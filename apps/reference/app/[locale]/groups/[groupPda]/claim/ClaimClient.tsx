"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Banner } from "@/components/susu/Banner";
import { ReceiptCard } from "@/components/susu/ReceiptCard";
import { RotationCard } from "@/components/susu/RotationCard";
import { TransactionConfirmModal } from "@/components/susu/TransactionConfirmModal";
import { WalletStatus } from "@/components/nav/WalletStatus";
import { useWallet } from "@/lib/wallet/useWallet";
import { useGroupMetadata } from "@/lib/convex/use-group-metadata";
import {
  resolveRotationForGroupPda,
  zeroBasedRotationIndex,
} from "@/lib/member-app";
import {
  buildClaimTx,
  simulateClaim,
  submitClaim,
  type ClaimParams,
  type ClaimTxHandle,
} from "@/lib/susu/claim";
import type { SimulationResult, TxSignature } from "@/lib/tx/types";
import { TxSummaryPanel } from "@/components/member/TxSummaryPanel";

interface ClaimClientProps {
  groupPda: string;
  locale: string;
}

function shortPubkey(address: string, head = 4, tail = 4): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * One-tap claim — uses shared rotation resolver + transaction summary panel.
 */
export function ClaimClient({ groupPda, locale }: ClaimClientProps) {
  const t = useTranslations("claim");
  const tTx = useTranslations("tx");
  const wallet = useWallet();
  const metadata = useGroupMetadata(groupPda);
  const rotation = resolveRotationForGroupPda(groupPda);
  const rotationIndexZb = zeroBasedRotationIndex(rotation);

  const [open, setOpen] = React.useState(false);
  const [signature, setSignature] = React.useState<TxSignature | null>(null);
  const handleRef = React.useRef<ClaimTxHandle | null>(null);

  const isRecipient = wallet.connected && wallet.address === rotation.recipient;
  const claimDeadline = rotation.claimDeadlineUnix;
  const isPreDeadline = nowSeconds() < claimDeadline;
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
      rotationIndex: rotationIndexZb,
      groupId: groupPda,
      tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      cluster: wallet.cluster,
    }),
    [groupPda, rotation.recipient, rotationIndexZb, wallet.address, wallet.cluster],
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

  const summaryRows = React.useMemo(
    () =>
      wallet.connected
        ? [
            { label: tTx("summaryCluster"), value: wallet.cluster, mono: true },
            { label: tTx("summaryToken"), value: "USDC" },
            {
              label: tTx("summaryFeePayer"),
              value: shortPubkey(wallet.address ?? ""),
              mono: true,
            },
            { label: tTx("summaryGroup"), value: shortPubkey(groupPda), mono: true },
            {
              label: tTx("summaryRecipient"),
              value: shortPubkey(rotation.recipient),
              mono: true,
            },
            {
              label: tTx("summaryRotation"),
              value: `${rotation.i} / ${rotation.n}`,
            },
          ]
        : [],
    [wallet.connected, wallet.cluster, wallet.address, groupPda, rotation.recipient, rotation.i, rotation.n, tTx],
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-white/95 shadow-2">
        <div className="bg-gradient-to-br from-white via-surface to-secondary/10 p-6 md:p-8">
          <Button asChild variant="ghost" size="sm" className="w-fit text-muted hover:text-text">
            <Link href={`/${locale}/groups/${groupPda}`}>← {t("backToGroup")}</Link>
          </Button>
          <header className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end">
            <div className="flex flex-col gap-3">
              <p className="font-mono text-caption font-semibold uppercase tracking-[0.18em] text-primary">
                Payout eligibility check
              </p>
              <h1 className="text-h1 font-semibold tracking-tight text-text">{t("modalTitle")}</h1>
              <p className="break-all text-body text-muted">{metadata?.name ?? groupPda}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-1">
              <p className="text-caption font-semibold uppercase tracking-wide text-muted">Recipient match</p>
              <p className="mt-2 font-mono text-h3 font-semibold text-text">
                {wallet.connected ? (isRecipient ? "Eligible" : "Blocked") : "Connect"}
              </p>
              <p className="mt-1 text-caption text-muted">
                Rotation {rotation.i} of {rotation.n}
              </p>
            </div>
          </header>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.75fr)] lg:items-start">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden rounded-2xl border-border/70 bg-white/95 shadow-1">
            <CardHeader className="border-b border-border/70 bg-surface2/60">
              <CardTitle>Wallet status</CardTitle>
              <CardDescription>Connect the recipient wallet before claiming.</CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              {!wallet.connected ? (
                <Banner variant="info" className="bg-white">
                  <div className="flex flex-col gap-3">
                    <span>{t("connectPrompt")}</span>
                    <WalletStatus />
                  </div>
                </Banner>
              ) : (
                <Banner variant="info" className="bg-white">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-text">{tTx("signerNotBoundTitle")}</span>
                    <span className="text-caption text-muted">{tTx("signerNotBoundBody")}</span>
                  </div>
                </Banner>
              )}
            </CardContent>
          </Card>

          {alreadyClaimed && priorSignature ? (
            <ReceiptCard
              signature={priorSignature}
              status="confirmed"
              title={t("receiptTitle")}
              nextSteps={<span>{t("nextStepsLead")}</span>}
            />
          ) : (
            <Card className="overflow-hidden rounded-2xl border-border/70 bg-white/95 shadow-1">
              <CardHeader className="border-b border-border/70 bg-surface2/60">
                <CardTitle>{t("modalTitle")}</CardTitle>
                <CardDescription>{t("modalDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 p-5">
                {wallet.connected && !isRecipient ? <Banner variant="warn">{t("notRecipient")}</Banner> : null}
                {wallet.connected && isRecipient && isPreDeadline ? (
                  <Banner variant="info">{t("preDeadline")}</Banner>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-surface2/60 p-4">
                    <p className="text-caption text-muted">Recipient</p>
                    <p className="mt-1 font-mono text-caption font-semibold text-text">
                      {shortPubkey(rotation.recipient)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-surface2/60 p-4">
                    <p className="text-caption text-muted">Deadline</p>
                    <p className="mt-1 font-mono text-caption font-semibold text-text">
                      {isPreDeadline ? "Pending" : "Closed"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-surface2/60 p-4">
                    <p className="text-caption text-muted">Payout</p>
                    <p className="mt-1 font-mono text-caption font-semibold text-text">USDC vault</p>
                  </div>
                </div>
                {!wallet.connected || isRecipient ? (
                  <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-body text-text">
                      Simulation confirms the payout path before your wallet signs.
                    </p>
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
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
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

          <TxSummaryPanel rows={summaryRows} />
        </aside>
      </div>

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
