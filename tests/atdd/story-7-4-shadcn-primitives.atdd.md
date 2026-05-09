# ATDD — Story 7.4: shadcn/ui primitives copied + reskinned via tokens (UX-DR24)

GH Issue: #68
Story spec: `output_susu/planning-artifacts/epics.md` § "Story 7.4"

## Acceptance Criteria mapping

| AC | Description | Static-test assertion |
|----|-------------|------------------------|
| AC1 | All 21 shadcn primitives present in `apps/reference/components/ui/` | File-existence loop over the 21 names from UX-DR24 |
| AC2 | Every primitive uses semantic Tailwind classes (`bg-surface`, `text-text`, `border-border`) — no hardcoded color values | Regex scan: forbid `bg-(red|blue|green|gray|zinc|slate|neutral|stone|amber|emerald|cyan|sky|indigo|violet|purple|fuchsia|pink|rose|orange|yellow|lime|teal)-[0-9]` and `text-...-[0-9]` and hex `#[0-9a-fA-F]{3,8}` and `rgb(`/`hsl(` literals; require at least one token-class hit per file |
| AC3 | Button variants (primary, secondary, ghost, destructive, link) are wired with token mappings | Regex scan of `button.tsx` for variant names |
| AC4 | Size variants `sm` 32 / `md` 40 / `lg` 48 are applied | Regex scan of `button.tsx` for `h-8` (32), `h-10` (40), `h-12` (48) |
| AC5 | Component preview page renders every primitive in both skins, gated behind `NEXT_PUBLIC_DEV_PAGES=true` | Existence of `apps/reference/app/[locale]/dev/components/page.tsx` + reference to `NEXT_PUBLIC_DEV_PAGES` |
| AC6 | Focus-visible ring (UX-DR28, 2px mint) wired on every interactive primitive | Regex scan of each interactive primitive for `focus-visible:` token classes (e.g., `ring-signal`, `ring-primary`, `outline-signal`) |
| Aux | `cn()` utility exists at `apps/reference/lib/utils.ts` (clsx + tailwind-merge) | File-existence + `clsx` + `tailwind-merge` import check |
| Aux | Radix peer deps declared in `apps/reference/package.json` | JSON parse + dependency presence check |

## Files to create

- `apps/reference/lib/utils.ts` — `cn()` helper
- `apps/reference/components/ui/{button,dialog,input,label,textarea,select,combobox,tooltip,popover,dropdown-menu,tabs,card,badge,toast,skeleton,switch,checkbox,radio-group,progress,avatar,scroll-area,separator}.tsx`
- `apps/reference/app/[locale]/dev/components/page.tsx` — preview page

## Out of scope

- Runtime browser tests — handled by `e2e` fixtures in later stories.
- Convex/Privy/wallet wiring — those land in 7.5/7.6/7.9.
