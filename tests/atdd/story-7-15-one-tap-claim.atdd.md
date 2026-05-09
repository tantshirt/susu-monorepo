# ATDD — Story 7.15: One-tap Claim Payout flow (FR41)

GH Issue: #79
Story spec: `output_susu/planning-artifacts/epics.md` § "Story 7.15"

## Acceptance Criteria mapping

| AC | Description | Static-test assertion |
|----|-------------|------------------------|
| AC1 | `app/[locale]/groups/[groupPda]/claim/page.tsx` exists as a Server Component shell that reads `groupPda` from route params and renders `<ClaimClient />` | File-existence + reference to `params` and `groupPda` + import of `ClaimClient` |
| AC2 | `ClaimClient.tsx` is a Client Component that uses `useWallet()`, mounts `<TransactionConfirmModal />`, and renders `<RotationCard />` for the active rotation | `"use client"` directive + import of `useWallet` from `@/lib/wallet/useWallet` + import of `TransactionConfirmModal` + import of `RotationCard` |
| AC3 | The Claim button is gated behind three guards (FR41 + Stories 4.3 / 4.4 / 4.5): non-recipient → `<Banner variant="warn">`; pre-deadline → `<Banner variant="info">` with disabled button; already-claimed → `<ReceiptCard />` with the prior tx | Imports of `Banner` and `ReceiptCard` + reference to `recipient`, `claimDeadline`, and `alreadyClaimed` (or equivalent) gating tokens in the source |
| AC4 | `lib/susu/claim.ts` exposes the three closure builders (`buildClaimTx`, `simulateClaim`, `submitClaim`) used by the modal, composed on top of the `@susu/sdk` `SusuClient` and `getRpcUrl()` | File-existence + named export regex for each function + import of `SusuClient` / `createSusuClient` from `@susu/sdk` + import of `getRpcUrl` from `@/lib/rpc/getRpcUrl` |
| AC5 | `messages/en.json` AND `messages/vi.json` AND every stub locale (`ar/es/yo/ht-kreyol`) declare `claim.*` keys: `buttonLabel`, `connectPrompt`, `modalTitle`, `modalDescription`, `receiptTitle`, `nextStepsLead`, `notRecipient`, `preDeadline`, `alreadyClaimed` | JSON parse + key existence check on all six locale files |
| AC6 | The Claim flow files contain no hardcoded RPC URLs / hex literals / Tailwind palette colors / directional Tailwind utilities | Regex forbid-list on the new files |

## Files to create

- `apps/reference/app/[locale]/groups/[groupPda]/claim/page.tsx`
- `apps/reference/app/[locale]/groups/[groupPda]/claim/ClaimClient.tsx`
- `apps/reference/lib/susu/claim.ts`
- `tests/atdd/story-7-15-one-tap-claim.atdd.md` (this file)
- `tests/atdd/story-7-15-one-tap-claim.static.red.test.mjs` (this red phase)

## Files to modify

- `apps/reference/messages/{en,vi,ar,es,yo,ht-kreyol}.json` — add `claim.*` strings (English fallback for stub locales per UX-DR47).

## Out of scope

- Real Privy signer wiring of `SusuClient.claimPayout()` — same shim caveat as 7.14; swaps to typed call site once the Privy signer plugin lands.
- Live recipient/deadline/receipt data — current cut renders a placeholder rotation; Story 7.17 (group detail capstone) wires real Convex/SDK lookups.
- E2E Playwright matrix — covered by green-phase suites once 7.15 lands.
