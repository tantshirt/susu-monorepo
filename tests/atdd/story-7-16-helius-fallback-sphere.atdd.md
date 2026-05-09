# Story 7.16 — Helius RPC fallback to public + Sphere on-ramp optional flag

## Acceptance criteria (from #80)

1. SDK / reference app must default to Helius RPC when `NEXT_PUBLIC_HELIUS_RPC_URL` is set, falling back to the cluster-appropriate public RPC otherwise.
2. Public fallback URLs are cluster-keyed and centralised — no other module hardcodes an RPC URL.
3. `isSphereEnabled()` reflects the env loader's boolean view of `NEXT_PUBLIC_SPHERE_ENABLED` and defaults to disabled (NFR-R3, FR44).
4. `<OnrampButton />` renders nothing when Sphere is disabled, and a `secondary`-variant shadcn `Button` with the placeholder label "On-ramp via Sphere" when enabled.
5. Helper modules are server-safe / client-safe — no `window` references — and all colour comes from semantic tokens (UX-DR2). Logical Tailwind directional classes only (`start-*` / `end-*`).

## Red-phase scope

- `apps/reference/lib/rpc/getRpcUrl.ts` — function exists, branches on `env.NEXT_PUBLIC_HELIUS_RPC_URL`, falls back per `NEXT_PUBLIC_CLUSTER` (`devnet` → `api.devnet.solana.com`, `mainnet-beta` → `api.mainnet-beta.solana.com`, `localnet` → `localhost:8899`), and emits a one-time dev-mode `console.warn` on fallback.
- `apps/reference/lib/rpc/index.ts` — re-exports `getRpcUrl` and exposes a placeholder `createRpcClient(): { url: string }`.
- `apps/reference/lib/sphere/isEnabled.ts` — exports `isSphereEnabled(): boolean`.
- `apps/reference/components/sphere/OnrampButton.tsx` — Client Component, gated render, `secondary` button.
- `apps/reference/lib/env.ts` — `NEXT_PUBLIC_SPHERE_ENABLED` defaults to `"false"` so production builds without the flag work cleanly.
- No `window` references in helper modules; no hardcoded RPC URLs outside `getRpcUrl.ts`; no directional Tailwind classes (`right-*` / `left-*`).
