# ATDD — Story 7.14: One-tap Contribute flow (FR40)

GH Issue: #78
Story spec: `output_susu/planning-artifacts/epics.md` § "Story 7.14"

## Acceptance Criteria mapping

| AC | Description | Static-test assertion |
|----|-------------|------------------------|
| AC1 | `app/[locale]/groups/[groupPda]/contribute/page.tsx` exists as a Server Component shell that reads `groupPda` from route params and renders the client orchestrator | File-existence + reference to `params` and `groupPda` + import of `ContributeClient` |
| AC2 | `ContributeClient.tsx` is a Client Component that uses `useWallet()`, mounts `<TransactionConfirmModal />`, and renders an inline `<RotationCard />` for the active rotation | `"use client"` directive + import of `useWallet` from `@/lib/wallet/useWallet` + import of `TransactionConfirmModal` + import of `RotationCard` |
| AC3 | When wallet is disconnected, the client renders a `<Banner />` prompting connection rather than enabling the Contribute button | Import of `Banner` from `@/components/susu/Banner` + reference to `connected` from the wallet hook |
| AC4 | `lib/susu/contribute.ts` exposes the three closure builders (`buildContributeTx`, `simulateContribute`, `submitContribute`) used by the modal, composed on top of the `@susu/sdk` `SusuClient` and `getRpcUrl()` | File-existence + named export regex for each function + import of `SusuClient` / `createSusuClient` from `@susu/sdk` + import of `getRpcUrl` from `@/lib/rpc/getRpcUrl` |
| AC5 | `messages/en.json` AND `messages/vi.json` AND every stub locale (`ar/es/yo/ht-kreyol`) declare `contribute.*` keys: `connectPrompt`, `buttonLabel`, `modalTitle`, `modalDescription`, `receiptTitle`, `nextStepsLead` | JSON parse + key existence check on all six locale files |
| AC6 | The Contribute flow files contain no hardcoded RPC URLs / hex literals / Tailwind palette colors; cluster strings only via `env.NEXT_PUBLIC_CLUSTER` indirectly via `<ReceiptCard />` | Regex forbid-list on the new files |

## Files to create

- `apps/reference/app/[locale]/groups/[groupPda]/contribute/page.tsx`
- `apps/reference/app/[locale]/groups/[groupPda]/contribute/ContributeClient.tsx`
- `apps/reference/lib/susu/contribute.ts`
- `tests/atdd/story-7-14-one-tap-contribute.atdd.md` (this file)
- `tests/atdd/story-7-14-one-tap-contribute.static.red.test.mjs` (this red phase)

## Files to modify

- `apps/reference/messages/{en,vi,ar,es,yo,ht-kreyol}.json` — add `contribute.*` strings (English fallback for stub locales per UX-DR47).

## Out of scope

- Real Privy signer wiring of the SDK `SusuClient` (lives in 7.9/7.10 plumbing). The closure builders accept a wallet adapter shape; the actual signer plumbing is best-effort and degrades to a clear error if not yet bound.
- Claim Payout flow — Story 7.15.
- E2E Playwright happy-path / failure-classification matrix — covered by the green-phase test suite once 7.14 lands.
