# Story 8.7 — Ecosystem partner reference outreach + landing — ATDD plan

## Acceptance criteria (epics.md §8.7)

**Given** Stories 6.6–6.8 ship the runnable partner integration examples
**When** the partner outreach workflow runs
**Then** Andre opens outreach to all four partner candidates (Squads, Privy, Helius, Token Extensions) on T+0 with the runnable example as the asset
**And** by submission close, at least one partner has either (a) tweeted/posted publicly citing Susu, (b) added a doc page or example referencing Susu, or (c) signed a public reference letter
**And** the partner reference URL is committed in the README's link cluster (Story 8.5)
**And** if no partner confirms by submission close, the "ecosystem partner reference" item is dropped from the README without breaking other badges (per PRD nice-to-have cut #5)
**And** outreach attempts and outcomes are documented in `/log/` entries

## Scope split: code vs. ops

This story is part-code, part-ops. The actual partner reply is async — the user owns it. This story ships the structural side:

- Outreach asset templates the user copy-pastes for each of the four partners.
- A tracker the user updates as replies come in.
- A swap script that flips the README link cluster from the placeholder to a real partner URL on confirmation, OR drops the row if nothing lands by submission close.
- A `/log/` kickoff entry establishing the campaign was opened on T+0.

Subsequent partner replies are recorded in later daily `/log/` entries — out of this story's scope.

## Red-phase static assertions

The static red test (`story-8-7-partner-outreach.static.red.test.mjs`) asserts:

- `docs/outreach/README.md` exists describing the campaign, success criteria, and how to use the templates.
- `docs/outreach/email-template-squads.md`, `email-template-privy.md`, `email-template-helius.md`, `email-template-token-extensions.md` all exist with a `Subject:` line, a body with personalization placeholders (`{{recipient_name}}`), a link to the relevant `examples/with-{partner}/` directory (Helius gets a generic example reference since it has no dedicated example yet), and a CTA mentioning the demo video.
- `docs/outreach/dm-template.md` exists with a short Twitter/Discord DM variant (1–2 sentences) plus the GitHub repo link.
- `docs/outreach/tracker.md` exists as a markdown table with columns `Partner | Sent | Channel | Status | Notes` and rows for all four partners initialized to `pending`.
- `scripts/swap-partner-reference.sh` exists, is executable, declares a shell shebang, supports `--partner <name> --url <url>` and `--drop`, and references the `<!-- susu:linkcluster:partner -->` sentinel.
- `README.md` contains the `<!-- susu:linkcluster:partner -->` sentinel inside the existing `<!-- susu:linkcluster:start -->`...`<!-- susu:linkcluster:end -->` block so the swap script can target the partner row precisely without disturbing the four other claim rows.
- `log/2026-05-09.md` contains a "Story 8.7" section noting the outreach kickoff with the four partners listed.

## Implementation approach

- Add four partner-specific email templates (~100–150 words each) with personalization placeholders. Each points to its dedicated `examples/with-{partner}/` directory; Helius links to `examples/with-privy/` (Helius RPC fallback already wired in `apps/reference/lib/rpc/getRpcUrl.ts` per Story 7.16) plus the demo video.
- Add a short DM template (1–2 sentences) for Twitter/Discord with the repo URL and a one-line ask.
- Tracker is a markdown table; user updates `Status` as replies come in.
- Swap script uses `awk` or `sed` keyed off the `<!-- susu:linkcluster:partner -->` sentinel to rewrite the partner row; `--drop` removes both the sentinel comment and the row entirely. The swap script must be idempotent so the user can re-run it without corrupting the README.
- Add the sentinel inside the link cluster table — this is a small README touch-up since Story 8.5 didn't add a sub-sentinel for the partner row.
- Append the kickoff entry to `log/2026-05-09.md` (per AC #5 — explicit exception to the usual "Lead handles /log" rule).
