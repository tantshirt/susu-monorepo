export type SusuErrorKind = 'program' | 'simulation' | 'rpc' | 'cluster';

export type SusuErrorBaseOptions = Readonly<{
  cause?: unknown;
}>;

export abstract class SusuErrorBase extends Error {
  abstract readonly kind: SusuErrorKind;
  readonly cause?: unknown;

  protected constructor(message: string, options: SusuErrorBaseOptions = {}) {
    super(message);
    this.name = new.target.name;
    this.cause = options.cause;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type SusuProgramErrorDetails = Readonly<{
  code: number;
  name: string;
  instructionName?: string;
  simulationLogs?: readonly string[] | null;
}>;

export class SusuError extends SusuErrorBase {
  readonly kind = 'program';
  readonly code: number;
  declare readonly name: string;
  readonly instructionName?: string;
  readonly simulationLogs: readonly string[];

  constructor(details: SusuProgramErrorDetails, message = `Susu program error ${details.name} (${details.code})`) {
    super(message);
    this.name = details.name;
    this.code = details.code;
    this.instructionName = details.instructionName;
    this.simulationLogs = [...(details.simulationLogs ?? [])];
  }
}

export type SusuSimulationErrorDetails = Readonly<{
  logs?: readonly string[] | null;
  programLogs?: readonly string[] | null;
  cause?: SusuError | unknown;
  error?: unknown;
}>;

export class SusuSimulationError extends SusuErrorBase {
  readonly kind = 'simulation';
  readonly logs: readonly string[];
  readonly programLogs: readonly string[];
  readonly error?: unknown;

  constructor(details: SusuSimulationErrorDetails, message = 'Susu transaction simulation failed') {
    super(message, { cause: details.cause });
    this.name = 'SusuSimulationError';
    this.logs = [...(details.logs ?? [])];
    this.programLogs = [...(details.programLogs ?? details.logs ?? [])];
    this.error = details.error;
  }
}

export type SusuRpcErrorDetails = Readonly<{
  status?: number;
  endpoint?: string;
  cause?: unknown;
}>;

export class SusuRpcError extends SusuErrorBase {
  readonly kind = 'rpc';
  readonly status?: number;
  readonly endpoint?: string;

  constructor(message: string, details: SusuRpcErrorDetails = {}) {
    super(message, { cause: details.cause });
    this.name = 'SusuRpcError';
    this.status = details.status;
    this.endpoint = details.endpoint;
  }
}

export type SusuClusterErrorReason = 'missing-cluster' | 'unsupported-cluster' | 'mainnet-mismatch';

export type SusuClusterErrorDetails = Readonly<{
  reason: SusuClusterErrorReason;
  expected?: string;
  actual?: string;
  cluster?: string;
  endpoint?: string;
  genesisHash?: string;
}>;

export class SusuClusterError extends SusuErrorBase {
  readonly kind = 'cluster';
  readonly reason: SusuClusterErrorReason;
  readonly expected?: string;
  readonly actual?: string;
  readonly cluster?: string;
  readonly endpoint?: string;
  readonly genesisHash?: string;

  constructor(message: string, details: SusuClusterErrorDetails) {
    super(message);
    this.name = 'SusuClusterError';
    this.reason = details.reason;
    this.expected = details.expected;
    this.actual = details.actual;
    this.cluster = details.cluster;
    this.endpoint = details.endpoint;
    this.genesisHash = details.genesisHash;
  }
}

export type SusuSdkError = SusuError | SusuSimulationError | SusuRpcError | SusuClusterError;

export function isSusuError(error: unknown): error is SusuSdkError {
  return isRecord(error) && isSusuErrorKind(error.kind);
}

export function isSusuProgramError(error: unknown): error is SusuError {
  return isSusuError(error) && error.kind === 'program';
}

export function isSusuSimulationError(error: unknown): error is SusuSimulationError {
  return isSusuError(error) && error.kind === 'simulation';
}

export function isSusuRpcError(error: unknown): error is SusuRpcError {
  return isSusuError(error) && error.kind === 'rpc';
}

export function isSusuClusterError(error: unknown): error is SusuClusterError {
  return isSusuError(error) && error.kind === 'cluster';
}

function isSusuErrorKind(kind: unknown): kind is SusuErrorKind {
  return kind === 'program' || kind === 'simulation' || kind === 'rpc' || kind === 'cluster';
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}
