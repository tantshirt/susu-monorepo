import {
  createSolanaRpc,
  type Address,
  type Rpc,
  type SolanaRpcApi,
} from "@solana/kit";

import {
  SYSTEM_INCINERATOR_ADDRESS,
  type UpgradeBurnedBadgeState,
} from "./upgrade-burned";

/**
 * Susu reference app — `<UpgradeBurnedBadge />` upgrade-authority resolver
 * (Story 8.3, ARCH-37).
 *
 * Pure-ish RPC plumbing for the badge route. Lives in `lib/` so the route
 * handler can stay env-aware while the resolver itself is decoupled from
 * `@/lib/env` (which would fire env validation at module-load time and
 * couple unit tests to a real `.env.local`). The route owns env reads;
 * this module owns RPC reads.
 *
 * The signal returned is one of three states:
 *
 *   - `verified` — upgrade authority pubkey == `1nc1nerator11111111111111111111111111111111` ✓
 *   - `warn`     — deployed but the authority is some other address (still upgradeable)
 *   - `pending`  — no mainnet program deployed yet (pre-Epic 9), or RPC unavailable
 */

const MAINNET_RPC_URL = "https://api.mainnet-beta.solana.com";

/** Hard cap on RPC time so a stuck request can't hold up an ISR rebuild. */
const RPC_TIMEOUT_MS = 5_000;

/**
 * The BPFLoaderUpgradeable program-data layout, per the Solana SDK:
 *
 *   offset 0..4   | u32 little-endian | account-state discriminator (3 = ProgramData)
 *   offset 4..12  | u64 little-endian | slot
 *   offset 12..13 | u8                | upgrade-authority Option<Pubkey> tag (1 = Some, 0 = None)
 *   offset 13..45 | [u8; 32]          | upgrade-authority pubkey (only when tag == 1)
 *
 * When the tag is 0 (`Option::None`), the program is permanently immutable —
 * we treat that as `verified` too since both shapes confer the same property.
 */
const UPGRADE_AUTHORITY_TAG_OFFSET = 12;
const UPGRADE_AUTHORITY_PUBKEY_OFFSET = 13;

/** Decoded ProgramAccount shape (the two fields we read). */
type UpgradeableProgramParsedAccount = {
  data: {
    parsed?: {
      info?: {
        programData?: string;
      };
    };
  };
};

type FetchedAccountInfo<T> = {
  value: T | null;
} | null;

/**
 * Narrow view of the kit RPC client we depend on. Declaring the surface
 * here lets the unit tests pass a hand-rolled mock without dragging in
 * kit's branded types.
 */
export type UpgradeBurnedRpc =
  | Pick<Rpc<SolanaRpcApi>, "getAccountInfo">
  | {
      getAccountInfo: (
        address: Address | string,
        options?: unknown,
      ) => {
        send: () => Promise<unknown>;
      };
    };

/** Result of a single resolution attempt. */
export type UpgradeBurnedResolution = {
  state: UpgradeBurnedBadgeState;
  authorityOrProgramId?: string;
};

