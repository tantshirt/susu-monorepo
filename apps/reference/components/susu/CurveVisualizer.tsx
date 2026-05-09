"use client";

import * as React from "react";
import { computeCollateralCurve, MAX_GROUP_SIZE, MIN_GROUP_SIZE } from "@/lib/curve/computeCollateralCurve";
import { cn } from "@/lib/utils";

/**
 * `<CurveVisualizer />` — visualizes the dynamic-collateral curve.
 *
 * Two variants share the same SVG markup:
 *   - **static-svg** (default, Story 7.11) — pure SVG, no JS, no animation.
 *     Used by the README hero embed and any context where the parameters
 *     are fixed at render time.
 *   - **interactive** (`interactive` prop, Story 8.4) — adds parameter
 *     sliders for `n` and `contribution`, plus a "30% Cartel" toggle that
 *     highlights positions 4..6 in the warn token with a labeled callout
 *     (UX-DR12). Renders client-side so the sliders can drive React state.
 *
 * Story 8.4 file is marked `"use client"` so the interactive controls work
 * out of the box. The static-svg variant still works correctly inside Server
 * Components — Next.js renders the initial markup on the server, and the
 * client bundle only kicks in when sliders or the toggle are actually used.
 *
 * Renders bars at zero-indexed slots `i = 0..n-1` whose heights are
 * proportional to `C_i = contribution * (2 * n - 1 - i)` — the canonical
 * curve from `programs/susu/src/curve.rs` and `docs/collateral-curve.md`.
 *
 * Token discipline (UX-DR2): all colors come from Tailwind tokens
 * (`fill-primary`, `fill-warn`, `stroke-border`, `text-muted`). The same
 * markup re-skins automatically under `[data-skin="diaspora"]`.
 *
 * a11y: `role="img"`, `aria-label`, and a hidden `<table>` with the same
 * data for screen readers (UX-DR12). Slider inputs are labeled, the cartel
 * toggle is a real `<button>` with `aria-pressed`, and the cartel callout
 * uses `role="note"` so screen readers announce it.
 *
 * Reduced-motion: the SVG re-renders synchronously when sliders change. No
 * CSS transitions are applied, so `prefers-reduced-motion: reduce` users
 * already see the static state. The cartel callout is always rendered
 * inline (no fade transition) for the same reason.
 */
export type CurveVisualizerSize = "sm" | "md" | "lg";

export interface CurveVisualizerProps extends Omit<React.SVGAttributes<SVGSVGElement>, "n"> {
  /** Group size, `3 <= n <= 12`. Required for the static variant; used as the
   *  initial value when `interactive` is true. */
  n: number;
  /** Per-round contribution (display units; the SVG is unitless). Required
   *  for the static variant; used as the initial value when `interactive`. */
  contribution: number;
  /** Optional zero-indexed slot indices to render in the warn token. Ignored
   *  when `interactive` is true (the cartel toggle controls highlighting). */
  highlight?: number[];
  /** Locale tag — accepted for future intl-aware formatting; unused for now. */
  locale?: string;
  /** Visual size preset. */
  size?: CurveVisualizerSize;
  /** When `true`, render parameter sliders for `n` and `contribution` plus
   *  a "30% Cartel" toggle that highlights positions 4..6. Defaults to
   *  `false` (static-svg variant unchanged from Story 7.11). */
  interactive?: boolean;
  /** User-facing copy for the interactive variant. The docs/curve page
   *  passes localized strings via `next-intl`. Falls back to English when
   *  the variant is mounted without copy (e.g., in unit tests). */
  copy?: CurveVisualizerCopy;
}

export interface CurveVisualizerCopy {
  sliderN: string;
  sliderContribution: string;
  cartelToggle: string;
  cartelCallout: string;
}

const DEFAULT_COPY: CurveVisualizerCopy = {
  sliderN: "Group size (n)",
  sliderContribution: "Contribution per round (USDC)",
  cartelToggle: "30% Cartel highlight",
  cartelCallout:
    "Positions 4–6 are the cartel-controlled slots in the documented adversary scenario. The curve still keeps every defaulter underwater (UX-DR12).",
};

