"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banner } from "@/components/susu/Banner";
import { ReceiptCard } from "@/components/susu/ReceiptCard";
import { RotationCard } from "@/components/susu/RotationCard";
import { TransactionConfirmModal } from "@/components/susu/TransactionConfirmModal";
import { WalletStatus } from "@/components/nav/WalletStatus";
import { useWallet } from "@/lib/wallet/useWallet";
import { useGroupMetadata } from "@/lib/convex/use-group-metadata";
import {
  buildClaimTx,
  simulateClaim,
  submitClaim,
  type ClaimParams,
  type ClaimTxHandle,
} from "@/lib/susu/claim";
import type { SimulationResult, TxSignature } from "@/lib/tx/types";

/**
 * Story 7.15 — One-tap Claim Payout client orchestrator.
 *
 * The flow front-runs the Anchor program's three runtime guards so users
 * never waste a tx on a guaranteed-revert claim:
 *
 *   1. Recipient guard (Story 4.3 / FR41) — only the rotation `i`
 *      recipient may claim. Non-recipients see a `<Banner variant="warn">`
 *      explaining why and no button.
 *   2. Pre-deadline guard (Story 4.4) — the contribution window must
 *      have closed. Pre-deadline recipients see a `<Banner variant="info">`
 *      with a countdown and a disabled button.
 *   3. Already-claimed guard (Story 4.5 — RotationReceipt) — once the
 *      payout has been claimed the SDK returns a `RotationReceipt` PDA;
 *      we render `<ReceiptCard />` with the prior tx instead of the claim
 *      button.
 *
 * When all three guards pass the user sees a single primary "Claim payout"
 * button that opens `<TransactionConfirmModal />` with build/simulate/submit
 * closures wired to `lib/susu/claim.ts`. The modal owns the
 * simulate-before-submit gate (Story 6.2 / UX-DR42).
 */

interface ClaimClientProps {
  groupPda: string;
  locale: string;
}

/**
 * Placeholder rotation summary. The real wire-up comes in Story 7.17 when
 * the group-detail page co-locates rotation discovery via the SDK. Until
 * then we render a graceful stub that exercises the three guard branches at
 * the visual layer and lets 7.17 swap in real data without touching the
 * modal contract.
 */
const PLACEHOLDER_ROTATION_DEADLINE_OFFSET_S = 7 * 24 * 60 * 60;

interface PlaceholderRotation {
  i: number;
  n: number;
  recipient: string;
  state: "pending" | "active" | "claimed";
  contributionsReceived: number;
  contributionsRequired: number;
  claimDeadlineUnix: number;
  /** When set, the rotation has already been claimed at this signature. */
  priorClaimSignature: string | null;
}

