# ATDD — Story 8.3: `<UpgradeBurnedBadge />` server-rendered from `solana program show`

**Issue:** #85
**Epics ref:** §8.3 (UX-DR18, ARCH-37)
**Branch:** `story-8-3-upgrade-burned-badge`

## Acceptance criteria

1. **AC1 — Route exists at `apps/reference/app/api/badge/upgrade-burned/route.ts`**
   - Exports an async `GET` Next.js Route Handler.
   - Returns a `Response` with `Content-Type: image/svg+xml`.
   - Reads the upgrade-authority via `@solana/kit` RPC (`createSolanaRpc` + `getAccountInfo`) — **never** by shelling out to `solana program show`.
   - Sets ISR-friendly `Cache-Control` (`public, max-age=60, s-maxage=600`) plus `dynamic = "force-static"` and `revalidate = 600`.
   - Catches RPC failures / timeouts and falls through to the `pending` state instead of returning 500.

2. **AC2 — Three-state SVG renderer in `apps/reference/lib/badge/upgrade-burned.ts`**
   - Pure function `renderUpgradeBurnedSvg(state, programIdOrAuthority?)`:
     - `verified` (authority == `1nc1nerator11111111111111111111111111111111`): mint label "Upgrade authority: burned ✓".
     - `warn` (deployed but authority is some other address): warn label "Upgrade: <authority>".
     - `pending` (no mainnet program deployed yet / RPC unavailable): muted/amber "Mainnet pending audit".
   - Inline SVG colors match the protocol-locked tokens (mint `#14F195`, warn `#FBBF24`, muted neutral).

3. **AC3 — Three-state unit tests in `apps/reference/app/api/badge/upgrade-burned/route.test.ts`**
   - Uses `node:test`. Mocks the RPC client and exercises pending / warn / verified branches.
   - Asserts the correct color, label, and a 200 OK SVG content-type from `GET()`.

4. **AC4 — Static red harness asserts file presence and the RPC-not-CLI requirement**
   - `tests/atdd/story-8-3-upgrade-burned-badge.static.red.test.mjs` asserts:
     - The route, lib, and unit-test files exist.
     - The route imports `createSolanaRpc` from `@solana/kit` (not `child_process` / `execSync`).
     - The lib renderer handles the three states with protocol-locked colors.
     - The unit tests cover all three states.

## Out of scope

- README badge URL wiring (Story 8.1).
- Inline curve plot (Story 8.4).
- Wiring against a live mainnet deploy (Story 9.4).
