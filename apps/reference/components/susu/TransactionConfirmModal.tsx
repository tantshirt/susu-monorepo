"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/susu/Banner";
import { ReceiptCard } from "@/components/susu/ReceiptCard";
import { SimulationResultBlock } from "@/components/susu/SimulationResultBlock";
import { useToastQueue } from "@/lib/tx/toast-queue";
import type { SimulationResult, SusuTxError, TxSignature } from "@/lib/tx/types";
import { isSusuError } from "@/lib/tx/types";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

/**
 * Story 7.10 — `<TransactionConfirmModal />`.
 *
 * Reusable transaction-confirmation surface consumed by Stories 7.14
 * (contribute) and 7.15 (claim). The modal:
 *
 *   1. On open, walks an internal state machine
 *      `idle → building → simulating → ready-to-submit → submitting →
 *      done | failed`.
 *   2. Calls `buildTx()` to produce a versioned `Transaction` (we keep the
 *      type as `unknown` here so the modal stays SDK-agnostic — the closure
 *      owner re-types as `@solana/kit` `Transaction`).
 *   3. Calls `simulate(tx)` and surfaces the result through
 *      `<SimulationResultBlock>`. Per Story 6.2 the simulation step is
 *      mandatory — the Confirm button stays disabled until the simulation
 *      promise resolves.
 *   4. On user confirmation, calls `submit(tx)` and renders a
 *      `<ReceiptCard>` once the signature returns. `onSuccess` /
 *      `onError` callbacks fire so consumers can advance their flow.
 *
 * UX-DR42: the modal MUST NOT be dismissable while `submitting` (escape
 * and overlay-click are suppressed). Once `done` / `failed` it can be
 * closed normally.
 *
 * Toasts use the Story 7.10 `useToastQueue()` so reviewers see a status
 * surface without losing the persistent `<ReceiptCard>` (UX-DR21 says
 * receipts are never replaced by toasts).
 */

export type TxBuilder = () => Promise<unknown>;
export type TxSimulator = (tx: unknown) => Promise<SimulationResult>;
export type TxSubmitter = (tx: unknown) => Promise<TxSignature>;

export interface TransactionConfirmModalProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  title: string;
  description?: string;
  buildTx: TxBuilder;
  simulate: TxSimulator;
  submit: TxSubmitter;
  onSuccess?(sig: TxSignature): void;
  onError?(err: SusuTxError): void;
  /**
   * Optional accent text rendered next to the title — typically the action
   * label (e.g. "Contribute", "Claim payout"). Stories 7.14 / 7.15 use this
   * to disambiguate identical modal copy.
   */
  actionLabel?: string;
}

type State =
  | "idle"
  | "building"
  | "simulating"
  | "ready-to-submit"
  | "submitting"
  | "done"
  | "failed";

interface InternalState {
  phase: State;
  tx: unknown;
  simulation: SimulationResult | null;
  signature: TxSignature | null;
  error: SusuTxError | null;
}

const INITIAL: InternalState = {
  phase: "idle",
  tx: null,
  simulation: null,
  signature: null,
  error: null,
};

/**
 * Outer component owns only the `open` flag — when closed we render the
 * Dialog without inner content so the inner state machine unmounts and any
 * subsequent re-open starts from `INITIAL`. This sidesteps the
 * `react-hooks/set-state-in-effect` rule (resetting state via an effect on
 * close) while still satisfying Story 6.2's "simulate every open" contract.
 */
export function TransactionConfirmModal(props: TransactionConfirmModalProps) {
  const { open, onOpenChange } = props;

  // While submitting, the inner component upgrades the close handler to a
  // no-op via `handleOpenChange`; the outer Dialog still uses the raw
  // `onOpenChange` so external `setOpen(false)` callers don't silently
  // break — they'll be ignored by the inner guard for `submitting`.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? <TransactionConfirmModalInner {...props} /> : null}
    </Dialog>
  );
}

