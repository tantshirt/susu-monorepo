# Story 6.9 Partner Integration Docs ATDD

## Acceptance Criteria

1. Each partner integration guide exists and starts with `## TL;DR`.
2. Each guide includes Mermaid architecture, a walkthrough that mirrors its runnable example, trade-offs, pinned versions, and a link to the example.
3. Version strings in each guide match the corresponding example `package.json`.
4. Each example README links back to its long-form integration guide.
5. `docs/README.md` links the guides and records the docs-quality bar for copy-paste runnable walkthroughs.

## Focused Static Verification

Run:

```sh
node --test tests/atdd/story-6-9-partner-integration-docs.static.red.test.mjs
```
