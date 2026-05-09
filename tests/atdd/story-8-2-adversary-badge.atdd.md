# ATDD — Story 8.2: `<AdversaryBadge />` server-rendered from latest report

**Issue:** #84
**Epics ref:** §8.2 (UX-DR17, ARCH-36)
**Branch:** `story-8-2-adversary-badge`

## Acceptance criteria

1. **AC1 — Route exists at `apps/reference/app/api/badge/adversary/route.ts`**
   - Exports a `GET` Next.js Route Handler.
   - Returns a `Response` with `Content-Type: image/svg+xml`.
   - Reads `audits/adversary/adversary-report.json` from the repo via Node `fs` (committed file, **not** network).
   - Sets ISR-friendly `Cache-Control` headers (e.g., `public, max-age=60, s-maxage=600`).

2. **AC2 — Three-state SVG renderer in `apps/reference/lib/badge/adversary.ts`**
   - Pure function `renderAdversarySvg(state, report)`:
     - `verified` (when `summary.max_defector_profit_lamports === 0`): mint label "10,000 adversarial circles passed ✓".
     - `pending` (when no recent run / report unreadable): warn label "Pending verification".
     - `failed` (when `summary.max_defector_profit_lamports > 0`): danger label "FAILED — view report".
   - Uses inline SVG colors that match the protocol-locked tokens (mint `#14F195`, warn `#FBBF24`, danger `#F87171`).

3. **AC3 — Type contract in `apps/reference/lib/badge/types.ts`**
   - Exports an `AdversaryReport` type covering at least
     `run_metadata.commit_sha`, `run_metadata.circles`, `summary.max_defector_profit_lamports`.

4. **AC4 — Unit tests cover the three states**
   - `apps/reference/app/api/badge/adversary/route.test.ts` uses `node:test` and mocks `fs.readFileSync`.
   - Asserts each state produces a 200 OK SVG with the expected mint/warn/danger color and label.

5. **AC5 — Static red harness asserts the route + lib + tests are wired up**
   - `tests/atdd/story-8-2-adversary-badge.static.red.test.mjs` asserts file presence, exported `GET`,
     references to `audits/adversary/adversary-report.json`, three-state branches, and inline color usage.

## Out of scope

- README badge URL wiring (Story 8.1).
- `<UpgradeBurnedBadge />` (Story 8.3).
- Demo video reference (Story 8.6).
