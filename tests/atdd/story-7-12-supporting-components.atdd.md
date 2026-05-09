# ATDD — Story 7.12: Supporting components (`<CodeBlock />`, `<ReceiptCard />`, `<Banner />`, `<FieldError />`)

GH Issue: #76
Story spec: `output_susu/planning-artifacts/epics.md` § "Story 7.12"

## Acceptance Criteria mapping

| AC | Description | Static-test assertion |
|----|-------------|------------------------|
| AC1 | `components/susu/CodeBlock.tsx` exists, exports `CodeBlock`, uses `font-mono` typography token, surfaces a copy button (UX-DR19) | File-existence + named export regex + `font-mono` regex + copy-button reference |
| AC2 | `components/susu/ReceiptCard.tsx` exists, exports `ReceiptCard`, builds on shadcn `Card`, links tx to explorer using cluster from `lib/env.ts` (UX-DR21, UX-DR39) | File-existence + named export + import of `Card` + import of `env` from `@/lib/env` + reference to `NEXT_PUBLIC_CLUSTER`/`env.NEXT_PUBLIC_CLUSTER` |
| AC3 | `components/susu/Banner.tsx` exists, exports `Banner`, accepts `variant: info \| warn \| danger \| success`, uses token classes `bg-warn` / `bg-danger` / etc (UX-DR22) | File-existence + named export + variant regex coverage + token-class regex |
| AC4 | `components/susu/FieldError.tsx` exists, exports `FieldError`, styled with `text-danger` and `text-caption` for `aria-describedby` linkage (UX-DR23) | File-existence + named export + `text-danger` + `text-caption` regex |
| AC5 | None of the four files hardcode colors (no hex / `rgb(` / `hsl(` / Tailwind palette literals) | Regex forbid-list scan |

## Files to create

- `apps/reference/components/susu/CodeBlock.tsx`
- `apps/reference/components/susu/ReceiptCard.tsx`
- `apps/reference/components/susu/Banner.tsx`
- `apps/reference/components/susu/FieldError.tsx`
- `tests/atdd/story-7-12-supporting-components.static.red.test.mjs` (this red phase)

## Files to modify

- `apps/reference/app/[locale]/dev/components/page.tsx` — extend the dev preview to render the four new susu components alongside shadcn primitives.

## Out of scope

- Shiki syntax highlighting runtime — Story 7.12 ships the component shape with `font-mono` + copy button; full Shiki wiring lands when a doc page actually imports `<CodeBlock />`.
- Receipt content/orchestration — Stories 7.14 / 7.15 wire `<ReceiptCard />` into the Cycle / Pay flows.
- Wallet / Convex / Privy data sources — those land in 7.6 / 7.9 / 7.10.
