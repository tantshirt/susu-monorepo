"use client";

import * as React from "react";
import { Banner } from "@/components/susu/Banner";
import { cn } from "@/lib/utils";
import type { SimulationResult } from "@/lib/tx/types";

/**
 * Story 7.10 — `<SimulationResultBlock />`.
 *
 * Renders the outcome of a `simulateTransaction` call inside the
 * `<TransactionConfirmModal>`:
 *
 *   - Success → `Banner variant="success"` ("Will succeed") plus optional
 *     unitsConsumed read-out and a collapsible `<details>` log dump.
 *   - Warnings (e.g. compute units near the limit) → additional
 *     `Banner variant="warn"` rows above the success banner. Warnings are
 *     advisory; the Confirm button stays enabled.
 *   - Failure → `Banner variant="danger"` with the SDK-resolved error
 *     code/name/message and a non-collapsible log section so reviewers can
 *     see exactly why the simulation rejected.
 *
 * The block declares `aria-live="polite"` so screen readers (UX-DR41)
 * announce the result when it transitions from "simulating" to "ready".
 *
 * Token discipline: only semantic tokens (`text-text`, `text-muted`,
 * `bg-surface2`, `border-border`). No hex / palette literals.
 */
export interface SimulationResultBlockProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Null while `simulating`; becomes a `SimulationResult` when settled. */
  result: SimulationResult | null;
  /** True while the underlying simulate() promise is pending. */
  pending?: boolean;
}

export const SimulationResultBlock = React.forwardRef<
  HTMLDivElement,
  SimulationResultBlockProps
>(({ result, pending, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      aria-live="polite"
      data-testid="simulation-result-block"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {pending ? (
        <Banner variant="info">
          Simulating transaction… we run this before asking you to sign.
        </Banner>
      ) : null}

      {result && result.warnings && result.warnings.length > 0
        ? result.warnings.map((w, i) => (
            <Banner key={i} variant="warn">
              {w}
            </Banner>
          ))
        : null}

      {result && result.ok ? (
        <Banner variant="success">
          Will succeed
          {typeof result.unitsConsumed === "number" ? (
            <>
              {" "}
              <span className="font-mono numeric">
                ({result.unitsConsumed.toLocaleString()} CU)
              </span>
            </>
          ) : null}
        </Banner>
      ) : null}

      {result && !result.ok ? (
        <Banner variant="danger">
          Will fail
          {result.errorName ? (
            <>
              {" "}
              <span className="font-mono">{result.errorName}</span>
            </>
          ) : null}
          {typeof result.errorCode === "number" ? (
            <>
              {" "}
              <span className="font-mono">(code {result.errorCode})</span>
            </>
          ) : null}
          {result.errorMessage ? <>: {result.errorMessage}</> : null}
        </Banner>
      ) : null}

      {result && result.logs.length > 0 ? (
        <details
          className={cn(
            "rounded-md border border-border bg-surface2 p-3",
            "text-caption text-muted",
          )}
        >
          <summary className="cursor-pointer select-none font-mono text-caption text-text">
            Simulation logs ({result.logs.length})
          </summary>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap font-mono text-caption leading-6 text-text">
            {result.logs.join("\n")}
          </pre>
        </details>
      ) : null}
    </div>
  );
});
SimulationResultBlock.displayName = "SimulationResultBlock";
