import type { SusuClient, TransactionSignature } from '../../client.js';
import { sendInstructions, type ComputeBudgetOptions, type SusuInstruction } from '../../client.js';

type RecordBag = Readonly<Record<string, unknown>>;

export type StateHelperInput<TAccounts extends RecordBag, TArgs extends RecordBag> = ComputeBudgetOptions &
  Readonly<{
    accounts?: TAccounts;
    args?: TArgs;
    simulate?: boolean;
    [key: string]: unknown;
  }>;

export type StateHelperShape<TAccounts extends RecordBag, TArgs extends RecordBag> = Readonly<{
  accountKeys: readonly string[];
  argKeys: readonly string[];
}>;

export async function sendStateChangingInstruction<TAccounts extends RecordBag, TArgs extends RecordBag>(
  client: SusuClient,
  helperName: string,
  buildInstruction: (accounts: TAccounts, args: TArgs) => SusuInstruction,
  input: StateHelperInput<TAccounts, TArgs>,
  shape: StateHelperShape<TAccounts, TArgs>,
): Promise<TransactionSignature> {
  const { accounts, args } = splitInstructionInput(input, shape);
  const instruction = buildInstruction(accounts, args);

  return sendInstructions(client, [instruction], {
    helperName,
    accounts,
    args,
    computeUnits: input.computeUnits,
    priorityFee: input.priorityFee,
    simulate: input.simulate,
  });
}

function splitInstructionInput<TAccounts extends RecordBag, TArgs extends RecordBag>(
  input: StateHelperInput<TAccounts, TArgs>,
  shape: StateHelperShape<TAccounts, TArgs>,
): Readonly<{ accounts: TAccounts; args: TArgs }> {
  const accountBag: Record<string, unknown> = { ...(input.accounts ?? {}) };
  const argsBag: Record<string, unknown> = { ...(input.args ?? {}) };
  const accountKeys = new Set(shape.accountKeys);
  const argKeys = new Set(shape.argKeys);

  for (const [key, value] of Object.entries(input)) {
    if (isReservedKey(key)) {
      continue;
    }
    if (argKeys.has(key)) {
      argsBag[key] = value;
    } else if (accountKeys.has(key)) {
      accountBag[key] = value;
    } else {
      argsBag[key] = value;
    }
  }

  return { accounts: accountBag as TAccounts, args: argsBag as TArgs };
}

function isReservedKey(key: string): boolean {
  return key === 'accounts' || key === 'args' || key === 'computeUnits' || key === 'priorityFee' || key === 'simulate';
}
