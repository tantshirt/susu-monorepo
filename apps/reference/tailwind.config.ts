import type { Config } from "tailwindcss";

/**
 * Tailwind v4 reads its theme primarily from the `@theme` directive in
 * `app/globals.css`, but we keep this config file as the canonical source
 * of truth for Story 7.2 (UX-DR1–8) and Story 7.3 (UX-DR9–10). Each
 * semantic color maps through `rgb(var(--token) / <alpha-value>)` so
 * utility classes like `bg-surface/80` and `text-primary/50` honour
 * token + alpha together.
 *
 * Cross-skin invariants (UX-DR2): tokens flow from `lib/theme/tokens.css`
 * (neutral) and `lib/theme/skin-diaspora.css` (diaspora). Forks rebrand
 * by editing those two files; this config does not need to change.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        surface2: "rgb(var(--surface-2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--text-muted) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        signal: "rgb(var(--signal) / <alpha-value>)",
        warn: "rgb(var(--warn) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
      },
      // 4px base spacing scale (UX-DR6).
      spacing: {
        "0": "0px",
        "1": "4px",
        "2": "8px",
        "3": "12px",
        "4": "16px",
        "5": "20px",
        "6": "24px",
        "8": "32px",
        "10": "40px",
        "12": "48px",
        "16": "64px",
        "20": "80px",
        "24": "96px",
      },
      // Radius scale (UX-DR7).
      borderRadius: {
        "sm": "6px",
        "md": "10px",
        "lg": "16px",
        "xl": "24px",
        "pill": "9999px",
      },
      // Phantom-style shadows (UX-DR8).
      boxShadow: {
        "1": "var(--shadow-1)",
        "2": "var(--shadow-2)",
      },
      // Self-hosted font stack (UX-DR9). Each family reads the CSS variable
      // injected by `lib/theme/fonts.ts` via the root layout, so swapping a
      // font (e.g., a fork) only touches that module.
      fontFamily: {
        display: [
          "var(--font-display)",
          "var(--font-noto-sans)",
          "var(--font-noto-arabic)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "var(--font-body)",
          "var(--font-noto-sans)",
          "var(--font-noto-arabic)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      // Locked type scale (UX-DR10) — `[size, lineHeight]` pairs.
      fontSize: {
        "display-1": ["56px", { lineHeight: "64px", letterSpacing: "-0.02em" }],
        "h1": ["40px", { lineHeight: "48px", letterSpacing: "-0.02em" }],
        "h2": ["32px", { lineHeight: "40px", letterSpacing: "-0.01em" }],
        "h3": ["24px", { lineHeight: "32px" }],
        "body": ["16px", { lineHeight: "24px" }],
        "caption": ["12px", { lineHeight: "16px" }],
      },
    },
  },
  plugins: [],
};

export default config;
