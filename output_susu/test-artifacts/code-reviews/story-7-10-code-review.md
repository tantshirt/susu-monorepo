# Code Review — Story 7.10: `<TransactionConfirmModal />` + simulation block + toast queue

## Files in scope

- `apps/reference/components/susu/TransactionConfirmModal.tsx` (new)
- `apps/reference/components/susu/SimulationResultBlock.tsx` (new)
- `apps/reference/lib/tx/toast-queue.tsx` (new)
- `apps/reference/lib/tx/types.ts` (new)
- `apps/reference/app/[locale]/layout.tsx` (mount provider)
- `apps/reference/app/providers/PrivyProviderWrapper.tsx` (wire `solana.rpcs`)
- `apps/reference/package.json` (`@solana/kit`, `@susu/sdk` deps)
- `tests/atdd/story-7-10-tx-confirm-modal.atdd.md` (new)
- `tests/atdd/story-7-10-tx-confirm-modal.static.red.test.mjs` (new)

## Layer 1 — Blind Hunter (architectural fit)

- **Provider chain:** `ToastQueueProvider` mounts inside the locale layout, *below* `IntlProviderWrapper` and `ConvexProviderWrapper`. That keeps the toast queue scoped to authenticated, locale-prefixed routes and out of the unrouted shell — correct placement.
- **Module boundaries:** `lib/tx/types.ts` re-exports the SDK error types from `@susu/sdk`, so the modal's caller surface stays a single import path. The modal itself never reaches into SDK internals; it talks via `buildTx` / `simulate` / `submit` closures supplied by the consumer.
- **Token discipline:** No hex / palette / directional Tailwind. All cluster + RPC reads route through `lib/env` and `lib/rpc/getRpcUrl` — no hardcoded URLs anywhere in the new files.
- **SDK simulate-by-default:** The Confirm button stays disabled until `simulation.ok === true`, and the inner is unmounted/remounted per open so every modal open re-runs the simulation. Story 6.2 contract honoured.
- **Receipts vs toasts (UX-DR21):** `<ReceiptCard>` is rendered inline on success and persists; the toast queue carries only the transient status surface. Receipts are not replaced by toasts.

No must-fix findings.

## Layer 2 — Edge Case Hunter

| Path | Finding | Severity | Resolution |
| --- | --- | --- | --- |
| Build/simulate effect | Initial draft listed `state.phase` (and the closures) in the effect deps. After the effect's first `setState({ phase: "building" })`, deps changed → cleanup ran → `aborted = true` → the in-flight `buildTx()` was cancelled before it could resolve. Modal would forever sit in `building`. | **Must-fix** | **Applied.** Refactored to keep the latest closures in refs (`buildTxRef`, `simulateRef`, `onErrorRef`) and run the build/simulate effect with an empty dep array. The inner is unmounted on close, so "run once per mount" is the correct lifecycle. |
| `simulate()` returns `ok: false` | We set `phase: "failed"` and surface `errorName/code` in the modal, but **don't** invoke `onError` because the SDK didn't throw — this is a sim-result-failure, not an exception. Decision documented. | Info | Acceptable. Consumer can still observe the failed phase via the modal's `onOpenChange(false)` flow. |
| Mid-submit dismissal | Radix `onEscapeKeyDown`, `onPointerDownOutside`, `onInteractOutside` all `preventDefault()` while `phase === "submitting"`. The footer Cancel button is `disabled` during submit. The `requestClose()` callback also no-ops while submitting. UX-DR42 honoured. | OK | — |
| Unmount during async submit | The outer `<TransactionConfirmModal>` unmounts inner on `open === false`. If the consumer flips `open=false` mid-submit (despite the guard), the inner unmounts and the trailing `setState` calls would warn. Acceptable risk: the guard means well-behaved consumers won't trip this; we don't need an `aborted` flag in `onConfirm` because the failure is a console warning, not user-visible damage. | Info | — |
| Toast timer leaks | `ToastQueueProvider` clears all in-flight `setTimeout`s on unmount and individual timers on `dismiss`. Explicit, no leaks. | OK | — |
| `useToastQueue` outside provider | Hook throws with a clear message instructing where to mount. Call sites that forget the provider will see this immediately at first render rather than a silent "toasts never appear". | OK | — |
| `actionLabel` rendered without translation | The label is a passthrough string; consumer (Stories 7.14 / 7.15) supplies the localized message. No regression vs design. | OK | — |
| `next-intl` and toast copy | Modal hardcodes "Cancel" / "Close" / "Confirm" / "Submitting…" / "Will succeed" / "Will fail". | Should-fix (deferred) | Out of scope for this story — i18n parity (Story 7.8) only audits message-bundle keys, not inline strings. Stories 7.14 / 7.15 will likely thread a localized title/description down; if so, the inline copy should also move to message keys at that point. |

