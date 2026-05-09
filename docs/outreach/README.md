# Susu — Ecosystem partner outreach campaign

This directory ships the asset side of [Story 8.7](https://github.com/tantshirt/susu-monorepo/issues/89): outreach templates, a tracker, and a swap script that flips the README link cluster from a placeholder to a real partner reference once one lands.

## Targets

Andre opens outreach to **all four** partner candidates on T+0 with the relevant runnable example as the asset:

| Partner | Runnable asset | Email template | Why it fits |
| --- | --- | --- | --- |
| Squads | [`examples/with-squads/`](../../examples/with-squads/) | [`email-template-squads.md`](./email-template-squads.md) | Susu groups can be created by a Squads vault PDA — a multisig-controlled creator unlocks DAO/treasury rotations. |
| Privy | [`examples/with-privy/`](../../examples/with-privy/) | [`email-template-privy.md`](./email-template-privy.md) | Privy embedded wallets adapted to `@solana/kit` `TransactionSigner` is the on-ramp for non-crypto-native ROSCA users. |
| Helius | [`examples/with-privy/`](../../examples/with-privy/) (RPC fallback) | [`email-template-helius.md`](./email-template-helius.md) | The reference app already calls `getRpcUrl()` — Helius first, public RPC fallback. Susu is a real production app calling Helius RPC. |
| Token Extensions | [`examples/with-token-extensions/`](../../examples/with-token-extensions/) | [`email-template-token-extensions.md`](./email-template-token-extensions.md) | Susu groups support Token-2022 mints with Transfer Hook + Metadata Pointer + Permanent Delegate, demonstrating the full extension matrix end-to-end. |

The supplementary asset for every email is the demo video embedded in the [project README](../../README.md). Send the GitHub repo URL plus the video link.

## Success criteria (per AC #2)

By submission close, **at least one** partner has done one of:

1. Tweeted or posted publicly citing Susu.
2. Added a doc page or example referencing Susu.
3. Signed a public reference letter.

Any one of those flips the README link cluster's partner row from the placeholder to a real URL via `scripts/swap-partner-reference.sh`.

If **no** partner confirms by submission close, drop the row entirely with `scripts/swap-partner-reference.sh --drop`. Per the PRD nice-to-have cut #5, the rest of the README continues to ship.

## How to use the templates

1. Open the per-partner email template in `email-template-{partner}.md`.
2. Replace placeholders:
   - `{{recipient_name}}` — the human you're emailing.
   - `{{your_relationship_to_them}}` — how you know them, e.g. "we met at Solana Breakpoint" or "I read your blog post on…". If there's no prior relationship, drop the line.
3. Send. Update [`tracker.md`](./tracker.md) with the date, channel (email / Twitter DM / Discord), and status.
4. For terse Twitter DMs or Discord pings, use [`dm-template.md`](./dm-template.md) instead — 1–2 sentences plus the repo link.

## Tracker workflow

[`tracker.md`](./tracker.md) starts with all four partners as `pending`. As replies come in, update the `Status` column to one of:

- `responded` — partner replied but no public artifact yet.
- `cited` — partner shipped a public artifact (tweet, doc page, reference letter). This is the success state for AC #2.
- `declined` — partner explicitly passed.

When a partner reaches `cited`, run:

```bash
./scripts/swap-partner-reference.sh --partner <squads|privy|helius|token-extensions> --url <partner-url>
```

That rewrites the partner row inside the README link cluster (sentinel: `<!-- susu:linkcluster:partner -->`).

If submission close arrives without any `cited` partner, run:

```bash
./scripts/swap-partner-reference.sh --drop
```

That removes the partner row from the link cluster. The other four claim verifiers (curve, adversary report, legal opinion, daily log) keep their badges.

## Logging

Per AC #5, every outreach attempt and outcome is recorded in `/log/YYYY-MM-DD.md`:

- The kickoff entry lives in `/log/2026-05-09.md` under "Story 8.7 outreach kickoff".
- Each subsequent reply (or non-reply at submission close) is appended to that day's log entry by Andre or by the BAD daily-log enforcer.
