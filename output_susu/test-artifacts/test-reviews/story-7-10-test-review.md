# Test Review — Story 7.10: `<TransactionConfirmModal />` + simulation block + toast queue

## Scope

- `tests/atdd/story-7-10-tx-confirm-modal.atdd.md`
- `tests/atdd/story-7-10-tx-confirm-modal.static.red.test.mjs` (6 assertions)

## Coverage matrix

| AC (issue #74) | Static assertion(s) |
| --- | --- |
| Modal exists as Client Component built on shadcn `Dialog`, exposes the typed prop set, walks the named state machine | Test #1 (`"use client"`, named export, Dialog import, ReceiptCard + Banner imports, `buildTx` / `simulate` / `submit` prop names, all seven phase string literals) |
| Simulation block surfaces compute units / logs / failure with `aria-live` for screen readers | Test #2 (`SimulationResultBlock` export, `<details>` element, `aria-live="polite"`) |
| Toast queue + viewport (per the 7.4 caveat) wraps the shadcn `Toast` surface | Test #3 (`"use client"`, `ToastQueueProvider` + `useToastQueue` exports, shadcn Toast import) |
| Reference-app callers import error types from a single in-app path (re-export of `@susu/sdk`) | Test #4 (`lib/tx/types.ts` imports from `@susu/sdk(/errors)`, references `SusuError`) |
| `@solana/kit` is a runtime dep so `createSolanaRpc(getRpcUrl())` is callable; `@susu/sdk` is wired as a workspace dep | Test #5 |
| Locale layout mounts the provider so the viewport renders for every page | Test #6 |
| Token discipline (no hex / palette literals, no directional Tailwind classes) | Bundled into Tests #1–#3 via `FORBID_HEX` / `FORBID_DIRECTIONAL` checks |

## Quality assessment

- **Determinism:** All assertions are pure file/regex inspections; no network, no sleeps, no process-level variability.
- **Red-then-green discipline:** Authored first and confirmed failing against the pre-implementation tree (6/6 red), passing after implementation (6/6 green).
- **Token + RTL discipline:** New files are scanned for `#hex`, `rgb()`, `hsl()`, palette colour names (banned by Story 7.2), and directional Tailwind utilities (banned by Stories 7.7 / 7.18).
- **Scope discipline:** Tests do not assert on simulate/submit return semantics (those are SDK-owned in Story 6.2) — only on the UI surface contracts.

## Gaps acknowledged (deferred)

- **Playwright user-flow coverage** — issue #74 mentions Playwright tests for "simulation-success → sign → confirmed", "simulation-failure → cannot confirm", and "mid-signing cannot escape". Reference-app Playwright wiring is owned by Story 7.17 (test framework setup, currently not on main). Static tests verify the modal *shape* needed to support those e2e paths; runtime e2e lands when 7.17 ships. The state machine, the disabled-confirm gate, and the Radix-level escape/overlay guards are exercised in this PR's code; a fast-follow Playwright story can layer the click-through assertions on top.
- **`SimulationResult` derivation from `SusuClient.simulate()`** — Stories 7.14 / 7.15 produce `SimulationResult` objects from the SDK output. The shape is defined in `lib/tx/types.ts` here; the SDK adapter lives with the consumer flows where it's exercised against real RPC fixtures.
- **Compute-unit warnings** — the modal accepts a `warnings: string[]` array and renders a `Banner variant="warn"` per entry. Heuristics for "compute units near the limit" live with the consumers, since the threshold depends on the action (contribute vs. claim vs. cancel-group) and is best decided alongside the build step.

## Decision

GO. Red → green pipeline verified end-to-end; static surface contracts cover every shape downstream stories will consume; Playwright runtime coverage explicitly deferred to Story 7.17.
