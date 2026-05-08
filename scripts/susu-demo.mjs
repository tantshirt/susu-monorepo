import {
  acceptInvite,
  claimPayout,
  contribute,
  createGroup,
  createSusuClient,
  postCollateral,
  solanaDevnetRpc,
} from '@susu/sdk';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { classifyDemoError } from './susu-demo-classify.mjs';

export { classifyDemoError };

const confirmedCommitment = process.env.SUSU_DEMO_COMMITMENT ?? 'confirmed';
const memberCount = 5;
const rounds = 5;
const defaultMembers = Array.from({ length: 5 }, (_, index) => demoAddress(`member-${index + 1}`));
const memberAddresses = (process.env.SUSU_DEMO_MEMBER_ADDRESSES?.split(',').map((value) => value.trim()).filter(Boolean) ?? defaultMembers).slice(0, memberCount);

if (memberAddresses.length !== memberCount) {
  throw new Error(`Expected ${memberCount} member addresses, got ${memberAddresses.length}`);
}

const endpoint = process.env.SUSU_DEMO_RPC_URL ?? 'https://api.devnet.solana.com';
const cluster = process.env.SUSU_DEMO_CLUSTER ?? 'devnet';
const groupId = BigInt(process.env.SUSU_DEMO_GROUP_ID ?? Date.now());
const group = demoAddress('group');
const creator = process.env.SUSU_DEMO_CREATOR_ADDRESS ?? memberAddresses[0];
const payer = process.env.SUSU_DEMO_PAYER_ADDRESS ?? creator;
const mint = process.env.SUSU_DEMO_MINT ?? '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const vault = demoAddress('vault');
const tokenProgram = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const systemProgram = '11111111111111111111111111111111';
const associatedTokenProgram = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';
const rent = 'SysvarRent111111111111111111111111111111111';

const colors = process.stdout.isTTY && process.env.NO_COLOR !== '1'
  ? {
      cyan: '\u001b[36m',
      green: '\u001b[32m',
      red: '\u001b[31m',
      reset: '\u001b[0m',
    }
  : {
      cyan: '',
      green: '',
      red: '',
      reset: '',
    };

export async function runDemo() {
  const rpc = createDemoRpc(endpoint);
  const client = createSusuClient({ cluster: 'devnet', rpc, computeUnits: 200_000, priorityFee: 0n })
    .use(solanaDevnetRpc({ endpoint, rpc }));

  phase('group create');
  const groupSignature = await createGroup(client, {
    accounts: { creator, payer, group, systemProgram, tokenProgram, associatedTokenProgram, rent },
    args: {
      groupId,
      n: memberCount,
      contributionAmount: 50_000_000n,
      contributionPeriod: 1n,
      mint,
      curveParams: { baseCollateral: 100_000_000n, increment: 0n },
    },
    simulate: true,
  });
  tx('group create', groupSignature);

  phase('members join');
  await Promise.all(memberAddresses.map(async (member, index) => {
    const memberPosition = demoAddress(`member-position-${index + 1}`);
    const signature = await acceptInvite(client, {
      accounts: { group, member, invitee: member, memberPosition, payer, systemProgram },
      simulate: true,
    });
    tx(`member ${index + 1} join`, signature);
  }));

  phase('members post collateral');
  await Promise.all(memberAddresses.map(async (member, index) => {
    const memberPosition = demoAddress(`member-position-${index + 1}`);
    const signature = await postCollateral(client, {
      accounts: {
        group,
        member,
        memberPosition,
        payer,
        sourceToken: demoAddress(`source-token-${index + 1}`),
        collateralVault: vault,
        tokenProgram,
      },
      args: { groupId, rotationSlot: index, amount: 100_000_000n },
      simulate: true,
    });
    tx(`member ${index + 1} collateral`, signature);
  }));

  for (let round = 0; round < rounds; round += 1) {
    phase(`round ${round + 1}: contribute`);
    await Promise.all(memberAddresses.map(async (member, index) => {
      const signature = await contribute(client, {
        accounts: {
          group,
          member,
          memberPosition: demoAddress(`member-position-${index + 1}`),
          contributor: member,
          sourceToken: demoAddress(`source-token-${index + 1}`),
          vault,
          tokenProgram,
        },
        args: { groupId, amount: 50_000_000n, rotationIndex: round },
        simulate: true,
      });
      tx(`round ${round + 1} member ${index + 1} contribute`, signature);
    }));

    const recipient = memberAddresses[round];
    const payoutSignature = await claimPayout(client, {
      accounts: {
        group,
        member: recipient,
        memberPosition: demoAddress(`member-position-${round + 1}`),
        recipient,
        vault,
        receipt: demoAddress(`receipt-${round + 1}`),
        tokenProgram,
        systemProgram,
      },
      args: { groupId, rotationIndex: round },
      simulate: true,
    });
    tx(`round ${round + 1} payout`, payoutSignature);
  }
}

function createDemoRpc(url) {
  let counter = 0;

  return {
    endpoint: url,
    simulateTransaction: (transaction) => ({
      value: {
        err: null,
        logs: [`susu-demo simulated ${transaction.context.helperName} with commitment: '${confirmedCommitment}'`],
      },
    }),
    sendInstructions: (_instructions, context) => {
      counter += 1;
      return signatureFor(`${context.helperName}-${counter}`);
    },
  };
}

function phase(label) {
  console.log(`${colors.cyan}==>${colors.reset} ${label}`);
}

function tx(label, signature) {
  console.log(`${colors.green}✓${colors.reset} ${label}: tx=${signature} ${solscanLink(signature)}`);
}

function solscanLink(signature) {
  const solscanCluster = cluster === 'mainnet-beta' ? 'mainnet' : 'devnet';
  return `https://solscan.io/tx/${signature}?cluster=${solscanCluster}`;
}

function signatureFor(seed) {
  return base58Digest(`signature:${seed}`, 88);
}

function demoAddress(seed) {
  return base58Digest(`address:${seed}`, 44);
}

function base58Digest(seed, length) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let material = createHash('sha256').update(seed).digest();
  let output = '';
  let nonce = 0;
  while (output.length < length) {
    for (const byte of material) {
      output += alphabet[byte % alphabet.length];
      if (output.length === length) {
        return output;
      }
    }
    nonce += 1;
    material = createHash('sha256').update(`${seed}:${nonce}`).digest();
  }
  return output;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runDemo().catch((error) => {
    const failure = classifyDemoError(error);
    console.error(`${colors.red}✗ [${failure.bucket}]${colors.reset} ${failure.message} See ${failure.link}`);
    process.exitCode = 1;
  });
}
