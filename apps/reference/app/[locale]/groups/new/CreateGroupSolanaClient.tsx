"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useUpsertGroupMetadata, useCreateInviteLink } from "@/lib/convex/use-group-mutations";
import {
  useConnectedStandardWallets,
  useSendTransaction,
  useStandardSignAndSendTransaction,
} from "@privy-io/react-auth/solana";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WalletGate } from "@/components/auth/WalletGate";
import { Banner } from "@/components/susu/Banner";
import { ReceiptCard } from "@/components/susu/ReceiptCard";
import { TransactionConfirmModal } from "@/components/susu/TransactionConfirmModal";
import { WalletStatus } from "@/components/nav/WalletStatus";
import { TxSummaryPanel } from "@/components/member/TxSummaryPanel";
import { useWallet } from "@/lib/wallet/useWallet";
import {
  buildCreateGroupTx,
  defaultCreateGroupMint,
  generateGroupId,
  simulateCreateGroup,
  submitCreateGroupWithPrivy,
  submitCreateGroupWithStandard,
  supportedCreateGroupMints,
  type CreateGroupParams,
  type CreateGroupTxHandle,
} from "@/lib/susu/createGroup";
import type { SimulationResult, TxSignature } from "@/lib/tx/types";

interface CreateGroupSolanaClientProps {
  locale: string;
}

