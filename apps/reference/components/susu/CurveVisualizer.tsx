import * as React from "react";
import { computeCollateralCurve } from "@/lib/curve/computeCollateralCurve";
import { cn } from "@/lib/utils";

/**
 * `<CurveVisualizer />` — **static SVG variant** of the dynamic-collateral
 * curve. Server Component, pure SVG, no JS, no animation.
 *
 * Story 7.11 (this file): static-svg variant only. Story 8.4 owns the
 * interactive variant (sliders, hover, animation). Story 8.1 README hero
 * embeds this exact variant.
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
 * data for screen readers (UX-DR12).
 */
export type CurveVisualizerSize = "sm" | "md" | "lg";

export interface CurveVisualizerProps extends Omit<React.SVGAttributes<SVGSVGElement>, "n"> {
  /** Group size, `3 <= n <= 12`. */
  n: number;
  /** Per-round contribution (display units; the SVG is unitless). */
  contribution: number;
  /** Optional zero-indexed slot indices to render in the warn token. */
  highlight?: number[];
  /** Locale tag — accepted for future intl-aware formatting; unused for now. */
  locale?: string;
  /** Visual size preset. */
  size?: CurveVisualizerSize;
}

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
  className,
  ...svgProps
}: CurveVisualizerProps) {
  const { width, height } = SIZE_DIMENSIONS[size];
  const curve = computeCollateralCurve(n, contribution);
  const maxValue = curve[0] ?? 0;
  const highlightSet = new Set(highlight ?? []);

  const plotWidth = width - PAD_INLINE_START - PAD_INLINE_END;
  const plotHeight = height - PAD_BLOCK_START - PAD_BLOCK_END;
  const slotWidth = plotWidth / n;
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

  const ariaLabel = `Collateral curve for n=${n}, contribution=${contribution}`;

  return (
    <figure className={cn("flex flex-col gap-2", className)}>
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
    </figure>
  );
}
CurveVisualizer.displayName = "CurveVisualizer";
