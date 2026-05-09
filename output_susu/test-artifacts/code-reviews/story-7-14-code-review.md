---
stepsCompleted:
  - step-01-load-context
  - step-02-blind-hunter
  - step-03-edge-case-hunter
  - step-04-acceptance-auditor
  - step-05-triage
  - step-06-apply-must-fix
lastStep: step-06-apply-must-fix
lastSaved: 2026-05-09
storyId: "7.14"
storyKey: story-7-14-one-tap-contribute
inputDocuments:
  - apps/reference/app/[locale]/groups/[groupPda]/contribute/page.tsx
  - apps/reference/app/[locale]/groups/[groupPda]/contribute/ContributeClient.tsx
  - apps/reference/lib/susu/contribute.ts
  - apps/reference/messages/en.json
  - apps/reference/messages/vi.json
  - tests/atdd/story-7-14-one-tap-contribute.atdd.md
  - tests/atdd/story-7-14-one-tap-contribute.static.red.test.mjs
---

# Code Review: Story 7.14 One-tap Contribute flow

## Lens 1 — Blind Hunter (assume nothing about intent)

What does the code do?

- `page.tsx` is a Server Component that awaits `params`, extracts `groupPda` and `locale`, and passes them to `<ContributeClient />`. No data fetching at the server boundary.
- `ContributeClient.tsx` is the client orchestrator. It mounts `<RotationCard />` (placeholder data), an info Banner with `<WalletStatus />` when disconnected, a primary Contribute button gated on `wallet.connected`, the Story 7.10 `<TransactionConfirmModal />`, and a persistent `<ReceiptCard />` once a signature is set.
- `lib/susu/contribute.ts` exports `buildContributeTx`, `simulateContribute`, `submitContribute`. These compose on top of `@susu/sdk`'s `createSusuClient` and `getRpcUrl()`. Build returns an opaque `ContributeTxHandle`. Simulate maps the SDK's `SusuSimulationResponse` to the reference-app `SimulationResult` shape. Submit refuses to fire if the simulation hasn't succeeded.

Open questions raised:
1. The simulator/submitter on `SusuClient` are introspected via `as unknown as { simulate?, submit? }`. **Hunter flag — intentional shim until the Privy signer plugin lands.** Documented in the JSDoc.
2. The placeholder `params` in `ContributeClient` use `groupPda` as the value for `vault`/`memberPosition`/`groupId`. The modal will fail simulation cleanly, but the comment explaining this is in `lib/susu/contribute.ts` rather than at the call site. Cosmetic; out-of-scope for 7.14.

## Lens 2 — Edge Case Hunter (boundary conditions)

- **Disconnected wallet**: Banner renders, button disabled. ✅
- **Wallet connected with `address: null`** (transient state): `useWallet()` returns `connected: true` only when `address` is truthy, so this state is unreachable per the hook's contract. ✅
- **Modal closed during simulation**: Story 7.10 modal handles `aborted` via the inner cleanup; this story passes through cleanly. ✅
- **Modal submit when simulation flagged `ok: false`**: Modal's `confirmDisabled` covers this — the Confirm button stays disabled. Belt-and-suspenders: `submitContribute` independently throws if `handle.simulation.err` is truthy. ✅
- **Convex unavailable**: `useGroupMetadata` returns `undefined` (loading) or `null`; the header falls back to `groupPda`. ✅
- **Locale unsupported by `Intl.DateTimeFormat`**: Handled inside `RotationCard` via try/catch fallback. ✅
- **Stub locale rendering**: en/ar/es/yo/ht-kreyol carry English fallback values per UX-DR47; vi has full localization. ✅
- **RotationCard "Claim now" button conflict**: caught by self-review. **Must-fix applied below.**

## Lens 3 — Acceptance Auditor (issue #78 AC ↔ code mapping)

| AC bullet | Mapping | Status |
| --- | --- | --- |
| Reads `groupPda` from route params | `page.tsx` awaits `params` and forwards | ✅ |
| Confirms wallet connection; shows Connect prompt with WalletStatus when disconnected | `ContributeClient` Banner branch | ✅ |
| Shows active rotation via `<RotationCard />` for the contribution target | `ContributeClient` mounts RotationCard with placeholder data + Convex display name | ✅ (placeholder until 7.17 wires SDK rotation discovery) |
| Single "Contribute" Button opens modal with build/simulate/submit closures | `setOpen(true)` + closures wired to `lib/susu/contribute.ts` | ✅ |
| Simulate-before-submit gate enforced | Story 7.10 modal owns the gate; `submitContribute` adds independent guard | ✅ |
| On success, persistent `<ReceiptCard />` with tx signature | `signature` state + `<ReceiptCard />` render | ✅ |
| Failure surfaces stay open with classified error and recovery action | Story 7.10 modal `Banner` covers this; `submitContribute` throws structured `SusuError` | ✅ |
| Devnet happy-path Playwright + four failure-classification tests | Out of scope for static red phase — flagged for green-phase follow-up | ⚠️ deferred |

## Triage

| Severity | Item | Decision |
| --- | --- | --- |
| **Must-fix** | RotationCard inside the Contribute page renders with `state: "active"` which surfaces a competing "Claim now" CTA next to the page's own Contribute button (UX-DR21 — one primary action per surface) | Applied: switched placeholder rotation to `state: "pending"` so the embedded card renders a neutral "View details" affordance |
| Should-fix | `params` shape in `ContributeClient` carries placeholder values; comment noting "real wire-up in 7.17" lives in `lib/susu/contribute.ts` not at the call site | Deferred — non-blocking; 7.17 will replace the placeholder entirely |
| Nice-to-have | `simulator`/`submitter` introspection in `lib/susu/contribute.ts` uses an `as unknown as { ... }` shim | Deferred — explicit follow-up when the SDK Privy signer plugin lands |

## Verdict

**PASS (must-fix applied)** — the must-fix on the RotationCard placeholder state was applied during this review. All AC trace to code; the deferred items are documented inline. Proceed to PR.
