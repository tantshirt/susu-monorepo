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

const EnvSchema = z.object({
  NEXT_PUBLIC_HELIUS_RPC_URL: z.string().url({
    message: "NEXT_PUBLIC_HELIUS_RPC_URL must be a valid URL (see apps/reference/.env.example)",
  }),
  NEXT_PUBLIC_PRIVY_APP_ID: z.string().length(25, {
    message:
      "NEXT_PUBLIC_PRIVY_APP_ID must be a 25-character Privy app id (see apps/reference/.env.example)",
  }),
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
  NEXT_PUBLIC_SPHERE_ENABLED: z
    .enum(["true", "false"], {
      errorMap: () => ({
        message: "NEXT_PUBLIC_SPHERE_ENABLED must be 'true' or 'false' (see apps/reference/.env.example)",
      }),
    })
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
  return parsed.data;
}

export const env: Env = loadEnv();
