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
  buildContributeTx,
  simulateContribute,
  submitContribute,
  type ContributeParams,
  type ContributeTxHandle,
} from "@/lib/susu/contribute";
import type { SimulationResult, TxSignature } from "@/lib/tx/types";

/**
 * Story 7.14 — One-tap Contribute client orchestrator.
 *
 * The flow:
 *   1. Read wallet via `useWallet()`. If disconnected, render an info
 *      `<Banner />` with inline `<WalletStatus />` so the user can
 *      authenticate without leaving the page.
 *   2. Show the active rotation via `<RotationCard />` so the contribution
 *      target is visible before the user commits (UX-DR21).
 *   3. Single primary button opens `<TransactionConfirmModal />` with
 *      build/simulate/submit closures wired to `lib/susu/contribute.ts`.
 *      The modal owns the simulate-before-submit gate (Story 6.2 / UX-DR42).
 *   4. On `onSuccess`, persist the signature in local state so the
 *      `<ReceiptCard />` survives the modal close (UX-DR21 — receipts are
 *      never replaced by toasts).
 */

interface ContributeClientProps {
  groupPda: string;
  locale: string;
}

/**
 * Placeholder rotation summary. The real wire-up comes in Story 7.17 when
 * the group-detail page co-locates rotation discovery via the SDK. Until
 * then we render a graceful stub that exercises the visual surface and lets
 * Stories 7.14b/7.17 swap in real data without touching the modal contract.
 */
const PLACEHOLDER_ROTATION_DEADLINE_OFFSET_S = 7 * 24 * 60 * 60;

function placeholderRotation(groupPda: string) {
  // Use the `pending` state so the embedded RotationCard renders a neutral
  // "View details" affordance rather than a competing "Claim now" CTA — the
  // Contribute page already exposes its own primary `Contribute` button and
  // we don't want two action buttons on the same surface (UX-DR21).
  return {
    i: 1,
    n: 6,
    recipient: groupPda,
    state: "pending" as const,
    contributionsReceived: 0,
    contributionsRequired: 6,
    claimDeadlineUnix:
      Math.floor(Date.now() / 1000) + PLACEHOLDER_ROTATION_DEADLINE_OFFSET_S,
  };
}

export function ContributeClient({ groupPda, locale }: ContributeClientProps) {
  const t = useTranslations("contribute");
  const wallet = useWallet();
  const metadata = useGroupMetadata(groupPda);

  const [open, setOpen] = React.useState(false);
  const [signature, setSignature] = React.useState<TxSignature | null>(null);

  // The handle is built lazily on modal-open via `buildContributeTx`. We
  // hold a ref so the simulate / submit closures see the same handle the
  // build step produced.
  const handleRef = React.useRef<ContributeTxHandle | null>(null);

  const params: ContributeParams = React.useMemo(
    () => ({
      groupPda,
      memberPda: wallet.address ?? "",
      amount: BigInt(0),
      rotationIndex: 0,
      vault: groupPda,
      sourceToken: wallet.address ?? "",
      contributor: wallet.address ?? "",
      memberPosition: groupPda,
      tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      groupId: groupPda,
      cluster: wallet.cluster,
    }),
    [groupPda, wallet.address, wallet.cluster],
  );

  const buildTx = React.useCallback(async () => {
    const handle = await buildContributeTx(params);
    handleRef.current = handle;
    return handle;
  }, [params]);

  const simulate = React.useCallback(
    async (tx: unknown): Promise<SimulationResult> => {
      const handle = (tx as ContributeTxHandle) ?? handleRef.current;
      if (!handle) {
        return {
          ok: false,
          logs: [],
          errorName: "SusuError",
          errorMessage: "Build step did not produce a transaction handle.",
        };
      }
      return simulateContribute(handle);
    },
    [],
  );

  const submit = React.useCallback(async (tx: unknown): Promise<TxSignature> => {
    const handle = (tx as ContributeTxHandle) ?? handleRef.current;
    if (!handle) {
      throw new Error("Build step did not produce a transaction handle.");
    }
    return submitContribute(handle);
  }, []);

  const onSuccess = React.useCallback((sig: TxSignature) => {
    setSignature(sig);
    setOpen(false);
  }, []);

  const rotation = placeholderRotation(groupPda);

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
        rotation={rotation}
        locale={locale}
        recipientDisplayName={metadata?.name ?? null}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("modalTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-body text-muted">{t("modalDescription")}</p>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setOpen(true)}
              disabled={!wallet.connected}
              data-testid="contribute-open-modal"
            >
              {t("buttonLabel")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {signature ? (
        <ReceiptCard
          signature={signature}
          status="confirmed"
          title={t("receiptTitle")}
          nextSteps={<span>{t("nextStepsLead")}</span>}
        />
      ) : null}

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
