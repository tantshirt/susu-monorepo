# ATDD — Story 7.2: Design tokens (tokens.css + dual-skin overrides + Tailwind config)

Issue: #66 — UX-DR1–8.

## Acceptance criteria → assertions

| AC                                                                    | Assertion (in `story-7-2-design-tokens.static.red.test.mjs`)                                                                                  |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/theme/tokens.css` exists with `:root[data-skin="neutral"]` block | grep file existence + `:root[data-skin="neutral"]` selector + every required CSS var (UX-DR3)                                                  |
| Required tokens (UX-DR3)                                              | `--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--primary`, `--secondary`, `--signal`, `--warn`, `--danger`, `--shadow-1`, `--shadow-2` |
| `lib/theme/skin-diaspora.css` defines `:root[data-skin="diaspora"]`    | grep selector + presence of `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--primary`, `--secondary`, `--shadow-1`, `--shadow-2` |
| Cross-skin invariants (UX-DR2)                                        | diaspora file MUST NOT redefine `--bg`, `--signal`, `--warn`, `--danger`                                                                       |
| Mint primary in neutral (UX direction)                                | `--primary` value in neutral matches Solana mint (`rgb(...)` with mint hue ~135-165 hue range, asserted by canonical hex)                      |
| Tailwind config maps tokens                                            | `apps/reference/tailwind.config.ts` references each semantic color name AND `rgb(var(--<token>)`                                              |
| Spacing 4px scale (UX-DR6)                                             | tailwind config or tokens.css defines spacing scale referencing 4px base                                                                       |
| Radius scale (UX-DR7)                                                  | tailwind config defines radius `sm`/`md`/`lg` keys (or via tokens.css `--radius-*`)                                                            |
| Phantom-style shadows (UX-DR8)                                         | tailwind config or tokens.css defines `--shadow-1`/`--shadow-2`                                                                                |
| Tokens imported into app                                               | `apps/reference/app/globals.css` imports `tokens.css` and `skin-diaspora.css`                                                                  |

## Out of scope

- Runtime smoke test (DOM rendering) — handled in a follow-up Playwright story; this story uses static-grep parity to satisfy AC at the file-system level.
