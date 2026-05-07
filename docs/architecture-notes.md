# Architecture Notes

## ADR-001: Invite via Group roster, not separate Invite PDA

Story 2.3 records invites directly in `Group.members` instead of creating a separate `Invite` PDA per member.

- `Group.members` is the roster source of truth and is publicly queryable through standard `getAccountInfo` account reads.
- Avoiding one Invite PDA per invitee saves rent, approximately 0.002 SOL times `n`, before any member has accepted.
- Keeping invite state on the existing `Group` account simplifies audit review and eliminates an extra state type.
- `accept_invite` can consume the roster from the `Group` account directly, so its account list does not need a separate invite account.
- The on-chain audit trace stays in one place: group configuration, invitee list, and acceptance status all live in `Group`.

Trade-off: re-inviting or replacing a member requires a future instruction. In v0.1.0, a creator who wants a different invitee set cancels the forming group and creates a new one.
