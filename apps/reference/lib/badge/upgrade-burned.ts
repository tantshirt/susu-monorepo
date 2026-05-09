/**
 * Susu reference app — `<UpgradeBurnedBadge />` SVG renderer
 * (Story 8.3, ARCH-37, UX-DR18).
 *
 * Pure function. Given a state discriminator and (optionally) the program-id
 * or upgrade-authority pubkey, returns a self-contained SVG string suitable
 * for `Content-Type: image/svg+xml`. The SVG is served standalone (README,
 * external embeds, GitHub social cards), so we cannot rely on Tailwind or
 * the reference-app token cascade. Colors are inlined to match the
 * protocol-locked tokens declared in `apps/reference/lib/theme/tokens.css`:
 *
 *   - mint   `#14F195` — verified (Solana mint, cross-skin protocol identity)
 *   - amber  `#FBBF24` — warn (`--warn`)
 *   - muted  `#94A3AB` — pending (deferred / no signal yet)
 *
 * The badge layout mirrors Story 8.2's AdversaryBadge (shields.io-style)
 * so README rows render consistently.
 */

/** Discriminator for the three SVG states the upgrade-burned badge can render. */
export type UpgradeBurnedBadgeState = "verified" | "warn" | "pending";

/** The System Program incinerator address — the only address that proves immutability. */
export const SYSTEM_INCINERATOR_ADDRESS = "1nc1nerator11111111111111111111111111111111";

type StateStyle = {
  /** Right-side label fill color. */
  fill: string;
  /** Right-side label text color (must hold WCAG AA against `fill`). */
  textFill: string;
};

const LEFT_LABEL = "upgrade";
const LEFT_FILL = "#1F2528"; // matches `--border` neutral skin (UX-DR3).
const LEFT_TEXT = "#E8EDED"; // light text, readable on dark left segment.

const STYLE_VERIFIED: StateStyle = { fill: "#14F195", textFill: "#0B0D12" };
const STYLE_WARN: StateStyle = { fill: "#FBBF24", textFill: "#1A1208" };
const STYLE_PENDING: StateStyle = { fill: "#94A3AB", textFill: "#0B0D12" };

function styleFor(state: UpgradeBurnedBadgeState): StateStyle {
  switch (state) {
    case "verified":
      return STYLE_VERIFIED;
    case "warn":
      return STYLE_WARN;
    case "pending":
      return STYLE_PENDING;
  }
}

/** Truncate a base58 pubkey to a `Abcd…wXyZ` shape for compact display. */
function shortPubkey(pubkey: string | undefined): string {
  if (!pubkey || typeof pubkey !== "string") {
    return "";
  }
  if (pubkey.length <= 12) {
    return pubkey;
  }
  return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
}

/**
 * SVG-encode a string for safe interpolation into element text.
 *
 * The label is operator-controlled (we ship the strings) but the authority
 * pubkey originates from RPC, so we defensively encode all five XML
 * special characters.
 */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Crude character-width heuristic for the right-segment width. Geist Sans
 * lands close to 7px per char at 12px size; we round up to keep edge
 * padding visible. Mirrors the helper in Story 8.2's AdversaryBadge so the
 * two badges sit side-by-side in the README without geometry drift.
 */
function approximateWidth(text: string, perChar = 7, padding = 16): number {
  return Math.max(80, Math.ceil(text.length * perChar + padding));
}

/**
 * Resolve the badge label for a given state.
 *
 * - `verified` → "Upgrade authority: burned ✓" (immutability proof)
 * - `warn`     → "Upgrade: <pubkey>"          (still mutable)
 * - `pending`  → "Mainnet pending audit"      (pre-Epic 9 / RPC down)
 */
function labelFor(state: UpgradeBurnedBadgeState, programIdOrAuthority?: string): string {
  switch (state) {
    case "verified":
      return "Upgrade authority: burned ✓";
    case "warn": {
      const short = shortPubkey(programIdOrAuthority);
      return short ? `Upgrade: ${short}` : "Upgrade: mutable";
    }
    case "pending":
      return "Mainnet pending audit";
  }
}

/**
 * Resolve the accessible title used by `<title>` and `aria-label`.
 */
function titleFor(state: UpgradeBurnedBadgeState, programIdOrAuthority?: string): string {
  switch (state) {
    case "verified":
      return "Upgrade authority: burned (immutable)";
    case "warn": {
      const short = shortPubkey(programIdOrAuthority);
      return short
        ? `Upgrade authority: ${short} (still mutable)`
        : "Upgrade authority: still mutable";
    }
    case "pending":
      return "Upgrade authority: mainnet pending audit";
  }
}

/**
 * Render the UpgradeBurnedBadge SVG.
 *
 * Exported for unit tests and the route handler. Returns a self-contained
 * SVG string with no external font/CSS references.
 *
 * @param state                  Discriminator returned by the route handler.
 * @param programIdOrAuthority   Optional pubkey — used as the right-side
 *                               label content for the `warn` state.
 */
export function renderUpgradeBurnedSvg(
  state: UpgradeBurnedBadgeState,
  programIdOrAuthority?: string,
): string {
  const style = styleFor(state);
  const label = labelFor(state, programIdOrAuthority);
  const title = titleFor(state, programIdOrAuthority);

  const leftWidth = 76; // fits "upgrade" comfortably at 12px.
  const rightWidth = approximateWidth(label);
  const totalWidth = leftWidth + rightWidth;
  const height = 28;
  const radius = 4;

  const titleText = escapeXml(title);
  const labelText = escapeXml(label);

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-label="${titleText}">`,
    `<title>${titleText}</title>`,
    `<defs><clipPath id="r"><rect width="${totalWidth}" height="${height}" rx="${radius}" ry="${radius}"/></clipPath></defs>`,
    `<g clip-path="url(#r)">`,
    `<rect width="${leftWidth}" height="${height}" fill="${LEFT_FILL}"/>`,
    `<rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="${style.fill}"/>`,
    `</g>`,
    `<g fill="${LEFT_TEXT}" font-family="ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,sans-serif" font-size="12">`,
    `<text x="${leftWidth / 2}" y="18" text-anchor="middle">${LEFT_LABEL}</text>`,
    `</g>`,
    `<g fill="${style.textFill}" font-family="ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,sans-serif" font-size="12" font-weight="600">`,
    `<text x="${leftWidth + rightWidth / 2}" y="18" text-anchor="middle">${labelText}</text>`,
    `</g>`,
    `</svg>`,
  ].join("");
}
