# Email template — Helius

**Subject:** Susu Protocol — Helius RPC powering a non-crypto-native ROSCA app

Hi {{recipient_name}},

I'm Andre, building Susu — an open-source Solana ROSCA primitive. {{your_relationship_to_them}}.

We just shipped the reference app with Helius RPC as the primary endpoint and a graceful public-RPC fallback. The implementation lives at `apps/reference/lib/rpc/getRpcUrl.ts` — Helius first when `NEXT_PUBLIC_HELIUS_RPC_URL` is configured, public Solana RPC keyed by cluster otherwise. The runnable integration example exercising the full happy path is at:

https://github.com/tantshirt/susu-monorepo/tree/main/examples/with-privy

(Helius RPC is the backbone of the entire reference app, not just one example.)

The 60-second demo video in the [project README](https://github.com/tantshirt/susu-monorepo) walks through the curve invariant, the live integration code, and the dual-skin reference app — all running on Helius.

Would the Helius team be open to a tweet, a short doc page, or a reference link? Susu is a real production fintech app calling Helius RPC under load. We'd love to cite Helius as our canonical RPC provider.

Happy to jump on a quick call.

Thanks,
Andre
