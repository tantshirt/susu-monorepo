import { address } from '@solana/kit';
import { createGroup, createSusuClient, deriveGroupPda } from '@susu/sdk';
import { describe, expect, it } from 'vitest';
import {
  createDemoMembers,
  createDryRunSquadsGateway,
  createSquadsMultisigSigner,
  createSquadsSusuRpc,
  SQUADS_PROGRAM_ADDRESS,
} from '../src/multisigSigner.js';

const SYSTEM_PROGRAM = address('11111111111111111111111111111111');
const TOKEN_PROGRAM = address('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const ASSOCIATED_TOKEN_PROGRAM = address('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
const RENT_SYSVAR = address('SysvarRent111111111111111111111111111111111');
const DEVNET_USDC = address('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

describe('Squads multisig signer adapter', () => {
  it('constructs and executes a Squads vault proposal with the multisig as Susu creator', async () => {
    const gateway = createDryRunSquadsGateway();
    const members = await createDemoMembers(3);
    const multisig = await gateway.ensureMultisig({ members, threshold: 2 });
    const squadsSigner = createSquadsMultisigSigner({
      multisig,
      gateway,
      approvingMembers: members.slice(0, 2),
    });
    const client = createSusuClient({
      cluster: 'devnet',
      rpc: createSquadsSusuRpc({ squadsSigner, endpoint: 'https://api.devnet.solana.com' }),
      signer: squadsSigner,
    });
    const group = await deriveGroupPda(client.programId, squadsSigner.address, 67n);

    const signature = await createGroup(client, {
      creator: squadsSigner.address,
      payer: squadsSigner.address,
      group,
      systemProgram: SYSTEM_PROGRAM,
      tokenProgram: TOKEN_PROGRAM,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM,
      rent: RENT_SYSVAR,
      groupId: 67n,
      n: members.length,
      contributionAmount: 50_000_000n,
      contributionPeriod: 2_592_000n,
      mint: DEVNET_USDC,
      curveParams: { baseCollateralBps: 15_000 },
    });

    const proposal = gateway.getProposals()[0];
    expect(SQUADS_PROGRAM_ADDRESS).toMatch(/^SQDS/);
    expect(signature).toBe('squads-1-2');
    expect(squadsSigner.address).toBe(multisig.vaultPda);
    expect(proposal?.status).toBe('executed');
    expect(proposal?.approvals).toEqual(members.slice(0, 2));
    expect(gateway.getGroupCreator(group)).toBe(multisig.vaultPda);
  });
});
