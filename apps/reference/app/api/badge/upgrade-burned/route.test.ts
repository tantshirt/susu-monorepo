import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  renderUpgradeBurnedSvg,
  SYSTEM_INCINERATOR_ADDRESS,
} from "@/lib/badge/upgrade-burned";

/**
 * Story 8.3 — `<UpgradeBurnedBadge />` Route Handler unit tests.
 *
 * Covers the three SVG states (verified / warn / pending) by mocking the
 * `@solana/kit` RPC client via the `setRpcFactoryForTesting()` and
 * `setProgramIdForTesting()` test seams that `route.ts` exposes. We do
 * NOT hit the real Solana mainnet RPC from tests — that would be flaky
 * and would tie CI to network availability.
 *
 * Required env stubs are set up in `setupEnv()` BEFORE the dynamic
 * import of `route.ts` so the strict env validator in `lib/env.ts`
 * accepts the harness shape.
 */

function setupEnv(): void {
  // `@/lib/env` validates these on import; set them once before the
  // dynamic import below.
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL ??= "https://api.devnet.solana.com";
  process.env.NEXT_PUBLIC_PRIVY_APP_ID ??= "clw0000000000000000000000";
  process.env.NEXT_PUBLIC_CONVEX_URL ??= "https://example.convex.cloud";
  process.env.NEXT_PUBLIC_PROGRAM_ID ??= "Susu1111111111111111111111111111111111111111";
  process.env.NEXT_PUBLIC_CLUSTER ??= "mainnet-beta";
}

setupEnv();

// Synchronous wrapper around `await import` for top-level test-suite use.
const routeModulePromise = import("./route");

