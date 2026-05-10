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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/lib/wallet/useWallet";
import { useGroupMetadata } from "@/lib/convex/use-group-metadata";
import {
  getContributionDefaultsForGroup,
  resolveRotationForGroupPda,
  zeroBasedRotationIndex,
} from "@/lib/member-app";
import {
  buildContributeTx,
  simulateContribute,
  submitContribute,
  type ContributeParams,
  type ContributeTxHandle,
} from "@/lib/susu/contribute";
import type { SimulationResult, TxSignature } from "@/lib/tx/types";
import { TxSummaryPanel } from "@/components/member/TxSummaryPanel";

interface ContributeClientProps {
  groupPda: string;
  locale: string;
}

function shortPubkey(address: string, head = 4, tail = 4): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/**
 * One-tap Contribute — rotation + amount from member-app resolver; SDK signer bind still pending.
 */
export function ContributeClient({ groupPda, locale }: ContributeClientProps) {
  const t = useTranslations("contribute");
  const tTx = useTranslations("tx");
  const tGroup = useTranslations("groupDetail");
  const wallet = useWallet();
  const metadata = useGroupMetadata(groupPda);
  const rotationVm = resolveRotationForGroupPda(groupPda);
  const defaults = React.useMemo(
    () => getContributionDefaultsForGroup(groupPda),
    [groupPda],
  );
  const [amountStr, setAmountStr] = React.useState(() => defaults.usdcMajor);

  const normalizedAmount = amountStr.replace(",", ".").trim();
  const parsedAmount = Number.parseFloat(normalizedAmount);
  const amountAtoms =
    Number.isFinite(parsedAmount) && parsedAmount >= 0
      ? BigInt(Math.round(parsedAmount * 1_000_000))
      : BigInt(0);

  const rotationIndexZb = zeroBasedRotationIndex(rotationVm);

  const [open, setOpen] = React.useState(false);
  const [signature, setSignature] = React.useState<TxSignature | null>(null);
  const handleRef = React.useRef<ContributeTxHandle | null>(null);

  const params: ContributeParams = React.useMemo(
    () => ({
      groupPda,
      memberPda: wallet.address ?? "",
      amount: amountAtoms,
      rotationIndex: rotationIndexZb,
      vault: groupPda,
      sourceToken: wallet.address ?? "",
      contributor: wallet.address ?? "",
      memberPosition: groupPda,
      tokenProgram: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
      groupId: groupPda,
      cluster: wallet.cluster,
    }),
    [groupPda, wallet.address, wallet.cluster, amountAtoms, rotationIndexZb],
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

  const summaryRows = React.useMemo(
    () =>
      wallet.connected
        ? [
            { label: tTx("summaryCluster"), value: wallet.cluster, mono: true },
            { label: tTx("summaryAmount"), value: `${amountStr.trim() || "0"} USDC` },
            { label: tTx("summaryToken"), value: "USDC" },
            {
              label: tTx("summaryFeePayer"),
              value: shortPubkey(wallet.address ?? ""),
              mono: true,
            },
            { label: tTx("summaryGroup"), value: shortPubkey(groupPda), mono: true },
            {
              label: tTx("summaryRecipient"),
              value: shortPubkey(rotationVm.recipient),
              mono: true,
            },
            {
              label: tTx("summaryRotation"),
              value: `${rotationVm.i} / ${rotationVm.n}`,
            },
          ]
        : [],
    [
      wallet.connected,
      wallet.cluster,
      wallet.address,
      amountStr,
      groupPda,
      rotationVm.recipient,
      rotationVm.i,
      rotationVm.n,
      tTx,
    ],
  );

  const rotationCardData = React.useMemo(
    () => ({
      i: rotationVm.i,
      n: rotationVm.n,
      recipient: rotationVm.recipient,
      state: rotationVm.state,
      contributionsReceived: rotationVm.contributionsReceived,
      contributionsRequired: rotationVm.contributionsRequired,
      claimDeadlineUnix: rotationVm.claimDeadlineUnix,
    }),
    [rotationVm],
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-white/95 shadow-2">
        <div className="bg-gradient-to-br from-white via-surface to-primary/10 p-6 md:p-8">
          <Button asChild variant="ghost" size="sm" className="w-fit text-muted hover:text-text">
            <Link href={`/${locale}/groups/${groupPda}`}>← {t("backToGroup")}</Link>
          </Button>
          <header className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem] md:items-end">
            <div className="flex flex-col gap-3">
              <p className="font-mono text-caption font-semibold uppercase tracking-[0.18em] text-primary">
                Secure transaction review
              </p>
              <h1 className="text-h1 font-semibold tracking-tight text-text">{t("modalTitle")}</h1>
              <p className="break-all text-body text-muted">{metadata?.name ?? groupPda}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white p-4 shadow-1">
              <p className="text-caption font-semibold uppercase tracking-wide text-muted">Contribution due</p>
              <p className="mt-2 font-mono text-h2 font-semibold text-text">
                {amountStr.trim() || "0"} USDC
              </p>
              <p className="mt-1 text-caption text-muted">
                Rotation {rotationVm.i} of {rotationVm.n}
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
              <CardDescription>Connect and review before simulation.</CardDescription>
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

          <Card className="overflow-hidden rounded-2xl border-border/70 bg-white/95 shadow-1">
            <CardHeader className="border-b border-border/70 bg-surface2/60">
              <CardTitle>{tGroup("contribution")}</CardTitle>
              <CardDescription>{t("modalDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5 p-5">
              <div className="rounded-2xl border border-border/70 bg-surface2/60 p-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contribute-amount">{t("amountLabel")}</Label>
                  <Input
                    id="contribute-amount"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={t("amountPlaceholder")}
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    className="h-14 rounded-xl bg-white font-mono text-h3 tabular-nums"
                    disabled={!wallet.connected}
                    aria-describedby="contribute-amount-help"
                  />
                  <p id="contribute-amount-help" className="text-caption text-muted">
                    {t("amountHelper")}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-body text-text">
                  Simulation runs before your wallet is asked to sign.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setOpen(true)}
                  disabled={!wallet.connected || amountAtoms <= BigInt(0)}
                  data-testid="contribute-open-modal"
                >
                  {t("buttonLabel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-24">
          <RotationCard
            rotation={rotationCardData}
            locale={locale}
            recipientDisplayName={metadata?.name ?? null}
          />

          <TxSummaryPanel rows={summaryRows} />
        </aside>
      </div>

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
