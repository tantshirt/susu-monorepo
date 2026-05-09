import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  renderUpgradeBurnedSvg,
  SYSTEM_INCINERATOR_ADDRESS,
} from "@/lib/badge/upgrade-burned";
import { resolveUpgradeBurnedState } from "@/lib/badge/upgrade-burned-resolver";

/**
 * Story 8.3 — `<UpgradeBurnedBadge />` unit tests.
 *
 * Covers the three SVG states (verified / warn / pending) by mocking the
 * `@solana/kit` RPC client and exercising `resolveUpgradeBurnedState`
 * directly. The `route.ts` handler is a thin glue layer over this
 * resolver + the renderer; we cover the glue's three branches via the
 * resolver tests below.
 *
 * The unit suite intentionally avoids importing `route.ts` so it stays
 * decoupled from `@/lib/env`'s startup validation (which would require
 * real env values to load). The RPC-not-CLI guarantee is enforced
 * statically by `tests/atdd/story-8-3-upgrade-burned-badge.static.red.test.mjs`.
 *
 * The System Program incinerator is `1nc1nerator11111111111111111111111111111111`.
 */

describe("Story 8.3 — renderUpgradeBurnedSvg (pure renderer)", () => {
  it("renders the verified state in mint with the burned-authority label", () => {
    const svg = renderUpgradeBurnedSvg("verified", SYSTEM_INCINERATOR_ADDRESS);
    assert.match(svg, /Upgrade authority:\s*burned/);
    assert.match(svg, /#14F195/i);
    assert.match(svg, /<title>/);
    assert.match(svg, /aria-label=/);
    assert.match(svg, /image\/svg\+xml|xmlns=/); // SVG namespace marker
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
    const rpc = {
      getAccountInfo: () => ({ send: async () => ({ value: null }) }),
    };
    const r1 = await resolveUpgradeBurnedState(rpc, undefined);
    const r2 = await resolveUpgradeBurnedState(rpc, "");
    assert.equal(r1.state, "pending");
    assert.equal(r2.state, "pending");
  });

  it("returns 'pending' when getAccountInfo returns null (program not deployed)", async () => {
    const rpc = {
      getAccountInfo: () => ({ send: async () => ({ value: null }) }),
    };
    const r = await resolveUpgradeBurnedState(
      rpc,
      "Susu1111111111111111111111111111111111111111",
    );
    assert.equal(r.state, "pending");
  });

  it("returns 'verified' when upgrade authority equals the System Program incinerator", async () => {
    // ProgramData blob: 4 bytes discriminator + 8 bytes slot + 1 byte tag (1) + 32 bytes incinerator pubkey.
    const { getAddressEncoder } = await import("@solana/kit");
    const encoder = getAddressEncoder();
    const incineratorBytes = encoder.encode(SYSTEM_INCINERATOR_ADDRESS as never);

    const programDataBytes = new Uint8Array(13 + 32);
    programDataBytes[12] = 1; // Some(...) tag
    programDataBytes.set(incineratorBytes, 13);
    const base64 = Buffer.from(programDataBytes).toString("base64");

    let call = 0;
    const rpc = {
      getAccountInfo: () => ({
        send: async () => {
          call += 1;
          if (call === 1) {
            return {
              value: {
                data: {
                  parsed: {
                    info: { programData: "PdataAddress11111111111111111111111111111111" },
                  },
                },
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
    const otherAuthority = "11111111111111111111111111111112";
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
                data: {
                  parsed: {
                    info: { programData: "PdataAddress11111111111111111111111111111111" },
                  },
                },
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

  it("returns 'verified' when the program-data tag is None (Option::None — already immutable)", async () => {
    const programDataBytes = new Uint8Array(13 + 32);
    programDataBytes[12] = 0; // None tag — permanently immutable
    const base64 = Buffer.from(programDataBytes).toString("base64");

    let call = 0;
    const rpc = {
      getAccountInfo: () => ({
        send: async () => {
          call += 1;
          if (call === 1) {
            return {
              value: {
                data: {
                  parsed: {
                    info: { programData: "PdataAddress11111111111111111111111111111111" },
                  },
                },
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
  });

  it("returns 'pending' when the RPC client throws (degrades gracefully)", async () => {
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

describe("Story 8.3 — GET handler shape (header / content-type contract)", () => {
  it("renderer-output composed by the route handler is image/svg+xml-shaped", () => {
    // We don't import `route.ts` directly here (env validation would fire);
    // instead we assert the renderer emits the SVG envelope the route
    // handler composes into the `image/svg+xml` Response. The route
    // handler's header contract (`Cache-Control`, `dynamic`, etc.) is
    // pinned by the static red harness.
    const svg = renderUpgradeBurnedSvg("pending");
    assert.match(svg, /<svg[\s\S]*xmlns=["']http:\/\/www\.w3\.org\/2000\/svg["']/);
    assert.match(svg, /<\/svg>$/);
  });
});