/** Cartel positions per `docs/collateral-curve.md` (zero-indexed slots 4..6). */
const CARTEL_POSITIONS: readonly number[] = [4, 5, 6];

/** Contribution slider bounds per AC. */
const MIN_CONTRIBUTION = 10;
const MAX_CONTRIBUTION = 10000;

const SIZE_DIMENSIONS: Record<CurveVisualizerSize, { width: number; height: number }> = {
  sm: { width: 320, height: 120 },
  md: { width: 480, height: 180 },
  lg: { width: 720, height: 320 },
};

const PAD_INLINE_START = 36;
const PAD_INLINE_END = 12;
const PAD_BLOCK_START = 16;
const PAD_BLOCK_END = 28;

export function CurveVisualizer({
  n,
  contribution,
  highlight,
  // `locale` is accepted for future intl-aware tick labels; deliberately unused
  // in the static-svg variant so the SVG markup is byte-stable across locales.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  locale,
  size = "md",
  interactive = false,
  copy,
  className,
  ...svgProps
}: CurveVisualizerProps) {
  // Local state only matters for the interactive variant. Keep both hooks
  // unconditional so React's hook ordering is stable across renders.
  const [activeN, setActiveN] = React.useState<number>(n);
  const [activeContribution, setActiveContribution] = React.useState<number>(contribution);
  const [cartelOn, setCartelOn] = React.useState<boolean>(false);

  const effectiveN = interactive ? activeN : n;
  const effectiveContribution = interactive ? activeContribution : contribution;
  const effectiveHighlight = interactive
    ? cartelOn
      ? CARTEL_POSITIONS
      : []
    : (highlight ?? []);
  const localizedCopy = copy ?? DEFAULT_COPY;

  const { width, height } = SIZE_DIMENSIONS[size];
  const curve = computeCollateralCurve(effectiveN, effectiveContribution);
  const maxValue = curve[0] ?? 0;
  const highlightSet = new Set(effectiveHighlight);

  const plotWidth = width - PAD_INLINE_START - PAD_INLINE_END;
  const plotHeight = height - PAD_BLOCK_START - PAD_BLOCK_END;
  const slotWidth = plotWidth / effectiveN;
  const barWidth = Math.max(1, slotWidth * 0.7);
  const barOffset = (slotWidth - barWidth) / 2;

  // Polyline points connecting the top of every bar (the "curve" overlay).
  const polylinePoints = curve
    .map((value, i) => {
      const cx = PAD_INLINE_START + slotWidth * i + slotWidth / 2;
      const ratio = maxValue > 0 ? value / maxValue : 0;
      const cy = PAD_BLOCK_START + plotHeight * (1 - ratio);
      return `${cx.toFixed(2)},${cy.toFixed(2)}`;
    })
    .join(" ");

  const ariaLabel = `Collateral curve for n=${effectiveN}, contribution=${effectiveContribution}`;

  const svgFigure = (
    <>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={ariaLabel}
        className="block max-w-full text-muted"
        {...svgProps}
      >
        {/* Y-axis line */}
        <line
          x1={PAD_INLINE_START}
          y1={PAD_BLOCK_START}
          x2={PAD_INLINE_START}
          y2={PAD_BLOCK_START + plotHeight}
          className="stroke-border"
          strokeWidth={1}
        />
        {/* X-axis line */}
        <line
          x1={PAD_INLINE_START}
          y1={PAD_BLOCK_START + plotHeight}
          x2={PAD_INLINE_START + plotWidth}
          y2={PAD_BLOCK_START + plotHeight}
          className="stroke-border"
          strokeWidth={1}
        />
        {/* Bars */}
        {curve.map((value, i) => {
          const ratio = maxValue > 0 ? value / maxValue : 0;
          const barHeight = plotHeight * ratio;
          const x = PAD_INLINE_START + slotWidth * i + barOffset;
          const y = PAD_BLOCK_START + plotHeight - barHeight;
          const isHighlighted = highlightSet.has(i);
          return (
            <rect
              key={`bar-${i}`}
              x={x}
              y={y}
              width={barWidth}
              height={Math.max(0, barHeight)}
              className={cn(
                isHighlighted ? "fill-warn" : "fill-primary",
                "opacity-90",
              )}
            />
          );
        })}
        {/* Curve overlay through bar tops, in the mint primary token. */}
        <polyline
          points={polylinePoints}
          className="fill-none stroke-primary"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Y-axis label (top of axis). */}
        <text
          x={PAD_INLINE_START - 4}
          y={PAD_BLOCK_START + 4}
          textAnchor="end"
          className="fill-muted text-caption"
          fontSize={10}
        >
          C
        </text>
        {/* X-axis label (bottom of axis). */}
        <text
          x={PAD_INLINE_START + plotWidth / 2}
          y={height - 8}
          textAnchor="middle"
          className="fill-muted text-caption"
          fontSize={10}
        >
          slot i (0..n-1)
        </text>
      </svg>
      {/* Hidden table mirror of the same data for screen readers (UX-DR12). */}
      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th scope="col">Slot</th>
            <th scope="col">Collateral</th>
          </tr>
        </thead>
        <tbody>
          {curve.map((value, i) => (
            <tr key={`row-${i}`}>
              <th scope="row">{i}</th>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );

  if (!interactive) {
    return <figure className={cn("flex flex-col gap-2", className)}>{svgFigure}</figure>;
  }

  // Interactive variant — sliders, cartel toggle, callout. Inputs use
  // logical Tailwind classes (no directional `pl-*`/`pr-*`) so RTL flips
  // automatically when wrapped in the locale layout.
  return (
    <figure className={cn("flex flex-col gap-4", className)} data-component="CurveVisualizer">
      {svgFigure}

      <div className="flex flex-col gap-3">
        {/* n slider — integer 3..12. */}
        <div className="flex flex-col gap-1">
          <label htmlFor="curve-n" className="text-body text-text">
            {localizedCopy.sliderN}: <span className="font-mono text-primary">{activeN}</span>
          </label>
          <input
            id="curve-n"
            type="range"
            min={MIN_GROUP_SIZE}
            max={MAX_GROUP_SIZE}
            step={1}
            value={activeN}
            onChange={(event) => setActiveN(Number(event.target.value))}
            className="w-full accent-primary"
            data-testid="curve-slider-n"
          />
        </div>

        {/* contribution slider — $10..$10,000, $10 step. */}
        <div className="flex flex-col gap-1">
          <label htmlFor="curve-contribution" className="text-body text-text">
            {localizedCopy.sliderContribution}: <span className="font-mono text-primary">${activeContribution}</span>
          </label>
          <input
            id="curve-contribution"
            type="range"
            min={MIN_CONTRIBUTION}
            max={MAX_CONTRIBUTION}
            step={10}
            value={activeContribution}
            onChange={(event) => setActiveContribution(Number(event.target.value))}
            className="w-full accent-primary"
            data-testid="curve-slider-contribution"
          />
        </div>

        {/* 30% Cartel toggle. Real <button> for proper a11y semantics; the
            visual treatment uses the warn token to mirror the highlighted
            bars. Cartel positions 4..6 are inclusive (zero-indexed) per
            docs/collateral-curve.md. */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            aria-pressed={cartelOn}
            onClick={() => setCartelOn((value) => !value)}
            className={cn(
              "inline-flex items-center justify-center rounded-md border px-4 py-2 text-body font-medium",
              cartelOn
                ? "border-warn bg-warn/10 text-warn"
                : "border-border bg-surface text-text hover:bg-muted/10",
            )}
            data-testid="curve-cartel-toggle"
          >
            {localizedCopy.cartelToggle}
          </button>
          {cartelOn ? (
            <p
              role="note"
              className="rounded-md border border-warn/40 bg-warn/10 p-3 text-caption text-warn"
              data-testid="curve-cartel-callout"
            >
              {localizedCopy.cartelCallout}
            </p>
          ) : null}
        </div>
      </div>
    </figure>
  );
}
CurveVisualizer.displayName = "CurveVisualizer";
