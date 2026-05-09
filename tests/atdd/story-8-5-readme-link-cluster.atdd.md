# Story 8.5 — README link cluster (FR53) — ATDD plan

## Acceptance criteria (epics.md §8.5)

**Given** Stories from Epics 5, 7, and 8.1 land
**When** the README link cluster commit lands
**Then** the README contains a "Verify every claim" or similarly-titled section linking to:
1. `docs/collateral-curve.md`
2. `audits/adversary/adversary-report.json`
3. `docs/legal-opinion.pdf`
4. The latest `/log/YYYY-MM-DD.md` entry (resolved via `log/latest.md`)
5. At least one ecosystem-partner reference (placeholder: one of `examples/with-*`)

**And** the latest-log link is updated via a `log/latest.md` regular file (committed alongside daily entries) plus a sync helper script `scripts/sync-latest-log.sh` and a CI workflow that runs the script on push to main.

**And** all links are tested via a `markdown-link-check` CI step that fails on broken links.

## Red-phase static assertions

The static red test (`story-8-5-readme-link-cluster.static.red.test.mjs`) asserts:

- `README.md` contains `<!-- susu:linkcluster:start -->` and `<!-- susu:linkcluster:end -->` sentinels (so 8.6/8.7 can splice cleanly).
- The link cluster appears AFTER the hero closing sentinel `<!-- susu:hero:end -->` (do NOT modify the hero block).
- The link cluster section heading matches "Verify every claim" (or similarly-titled per epic AC).
- Links present and resolve to existing local files/directories:
  - `docs/collateral-curve.md`
  - `audits/adversary/adversary-report.json`
  - `docs/legal-opinion.pdf`
  - `log/latest.md`
  - At least one of `examples/with-privy`, `examples/with-squads`, `examples/with-token-extensions`
- `log/latest.md` exists as a regular file.
- `scripts/sync-latest-log.sh` exists and is executable.
- `.github/workflows/markdown-link-check.yml` exists and references `markdown-link-check`.
- `package.json` root script `link:check` is defined.

## Implementation approach

- README link cluster table inserted just below `<!-- susu:hero:end -->` with H2 heading.
- `log/latest.md` — committed regular file mirroring the latest dated daily log; CI workflow + `scripts/sync-latest-log.sh` keeps it in sync on push to main.
- `markdown-link-check` step in a new workflow runs on PR + push and asserts no broken links in README.md and docs/*.md.
