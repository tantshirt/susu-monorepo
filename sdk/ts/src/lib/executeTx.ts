import {
  assertClientReady,
  getOwnRpcMethod,
  normalizeSignature,
  prependComputeBudgetInstructions,
  resolvePriorityFee,
  resolveSendable,
  type ComputeBudgetOptions,
  type SendInstructionsContext,
  type SusuClient,
  type SusuInstruction,
  type SusuSimulationResponse,
  type SusuTransaction,
  type TransactionSignature,
} from '../client.js';
import { SusuSimulationError } from '../errors.js';
import { SusuTransactionSendError } from '../client.js';

export type ExecuteTxOptions = ComputeBudgetOptions &
  Readonly<{
    simulate?: boolean;
    helperName: string;
    accounts: Readonly<Record<string, unknown>>;
    args: Readonly<Record<string, unknown>>;
  }>;

export async function executeTx(
  client: SusuClient,
  instructions: readonly SusuInstruction[],
  options: ExecuteTxOptions,
): Promise<TransactionSignature> {
  assertClientReady(client);

  const simulate = options.simulate ?? true;
  const computeUnits = options.computeUnits ?? client.computeUnits;
  const priorityFee = await resolvePriorityFee(client, instructions, options.priorityFee);
  const budgetedInstructions = prependComputeBudgetInstructions(instructions, computeUnits, priorityFee);
  const context: SendInstructionsContext = {
    cluster: client.cluster,
    programId: client.programId,
    signer: client.signer,
    simulate,
    helperName: options.helperName,
    accounts: options.accounts,
    args: options.args,
    computeUnits,
    priorityFee,
  };
  const transaction: SusuTransaction = { instructions: budgetedInstructions, context };

  if (simulate) {
    await simulateOrThrow(client, transaction);
  }

  const sendInstructions = getOwnRpcMethod(client.rpc, 'sendInstructions');
  if (sendInstructions) {
    return normalizeSignature(await resolveSendable(sendInstructions(budgetedInstructions, context)));
  }

  const sendTransaction = getOwnRpcMethod(client.rpc, 'sendTransaction');
  if (sendTransaction) {
    return normalizeSignature(await resolveSendable(sendTransaction(transaction)));
  }

  throw new SusuTransactionSendError('Susu RPC must expose sendInstructions or sendTransaction for state-changing helpers');
}

async function simulateOrThrow(client: SusuClient & { rpc: NonNullable<SusuClient['rpc']> }, transaction: SusuTransaction): Promise<void> {
  const simulateTransaction = getOwnRpcMethod(client.rpc, 'simulateTransaction');
  if (!simulateTransaction) {
    throw new SusuSimulationError(
      { logs: [], programLogs: [], error: new Error('Susu RPC must expose simulateTransaction when simulate is true') },
      'Susu RPC must expose simulateTransaction when simulate is true',
    );
  }

  const response = await resolveSendable(simulateTransaction(transaction));
  const outcome = extractSimulationOutcome(response);
  if (outcome.error !== undefined && outcome.error !== null && outcome.error !== false) {
    throw new SusuSimulationError({
      logs: outcome.logs,
      programLogs: outcome.programLogs,
      error: outcome.error,
    });
  }
}

function extractSimulationOutcome(response: SusuSimulationResponse): Readonly<{
  error: unknown;
  logs: readonly string[];
  programLogs: readonly string[];
}> {
  const resultRecord = asRecord(response.result);
  const valueRecord = asRecord(response.value) ?? asRecord(resultRecord?.value) ?? asRecord(response);
  const error = valueRecord?.err ?? valueRecord?.error ?? response.err ?? response.error;
  const logs = normalizeLogs(valueRecord?.logs ?? response.logs ?? resultRecord?.logs);
  const programLogs = normalizeLogs(valueRecord?.programLogs ?? response.programLogs ?? resultRecord?.programLogs) ?? logs;

  return {
    error,
    logs,
    programLogs,
  };
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === 'object' && value !== null ? (value as Readonly<Record<string, unknown>>) : undefined;
}

function normalizeLogs(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry): entry is string => typeof entry === 'string');
}