function TransactionConfirmModalInner({
  onOpenChange,
  title,
  description,
  buildTx,
  simulate,
  submit,
  onSuccess,
  onError,
  actionLabel,
}: TransactionConfirmModalProps) {
  const [state, setState] = React.useState<InternalState>(INITIAL);
  const toast = useToastQueue();
  const t = useTranslations("tx");
  const tCommon = useTranslations("common");

  // Pin the latest `buildTx` / `simulate` / `onError` closures via refs so
  // the build-and-simulate effect can run exactly once per mount without
  // listing them in its deps array. Listing them — or `state.phase` — would
  // re-fire the effect mid-async and the cleanup would set `aborted = true`
  // on the in-flight run, cancelling the very build we just kicked off.
  const buildTxRef = React.useRef(buildTx);
  const simulateRef = React.useRef(simulate);
  const onErrorRef = React.useRef(onError);
  React.useEffect(() => {
    buildTxRef.current = buildTx;
    simulateRef.current = simulate;
    onErrorRef.current = onError;
  });

  // Build + simulate on mount. The outer component only mounts the inner
  // when `open` is true, so this fires exactly once per "open the modal"
  // gesture — satisfying Story 6.2's simulate-by-default contract without
  // needing `state.phase` in the deps.
  React.useEffect(() => {
    let aborted = false;
    (async () => {
      setState((s) => ({ ...s, phase: "building" }));
      let tx: unknown;
      try {
        tx = await buildTxRef.current();
      } catch (err) {
        if (aborted) return;
        const e = toError(err);
        setState({ ...INITIAL, phase: "failed", error: e });
        onErrorRef.current?.(e);
        return;
      }
      if (aborted) return;
      setState((s) => ({ ...s, phase: "simulating", tx }));

      try {
        const sim = await simulateRef.current(tx);
        if (aborted) return;
        setState((s) => ({
          ...s,
          phase: sim.ok ? "ready-to-submit" : "failed",
          simulation: sim,
          error: sim.ok
            ? null
            : ({
                name: sim.errorName ?? "SusuSimulationError",
                message: sim.errorMessage ?? "Simulation reported an error.",
              } as SusuTxError),
        }));
      } catch (err) {
        if (aborted) return;
        const e = toError(err);
        setState((s) => ({
          ...s,
          phase: "failed",
          error: e,
        }));
        onErrorRef.current?.(e);
      }
    })();

    return () => {
      aborted = true;
    };
  }, []);

  const onConfirm = React.useCallback(async () => {
    if (state.phase !== "ready-to-submit" || !state.tx) return;
    setState((s) => ({ ...s, phase: "submitting" }));
    try {
      const sig = await submit(state.tx);
      setState((s) => ({ ...s, phase: "done", signature: sig }));
      toast.push({
        title: t("toastConfirmedTitle"),
        description: t("toastConfirmedDescription"),
        variant: "signal",
      });
      onSuccess?.(sig);
    } catch (err) {
      const e = toError(err);
      setState((s) => ({ ...s, phase: "failed", error: e }));
      toast.push({
        title: t("toastFailedTitle"),
        description: e.message,
        variant: "danger",
      });
      onError?.(e);
    }
  }, [state.phase, state.tx, submit, onSuccess, onError, toast, t]);

  // Mid-signing the modal cannot be dismissed (UX-DR42). The Radix-level
  // event guards on `<DialogContent>` already block escape / overlay-click
  // during submission; this callback is the explicit "Cancel" path used by
  // the footer button, which mirrors the same guard for symmetry.
  const requestClose = React.useCallback(() => {
    if (state.phase === "submitting") return;
    onOpenChange(false);
  }, [state.phase, onOpenChange]);

  // Block escape + overlay-click during submission via Radix' dedicated
  // event hooks (the footer Cancel button calls `requestClose` instead).
  const blockDuringSubmit = React.useCallback(
    (e: Event) => {
      if (state.phase === "submitting") e.preventDefault();
    },
    [state.phase],
  );

  const confirmDisabled =
    state.phase === "building" ||
    state.phase === "simulating" ||
    state.phase === "submitting" ||
    state.phase === "failed" ||
    state.phase === "done" ||
    !state.simulation ||
    !state.simulation.ok;

  const showReceipt = state.phase === "done" && state.signature;
  const submittingLabel = state.phase === "submitting" ? t("submitting") : t("confirm");

  return (
    <DialogContent
      aria-modal="true"
      onEscapeKeyDown={blockDuringSubmit}
      onPointerDownOutside={blockDuringSubmit}
      onInteractOutside={blockDuringSubmit}
      className={cn("max-w-lg gap-0 overflow-hidden rounded-2xl border-border/70 bg-white p-0 shadow-2")}
    >
        <DialogHeader className="border-b border-border/70 bg-surface2/70 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-h3 font-semibold tracking-tight text-text">
                {title}
              </DialogTitle>
              {description ? (
                <DialogDescription className="mt-2 max-w-md text-body text-muted">
                  {description}
                </DialogDescription>
              ) : null}
            </div>
            {actionLabel ? (
              <span className="shrink-0 rounded-pill border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-caption font-semibold text-primary">
                {actionLabel}
              </span>
            ) : null}
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-6 py-5">
          <SimulationResultBlock
            result={state.simulation}
            pending={state.phase === "building" || state.phase === "simulating"}
          />

          {state.phase === "failed" && state.error ? (
            <Banner variant="danger">
              {state.error.name && state.error.name !== "Error" ? (
                <span className="font-mono">{state.error.name}: </span>
              ) : null}
              {state.error.message}
            </Banner>
          ) : null}

          {showReceipt && state.signature ? (
            <ReceiptCard signature={state.signature} status="confirmed" />
          ) : null}
        </div>

        <DialogFooter className="border-t border-border/70 bg-surface2/60 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={requestClose}
            disabled={state.phase === "submitting"}
          >
            {state.phase === "done" ? tCommon("close") : tCommon("cancel")}
          </Button>
          {state.phase !== "done" ? (
            <Button
              type="button"
              variant="primary"
              onClick={onConfirm}
              disabled={confirmDisabled}
              data-testid="tx-confirm-submit"
            >
              {submittingLabel}
            </Button>
          ) : null}
        </DialogFooter>
    </DialogContent>
  );
}

function toError(err: unknown): SusuTxError {
  if (err instanceof Error) return err;
  if (isSusuError(err)) return err as SusuTxError;
  return new Error(typeof err === "string" ? err : "Unknown error");
}
