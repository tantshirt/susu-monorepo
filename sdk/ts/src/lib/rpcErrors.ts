export type RpcMetadata = Readonly<{
  endpoint?: unknown;
  url?: unknown;
}>;

export function extractRpcEndpoint(rpc?: RpcMetadata): string | undefined {
  if (!rpc) {
    return undefined;
  }
  for (const key of ['endpoint', 'url'] as const) {
    if (Object.prototype.hasOwnProperty.call(rpc, key) && typeof rpc[key] === 'string') {
      return rpc[key];
    }
  }
  return undefined;
}

export function extractRpcStatus(error: unknown): number | undefined {
  const record = asRecord(error);
  const response = asRecord(record?.response);
  const status = record?.status ?? record?.statusCode ?? response?.status ?? response?.statusCode;
  return typeof status === 'number' ? status : undefined;
}

function asRecord(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === 'object' && value !== null ? (value as Readonly<Record<string, unknown>>) : undefined;
}