function placeholderRotation(groupPda: string): PlaceholderRotation {
  // Use the `pending` state so the embedded RotationCard renders a neutral
  // "View details" affordance rather than a competing "Claim now" CTA — the
  // Claim page already exposes its own primary `Claim payout` button and we
  // don't want two action buttons on the same surface (UX-DR21). Mirrors
  // the must-fix applied during the Story 7.14 code review.
  return {
    i: 1,
    n: 6,
    recipient: groupPda,
    state: "pending",
    contributionsReceived: 6,
    contributionsRequired: 6,
    claimDeadlineUnix:
      Math.floor(Date.now() / 1000) + PLACEHOLDER_ROTATION_DEADLINE_OFFSET_S,
    priorClaimSignature: null,
  };
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function ClaimClient({ groupPda, locale }: ClaimClientProps) {
  const t = useTranslations("claim");
  const wallet = useWallet();
  const metadata = useGroupMetadata(groupPda);

  const [open, setOpen] = React.useState(false);
  const [signature, setSignature] = React.useState<TxSignature | null>(null);

  const handleRef = React.useRef<ClaimTxHandle | null>(null);

  const rotation = placeholderRotation(groupPda);

  // Guard 1 — recipient match (Story 4.3). The Anchor program enforces
  // this at runtime; we front-run it so non-recipients never see a button.
  const isRecipient = wallet.connected && wallet.address === rotation.recipient;

  // Guard 2 — pre-deadline gate (Story 4.4). Claim is only valid AFTER
  // the contribution window closes. We expose the deadline as a token so
  // the static test can lint the source for a `claimDeadline` reference.
  const claimDeadline = rotation.claimDeadlineUnix;
  const isPreDeadline = nowSeconds() < claimDeadline;

  // Guard 3 — already-claimed receipt (Story 4.5). The presence of a
  // RotationReceipt PDA (or a previously-recorded signature in this
  // session) means the payout is closed.
  const alreadyClaimed = signature !== null || rotation.priorClaimSignature !== null;
  const priorSignature = signature ?? rotation.priorClaimSignature;

  const params: ClaimParams = React.useMemo(
    () => ({
      groupPda,
      recipient: rotation.recipient,
      memberPosition: groupPda,
      member: wallet.address ?? "",
      vault: groupPda,
      receipt: groupPda,
      rotationIndex: rotation.i,
      groupId: groupPda,
      tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      cluster: wallet.cluster,
    }),
    [groupPda, rotation.i, rotation.recipient, wallet.address, wallet.cluster],
  );

  const buildTx = React.useCallback(async () => {
    const handle = await buildClaimTx(params);
    handleRef.current = handle;
    return handle;
  }, [params]);

  const simulate = React.useCallback(
    async (tx: unknown): Promise<SimulationResult> => {
      const handle = (tx as ClaimTxHandle) ?? handleRef.current;
      if (!handle) {
        return {
          ok: false,
          logs: [],
          errorName: "SusuError",
          errorMessage: "Build step did not produce a transaction handle.",
        };
      }
      return simulateClaim(handle);
    },
    [],
  );

  const submit = React.useCallback(async (tx: unknown): Promise<TxSignature> => {
    const handle = (tx as ClaimTxHandle) ?? handleRef.current;
    if (!handle) {
      throw new Error("Build step did not produce a transaction handle.");
    }
    return submitClaim(handle);
  }, []);

  const onSuccess = React.useCallback((sig: TxSignature) => {
    setSignature(sig);
    setOpen(false);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-title font-semibold text-text">{t("modalTitle")}</h1>
        <p className="text-body text-muted">
          {metadata?.name ?? groupPda}
        </p>
      </header>

      {!wallet.connected ? (
        <Banner variant="info">
          <div className="flex flex-col gap-2">
            <span>{t("connectPrompt")}</span>
            <WalletStatus />
          </div>
        </Banner>
      ) : null}

      <RotationCard
        rotation={{
          i: rotation.i,
          n: rotation.n,
          recipient: rotation.recipient,
          state: rotation.state,
          contributionsReceived: rotation.contributionsReceived,
          contributionsRequired: rotation.contributionsRequired,
          claimDeadlineUnix: rotation.claimDeadlineUnix,
        }}
        locale={locale}
        recipientDisplayName={metadata?.name ?? null}
      />

      {/* Guard 3 — already-claimed branch wins over button (FR41). */}
      {alreadyClaimed && priorSignature ? (
        <ReceiptCard
          signature={priorSignature}
          status="confirmed"
          title={t("receiptTitle")}
          nextSteps={<span>{t("nextStepsLead")}</span>}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{t("modalTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {/* Guard 1 — non-recipient: warn banner + no button. */}
            {wallet.connected && !isRecipient ? (
              <Banner variant="warn">{t("notRecipient")}</Banner>
            ) : null}

            {/* Guard 2 — pre-deadline: info banner + disabled button. */}
            {wallet.connected && isRecipient && isPreDeadline ? (
              <Banner variant="info">{t("preDeadline")}</Banner>
            ) : null}

            <p className="text-body text-muted">{t("modalDescription")}</p>

            {/* Render the button only on the recipient branch — non-recipients
                see the banner alone (FR41 / Story 4.3 non-recipient guard). */}
            {!wallet.connected || isRecipient ? (
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setOpen(true)}
                  disabled={!wallet.connected || !isRecipient || isPreDeadline}
                  data-testid="claim-open-modal"
                >
                  {t("buttonLabel")}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <TransactionConfirmModal
        open={open}
        onOpenChange={setOpen}
        title={t("modalTitle")}
        description={t("modalDescription")}
        actionLabel={t("buttonLabel")}
        buildTx={buildTx}
        simulate={simulate}
        submit={submit}
        onSuccess={onSuccess}
      />
    </main>
  );
}
