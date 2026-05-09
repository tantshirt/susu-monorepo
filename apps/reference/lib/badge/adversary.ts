import type { AdversaryBadgeState, AdversaryReport } from "./types";
import {
  approximateWidth,
  BADGE_FONT_FAMILY,
  BADGE_LEFT_FILL,
  BADGE_LEFT_TEXT,
  escapeXml,
} from "./svg-utils";

/**
 * Susu reference app — `<AdversaryBadge />` SVG renderer (Story 8.2, UX-DR17).
 *
 * Pure function. Given a state discriminator and (optionally) the parsed
 * adversary report, returns a self-contained SVG string suitable for
 * `Content-Type: image/svg+xml`. The SVG is served standalone (README,
 * external embeds, GitHub social cards), so we cannot rely on Tailwind or
 * the reference-app token cascade. Colors are inlined to match the
 * protocol-locked tokens declared in `apps/reference/lib/theme/tokens.css`:
 *
 *   - mint   `#14F195` — verified (Solana mint, cross-skin protocol identity)
 *   - amber  `#FBBF24` — pending  (`--warn`)
 *   - coral  `#F87171` — failed   (`--danger`)
 *
 * The badge layout is intentionally minimalist (shields.io-style) so
 * GitHub README rendering stays crisp at any zoom and the surface stays
 * accessible to screen readers via the embedded `<title>` element.
 */

type StateStyle = {
  /** Right-side label color. */
  fill: string;
  /** Right-side label text. */
  label: string;
  /** Accessible title used by `<title>` and `aria-label`. */
  title: string;
};

const LEFT_LABEL = "adversary";

function styleFor(state: AdversaryBadgeState): StateStyle {
  switch (state) {
    case "verified":
      return {
        fill: "#14F195",
        label: "10,000 adversarial circles passed ✓",
        title: "Adversary: 10,000 adversarial circles passed",
      };
    case "pending":
      return {
        fill: "#FBBF24",
        label: "Pending verification",
        title: "Adversary: pending verification",
      };
    case "failed":
      return {
        fill: "#F87171",
        label: "FAILED — view report",
        title: "Adversary: FAILED — view report",
      };
  }
}

/**
 * Resolve the badge state from a parsed report (or `null` if missing).
 *
 * - `null` (read failed / no recent run) → `pending`
 * - `summary.max_defector_profit_lamports === 0` → `verified`
 * - any positive defector profit → `failed`
 *
 * Negative defector profits indicate a scenario where the simulator
 * proved every defector LOST money; that still counts as `verified`
 * for the headline invariant.
 */
export function resolveAdversaryState(
  report: AdversaryReport | null,
): AdversaryBadgeState {
  if (!report) {
    return "pending";
  }
  const profit = report.summary?.max_defector_profit_lamports;
  if (typeof profit !== "number" || Number.isNaN(profit)) {
    return "pending";
  }
  if (profit > 0) {
    return "failed";
  }
  return "verified";
}

/** Truncate a commit SHA to the first 7 chars (git short-hash style). */
function shortSha(sha: string | undefined): string {
  if (!sha || typeof sha !== "string") {
    return "";
  }
  return sha.slice(0, 7);
}

/**
 * Render the AdversaryBadge SVG.
 *
 * Exported for unit tests and the route handler. Returns a self-contained
 * SVG string with no external font/CSS references.
 */
export function renderAdversarySvg(
  state: AdversaryBadgeState,
  report: AdversaryReport | null,
): string {
  const style = styleFor(state);
  const leftWidth = 86; // fits "adversary" comfortably at 12px.
  const rightWidth = approximateWidth(style.label);
  const totalWidth = leftWidth + rightWidth;
  const height = 28;
  const radius = 4;

  const sha = shortSha(report?.run_metadata?.commit_sha);
  const caption = sha ? `verified at ${sha}` : "";

  // Mint/coral are bright on dark; amber works against a dark text fill.
  // Pick a foreground that holds WCAG AA contrast against the fill.
  const rightTextFill = state === "pending" ? "#1A1208" : "#0B0D12";

  const titleText = escapeXml(style.title);
  const labelText = escapeXml(style.label);
  const captionText = escapeXml(caption);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-label="${titleText}">`,
    `<title>${titleText}</title>`,
    `<defs><clipPath id="r"><rect width="${totalWidth}" height="${height}" rx="${radius}" ry="${radius}"/></clipPath></defs>`,
    `<g clip-path="url(#r)">`,
    `<rect width="${leftWidth}" height="${height}" fill="${BADGE_LEFT_FILL}"/>`,
    `<rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="${style.fill}"/>`,
    `</g>`,
    `<g fill="${BADGE_LEFT_TEXT}" font-family="${BADGE_FONT_FAMILY}" font-size="12">`,
    `<text x="${leftWidth / 2}" y="18" text-anchor="middle">${LEFT_LABEL}</text>`,
    `</g>`,
    `<g fill="${rightTextFill}" font-family="${BADGE_FONT_FAMILY}" font-size="12" font-weight="600">`,
    `<text x="${leftWidth + rightWidth / 2}" y="18" text-anchor="middle">${labelText}</text>`,
    `</g>`,
    captionText
      ? `<g fill="${BADGE_LEFT_TEXT}" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="9" opacity="0.7"><text x="${totalWidth - 4}" y="${height - 2}" text-anchor="end">${captionText}</text></g>`
      : "",
    `</svg>`,
  ].join("");
}
