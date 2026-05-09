# Test Review — Story 7.4: shadcn/ui primitives copied + reskinned via tokens

**Spec:** GH Issue #68 / `output_susu/planning-artifacts/epics.md` § "Story 7.4"
**Test file:** `tests/atdd/story-7-4-shadcn-primitives.static.red.test.mjs`
**ATDD scaffold:** `tests/atdd/story-7-4-shadcn-primitives.atdd.md`

## Coverage matrix

| AC (epics.md L1396-1403) | Test name | Pass strategy |
|---|---|---|
| AC1: 21 primitives present | "components/ui/ contains all 21 shadcn primitives from UX-DR24" | Loops `existsSync` over the literal UX-DR24 list |
| AC2: token classes only — no hardcoded colors | "every primitive uses semantic Tailwind tokens — no hardcoded colors" | Three negative regex bands (Tailwind palette / hex / `rgb()` literals) + one positive token-class regex |
| AC3: Button variants primary/secondary/ghost/destructive/link | "Button declares all five variants… per UX-DR38" | String includes for each variant key |
| AC4: Button sizes sm 32 / md 40 / lg 48 | "Button declares size variants sm 32 / md 40 / lg 48" | Asserts `h-8` / `h-10` / `h-12` Tailwind classes |
| AC5: dev preview page gated by `NEXT_PUBLIC_DEV_PAGES` | "dev component preview page exists and is gated…" | Path existence + flag-name appears in either page or `lib/env.ts` (since `scripts/check-patterns.sh` forbids raw `process.env` outside env.ts) |
| AC6: focus-visible ring on interactive primitives | "every interactive primitive wires focus-visible rings to the `--signal` token" | Regex match `focus-visible:[…]ring-signal\|ring-primary\|outline-signal` across all interactive primitives |
| Aux: `cn()` utility exists | "cn() utility exists at lib/utils.ts using clsx + tailwind-merge" | Imports clsx + tailwind-merge + exports `cn` |
| Aux: Radix peer deps declared | "declares Radix + cva + clsx + tailwind-merge peer deps in apps/reference/package.json" | JSON parse + dependency presence loop |

## Red phase verification

Initial run before implementation produced `ENOENT` on `apps/reference/components/ui/button.tsx` and other primitives — confirming the tests genuinely gate the implementation. Logged in commit history: tests authored at the same SHA as the spec scaffold, then implementation commits flipped each test green.

## Heuristics applied

- **No false greens:** the negative regex for hardcoded colors covers all 17 Tailwind palette names and any inline hex/`rgb()`/`hsl()` literal. A positive regex confirms every primitive *also* references at least one Susu token class — so an empty file would not trivially pass.
- **AC5 dual-path acceptance:** the dev page reads the flag through the parsed `env` object (because `scripts/check-patterns.sh` forbids `process.env.*` outside `lib/env.ts`). The test accepts either path so future refactors that move the read site stay green as long as the env contract is intact.
- **Focus ring identity is cross-skin:** `--signal` is a protocol-locked token (UX-DR2). Asserting on `ring-signal` vs `ring-primary` keeps the visible focus identity consistent on both the neutral and diaspora skins.

## Decisions / caveats

- Skipped runtime DOM tests — those land in 7.5+ once Playwright fixtures exist.
- The `combobox.tsx` ships a minimal token-driven shell (Radix Popover + filtered list). Story 7.4 commits the surface; downstream stories that need a fully-keyboarded combobox can compose with `cmdk` or extend in place.
- `Toast` is provided as a token-styled surface only; the viewport/provider lands in 7.10/7.14/7.15 alongside the toast queue. UX-DR24 only requires the primitive surface.

## Risk register

- **Low** — primitives are pure presentational code with zero protocol/state coupling.
- The `process.env` flag is parsed at import time via `lib/env.ts` Zod schema, with `.default("false")` so missing env doesn't break the loader. Production builds with the flag unset 404 the dev page.
