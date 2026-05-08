import {
  assertClientReady,
  getOwnRpcMethod,
  normalizeSignature,
  prependComputeBudgetInstructions,
  resolvePriorityFee,
  resolveSendable,
  SusuTransactionSendError,
  type ComputeBudgetOptions,
  type SendInstructionsContext,
  type SusuClient,
  type SusuInstruction,
  type SusuRpc,
  type SusuSimulationResponse,
  type SusuTransaction,
  type TransactionSignature,
} from '../client.js';
import { SusuError, SusuRpcError, SusuSimulationError, isSusuRpcError } from '../errors.js';
import { decodeSusuProgramError } from './programErrors.js';
import { extractRpcEndpoint, extractRpcStatus } from './rpcErrors.js';

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
  let priorityFee: bigint;
  try {
    priorityFee = await resolvePriorityFee(client, instructions, options.priorityFee);
  } catch (error) {
    throw wrapRpcError(error, client.rpc, 'Susu RPC priority fee estimation failed');
  }

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
    try {
      return normalizeSignature(await resolveSendable(sendInstructions(budgetedInstructions, context)));
    } catch (error) {
      throw wrapRpcError(error, client.rpc, 'Susu RPC sendInstructions failed');
    }
  }

  const sendTransaction = getOwnRpcMethod(client.rpc, 'sendTransaction');
  if (sendTransaction) {
    try {
      return normalizeSignature(await resolveSendable(sendTransaction(transaction)));
    } catch (error) {
      throw wrapRpcError(error, client.rpc, 'Susu RPC sendTransaction failed');
    }
  }

  throw new SusuTransactionSendError('Susu RPC must expose sendInstructions or sendTransaction for state-changing helpers', {
    endpoint: extractRpcEndpoint(client.rpc),
  });
}

async function simulateOrThrow(client: SusuClient & { rpc: NonNullable<SusuClient['rpc']> }, transaction: SusuTransaction): Promise<void> {
  const simulateTransaction = getOwnRpcMethod(client.rpc, 'simulateTransaction');
  if (!simulateTransaction) {
    throw new SusuRpcError('Susu RPC must expose simulateTransaction when simulate is true', {
      endpoint: extractRpcEndpoint(client.rpc),
    });
  }

  let response: SusuSimulationResponse;
  try {
    response = await resolveSendable(simulateTransaction(transaction));
  } catch (error) {
    throw wrapRpcError(error, client.rpc, 'Susu RPC simulateTransaction failed');
  }

  const outcome = extractSimulationOutcome(response);
  if (outcome.error !== undefined && outcome.error !== null && outcome.error !== false) {
    const decodedProgramError = decodeProgramErrorFromLogs(outcome.logs, outcome.programLogs, transaction.context.helperName);
    throw new SusuSimulationError({
      logs: outcome.logs,
      programLogs: outcome.programLogs,
      cause: decodedProgramError,
      error: outcome.error,
    });
  }
}

function decodeProgramErrorFromLogs(
  logs: readonly string[],
  programLogs: readonly string[],
  instructionName: string,
): SusuError | undefined {
  const logsToDecode = logs.length > 0 ? logs : programLogs;
  const code = extractAnchorProgramErrorCode(logsToDecode);
  if (code === undefined) {
    return undefined;
  }

  const definition = decodeSusuProgramError(code);
  if (!definition) {
    return undefined;
  }

  return new SusuError({
    code: definition.code,
    name: definition.name,
    instructionName,
    simulationLogs: logsToDecode,
  });
}

function extractAnchorProgramErrorCode(logs: readonly string[]): number | undefined {
  const joinedLogs = logs.join('\n');
  // AnchorError logs may spell this field as ErrorNumber or Error Number.
  const anchorMatch = joinedLogs.match(/AnchorError[\s\S]*?Error\s*Number:\s*(\d+)/i);
  const rawCode = anchorMatch?.[1];
  if (rawCode !== undefined) {
    return Number(rawCode);
  }

  const customProgramErrorMatch = joinedLogs.match(/custom program error:\s*0x([0-9a-f]+)/i);
  if (customProgramErrorMatch?.[1] !== undefined) {
    return Number.parseInt(customProgramErrorMatch[1], 16);
  }

  return undefined;
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
  const explicitProgramLogs = normalizeLogs(valueRecord?.programLogs ?? response.programLogs ?? resultRecord?.programLogs);
  const programLogs = explicitProgramLogs.length > 0 ? explicitProgramLogs : logs;

  return {
    error,
    logs,
    programLogs,
  };
}

function wrapRpcError(error: unknown, rpc: SusuRpc | undefined, message: string): SusuRpcError {
  if (isSusuRpcError(error)) {
    return error;
  }

  return new SusuRpcError(message, {
    endpoint: extractRpcEndpoint(rpc),
    status: extractRpcStatus(error),
    cause: error,
  });
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
