---
stepsCompleted:
  - step-01-load-context
  - step-02-discover-tests
  - step-03-quality-evaluation
  - step-04-generate-report
lastStep: step-04-generate-report
lastSaved: 2026-05-09
storyId: "7.14"
storyKey: story-7-14-one-tap-contribute
inputDocuments:
  - tests/atdd/story-7-14-one-tap-contribute.atdd.md
  - tests/atdd/story-7-14-one-tap-contribute.static.red.test.mjs
  - apps/reference/app/[locale]/groups/[groupPda]/contribute/page.tsx
  - apps/reference/app/[locale]/groups/[groupPda]/contribute/ContributeClient.tsx
  - apps/reference/lib/susu/contribute.ts
  - apps/reference/messages/en.json
  - apps/reference/messages/vi.json
  - apps/reference/messages/ar.json
  - apps/reference/messages/es.json
  - apps/reference/messages/yo.json
  - apps/reference/messages/ht-kreyol.json
---

# Test Review: Story 7.14 One-tap Contribute flow

## Scope

Static red tests for Story 7.14 cover (a) the existence of the locale-aware contribute route as a Server Component, (b) the client orchestrator's required imports (useWallet, TransactionConfirmModal, RotationCard, Banner) and the wallet-gating logic, (c) the three closure builders in `lib/susu/contribute.ts` plus their composition on top of `@susu/sdk` and `getRpcUrl()`, (d) `contribute.*` key parity across all six locale files (en/vi/ar/es/yo/ht-kreyol), and (e) absence of hardcoded RPC URLs / hex literals / Tailwind palette colors.

## Score Summary

| Dimension | Score | Grade | Notes |
| --- | ---: | --- | --- |
| Determinism | 100 | A | Pure file-content + regex + JSON-parse assertions; no I/O beyond `readFileSync`. |
| Isolation | 100 | A | No external services, no module compilation required at test time. |
| Maintainability | 90 | A | Tests use focused regex per AC; the locale-key check loops over a constant array so adding a 7th locale is a one-line edit. |
| Performance | 100 | A | Whole suite completes in ~85ms locally. |
| Coverage of AC | 92 | A | All six static AC mapped 1:1; the dynamic AC (Playwright happy-path on devnet, failure-classification matrix from issue #78) is intentionally out-of-scope for the static red phase and tracked as a follow-up. |

## Findings

### Strengths
- Each AC in the ATDD doc has a 1:1 corresponding test block.
- The locale-parity test parses every JSON file and asserts both namespace presence AND non-empty string values — catches regressions where a stub locale lands with `null` or `""`.
- The forbid-list regex includes a hardcoded-RPC-URL check (Helius + public Solana endpoints), guarding against a frequent regression mode.

### Observations (non-blocking)
- The Banner-import assertion does not verify that the `connectPrompt` translation is actually rendered inside a Banner — only that Banner is imported and the `connected` flag is referenced. A behavioral test would need React Testing Library or Playwright. Acceptable for a static red phase.
- The closure-builder existence check uses a regex on `export function <name>` which would miss arrow-function exports. The current implementation uses named function declarations so this is fine; if a future refactor switches to `export const buildContributeTx = ...` the test will need updating.

### Recommendations for green-phase / future work
- When Playwright lands, add the happy-path + four failure-classification tests called out in issue #78 (RPC error, wallet error, simulation failure, retry path).
- Add a contract test that mounts `<ContributeClient />` in a JSDOM environment with a stubbed `useWallet()` to assert the disconnected/connected branches actually render.
- Once the SDK exposes `prepareContribute(...)` with split build/simulate/submit primitives, swap the placeholder simulator-detection logic for a typed call site.

## Verdict

**PASS** — tests are deterministic, isolated, performant, and trace cleanly to issue #78. Proceed to code review.
