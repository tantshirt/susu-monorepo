# ATDD — Story 7.10: `<TransactionConfirmModal />` with simulation result block

## Acceptance criteria (from issue #74, FR40, FR41)

- `apps/reference/components/susu/TransactionConfirmModal.tsx` exists as a Client
  Component built on the shadcn `Dialog` primitive (Story 7.4) and exports
  `TransactionConfirmModal`.
- The modal accepts a typed prop set
  `{ open, onOpenChange, title, description?, buildTx, simulate, submit, onSuccess?, onError? }`
  where `buildTx` returns a `Transaction` from `@solana/kit`, `simulate(tx)`
  returns a `SimulationResult`, and `submit(tx)` returns a `TxSignature`.
- On open, the modal walks an internal state machine
  `idle → building → simulating → ready-to-submit → submitting → done | failed`.
  The Confirm button is disabled until the simulation result returns; mid-signing
  the modal cannot be dismissed (Escape and overlay-click are suppressed) per
  UX-DR42.
- The simulation result is rendered through
  `apps/reference/components/susu/SimulationResultBlock.tsx`. Failure surfaces a
  `Banner` (variant `danger`) with the simulation error/code; warnings (e.g.
  high compute-unit usage) surface a `Banner` (variant `warn`). Logs render
  inside a collapsible `<details>` element. The block declares
  `aria-live="polite"` so simulation outcomes are announced to screen readers.
- On success the modal renders a `<ReceiptCard>` with the resulting
  `TxSignature` and calls `onSuccess(sig)`. On failure it renders a `Banner`
  variant `danger` and calls `onError(err)` with `SusuError` types from
  `@susu/sdk` (Story 6.3) when applicable.
- A toast queue (`apps/reference/lib/tx/toast-queue.tsx`) wraps the shadcn
  `Toast` surface (per the 7.4 caveat) with a `<ToastQueueProvider>`, a
  `useToastQueue()` hook, and a viewport mounted in `app/[locale]/layout.tsx`.
- `apps/reference/lib/tx/types.ts` re-exports the `SusuError` types from
  `@susu/sdk/errors` so reference-app callers have a single import path.
- `@solana/kit` is added as a runtime dependency of `apps/reference/package.json`
  so the modal can use `createSolanaRpc(getRpcUrl())` for the real simulation
  call. `@susu/sdk` is also wired as a workspace dependency so error types are
  importable.
- All RPC URLs and cluster identifiers are read through `lib/rpc/getRpcUrl` and
  `lib/env`. No hardcoded RPC URLs or cluster strings appear in the new files.
- Tailwind classes are logical-only (`start-`, `end-`, `ps-`, `pe-`, `ms-`,
  `me-`); no directional `left-`, `right-`, `pl-`, `pr-`, `ml-`, `mr-`.

## Static (red) assertions

The companion `story-7-10-tx-confirm-modal.static.red.test.mjs` enforces:

1. `TransactionConfirmModal.tsx` exists, declares `"use client"`, exports
   `TransactionConfirmModal`, imports `Dialog` from `@/components/ui/dialog`,
   imports `ReceiptCard` and `Banner` from `@/components/susu/*`, references
   the `buildTx`/`simulate`/`submit` prop names, and references each named
   state in the `idle → building → simulating → ready-to-submit → submitting →
   done → failed` machine.
2. `SimulationResultBlock.tsx` exists, exports `SimulationResultBlock`, uses
   a `<details>` element for collapsible logs, and declares
   `aria-live="polite"`.
3. `apps/reference/lib/tx/toast-queue.tsx` exists, declares `"use client"`,
   exports `ToastQueueProvider` and `useToastQueue`, and references the
   shadcn `Toast` surface from `@/components/ui/toast`.
4. `apps/reference/lib/tx/types.ts` exists and re-exports `SusuError` from
   `@susu/sdk/errors` (or `@susu/sdk`).
5. The reference-app `package.json` lists `@solana/kit` and `@susu/sdk` as
   dependencies.
6. The locale layout (`apps/reference/app/[locale]/layout.tsx`) mounts the
   `ToastQueueProvider` so the viewport is rendered for every authenticated
   page.
7. No directional Tailwind classes appear in the new files.
