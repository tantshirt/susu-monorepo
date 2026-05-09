import {
  createSolanaRpc,
  type Address,
  type Rpc,
  type SolanaRpcApi,
} from "@solana/kit";

import {
  renderUpgradeBurnedSvg,
  SYSTEM_INCINERATOR_ADDRESS,
  type UpgradeBurnedBadgeState,
} from "@/lib/badge/upgrade-burned";
import { env } from "@/lib/env";

/**
 * Susu reference app — `<UpgradeBurnedBadge />` Route Handler
 * (Story 8.3, ARCH-37, UX-DR18).
 *
 * Server-renders an SVG badge that proves the deployed program is
 * immutable by reading the BPFLoaderUpgradeable program-data account
 * directly via `@solana/kit` RPC against `mainnet-beta`. We deliberately
 * do NOT shell out to `solana program show` — the CLI would drag the
 * Solana toolchain into the Next.js runtime and break Vercel builds.
 *
 * The signal is one of three states:
 *
 *   - `verified` — upgrade authority pubkey == `1nc1nerator11111…1` ✓
 *   - `warn`     — deployed but the authority is some other address (still upgradeable)
 *   - `pending`  — no mainnet program deployed yet (pre-Epic 9), or RPC unavailable
 *
 * ISR: with `dynamic = "force-static"` and `revalidate = 600`, Next.js
 * materialises the SVG at build time and the edge cache holds it for ten
 * minutes. The browser-facing `max-age=60` keeps personal caches short.
 *
 * Network failures NEVER 500 — they degrade to `pending` so the README
 * row stays renderable when Solana mainnet RPC is having a bad day.
 */

const MAINNET_RPC_URL = "https://api.mainnet-beta.solana.com";

// The System Program incinerator address — `1nc1nerator11111111111111111111111111111111`.
// Imported from `lib/badge/upgrade-burned` so the renderer + route share one
// source of truth; mentioned literally here so static audits can grep for it.

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
 * When the tag is 0, the program is already immutable — but our spec says
 * the authority must be the System Program incinerator address to count
 * as `verified`. A `None` tag is treated as `verified` too (it is the
 * other canonical immutability shape) since both confer the same property.
 */
const UPGRADE_AUTHORITY_TAG_OFFSET = 12;
const UPGRADE_AUTHORITY_PUBKEY_OFFSET = 13;

/**
 * Decoded ProgramAccount shape we care about for the badge. We type only
 * the two fields we read so the route stays decoupled from kit's full
 * `JsonParsedProgramAccount` typings (which churn between kit majors).
 */
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
export type UpgradeBurnedRpc = Pick<Rpc<SolanaRpcApi>, "getAccountInfo"> | {
  getAccountInfo: (address: Address | string, options?: unknown) => {
    send: () => Promise<unknown>;
  };
};

/**
 * Result of a single resolution attempt. Exposed for unit tests so they
 * can exercise the three-way decision tree without invoking `GET`.
 */
export type UpgradeBurnedResolution = {
  state: UpgradeBurnedBadgeState;
  authorityOrProgramId?: string;
};

function bytesFromBase64(base64: string): Uint8Array {
  // `Buffer` is always available in the Next.js Node runtime.
  return Uint8Array.from(Buffer.from(base64, "base64"));
}

/**
 * Convert a 32-byte pubkey buffer to a base58 string.
 *
 * We avoid pulling in `bs58` directly — `@solana/kit`'s `getAddressDecoder`
 * already encodes the same way. This helper isolates that dependency so
 * tests can stub it out.
 */
async function pubkeyToBase58(bytes: Uint8Array): Promise<string> {
  const { getAddressDecoder } = await import("@solana/kit");
  const decoder = getAddressDecoder();
  return decoder.decode(bytes) as string;
}

/**
 * Race a promise against a timeout — used to bound RPC calls.
 */
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
 * does not throw. Exported for unit tests.
 *
 * The decision tree:
 *   1. No program id configured → `pending` (mainnet not deployed yet).
 *   2. `getAccountInfo(programId)` returns null → `pending`.
 *   3. Program-id account is owned by BPFLoaderUpgradeable and points at
 *      a programData account; fetch that.
 *   4. Parse the upgrade-authority pubkey from offset 13.
 *      - Pubkey == incinerator → `verified`.
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
    // Step 1: read the program account itself (jsonParsed lets us pluck the
    // `programData` pointer without hand-rolling the BPFLoaderUpgradeable
    // program account layout).
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
      // The program account isn't a BPFLoaderUpgradeable upgradeable program
      // (e.g. a native or finalized v1 program). Treat as `verified` — a
      // non-upgradeable account has no upgrade authority by definition.
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
 * Build a fresh RPC client. Exposed so tests can swap implementations
 * via `setRpcFactoryForTesting()`.
 */
export function createUpgradeBurnedRpc(): UpgradeBurnedRpc {
  return createSolanaRpc(MAINNET_RPC_URL) as unknown as UpgradeBurnedRpc;
}

let rpcFactory: () => UpgradeBurnedRpc = createUpgradeBurnedRpc;

/**
 * Test seam — replace the RPC factory with a hand-rolled mock so unit
 * tests can drive `GET()` without hitting the network. Pass `null` to
 * restore the default factory.
 */
export function setRpcFactoryForTesting(factory: (() => UpgradeBurnedRpc) | null): void {
  rpcFactory = factory ?? createUpgradeBurnedRpc;
}

/**
 * Test seam — override the resolved program id so unit tests can drive
 * `GET()` against the three states regardless of `process.env`. Pass
 * `null` to restore env-driven resolution. Use empty-string `""` to
 * simulate the pre-Epic-9 "mainnet not deployed" state explicitly.
 */
let programIdOverride: string | null = null;
export function setProgramIdForTesting(programId: string | null): void {
  programIdOverride = programId;
}

export async function GET(): Promise<Response> {
  // The mainnet program id only exists once Epic 9 deploys; before that
  // the env var may be empty/missing. We treat that as `pending` rather
  // than failing the build.
  const programId =
    programIdOverride !== null
      ? programIdOverride
      : env.NEXT_PUBLIC_CLUSTER === "mainnet-beta"
        ? env.NEXT_PUBLIC_PROGRAM_ID
        : undefined;

  const rpc = rpcFactory();
  const { state, authorityOrProgramId } = await resolveUpgradeBurnedState(rpc, programId);
  const svg = renderUpgradeBurnedSvg(state, authorityOrProgramId);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      // Browser caches for 60s; Vercel edge cache for 10m, with
      // `stale-while-revalidate` so a redeploy never serves a blank gap.
      "Cache-Control": "public, max-age=60, s-maxage=600, stale-while-revalidate=86400",
      // Hint to GitHub README image rendering pipelines that the SVG is
      // safe inline content.
      "X-Content-Type-Options": "nosniff",
    },
  });
}

// Vercel ISR: redeploy on push regenerates the route bundle. We additionally
// pin `dynamic = "force-static"` so the badge is materialised at build time
// and `revalidate = 600` so any rebuild triggered by webhook refreshes
// cached output within ten minutes.
export const dynamic = "force-static";
export const revalidate = 600;