function bytesFromBase64(base64: string): Uint8Array {
  // `Buffer` is always available in the Next.js Node runtime.
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

/**
 * Convert a 32-byte pubkey buffer to a base58 string via kit's address
 * decoder so we don't pull `bs58` directly.
 */
async function pubkeyToBase58(bytes: Uint8Array): Promise<string> {
  const { getAddressDecoder } = await import("@solana/kit");
  const decoder = getAddressDecoder();
  return decoder.decode(bytes) as string;
}

/** Race a promise against a timeout — used to bound RPC calls. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Resolve the upgrade-burned state for a given program id using the
 * supplied RPC client. Pure-ish — does its own logging on failure but
 * does not throw. Exported for the route handler and unit tests.
 *
 * The decision tree:
 *   1. No program id configured → `pending` (mainnet not deployed yet).
 *   2. `getAccountInfo(programId)` returns null → `pending`.
 *   3. Program-id account is owned by BPFLoaderUpgradeable and points at
 *      a programData account; fetch that.
 *   4. Parse the upgrade-authority pubkey from offset 13.
 *      - Pubkey == incinerator (`1nc1nerator11111111111111111111111111111111`) → `verified`.
 *      - Tag == 0 (None)       → `verified` (already immutable).
 *      - Anything else         → `warn` with the authority pubkey.
 *   5. RPC throws / times out → `pending`.
 */
export async function resolveUpgradeBurnedState(
  rpc: UpgradeBurnedRpc,
  programId: string | undefined,
): Promise<UpgradeBurnedResolution> {
  if (!programId || typeof programId !== "string" || programId.trim().length === 0) {
    return { state: "pending" };
  }

  try {
    // Step 1: read the program account itself (jsonParsed lets us pluck
    // the `programData` pointer without hand-rolling the BPFLoaderUpgradeable
    // program-account layout).
    const programResp = (await withTimeout(
      Promise.resolve(
        rpc.getAccountInfo(programId as Address, { encoding: "jsonParsed" }).send(),
      ),
      RPC_TIMEOUT_MS,
      "getAccountInfo(programId)",
    )) as FetchedAccountInfo<UpgradeableProgramParsedAccount>;

    const programAccount = programResp?.value;
    if (!programAccount) {
      return { state: "pending" };
    }

    const programDataAddress = programAccount.data?.parsed?.info?.programData;
    if (!programDataAddress || typeof programDataAddress !== "string") {
      // The program account isn't a BPFLoaderUpgradeable upgradeable
      // program (e.g. a native or finalized v1 program). Treat as
      // `verified` — a non-upgradeable account has no upgrade authority
      // by definition.
      return { state: "verified", authorityOrProgramId: programId };
    }

    // Step 2: read the program-data account in raw base64 so we can pluck
    // the upgrade-authority pubkey at offset 13.
    const dataResp = (await withTimeout(
      Promise.resolve(
        rpc
          .getAccountInfo(programDataAddress as Address, { encoding: "base64" })
          .send(),
      ),
      RPC_TIMEOUT_MS,
      "getAccountInfo(programData)",
    )) as FetchedAccountInfo<{ data: [string, "base64"] | string }>;

    const programDataAccount = dataResp?.value;
    if (!programDataAccount) {
      return { state: "pending" };
    }

    const rawData = Array.isArray(programDataAccount.data)
      ? programDataAccount.data[0]
      : programDataAccount.data;

    if (typeof rawData !== "string" || rawData.length === 0) {
      return { state: "pending" };
    }

    const bytes = bytesFromBase64(rawData);
    if (bytes.byteLength < UPGRADE_AUTHORITY_PUBKEY_OFFSET + 32) {
      return { state: "pending" };
    }

    const tag = bytes[UPGRADE_AUTHORITY_TAG_OFFSET];
    if (tag === 0) {
      // `Option::None` — the program is permanently immutable. Treat as
      // verified; the README copy ("burned") still reads as truthful.
      return { state: "verified", authorityOrProgramId: programId };
    }

    const authorityBytes = bytes.slice(
      UPGRADE_AUTHORITY_PUBKEY_OFFSET,
      UPGRADE_AUTHORITY_PUBKEY_OFFSET + 32,
    );
    const authority = await pubkeyToBase58(authorityBytes);

    if (authority === SYSTEM_INCINERATOR_ADDRESS) {
      return { state: "verified", authorityOrProgramId: authority };
    }

    return { state: "warn", authorityOrProgramId: authority };
  } catch (error) {
    // ops visibility — Vercel captures stderr.
    // eslint-disable-next-line no-console
    console.warn(
      "[susu] UpgradeBurnedBadge RPC failed; falling back to pending:",
      error instanceof Error ? error.message : String(error),
    );
    return { state: "pending" };
  }
}

/**
 * Build a fresh RPC client pointed at mainnet-beta. We deliberately do
 * NOT route through `getRpcUrl()` because the badge is a *mainnet* truth
 * claim regardless of `NEXT_PUBLIC_CLUSTER` (which can be `devnet` for
 * local development).
 */
export function createUpgradeBurnedRpc(): UpgradeBurnedRpc {
  return createSolanaRpc(MAINNET_RPC_URL) as unknown as UpgradeBurnedRpc;
}