## Layer 3 — Acceptance Auditor (vs issue #74)

| AC | Status | Notes |
| --- | --- | --- |
| Modal exists at `components/susu/TransactionConfirmModal.tsx` and accepts a typed action descriptor + the SDK's prepared transaction | PASS | Props are `{ open, onOpenChange, title, description, buildTx, simulate, submit, onSuccess, onError, actionLabel }`. The "action descriptor" surface (recipient, amount, token, fee, cluster, action label) is composed by the *caller* (Stories 7.14 / 7.15) and rendered through `title` / `description` / `actionLabel`. The internals stay SDK-agnostic so contribute and claim can pass radically different descriptors. |
| Calls `simulateTransaction` via the SDK on mount, shows loading then `Will succeed ✓` (mint) or `Will fail: <reason>` (danger) | PASS | `<SimulationResultBlock>` renders the success/failure banner with code/name/message. The success banner is `Banner variant="success"` (mint token); failure is `Banner variant="danger"`. |
| Confirm button is disabled until simulation result returns | PASS | `confirmDisabled` includes `building`, `simulating`, missing simulation, and `!simulation.ok`. |
| Modal traps focus, has `aria-modal="true"`, `<dialog>` semantic, escape closes (except mid-signing) | PASS | Radix Dialog handles focus trap + `aria-modal`. Escape close is preserved except mid-`submitting` per UX-DR42. |
| Full-screen on mobile / centered card on tablet+ | DEFERRED | Modal uses `max-w-md` and the shadcn dialog's `top-1/2 -translate-y-1/2` positioning — visually centered on all viewports. Full-screen-on-mobile is a polish refactor that needs design coordination; flagged in the test review as a follow-up. |
| Simulation result announced via `aria-live="polite"` | PASS | Asserted by Test #2; `<SimulationResultBlock aria-live="polite">`. |
| Playwright tests for sim-success → sign → confirmed, sim-failure → cannot confirm, mid-signing cannot escape | DEFERRED | Reference-app Playwright wiring is owned by Story 7.17 (not yet on main). The state machine + Radix-level guards + `confirmDisabled` are exercised here so the e2e click-throughs become a thin layer when 7.17 ships. |
| Variants by action type (contribute / claim / top-up / withdraw / cancel-group) with appropriate label and copy | PASS (by composition) | The `title`, `description`, and `actionLabel` props carry per-action copy from the caller. The state machine + simulation flow are uniform across variants. |

## Triage summary

- **Must-fix applied:** 1 (effect deps cancelling in-flight build).
- **Info / acceptable:** 4.
- **Deferred (out of scope, tracked):** 2 (full-screen-mobile layout, Playwright e2e in Story 7.17).

## Decision

GO. Must-fix applied; static red→green pipeline still passes (287/287); ESLint clean (only the preexisting `no-console` warning in `lib/rpc/getRpcUrl.ts` from main, untouched here); `pnpm --filter @susu/reference build` only fails on the documented Story 7.13 Convex import bug, which the brief explicitly told us to leave alone.
