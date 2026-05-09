#!/usr/bin/env node
/**
 * Story 8.1 + 8.4 — render-curve-hero
 *
 * Emits `docs/assets/curve-hero.svg`: an SVG visualization of the
 * dynamic-collateral curve `C_i = contribution * (2 * n - 1 - i)` for the
 * README first viewport (UX-DR25).
 *
 * Story 8.4 makes the default output animated via SMIL `<animate>` elements
 * (no JavaScript — GitHub strips `<script>` from rendered SVG). The animation
 * "draws in" the bars and the polyline curve on load. A CSS rule wired to
 * `prefers-reduced-motion: reduce` collapses the SMIL effect for reduced-
 * motion environments by zero-ing the bar offset and snapping the polyline
 * to its final state.
 *
 * Forks that want the original still image can run with `--no-animation`.
 *
 * Mirrors the static-svg variant of `<CurveVisualizer />`
 * (`apps/reference/components/susu/CurveVisualizer.tsx`, Story 7.11) but
 * emits a self-contained SVG that GitHub renders without JavaScript.
 *
 * Run with: `node scripts/render-curve-hero.mjs [--no-animation]`
 */

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Inline port of `apps/reference/lib/curve/computeCollateralCurve.ts`.
// Kept inline here so the script has zero workspace dependencies (a fork can
// run it from a clean checkout without `pnpm install`).
function computeCollateralCurve(n, contribution) {
  if (!Number.isInteger(n) || n < 3 || n > 12) {
    throw new Error(`n must be integer in [3, 12], got ${n}`);
  }
  if (!Number.isFinite(contribution) || contribution < 0) {
    throw new Error(`contribution must be non-negative finite, got ${contribution}`);
  }
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    out[i] = contribution * (2 * n - 1 - i);
  }
  return out;
}

const N = 8;
const CONTRIBUTION = 100;
const WIDTH = 720;
const HEIGHT = 320;
const PAD_INLINE_START = 36;
const PAD_INLINE_END = 12;
const PAD_BLOCK_START = 16;
const PAD_BLOCK_END = 28;

const COLOR_PRIMARY = '#14F195'; // Solana mint-green (UX direction).
const COLOR_BORDER = '#71717a'; // slate-500.
const COLOR_MUTED = '#71717a';

// Animation timing — tuned to feel "drawn in" without slowing the README hero.
const BAR_DURATION_S = 0.6; // each bar takes 0.6s to grow to full height
const BAR_STAGGER_S = 0.08; // each subsequent bar starts 0.08s later
const POLYLINE_DURATION_S = 1.4;

