/**
 * Single source of truth for environment variables in the reference app.
 *
 * Every `process.env.*` read in the reference app must come through this module.
 * `scripts/check-patterns.sh` enforces this invariant in CI.
 *
 * On import, the schema parses `process.env` once. If a required key is missing
 * or invalid the module throws a structured error that cites `.env.example`.
 */

import { z } from "zod";

/** Known placeholder from an older `.env.example`; Privy returns 400 if used. */
const PRIVY_APP_ID_PLACEHOLDER = "clw0000000000000000000000";

const EnvSchema = z.object({
  NEXT_PUBLIC_HELIUS_RPC_URL: z.string().url({
    message: "NEXT_PUBLIC_HELIUS_RPC_URL must be a valid URL (see apps/reference/.env.example)",
  }),
  NEXT_PUBLIC_PRIVY_APP_ID: z
    .string()
    .length(25, {
      message:
        "NEXT_PUBLIC_PRIVY_APP_ID must be a 25-character Privy app id from https://dashboard.privy.io (see apps/reference/.env.example)",
    })
    // Block the docs placeholder in production only so `next dev` can run for
    // UI/fixture demos without a Privy account (Privy still returns 400 until
    // a real id is set).
    .refine(
      (id) =>
        (process.env.NODE_ENV ?? "development") !== "production"
          ? true
          : id !== PRIVY_APP_ID_PLACEHOLDER,
      {
        message:
          "NEXT_PUBLIC_PRIVY_APP_ID is still the example placeholder. Set a real App ID from https://dashboard.privy.io before `next build` / production (see apps/reference/.env.example)",
      },
    ),
  NEXT_PUBLIC_CONVEX_URL: z.string().url({
    message: "NEXT_PUBLIC_CONVEX_URL must be a valid URL (see apps/reference/.env.example)",
  }),
  NEXT_PUBLIC_PROGRAM_ID: z.string().min(32, {
    message: "NEXT_PUBLIC_PROGRAM_ID must be a base58 program id (see apps/reference/.env.example)",
  }),
  NEXT_PUBLIC_CLUSTER: z.enum(["mainnet-beta", "devnet", "testnet", "localnet"], {
    errorMap: () => ({
      message:
        "NEXT_PUBLIC_CLUSTER must be one of mainnet-beta|devnet|testnet|localnet (see apps/reference/.env.example)",
    }),
  }),
  // Story 7.16 — Sphere on-ramp/off-ramp is gated behind this flag (FR44,
  // NFR-R3). Defaults to "false" so production builds without the flag set
  // continue to work cleanly and the demo happy-path stays Sphere-disabled.
  NEXT_PUBLIC_SPHERE_ENABLED: z
    .enum(["true", "false"], {
      errorMap: () => ({
        message: "NEXT_PUBLIC_SPHERE_ENABLED must be 'true' or 'false' (see apps/reference/.env.example)",
      }),
    })
    .default("false")
    .transform((v) => v === "true"),
  // Story 7.4 — dev component preview gate. Defaults to "false" so a
  // production build never exposes `/[locale]/dev/components` unless the
  // env explicitly opts in.
  NEXT_PUBLIC_DEV_PAGES: z
    .enum(["true", "false"], {
      errorMap: () => ({
        message:
          "NEXT_PUBLIC_DEV_PAGES must be 'true' or 'false' (see apps/reference/.env.example)",
      }),
    })
    .default("false")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  // Next.js inlines NEXT_PUBLIC_* at build time only when accessed via the
  // statically analyzable `process.env.NAME` form, so reads must be explicit.
  const candidate = {
    NEXT_PUBLIC_HELIUS_RPC_URL: process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
    NEXT_PUBLIC_PROGRAM_ID: process.env.NEXT_PUBLIC_PROGRAM_ID,
    NEXT_PUBLIC_CLUSTER: process.env.NEXT_PUBLIC_CLUSTER,
    NEXT_PUBLIC_SPHERE_ENABLED: process.env.NEXT_PUBLIC_SPHERE_ENABLED,
    NEXT_PUBLIC_DEV_PAGES: process.env.NEXT_PUBLIC_DEV_PAGES,
  };

  const parsed = EnvSchema.safeParse(candidate);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid or missing environment variables. Copy apps/reference/.env.example to apps/reference/.env.local and fill the values.\n${issues}`,
    );
  }
  if (
    (process.env.NODE_ENV ?? "development") !== "production" &&
    parsed.data.NEXT_PUBLIC_PRIVY_APP_ID === PRIVY_APP_ID_PLACEHOLDER
  ) {
    console.warn(
      "[@susu/reference] NEXT_PUBLIC_PRIVY_APP_ID is the example placeholder — Privy login will not work until you set a real App ID (https://dashboard.privy.io) in apps/reference/.env.local",
    );
  }
  return parsed.data;
}

export const env: Env = loadEnv();

/**
 * `NODE_ENV` lives outside the user-configurable env schema (Next.js
 * inlines it at build time and it is never user-configurable in the same
 * sense), but `scripts/check-patterns.sh` forbids `process.env` reads
 * outside this module. Exposing it here keeps the invariant intact while
 * still giving downstream modules dev-vs-prod visibility.
 */
export const NODE_ENV: string = process.env.NODE_ENV ?? "development";
export const IS_DEV: boolean = NODE_ENV !== "production";
