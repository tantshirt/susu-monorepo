export const BADGE_LEFT_FILL = "#1F2528"; // matches `--border` neutral skin (UX-DR3).
export const BADGE_LEFT_TEXT = "#E8EDED"; // light text, readable on dark left segment.
export const BADGE_FONT_FAMILY =
  "ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Inter,sans-serif";

/**
 * SVG-encode a string for safe interpolation into element text.
 */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Crude character-width heuristic for badge segment widths.
 */
export function approximateWidth(text: string, perChar = 7, padding = 16): number {
  return Math.max(80, Math.ceil(text.length * perChar + padding));
}
