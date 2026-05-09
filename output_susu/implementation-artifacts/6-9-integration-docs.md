# Story 6.9: docs/integration-{partner}.md per partner

Status: review

## Story

As an integrator,
I want `docs/integration-squads.md`, `docs/integration-privy.md`, `docs/integration-token-extensions.md` explaining the integration pattern for each partner,
so that I have a long-form companion to each runnable example.

## Acceptance Criteria

1. **Given** the three example repos from Stories 6.6–6.8, **when** the integration docs land, **then** each doc has a `## TL;DR`, an architecture diagram (Mermaid or SVG), the integration walkthrough, the trade-offs section, and links to the runnable example.
2. Every code example in the doc is copy-paste-runnable from a clean clone.
3. Every partner SDK version is pinned in the doc and matches the example's `package.json`.

## Tasks / Subtasks

- [ ] Author `docs/integration-privy.md` (AC: 1, 2, 3)
  - [ ] `## TL;DR` (3-5 bullet summary)
  - [ ] `## Architecture` — Mermaid diagram showing user → Privy embedded wallet → Susu SDK → program
  - [ ] `## Walkthrough` — step-by-step integration code (mirrors `examples/with-privy/src/index.ts`); copy-paste-runnable from clean clone
  - [ ] `## Trade-offs` — Privy custodianship model, recovery, mainnet considerations, alternatives (wallet-standard direct connect)
  - [ ] `## Pinned versions` — Privy SDK version matches `examples/with-privy/package.json` exactly
  - [ ] `## See also` — link to `examples/with-privy/`, Privy docs, `docs/sdk-typescript.md`
- [ ] Author `docs/integration-squads.md` (AC: 1, 2, 3)
  - [ ] Same structure as Privy doc
  - [ ] Mermaid: user → Squads multisig (threshold approval) → Susu group via vault_transaction
  - [ ] Walkthrough mirrors `examples/with-squads/src/index.ts`
  - [ ] Trade-offs: latency, threshold sizing, governance vs. UX, recovery model
  - [ ] Pinned `@sqds/multisig` version matches example
- [ ] Author `docs/integration-token-extensions.md` (AC: 1, 2, 3)
  - [ ] Same structure
  - [ ] Mermaid: Token-2022 mint with extensions → SPL transfer CPI → Susu vault
  - [ ] Walkthrough mirrors `examples/with-token-extensions/src/index.ts`
  - [ ] Trade-offs: TransferFee math, MetadataPointer caveats, v2 confidential-extension roadmap (clearly marked as future work)
  - [ ] Pinned `@solana-program/token-2022` version matches example
- [ ] Add docs cross-link from each example's README → corresponding integration doc (AC: 1)
  - [ ] `examples/with-privy/README.md` `See also` → `docs/integration-privy.md`
  - [ ] Same for squads, token-extensions
- [ ] Verify copy-paste-runnability (AC: 2)
  - [ ] Manual: from a fresh clone, copy the doc's walkthrough code into a scratch file → it should run with the example's `pnpm install`'d deps
  - [ ] Document this verification in `docs/README.md` as the docs-quality bar

## Dev Notes

### Architecture compliance (non-negotiables)

- **Docs are companions to running code, not replacements.** Each doc must reference its `examples/with-*/` sibling. If the example changes, the doc must change in lockstep — Story 6.5-style structural parity isn't required for prose, but PR review checks this.
- **Mermaid for diagrams (not SVG/PNG).** Source-controlled, diff-able, renders natively on GitHub. Architecture decision implicit from doc-as-code posture.
- **Pinned versions everywhere.** No "latest" or `^x.y.z`. Every code block specifies the exact version of every partner SDK. This protects integrators forking 6 months later.
- **Audience: Aisha-level.** Self-taught, mid-level, no Solana production experience. Avoid jargon without explanation. Define "ROSCA," "PDA," "vault" on first use (or link to glossary).

### Source tree (this story creates/modifies)

```
docs/
├── integration-privy.md            # CREATE
├── integration-squads.md           # CREATE
├── integration-token-extensions.md # CREATE
└── README.md                       # MODIFY — link to all three; document quality bar

examples/with-privy/README.md         # MODIFY — see also link
examples/with-squads/README.md        # MODIFY — see also link
examples/with-token-extensions/README.md # MODIFY — see also link
```

### Project Structure Notes

- Depends on Stories 6.6, 6.7, 6.8 (examples must exist and be runnable).
- No code changes; pure documentation. Docs are part of the public-from-commit-zero posture.

### Forbidden patterns

- "Latest" or floating versions in code blocks.
- Diagrams as binary (SVG/PNG) without Mermaid source — Mermaid is mandatory.
- Code blocks that don't compile or that reference functions/imports not in the corresponding example.
- Marketing language about v2 features as available — clearly demarcate roadmap.
- Drift between doc and example — doc is the secondary artifact; example is the primary.

### Testing standards

- No automated tests for prose. Manual verification: walkthrough copy-paste-run from clean clone.
- A future story can add a docs-link-check (broken-link CI), but that's not in scope here.

### References

- [epics.md §Epic 6 / Story 6.9](../planning-artifacts/epics.md) — BDD ACs
- [prd.md §FR38](../planning-artifacts/prd.md) — integration docs requirement
- [Story 6.6](6-6-example-with-privy.md), [6.7](6-7-example-with-squads.md), [6.8](6-8-example-with-token-extensions.md) — example sources

## Dev Agent Record

### Agent Model Used

_TBD_

### Debug Log References

### Completion Notes List

- Partner guides + ATDD pinned-version table parity; docs index captures copy-paste quality bar.

### File List

- `docs/integration-privy.md`, `docs/integration-squads.md`, `docs/integration-token-extensions.md`
- `docs/README.md`, `docs/sdk-typescript.md`
- `examples/with-privy/README.md`, `examples/with-squads/README.md`, `examples/with-token-extensions/README.md`
- `tests/atdd/story-6-9-partner-integration-docs.{atdd.md,static.red.test.mjs}`
- `output_susu/implementation-artifacts/sprint-status.yaml`, `dependency-graph.md`
