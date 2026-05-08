import { address, generateKeyPairSigner, type Address, type TransactionSigner } from '@solana/kit';
import * as squads from '@sqds/multisig';
import type { SusuInstruction, SusuRpc, TransactionSignature } from '@susu/sdk';

export const SQUADS_PROGRAM_ADDRESS = squads.PROGRAM_ADDRESS;

type PublicKeyLike = Readonly<{ toBase58(): string }>;
type EnsureMultisigInput = Readonly<{ existingMultisigPda?: Address; createKey?: Address; members: readonly Address[]; threshold: number }>;
const PublicKeyCtor = squads.generated.PROGRAM_ID.constructor as new (value: string) => PublicKeyLike;

export type SquadsMultisig = Readonly<{ multisigPda: Address; vaultPda: Address; threshold: number; created: boolean }>;
export type SquadsProposal = Readonly<{
  transactionIndex: bigint;
  multisigPda: Address;
  vaultPda: Address;
  creator: Address;
  instructions: readonly SusuInstruction[];
  approvals: readonly Address[];
  status: 'created' | 'approved' | 'executed';
}>;
export type SquadsGateway = Readonly<{
  ensureMultisig(input: EnsureMultisigInput): Promise<SquadsMultisig>;
  createVaultTransaction(input: Omit<SquadsProposal, 'approvals' | 'status'>): Promise<SquadsProposal>;
  approveVaultTransaction(proposal: SquadsProposal, member: Address): Promise<SquadsProposal>;
  executeVaultTransaction(proposal: SquadsProposal): Promise<Readonly<{ proposal: SquadsProposal; signature: TransactionSignature }>>;
  getGroupCreator(group: Address): Address | undefined;
  getProposals(): readonly SquadsProposal[];
}>;
export type SquadsMultisigSigner = TransactionSigner & Readonly<{
  address: Address;
  multisigPda: Address;
  vaultPda: Address;
  propose(instructions: readonly SusuInstruction[]): Promise<Readonly<{ proposal: SquadsProposal; signature: TransactionSignature }>>;
}>;

export async function createDemoMembers(count = 3): Promise<readonly Address[]> {
  return Promise.all(Array.from({ length: count }, async () => (await generateKeyPairSigner()).address));
}

export function createDryRunSquadsGateway(): SquadsGateway {
  const groups = new Map<Address, Address>();
  const thresholds = new Map<Address, number>();
  const proposals: SquadsProposal[] = [];
  const save = (oldProposal: SquadsProposal, nextProposal: SquadsProposal): SquadsProposal => {
    const index = proposals.indexOf(oldProposal);
    if (index >= 0) proposals[index] = nextProposal;
    return nextProposal;
  };

  return {
    async ensureMultisig({ existingMultisigPda, createKey, threshold }) {
      const key = createKey ?? (await generateKeyPairSigner()).address;
      const multisigPda = existingMultisigPda ?? fromPublicKey(squads.getMultisigPda({ createKey: toPublicKey(key) as never })[0]);
      const vaultPda = fromPublicKey(squads.getVaultPda({ multisigPda: toPublicKey(multisigPda) as never, index: 0 })[0]);
      thresholds.set(multisigPda, threshold);
      return { multisigPda, vaultPda, threshold, created: existingMultisigPda === undefined };
    },
    async createVaultTransaction(input) {
      const proposal = { ...input, approvals: [], status: 'created' as const };
      proposals.push(proposal);
      return proposal;
    },
    async approveVaultTransaction(proposal, member) {
      const approvals = [...new Set([...proposal.approvals, member])];
      return save(proposal, { ...proposal, approvals, status: 'approved' });
    },
    async executeVaultTransaction(proposal) {
      const threshold = thresholds.get(proposal.multisigPda) ?? 1;
      if (proposal.approvals.length < threshold) throw new Error(`Squads proposal needs ${threshold} approvals`);
      const executed = save(proposal, { ...proposal, status: 'executed' });
      const createGroup = extractCreateGroup(executed.instructions);
      if (createGroup) groups.set(createGroup.group, createGroup.creator);
      return { proposal: executed, signature: `squads-${executed.transactionIndex}-${executed.approvals.length}` as TransactionSignature };
    },
    getGroupCreator: (group) => groups.get(group),
    getProposals: () => proposals,
  };
}

export function createSquadsMultisigSigner(input: {
  multisig: SquadsMultisig;
  gateway: SquadsGateway;
  approvingMembers: readonly Address[];
  transactionIndex?: bigint;
}): SquadsMultisigSigner {
  let nextIndex = input.transactionIndex ?? 1n;
  return {
    address: input.multisig.vaultPda,
    multisigPda: input.multisig.multisigPda,
    vaultPda: input.multisig.vaultPda,
    async propose(instructions: readonly SusuInstruction[]) {
      let proposal = await input.gateway.createVaultTransaction({
        transactionIndex: nextIndex,
        multisigPda: input.multisig.multisigPda,
        vaultPda: input.multisig.vaultPda,
        creator: input.multisig.vaultPda,
        instructions,
      });
      nextIndex += 1n;
      for (const member of input.approvingMembers.slice(0, input.multisig.threshold)) proposal = await input.gateway.approveVaultTransaction(proposal, member);
      return input.gateway.executeVaultTransaction(proposal);
    },
  } as unknown as SquadsMultisigSigner;
}

export function createSquadsSusuRpc(input: { squadsSigner: SquadsMultisigSigner; endpoint: string }): SusuRpc {
  return {
    endpoint: input.endpoint,
    getPriorityFeeEstimate: () => ({ priorityFeeEstimate: 0n }),
    simulateTransaction: () => ({ value: { err: null, logs: ['Squads vault proposal simulation accepted'] } }),
    sendInstructions: async (instructions) => ({ signature: (await input.squadsSigner.propose(instructions)).signature }),
  };
}

function toPublicKey(value: Address): PublicKeyLike {
  return new PublicKeyCtor(value);
}

function fromPublicKey(publicKey: PublicKeyLike): Address {
  return address(publicKey.toBase58());
}

function extractCreateGroup(instructions: readonly SusuInstruction[]): Readonly<{ group: Address; creator: Address }> | undefined {
  for (const instruction of instructions) {
    const record = asRecord(instruction);
    const accounts = record?.instruction === 'createGroup' ? asRecord(record.accounts) : undefined;
    if (typeof accounts?.group === 'string' && typeof accounts.creator === 'string') return { group: address(accounts.group), creator: address(accounts.creator) };
  }
  return undefined;
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === 'object' && value !== null ? (value as Readonly<Record<string, unknown>>) : undefined;
}