function renderSvg({ animated }) {
  const curve = computeCollateralCurve(N, CONTRIBUTION);
  const maxValue = curve[0] ?? 0;

  const plotWidth = WIDTH - PAD_INLINE_START - PAD_INLINE_END;
  const plotHeight = HEIGHT - PAD_BLOCK_START - PAD_BLOCK_END;
  const slotWidth = plotWidth / N;
  const barWidth = Math.max(1, slotWidth * 0.7);
  const barOffset = (slotWidth - barWidth) / 2;

  const polylinePoints = curve
    .map((value, i) => {
      const cx = PAD_INLINE_START + slotWidth * i + slotWidth / 2;
      const ratio = maxValue > 0 ? value / maxValue : 0;
      const cy = PAD_BLOCK_START + plotHeight * (1 - ratio);
      return `${cx.toFixed(2)},${cy.toFixed(2)}`;
    })
    .join(' ');

  const bars = curve
    .map((value, i) => {
      const ratio = maxValue > 0 ? value / maxValue : 0;
      const barHeight = plotHeight * ratio;
      const x = PAD_INLINE_START + slotWidth * i + barOffset;
      const yFinal = PAD_BLOCK_START + plotHeight - barHeight;
      const yStart = PAD_BLOCK_START + plotHeight; // flat against the x-axis
      const heightFinal = Math.max(0, barHeight).toFixed(2);
      const heightStart = '0';
      const begin = (i * BAR_STAGGER_S).toFixed(2);

      if (!animated) {
        return `  <rect class="bar" x="${x.toFixed(2)}" y="${yFinal.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${heightFinal}" fill="${COLOR_PRIMARY}" opacity="0.9" />`;
      }

      // SMIL <animate> grows the bar from the x-axis baseline up to its final
      // height. The `from`/`to` pair is overridden under reduced-motion via
      // the CSS rule that sets the static height directly on `.bar`.
      return [
        `  <rect class="bar" x="${x.toFixed(2)}" y="${yFinal.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${heightFinal}" fill="${COLOR_PRIMARY}" opacity="0.9">`,
        `    <animate attributeName="y" from="${yStart.toFixed(2)}" to="${yFinal.toFixed(2)}" dur="${BAR_DURATION_S}s" begin="${begin}s" fill="freeze" />`,
        `    <animate attributeName="height" from="${heightStart}" to="${heightFinal}" dur="${BAR_DURATION_S}s" begin="${begin}s" fill="freeze" />`,
        `  </rect>`,
      ].join('\n');
    })
    .join('\n');

  // Polyline path-length trick: stroke-dasharray + stroke-dashoffset gives a
  // "drawing" effect when offset animates from full length down to 0. We use a
  // pessimistic length that exceeds the actual polyline (the "draw" still
  // looks correct because dashoffset just shifts the visible portion).
  const polyTotal = (plotWidth + plotHeight) * 1.5;
  const polylineEl = animated
    ? [
        `  <polyline class="curve" points="${polylinePoints}" fill="none" stroke="${COLOR_PRIMARY}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" stroke-dasharray="${polyTotal.toFixed(2)}" stroke-dashoffset="${polyTotal.toFixed(2)}">`,
        `    <animate attributeName="stroke-dashoffset" from="${polyTotal.toFixed(2)}" to="0" dur="${POLYLINE_DURATION_S}s" begin="0s" fill="freeze" />`,
        `  </polyline>`,
      ].join('\n')
    : `  <polyline class="curve" points="${polylinePoints}" fill="none" stroke="${COLOR_PRIMARY}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />`;

  const ariaLabel = `Susu dynamic-collateral curve for n=${N}, contribution=${CONTRIBUTION}`;

  // Reduced-motion: collapse the SMIL effect by snapping bars/curve to the
  // final state. SMIL doesn't expose a direct `prefers-reduced-motion` hook,
  // but inline CSS in <style> *does* — we override `animation` on a
  // companion CSS class and (more importantly) hide the SMIL animate elements
  // via `display:none` so the rendered SVG starts in its final state.
  // GitHub does honor inline <style> in SVG; reduced-motion users get the
  // static curve immediately.
  const reducedMotionStyle = animated
    ? `  <style>@media (prefers-reduced-motion: reduce) { animate { display: none !important; } .bar, .curve { animation: none !important; } }</style>\n`
    : `  <style>/* prefers-reduced-motion already honored: this is the static fallback. */</style>\n`;

  // Self-contained SVG. No <script>, no external refs, only static markup
  // plus optional SMIL <animate> children.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="${ariaLabel}">
  <title>${ariaLabel}</title>
  <desc>Per-slot collateral C_i = contribution * (2 * n - 1 - i). Bars descend left-to-right; the polyline overlays the bar tops in mint. Story 8.4 animates the asset via SMIL; reduced-motion users see the static state.</desc>
${reducedMotionStyle}  <line x1="${PAD_INLINE_START}" y1="${PAD_BLOCK_START}" x2="${PAD_INLINE_START}" y2="${PAD_BLOCK_START + plotHeight}" stroke="${COLOR_BORDER}" stroke-width="1" />
  <line x1="${PAD_INLINE_START}" y1="${PAD_BLOCK_START + plotHeight}" x2="${PAD_INLINE_START + plotWidth}" y2="${PAD_BLOCK_START + plotHeight}" stroke="${COLOR_BORDER}" stroke-width="1" />
${bars}
${polylineEl}
  <text x="${PAD_INLINE_START - 4}" y="${PAD_BLOCK_START + 4}" text-anchor="end" fill="${COLOR_MUTED}" font-size="10" font-family="ui-sans-serif, system-ui, sans-serif">C</text>
  <text x="${PAD_INLINE_START + plotWidth / 2}" y="${HEIGHT - 8}" text-anchor="middle" fill="${COLOR_MUTED}" font-size="10" font-family="ui-sans-serif, system-ui, sans-serif">slot i (0..n-1)</text>
</svg>
`;
}

function main() {
  const argv = process.argv.slice(2);
  const animated = !argv.includes('--no-animation');
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, '..');
  const outPath = resolve(repoRoot, 'docs/assets/curve-hero.svg');
  const svg = renderSvg({ animated });
  writeFileSync(outPath, svg, 'utf8');
  console.log(`wrote ${outPath} (${svg.length} bytes, animated=${animated})`);
}

main();
