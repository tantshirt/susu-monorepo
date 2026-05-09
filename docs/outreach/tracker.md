# Outreach tracker — Story 8.7

Status legend: `pending` (not yet sent) · `responded` (replied, no public artifact yet) · `cited` (public tweet / doc page / reference letter — success state for AC #2) · `declined` (explicit pass).

When a partner reaches `cited`, run:

```bash
./scripts/swap-partner-reference.sh --partner <squads|privy|helius|token-extensions> --url <partner-url>
```

If submission close arrives without any `cited` partner:

```bash
./scripts/swap-partner-reference.sh --drop
```

## Status

| Partner          | Sent       | Channel | Status  | Notes |
| ---------------- | ---------- | ------- | ------- | ----- |
| Squads           |            |         | pending |       |
| Privy            |            |         | pending |       |
| Helius           |            |         | pending |       |
| Token Extensions |            |         | pending |       |

## Notes

- Kickoff date: 2026-05-09 (T+0). All four templates landed alongside this tracker.
- Each subsequent reply (or non-reply at submission close) is recorded in `/log/YYYY-MM-DD.md` per AC #5.
- The `Sent` column takes a `YYYY-MM-DD` date; `Channel` takes one of `email`, `twitter-dm`, `discord`, or a partner-specific contact form name.
