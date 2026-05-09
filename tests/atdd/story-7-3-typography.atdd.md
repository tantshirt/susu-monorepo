# Story 7.3 — Typography (ATDD plan)

## Acceptance criteria (from issue #67)

- Self-hosted woff2/ttf assets exist in `apps/reference/public/fonts/` for
  Geist (display), Inter (body), Geist Mono (mono), with Noto Sans Arabic
  and Noto Sans (Yoruba/Latin-extended) fallbacks per UX-DR9.
- `apps/reference/lib/theme/fonts.ts` exports `next/font/local` instances
  for each family, exposing CSS-variable handles
  (`--font-display`, `--font-body`, `--font-mono`, plus the multilingual
  fallback variables).
- `app/layout.tsx` wires the font CSS variables onto `<html>` (or `<body>`)
  so the variables flow through the entire tree.
- `tailwind.config.ts` extends `theme.fontFamily.{display,sans,mono}` to
  read the CSS variables and exposes a typescale via
  `theme.fontSize.{display-1,h1,h2,body,caption}` mapped to the new
  `--text-*` tokens. The Tailwind v4 `@theme` block in `app/globals.css`
  stays in sync.
- `lib/theme/tokens.css` defines the locked type scale tokens
  (e.g., `--text-display-1: 56px / 64px`, `--text-h1`, `--text-h2`,
  `--text-body`, `--text-caption`) per UX-DR10.
- A `.numeric` utility (in `lib/theme/numeric.css` or extending tokens.css)
  applies `font-feature-settings: "tnum" 1, "lnum" 1` so monetary values
  render with tabular + lining figures.
- A static smoke check ensures no `fonts.googleapis.com` reference appears
  in `app/layout.tsx` (no runtime Google Fonts request).

## Red tests

`tests/atdd/story-7-3-typography.static.red.test.mjs` exercises the AC by
inspecting the filesystem and the relevant configs. The tests fail before
implementation and pass after the files described above are written.
