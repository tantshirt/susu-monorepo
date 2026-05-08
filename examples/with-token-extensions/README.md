# Susu with Token-2022 Extensions

This example shows a Susu group using a Token-2022 mint where a regular SPL Token mint would normally be passed.

## What this demonstrates

- **Transfer Hook**: the mint carries a hook program and every Token-2022 transfer must include the hook program's extra-account PDA. The example derives that PDA and threads it through `postCollateral` and `contribute`.
- **Metadata Pointer**: the mint points metadata resolution at the mint account so wallets and indexers can find token metadata without changing Susu state.
- **Permanent Delegate**: the example performs a read-only authority check to prove the configured delegate is known. It does not exercise force-transfer authority.

Transfer Hook, Metadata Pointer, and Permanent Delegate are mainnet-live as of May 2026. Susu composes with them by keeping the group payment mint and token program explicit in the SDK call.

## Run

```sh
pnpm install
pnpm start
```

`pnpm start` uses a logging RPC shim so the flow is independently runnable without a funded devnet keypair. Set `HELIUS_RPC_URL` to show the endpoint you will use when wiring the same instructions into a real transaction sender.

## v0.1 vs v2 roadmap

v0.1.0 supports SPL Token. This example demonstrates the Token-2022 path for Transfer Hook, Metadata Pointer, and Permanent Delegate, but it does not promise confidential transfer support in v0.1.

Confidential transfer and confidential-reputation extensions are post-v2 and gated on Solana Foundation re-enabling the ZK ElGamal program after its mainnet/devnet security audit.

## Caveats

Transfer Hook adds extra accounts to every transfer. Integrators must thread the hook program's expected accounts through their transaction builder.

Permanent Delegate gives the delegate force-transfer authority over token accounts for the mint. Surface that trust model in your fork's UX before users deposit funds.

## Tests

```sh
pnpm test
PNPM_TEST_E2E=1 pnpm test:e2e
```

## See also

- `docs/integration-token-extensions.md`