describe("Story 8.3 — renderUpgradeBurnedSvg (pure renderer)", () => {
  it("renders the verified state in mint with the burned-authority label", () => {
    const svg = renderUpgradeBurnedSvg("verified", SYSTEM_INCINERATOR_ADDRESS);
    assert.match(svg, /Upgrade authority:\s*burned/);
    assert.match(svg, /#14F195/i);
    assert.match(svg, /<title>/);
    assert.match(svg, /aria-label=/);
  });

  it("renders the warn state in amber with the truncated authority pubkey", () => {
    const someAuthority = "Wal1etABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghij";
    const svg = renderUpgradeBurnedSvg("warn", someAuthority);
    assert.match(svg, /Upgrade:\s*Wal1.*ghij/);
    assert.match(svg, /#FBBF24/i);
  });

  it("renders the pending state in muted with the audit-pending label", () => {
    const svg = renderUpgradeBurnedSvg("pending");
    assert.match(svg, /Mainnet pending audit/);
    assert.doesNotMatch(svg, /#14F195/i); // not mint
    assert.doesNotMatch(svg, /#FBBF24/i); // not amber
  });
});

describe("Story 8.3 — resolveUpgradeBurnedState (decision tree)", () => {
  it("returns 'pending' when programId is missing/empty", async () => {
    const { resolveUpgradeBurnedState } = await routeModulePromise;
    const rpc = {
      getAccountInfo: () => ({ send: async () => ({ value: null }) }),
    };
    const r1 = await resolveUpgradeBurnedState(rpc, undefined);
    const r2 = await resolveUpgradeBurnedState(rpc, "");
    assert.equal(r1.state, "pending");
    assert.equal(r2.state, "pending");
  });

  it("returns 'pending' when getAccountInfo returns null (program not deployed)", async () => {
    const { resolveUpgradeBurnedState } = await routeModulePromise;
    const rpc = {
      getAccountInfo: () => ({ send: async () => ({ value: null }) }),
    };
    const r = await resolveUpgradeBurnedState(rpc, "Susu1111111111111111111111111111111111111111");
    assert.equal(r.state, "pending");
  });

  // The System Program incinerator is `1nc1nerator11111111111111111111111111111111`.
  it("returns 'verified' when upgrade authority equals the System Program incinerator", async () => {
    const { resolveUpgradeBurnedState } = await routeModulePromise;

    // ProgramData blob: 4 bytes discriminator + 8 bytes slot + 1 byte tag (1) + 32 bytes incinerator pubkey.
    // We use kit's address encoder to materialize the pubkey bytes.
    const { getAddressEncoder } = await import("@solana/kit");
    const encoder = getAddressEncoder();
    const incineratorBytes = encoder.encode(SYSTEM_INCINERATOR_ADDRESS as never);

    const programDataBytes = new Uint8Array(13 + 32);
    programDataBytes[12] = 1; // Some(...) tag
    programDataBytes.set(incineratorBytes, 13);
    const base64 = Buffer.from(programDataBytes).toString("base64");

    let call = 0;
    const rpc = {
      getAccountInfo: (_addr: unknown) => ({
        send: async () => {
          call += 1;
          if (call === 1) {
            return {
              value: {
                data: { parsed: { info: { programData: "PdataAddress11111111111111111111111111111111" } } },
              },
            };
          }
          return { value: { data: [base64, "base64"] } };
        },
      }),
    };

    const r = await resolveUpgradeBurnedState(
      rpc,
      "Susu1111111111111111111111111111111111111111",
    );
    assert.equal(r.state, "verified");
    assert.equal(r.authorityOrProgramId, SYSTEM_INCINERATOR_ADDRESS);
  });

  it("returns 'warn' when upgrade authority is some non-incinerator address", async () => {
    const { resolveUpgradeBurnedState } = await routeModulePromise;

    const otherAuthority = "11111111111111111111111111111112"; // legit base58, distinct
    const { getAddressEncoder } = await import("@solana/kit");
    const encoder = getAddressEncoder();
    const otherBytes = encoder.encode(otherAuthority as never);

    const programDataBytes = new Uint8Array(13 + 32);
    programDataBytes[12] = 1; // Some(...) tag
    programDataBytes.set(otherBytes, 13);
    const base64 = Buffer.from(programDataBytes).toString("base64");

    let call = 0;
    const rpc = {
      getAccountInfo: () => ({
        send: async () => {
          call += 1;
          if (call === 1) {
            return {
              value: {
                data: { parsed: { info: { programData: "PdataAddress11111111111111111111111111111111" } } },
              },
            };
          }
          return { value: { data: [base64, "base64"] } };
        },
      }),
    };

    const r = await resolveUpgradeBurnedState(
      rpc,
      "Susu1111111111111111111111111111111111111111",
    );
    assert.equal(r.state, "warn");
    assert.equal(r.authorityOrProgramId, otherAuthority);
  });

  it("returns 'pending' when the RPC client throws (degrades gracefully)", async () => {
    const { resolveUpgradeBurnedState } = await routeModulePromise;
    const rpc = {
      getAccountInfo: () => ({
        send: async () => {
          throw new Error("RPC unreachable");
        },
      }),
    };
    const r = await resolveUpgradeBurnedState(
      rpc,
      "Susu1111111111111111111111111111111111111111",
    );
    assert.equal(r.state, "pending");
  });
});

describe("Story 8.3 — GET handler smoke test", () => {
  it("returns a 200 SVG response with ISR cache headers (pending fallback when programId missing)", async () => {
    const { GET, setProgramIdForTesting, setRpcFactoryForTesting } =
      await routeModulePromise;

    setProgramIdForTesting(""); // simulate pre-Epic-9 / mainnet not deployed.
    setRpcFactoryForTesting(
      () =>
        ({
          getAccountInfo: () => ({ send: async () => ({ value: null }) }),
        }) as never,
    );

    try {
      const response = await GET();
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("Content-Type"), "image/svg+xml; charset=utf-8");
      const cacheControl = response.headers.get("Cache-Control") ?? "";
      assert.match(cacheControl, /s-maxage=600/);
      const body = await response.text();
      assert.match(body, /<svg /);
      assert.match(body, /Mainnet pending audit/);
    } finally {
      setProgramIdForTesting(null);
      setRpcFactoryForTesting(null);
    }
  });
});
