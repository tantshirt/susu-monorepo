import localFont from "next/font/local";

/**
 * Story 7.3 — typography stack, fully self-hosted.
 *
 * Per UX-DR9 the multilingual chain now uses Inter for both display and body
 * so the reference app feels unified and polished. Geist Mono remains for
 * numerics/code, with Noto Sans (Yoruba/Latin extended) and
 * Noto Sans Arabic as language-specific fallbacks. All assets ship from
 * `public/fonts/` so production builds make zero `fonts.googleapis.com`
 * requests at runtime.
 *
 * Each `localFont` declaration exposes a `--font-*` CSS variable. The
 * variables are wired onto `<html>` in `app/layout.tsx`, which lets
 * Tailwind utilities (`font-display`, `font-sans`, `font-mono`) and raw
 * CSS read them through the cascade.
 *
 * Licensing: Geist + Geist Mono are MIT (vercel/geist-font), Inter is
 * OFL 1.1 (rsms/inter), Noto Sans + Noto Sans Arabic are OFL 1.1
 * (Google Fonts). All redistributable inside this repo.
 */

export const geistDisplay = localFont({
  src: [
    {
      path: "../../public/fonts/InterVF.woff2",
      style: "normal",
      weight: "100 900",
    },
  ],
  variable: "--font-display",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const inter = localFont({
  src: [
    {
      path: "../../public/fonts/InterVF.woff2",
      style: "normal",
      weight: "100 900",
    },
  ],
  variable: "--font-body",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const geistMono = localFont({
  src: [
    {
      path: "../../public/fonts/GeistMonoVF.woff2",
      style: "normal",
      weight: "100 900",
    },
  ],
  variable: "--font-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
});

export const notoSans = localFont({
  src: [
    {
      path: "../../public/fonts/NotoSans-Regular.ttf",
      style: "normal",
      weight: "400",
    },
  ],
  variable: "--font-noto-sans",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

export const notoArabic = localFont({
  src: [
    {
      path: "../../public/fonts/NotoSansArabic-Regular.ttf",
      style: "normal",
      weight: "400",
    },
  ],
  variable: "--font-noto-arabic",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
