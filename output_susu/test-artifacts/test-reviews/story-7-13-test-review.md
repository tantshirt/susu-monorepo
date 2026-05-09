---
stepsCompleted:
  - step-01-load-context
  - step-02-discover-tests
  - step-03-quality-evaluation
  - step-04-generate-report
lastStep: step-04-generate-report
lastSaved: 2026-05-09
storyId: "7.13"
storyKey: story-7-13-convex-schema
inputDocuments:
  - tests/atdd/story-7-13-convex-schema.atdd.md
  - tests/atdd/story-7-13-convex-schema.static.red.test.mjs
  - apps/reference/convex/schema.ts
  - apps/reference/convex/groups.ts
  - apps/reference/lib/convex/client.ts
  - apps/reference/lib/convex/use-group-metadata.ts
  - apps/reference/lib/convex/use-invite-link.ts
  - apps/reference/app/providers/ConvexProviderWrapper.tsx
  - scripts/check-patterns.sh
---

# Test Review: Story 7.13 Convex schema + isolation lock

## Scope

Static red tests for Story 7.13 cover (a) the three Convex tables required by ARCH-30 and the GitHub issue, (b) the query/mutation surface in `groups.ts` including the GDPR Article 17 `eraseUserData` mutation, (c) the per-group isolation lock keyword (ARCH-31), (d) the `lib/convex/client.ts` singleton, (e) the two consumer hooks, (f) the wrapper consuming the singleton, and (g) the `check-patterns.sh` enforcement of the convex-import isolation rule.

## Score Summary

| Dimension | Score | Grade | Notes |
| --- | ---: | --- | --- |
| Determinism | 100 | A | Pure file-content + regex assertions; no I/O beyond `readFileSync` and a single `bash scripts/check-patterns.sh` invocation. |
| Isolation | 100 | A | No external services, no Convex deployment required (per the codegen note in the brief). |
| Maintainability | 92 | A | Tests use focused regex per ACR; `check-patterns.sh` is invoked once via spawnSync. Multiple `eslint-disable` comments in `groups.ts` are an artifact of typed-API codegen lag — flagged below. |
| Performance | 100 | A | Whole suite completes in ~140ms locally. |
| Coverage of AC | 95 | A | All seven AC bullets from issue #77 are mapped to scenarios; the only AC not statically tested is the Playwright "Convex absent → flows still complete" runtime check, deferred to Story 7.x where Playwright lands. |

## Findings

### Strengths
- Each scenario in the ATDD doc has a 1:1 corresponding test block.
- `check-patterns.sh` is invoked twice — once to assert the rule grammar exists, once to assert the current tree passes — which catches both regressions in the rule and accidental violations in the implementation.
- The schema test asserts both the table names and at least one required field per table, so future renames cause loud failures.

### Observations (non-blocking)
- The "isolation lock" assertion is keyword-based (`/isolation lock|acquireLock|withGroupLock|.../i`); a behavioral test would need a Convex sandbox. Acceptable for a static red phase given the codegen-lag note.
- `groups.ts` contains several `eslint-disable @typescript-eslint/no-explicit-any` directives. These are intentional: until `npx convex dev` runs and produces `convex/_generated/dataModel.d.ts`, the `db.query("table")` overloads cannot be statically resolved. Once codegen lands, a follow-up should remove the casts.

### Recommendations for green-phase / future work
- When Playwright lands, add an end-to-end test that boots the reference app with `NEXT_PUBLIC_CONVEX_URL` pointed at an unreachable host and asserts join + contribute + claim still complete (last AC bullet of #77).
- Add a Convex codegen step to `pnpm dev` so the `as any` casts in `groups.ts` and the hooks can be removed.

## Verdict

**PASS** — tests are deterministic, isolated, performant, and trace cleanly to the issue AC. Proceed to code review.
