---
stepsCompleted:
  - step-01-preflight-and-context
  - step-02-generation-mode
  - step-03-test-strategy
  - step-04-generate-tests
  - step-04c-aggregate
  - step-05-validate-and-complete
lastStep: step-05-validate-and-complete
lastSaved: '2026-05-07'
storyId: '1.1'
storyKey: '1-1-monorepo-skeleton'
storyFile: '/Users/dre/Desktop/Susu Protocol/output_susu/implementation-artifacts/1-1-monorepo-skeleton.md'
atddChecklistPath: '/Users/dre/Desktop/Susu Protocol/output_susu/test-artifacts/atdd-checklist-1-1-monorepo-skeleton.md'
generatedTestFiles:
  - tests/atdd/story-1.1-monorepo-skeleton.structure.red.test.mjs
  - tests/atdd/story-1.1-monorepo-skeleton.bootstrap.red.test.mjs
inputDocuments:
  - /Users/dre/Desktop/Susu Protocol/output_susu/implementation-artifacts/1-1-monorepo-skeleton.md
  - /Users/dre/Desktop/Susu Protocol/output_susu/test-artifacts/test-design-epic-1.md
  - /Users/dre/Desktop/Susu Protocol/_bmad/tea/config.yaml
---

# ATDD Checklist: Story 1.1 Monorepo Skeleton

## TDD Red Phase

- Generated RED-phase acceptance scaffolds were activated during Story 1.1 implementation.
- Directory/manifest/README/license checks execute normally; runtime smoke checks for `pnpm` and `cargo`
  are environment-aware and skip only when those tools are unavailable locally.

## Acceptance Criteria Coverage

1. Directory skeleton and scaffold file requirements are covered in `story-1.1-monorepo-skeleton.structure.red.test.mjs`.
2. `pnpm install` smoke requirement is covered in `story-1.1-monorepo-skeleton.bootstrap.red.test.mjs`.
3. `cargo metadata --format-version 1` smoke requirement is covered in `story-1.1-monorepo-skeleton.bootstrap.red.test.mjs`.
4. MIT + public-from-commit-zero README posture coverage is included in `story-1.1-monorepo-skeleton.structure.red.test.mjs`.
5. Public GitHub push posture remains an implementation-time operational check.

## Generated RED Test Files

- `tests/atdd/story-1.1-monorepo-skeleton.structure.red.test.mjs`
- `tests/atdd/story-1.1-monorepo-skeleton.bootstrap.red.test.mjs`

## Activation Guidance (Green Transition)

1. Remove `.skip` from one test at a time aligned to active task scope.
2. Run the activated test and confirm it fails first.
3. Implement the scaffold behavior.
4. Re-run to confirm green.
5. Commit with evidence notes.

## Risks / Assumptions

- Assumes Node test runner (`node:test`) is acceptable for scaffold-stage acceptance checks.
- Assumes command execution checks (`pnpm install`, `cargo metadata`) are deferred until scaffold files exist.