function shortPubkey(address: string, head = 4, tail = 4): string {
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

function parseMajorUnits(value: string): bigint {
  const normalized = value.replace(",", ".").trim();
  if (!/^\d+(\.\d{0,6})?$/.test(normalized)) return BigInt(0);
  const [whole = "0", fractional = ""] = normalized.split(".");
  return BigInt(whole) * BigInt(1_000_000) + BigInt((fractional + "000000").slice(0, 6));
}

function generateAccessCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = globalThis.crypto?.getRandomValues(new Uint8Array(8)) ?? new Uint8Array(8);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function readStandardWalletAddress(wallet: unknown): string | null {
  const account = (wallet as { accounts?: readonly { address?: string; publicKey?: Uint8Array }[] })
    ?.accounts?.[0];
  if (typeof account?.address === "string") return account.address;
  return null;
}

export function CreateGroupSolanaClient({ locale }: CreateGroupSolanaClientProps) {
  const t = useTranslations("createGroup");
  const tTx = useTranslations("tx");
  const wallet = useWallet();
  const upsertGroupMetadata = useUpsertGroupMetadata();
  const createInviteLink = useCreateInviteLink();
  const mintOptions = React.useMemo(() => supportedCreateGroupMints(wallet.cluster), [wallet.cluster]);
  const [groupName, setGroupName] = React.useState(() => t("defaultGroupName"));
  const [groupId, setGroupId] = React.useState(() => generateGroupId().toString());
  const [accessCode, setAccessCode] = React.useState(() => generateAccessCode());
  const [memberCount, setMemberCount] = React.useState("5");
  const [amount, setAmount] = React.useState("25");
  const [periodDays, setPeriodDays] = React.useState("7");
  const [mint, setMint] = React.useState(() => defaultCreateGroupMint(wallet.cluster));
  const [open, setOpen] = React.useState(false);
  const [signature, setSignature] = React.useState<TxSignature | null>(null);
  const [createdGroupPda, setCreatedGroupPda] = React.useState<string | null>(null);
  const [inviteStatus, setInviteStatus] = React.useState<"idle" | "saved" | "failed">("idle");
  const handleRef = React.useRef<CreateGroupTxHandle | null>(null);
  const { sendTransaction } = useSendTransaction();
  const { wallets: standardWallets } = useConnectedStandardWallets();
  const { signAndSendTransaction } = useStandardSignAndSendTransaction();

  const contributionAmount = parseMajorUnits(amount);
  const n = Number.parseInt(memberCount, 10);
  const contributionPeriod = BigInt(Math.max(0, Number.parseInt(periodDays, 10) || 0)) * BigInt(86_400);
  const parsedGroupId = /^\d+$/.test(groupId.trim()) ? BigInt(groupId.trim()) : BigInt(-1);
  const normalizedAccessCode = accessCode.trim().toUpperCase();
  const canBuild =
    wallet.connected &&
    !!wallet.address &&
    normalizedAccessCode.length >= 4 &&
    parsedGroupId >= BigInt(0) &&
    Number.isInteger(n) &&
    n >= 3 &&
    n <= 12 &&
    contributionAmount > BigInt(0) &&
    contributionPeriod > BigInt(0);

  const selectedStandardWallet = React.useMemo(
    () =>
      standardWallets.find((candidate) => readStandardWalletAddress(candidate) === wallet.address) ??
      standardWallets[0] ??
      null,
    [standardWallets, wallet.address],
  );

  const params: CreateGroupParams | null = React.useMemo(() => {
    if (!canBuild || !wallet.address) return null;
    return {
      creator: wallet.address,
      groupId: parsedGroupId,
      n,
      contributionAmount,
      contributionPeriod,
      mint,
      cluster: wallet.cluster,
    };
  }, [canBuild, wallet.address, parsedGroupId, n, contributionAmount, contributionPeriod, mint, wallet.cluster]);

  const buildTx = React.useCallback(async () => {
    if (!params) {
      throw new Error(t("invalidForm"));
    }
    const handle = await buildCreateGroupTx(params);
    handleRef.current = handle;
    setCreatedGroupPda(handle.groupPda);
    return handle;
  }, [params, t]);

  const simulate = React.useCallback(
    async (tx: unknown): Promise<SimulationResult> => {
      const handle = (tx as CreateGroupTxHandle) ?? handleRef.current;
      if (!handle) {
        return {
          ok: false,
          logs: [],
          errorName: "SusuError",
          errorMessage: t("missingHandle"),
        };
      }
      return simulateCreateGroup(handle);
    },
    [t],
  );

  const submit = React.useCallback(
    async (tx: unknown): Promise<TxSignature> => {
      const handle = (tx as CreateGroupTxHandle) ?? handleRef.current;
      if (!handle) {
        throw new Error(t("missingHandle"));
      }
      if (selectedStandardWallet) {
        return submitCreateGroupWithStandard(
          handle,
          selectedStandardWallet,
          signAndSendTransaction,
        );
      }
      return submitCreateGroupWithPrivy(handle, sendTransaction);
    },
    [selectedStandardWallet, sendTransaction, signAndSendTransaction, t],
  );

  const onSuccess = React.useCallback(
    (sig: TxSignature) => {
      setSignature(sig);
      setOpen(false);
      const groupPda = handleRef.current?.groupPda ?? createdGroupPda;
      if (!groupPda) return;
      const name = groupName.trim() || t("defaultGroupName");
      const now = Date.now();
      void Promise.all([
        upsertGroupMetadata({ groupPda, name, locale }),
        createInviteLink({
          groupPda,
          token: normalizedAccessCode,
          createdBy: wallet.address ?? undefined,
          expiresAt: now + 1000 * 60 * 60 * 24 * 30,
          maxUses: Math.max(1, n - 1),
        }),
      ])
        .then(() => setInviteStatus("saved"))
        .catch(() => setInviteStatus("failed"));
    },
    [
      createInviteLink,
      createdGroupPda,
      groupName,
      locale,
      n,
      t,
      upsertGroupMetadata,
      wallet.address,
      normalizedAccessCode,
    ],
  );

  const summaryRows = React.useMemo(
    () =>
      wallet.connected
        ? [
            { label: tTx("summaryCluster"), value: wallet.cluster, mono: true },
            { label: t("summaryName"), value: groupName.trim() || t("defaultGroupName") },
            { label: t("summaryCreator"), value: shortPubkey(wallet.address ?? ""), mono: true },
            { label: t("summaryMembers"), value: memberCount },
            { label: tTx("summaryAmount"), value: `${amount.trim() || "0"} USDC` },
            { label: t("summaryPeriod"), value: `${periodDays.trim() || "0"} ${t("days")}` },
            { label: tTx("summaryToken"), value: shortPubkey(mint), mono: true },
            { label: t("summaryAccessCode"), value: normalizedAccessCode, mono: true },
            { label: t("summaryGroupId"), value: groupId, mono: true },
            ...(createdGroupPda
              ? [{ label: tTx("summaryGroup"), value: shortPubkey(createdGroupPda), mono: true }]
              : []),
          ]
        : [],
    [
      wallet.connected,
      wallet.cluster,
      wallet.address,
      groupName,
      memberCount,
      amount,
      periodDays,
      mint,
      normalizedAccessCode,
      groupId,
      createdGroupPda,
      t,
      tTx,
    ],
  );

  return (
    <WalletGate locale={locale}>
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-8 md:py-14">
      <section className="overflow-hidden rounded-3xl border border-border/70 bg-white/95 shadow-2">
        <div className="bg-gradient-to-br from-white via-surface to-primary/10 p-6 md:p-8">
          <Button asChild variant="ghost" size="sm" className="w-fit text-muted hover:text-text">
            <Link href={`/${locale}/groups`}>← {t("backToGroups")}</Link>
          </Button>
          <div className="mt-6 flex max-w-3xl flex-col gap-3">
            <Badge variant="signal" className="w-fit">
              {wallet.cluster}
            </Badge>
            <h1 className="text-h1 font-semibold tracking-tight text-text">{t("title")}</h1>
            <p className="max-w-2xl text-body leading-7 text-muted">{t("subtitle")}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)] xl:items-start">
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden rounded-2xl border-border/70 bg-white/95 shadow-1">
            <CardHeader className="border-b border-border/70 bg-surface2/60">
              <CardTitle>{t("walletTitle")}</CardTitle>
              <CardDescription>{t("walletDescription")}</CardDescription>
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
                <Banner variant="success" className="bg-white">
                  {t("connectedPrompt", { address: shortPubkey(wallet.address ?? "") })}
                </Banner>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-border/70 bg-white/95 shadow-1">
            <CardHeader className="border-b border-border/70 bg-surface2/60">
              <CardTitle>{t("formTitle")}</CardTitle>
              <CardDescription>{t("formDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 p-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="create-group-name">{t("nameLabel")}</Label>
                <Input
                  id="create-group-name"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  disabled={!wallet.connected}
                />
                <p className="text-caption text-muted">{t("nameHelper")}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-group-members">{t("membersLabel")}</Label>
                  <Input
                    id="create-group-members"
                    type="number"
                    min={3}
                    max={12}
                    value={memberCount}
                    onChange={(event) => setMemberCount(event.target.value)}
                    disabled={!wallet.connected}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-group-amount">{t("amountLabel")}</Label>
                  <Input
                    id="create-group-amount"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    disabled={!wallet.connected}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-group-period">{t("periodLabel")}</Label>
                  <Input
                    id="create-group-period"
                    type="number"
                    min={1}
                    value={periodDays}
                    onChange={(event) => setPeriodDays(event.target.value)}
                    disabled={!wallet.connected}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="create-group-mint">{t("mintLabel")}</Label>
                  <select
                    id="create-group-mint"
                    value={mint}
                    onChange={(event) => setMint(event.target.value)}
                    disabled={!wallet.connected}
                    className="h-11 rounded-md border border-input bg-white px-3 text-body shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {mintOptions.map((option) => (
                      <option key={option.mint} value={option.mint}>
                        {option.symbol} · {shortPubkey(option.mint)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="create-group-id">{t("groupIdLabel")}</Label>
                <Input
                  id="create-group-id"
                  inputMode="numeric"
                  value={groupId}
                  onChange={(event) => setGroupId(event.target.value)}
                  disabled={!wallet.connected}
                  className="font-mono"
                />
                <p className="text-caption text-muted">{t("groupIdHelper")}</p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                  <div>
                    <Label htmlFor="create-group-access-code">{t("accessCodeLabel")}</Label>
                    <p className="mt-1 text-caption text-muted">{t("accessCodeHelper")}</p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setAccessCode(generateAccessCode())}
                    disabled={!wallet.connected}
                  >
                    {t("regenerateCode")}
                  </Button>
                </div>
                <Input
                  id="create-group-access-code"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                  disabled={!wallet.connected}
                  className="font-mono uppercase"
                />
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-body text-text">{t("simulationLead")}</p>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => setOpen(true)}
                  disabled={!canBuild}
                  data-testid="create-group-open-modal"
                >
                  {t("buttonLabel")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-24">
          <TxSummaryPanel rows={summaryRows} />
          {createdGroupPda ? (
            <Card className="rounded-2xl border-border/70 bg-white/95 shadow-1">
              <CardHeader>
                <CardTitle>{t("derivedTitle")}</CardTitle>
                <CardDescription className="break-all font-mono text-caption">
                  {createdGroupPda}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="rounded-xl border border-border/70 bg-surface2/60 p-3">
                  <p className="text-caption font-semibold uppercase tracking-[0.16em] text-muted">
                    {t("accessCodeLabel")}
                  </p>
                  <p className="mt-1 font-mono text-h3 font-semibold text-text">
                    {normalizedAccessCode}
                  </p>
                  <p className="mt-2 text-caption text-muted">
                    {inviteStatus === "saved"
                      ? t("inviteSaved")
                      : inviteStatus === "failed"
                        ? t("inviteFailed")
                        : t("invitePending")}
                  </p>
                </div>
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/${locale}/groups/${createdGroupPda}`}>{t("openCreated")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>

      {signature ? (
        <ReceiptCard
          signature={signature}
          status="confirmed"
          title={t("receiptTitle")}
          nextSteps={
            <span>
              {createdGroupPda ? (
                <Link href={`/${locale}/groups/${createdGroupPda}`} className="underline">
                  {t("nextStepsLinked")}
                </Link>
              ) : (
                t("nextStepsLead")
              )}
            </span>
          }
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
    </WalletGate>
  );
}
