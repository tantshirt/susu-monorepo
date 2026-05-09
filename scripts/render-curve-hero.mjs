#!/usr/bin/env node
/**
 * Story 8.1 — render-curve-hero
 *
 * Emits `docs/assets/curve-hero.svg`: a static SVG visualization of the
 * dynamic-collateral curve `C_i = contribution * (2 * n - 1 - i)` for the
 * README first viewport (UX-DR25).
 *
 * Mirrors the static-svg variant of `<CurveVisualizer />`
 * (`apps/reference/components/susu/CurveVisualizer.tsx`, Story 7.11) but
 * emits a self-contained SVG that GitHub renders without JavaScript.
 *
 * The Tailwind tokens used by the React component (`fill-primary`,
 * `stroke-border`, `text-muted`) are flattened to inline colors that read
 * well against both GitHub light + dark themes:
 *   - bars + curve: mint (#14F195, the Solana mint-green protocol identity)
 *   - axes: muted neutral (#71717a, slate-500)
 *   - labels: muted neutral (same)
 *
 * Story 8.4 will replace this static asset with an animated SMIL/CSS variant.
 *
 * Run with: `node scripts/render-curve-hero.mjs`
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

function renderSvg() {
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
      const y = PAD_BLOCK_START + plotHeight - barHeight;
      return `  <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barWidth.toFixed(2)}" height="${Math.max(0, barHeight).toFixed(2)}" fill="${COLOR_PRIMARY}" opacity="0.9" />`;
    })
    .join('\n');

  const ariaLabel = `Susu dynamic-collateral curve for n=${N}, contribution=${CONTRIBUTION}`;

  // Self-contained SVG. No <script>, no external refs, only static markup.
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}" role="img" aria-label="${ariaLabel}">
  <title>${ariaLabel}</title>
  <desc>Per-slot collateral C_i = contribution * (2 * n - 1 - i). Bars descend left-to-right; the polyline overlays the bar tops in mint. Story 8.1 README hero. Story 8.4 will animate this asset.</desc>
  <line x1="${PAD_INLINE_START}" y1="${PAD_BLOCK_START}" x2="${PAD_INLINE_START}" y2="${PAD_BLOCK_START + plotHeight}" stroke="${COLOR_BORDER}" stroke-width="1" />
  <line x1="${PAD_INLINE_START}" y1="${PAD_BLOCK_START + plotHeight}" x2="${PAD_INLINE_START + plotWidth}" y2="${PAD_BLOCK_START + plotHeight}" stroke="${COLOR_BORDER}" stroke-width="1" />
${bars}
  <polyline points="${polylinePoints}" fill="none" stroke="${COLOR_PRIMARY}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
  <text x="${PAD_INLINE_START - 4}" y="${PAD_BLOCK_START + 4}" text-anchor="end" fill="${COLOR_MUTED}" font-size="10" font-family="ui-sans-serif, system-ui, sans-serif">C</text>
  <text x="${PAD_INLINE_START + plotWidth / 2}" y="${HEIGHT - 8}" text-anchor="middle" fill="${COLOR_MUTED}" font-size="10" font-family="ui-sans-serif, system-ui, sans-serif">slot i (0..n-1)</text>
</svg>
`;
}

function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const repoRoot = resolve(here, '..');
  const outPath = resolve(repoRoot, 'docs/assets/curve-hero.svg');
  const svg = renderSvg();
  writeFileSync(outPath, svg, 'utf8');
  console.log(`wrote ${outPath} (${svg.length} bytes)`);
}

main();
