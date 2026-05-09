import type { Config } from "tailwindcss";

/**
 * Tailwind v4 reads its theme primarily from the `@theme` directive in
 * `app/globals.css`, but we keep this config file as the canonical source
 * of truth for Story 7.2 (UX-DR1–8). Each semantic color maps through
 * `rgb(var(--token) / <alpha-value>)` so utility classes like
 * `bg-surface/80` and `text-primary/50` honour token + alpha together.
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
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};

export default config;
