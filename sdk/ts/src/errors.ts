export type SusuClusterErrorReason = 'missing-cluster' | 'unsupported-cluster' | 'mainnet-mismatch';

export type SusuClusterErrorDetails = Readonly<{
  reason: SusuClusterErrorReason;
  cluster?: string;
  endpoint?: string;
  genesisHash?: string;
}>;

export class SusuClusterError extends Error {
  readonly kind = 'cluster';
  readonly reason: SusuClusterErrorReason;
  readonly cluster?: string;
  readonly endpoint?: string;
  readonly genesisHash?: string;

  constructor(message: string, details: SusuClusterErrorDetails) {
    super(message);
    this.name = 'SusuClusterError';
    this.reason = details.reason;
    this.cluster = details.cluster;
    this.endpoint = details.endpoint;
    this.genesisHash = details.genesisHash;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export type SusuSimulationErrorDetails = Readonly<{
  logs?: readonly string[] | null;
  programLogs?: readonly string[] | null;
  error?: unknown;
}>;

export class SusuSimulationError extends Error {
  readonly kind = 'simulation';
  readonly logs: readonly string[];
  readonly programLogs: readonly string[];
  readonly error?: unknown;

  constructor(details: SusuSimulationErrorDetails, message = 'Susu transaction simulation failed') {
    super(message);
    this.name = 'SusuSimulationError';
    this.logs = [...(details.logs ?? [])];
    this.programLogs = [...(details.programLogs ?? details.logs ?? [])];
    this.error = details.error;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
