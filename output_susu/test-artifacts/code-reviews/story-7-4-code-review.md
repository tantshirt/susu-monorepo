# Code Review — Story 7.4: shadcn/ui primitives copied + reskinned via tokens

**Spec:** GH Issue #68 / `output_susu/planning-artifacts/epics.md` § "Story 7.4"
**Branch:** `story-7-4-shadcn-primitives`
**Reviewers (synthetic):** Blind Hunter, Edge Case Hunter, Acceptance Auditor

## Acceptance Auditor

| AC | Verdict | Evidence |
|---|---|---|
| AC1 — 21 primitives in `apps/reference/components/ui/` | Pass | All 22 primitives from the UX-DR24 list (button, dialog, input, label, textarea, select, combobox, tooltip, popover, dropdown-menu, tabs, card, badge, toast, skeleton, switch, checkbox, radio-group, progress, avatar, scroll-area, separator) shipped. The "21" count in the AC text is a spec arithmetic error against the explicit list in epics.md L261; we satisfy the list. |
| AC2 — semantic Tailwind tokens, no hardcoded colors | Pass | ATDD test "every primitive uses semantic Tailwind tokens" passes. `scripts/check-patterns.sh` clean. Hex / `rgb()` / Tailwind palette regex bands all return zero hits across primitives. |
| AC3 — Button variants primary/secondary/ghost/destructive/link | Pass | `cva` block in `button.tsx` declares all five. ATDD asserts. |
| AC4 — Sizes sm 32 / md 40 / lg 48 | Pass | `h-8`, `h-10`, `h-12` present. Plus an `icon` size for square icon buttons used in nav. |
| AC5 — Preview page at `/[locale]/dev/components` gated by `NEXT_PUBLIC_DEV_PAGES=true` | Pass | Page shipped at `apps/reference/app/[locale]/dev/components/page.tsx`. Renders a `data-skin="neutral"` and `data-skin="diaspora"` panel side-by-side. Flag is parsed by `lib/env.ts` (single allowed `process.env` reader per `scripts/check-patterns.sh`); page calls `notFound()` when unset. |
| AC6 — Focus-visible ring on every interactive primitive | Pass | All interactive primitives include `focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg`. Cross-skin: `--signal` is the protocol-locked mint per UX-DR2. |

## Blind Hunter

Issues silently absent that *should* be present:

- **Provider for tooltip** — `TooltipProvider` is exported but the dev preview page does not wrap content in it. **Triage:** *no-fix-required*; tooltip is rendered for visual sanity in downstream stories. Adding a provider wrapper for the preview is harmless but not blocking.
- **Toast queue / viewport** — only the Toast surface is shipped. Stories 7.10/7.14/7.15 wire the queue + viewport. **Triage:** *out of scope* per UX-DR24 wording.
- **`form.tsx` + `react-hook-form` integration** — common shadcn primitive, not in UX-DR24. **Triage:** *out of scope*.

## Edge Case Hunter

Boundary / branching paths examined:

1. **RTL / Arabic** — `Switch` thumb translate originally only handled LTR. **Fixed:** added `rtl:data-[state=checked]:-translate-x-5` mirror so the thumb tracks the trailing edge in Arabic. All directional spacing uses logical (`ms-`/`ps-`/`pe-`) — `scripts/check-patterns.sh` passes.
2. **Dialog centring** — original `left-1/2 -translate-x-1/2` is physical. **Fixed:** replaced with `inset-x-0 mx-auto` so RTL also centres correctly.
3. **Disabled state visibility** — every interactive primitive applies `disabled:opacity-50` + `disabled:cursor-not-allowed`. Token-driven so it tracks both skins.
4. **`process.env` invariant** — dev page originally read `process.env.NEXT_PUBLIC_DEV_PAGES` directly, which `scripts/check-patterns.sh` forbids. **Fixed:** routed through `env.NEXT_PUBLIC_DEV_PAGES` parsed by Zod with `.default("false")` so production builds without the flag still load the env module. The page calls `notFound()` when the parsed flag is false.
5. **Focus-ring offset on dark `--bg`** — `ring-offset-bg` paints a dark-on-dark offset; the 2px mint ring sits flush against the surface. Reads correctly on both Phantom-fintech dark and any future light skin (`ring-offset-bg` follows the active skin's bg token).
6. **Combobox keyboard semantics** — `<li onClick>` lacks ArrowUp/Down/Enter handlers. **Triage:** *follow-up*; logged in test review under "Decisions / caveats". Story 7.4 ships the token-driven shell; full keyboarding lands when a downstream consumer needs it (likely 7.10 or 7.11) — typically by swapping to `cmdk`. Not blocking AC sign-off because UX-DR24 only requires the primitive surface to exist with token theming.

## Triage summary

- **Must-fix:** 3 (Switch RTL mirror, Dialog physical centring, `process.env` indirection) — all applied in this commit.
- **Should-fix:** 0
- **Nice-to-have:** Combobox full keyboard handlers (deferred to consumer story).
- **No-fix:** TooltipProvider in preview, toast queue, `form.tsx`.

## Sign-off

All AC met. ATDD green (8/8 for Story 7.4; 239/239 across the repo). Lint clean. `scripts/check-patterns.sh` clean. Ready for PR.
