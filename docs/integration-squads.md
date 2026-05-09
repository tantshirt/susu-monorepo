# Squads Integration Guide

## TL;DR

- Use the runnable [Squads example](../examples/with-squads/) as the source of truth for multisig-controlled Susu group creation.
- A Squads vault can be the Susu group creator, so no individual member key owns the group creator role.
- The example derives a multisig PDA and vault PDA, gathers threshold approval, executes a vault transaction, and verifies that the Susu group creator equals the vault.
- This improves governance and recovery, but it adds latency and operational ceremony before a group can be created.

## Architecture

```mermaid
flowchart LR
  User["Team members"] --> Members["Squads member keys"]
  Members --> Proposal["Squads proposal"]
  Proposal --> Approval["threshold approval"]
  Approval --> VaultTx["vault transaction"]
  VaultTx --> SDK["@susu/sdk createGroup"]
  SDK --> Group["Susu group PDA"]
```

A vault is the account authority controlled by the multisig. A PDA is a program-derived address; in this flow the Squads program derives both the multisig PDA and the vault PDA, and Susu derives the group PDA from the vault creator plus group id.

## Walkthrough

Start from a clean clone:

```sh
pnpm install
cd examples/with-squads
pnpm install
cp .env.example .env
```

Optional `.env` values are `HELIUS_RPC_URL`, `CLUSTER=devnet`, `MULTISIG_PUBKEY`, and `SUSU_GROUP_ID`. The default path is a dry run that derives real Squads addresses and exercises the proposal shape without requiring funded wallets.

The walkthrough mirrors `src/index.ts`:

1. `readConfig` loads the cluster, RPC endpoint, optional existing multisig PDA, and group id.
2. `createDemoMembers(3)` creates demo member addresses.
3. `createDryRunSquadsGateway().ensureMultisig(...)` derives or accepts the multisig PDA and vault PDA.
4. `createSquadsMultisigSigner` prepares a signer whose address is the vault PDA.
5. `createSusuClient` injects `createSquadsSusuRpc`, so Susu helper sends become Squads proposals.
6. `deriveGroupPda` derives the Susu group from the program id, vault creator, and group id.
7. `createGroup` builds the Susu instruction with `creator: squadsSigner.address`.
8. The gateway records the executed vault transaction and `verifiedCreator` confirms the creator is the vault PDA.

Copy-paste smoke check from `examples/with-squads`:

```sh
cat > story-6-9-squads-walkthrough.ts <<'TS'
import { run } from './src/index.js';

const result = await run();
console.log(`Multisig PDA: ${result.multisigPda}`);
console.log(`Vault PDA: ${result.vaultPda}`);
console.log(`Verified creator: ${result.verifiedCreator}`);
TS

pnpm exec tsx story-6-9-squads-walkthrough.ts
rm story-6-9-squads-walkthrough.ts
```

For local verification:

```sh
pnpm start
pnpm test
PNPM_TEST_E2E=1 pnpm test
```

## Trade-offs

Latency: group creation now waits for proposal creation, threshold approval, and execution. This is slower than a single-key creator, especially when approvers are in different time zones.

Threshold sizing: 2-of-3 is useful for demos. Mainnet groups should size thresholds around signer independence, hardware-wallet use, geography, and emergency procedures.

Governance vs. UX: a vault creator gives teams shared control and auditability, but members need a clearer user journey because approval state is external to Susu.

Recovery model: threshold control helps when one key is lost, but recovery fails if enough members lose keys or refuse to approve. Document replacement, cancellation, and escalation before deposits are accepted.

Censorship risk: the same threshold that prevents one compromised key from acting alone can block group creation if enough approvers do not participate.

## Pinned versions

Source: [`../examples/with-squads/package.json`](../examples/with-squads/package.json). Keep these strings in lockstep with the example.

| Package | Version |
| --- | --- |
| `@solana/kit` | `^5.0.0` |
| `@solana/web3-compat` | `^0.0.21` |
| `@sqds/multisig` | `^2.1.4` |
| `@susu/sdk` | `workspace:*` |
| `@types/node` | `25.6.1` |
| `tsx` | `^4.21.0` |
| `typescript` | `5.9.3` |
| `vitest` | `^4.1.5` |

## See also

- [Runnable Squads example](../examples/with-squads/)
- [Squads protocol documentation](https://docs.squads.so/)
- [Susu TypeScript SDK](./sdk-typescript.md)
