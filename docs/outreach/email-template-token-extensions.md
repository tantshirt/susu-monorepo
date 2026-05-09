# Email template — Token Extensions

**Subject:** Susu Protocol — Token-2022 Transfer Hook + Metadata Pointer + Permanent Delegate end-to-end

Hi {{recipient_name}},

I'm Andre, building Susu — an open-source Solana ROSCA primitive. {{your_relationship_to_them}}.

We just shipped a runnable Token-2022 integration example that exercises three extensions end-to-end inside a real Susu group:

- **Transfer Hook** — derives the hook program's extra-account PDA and threads it through `postCollateral` and `contribute`.
- **Metadata Pointer** — points metadata resolution at the mint account so wallets and indexers can resolve token metadata without changing Susu state.
- **Permanent Delegate** — performs a read-only authority check to prove the configured delegate is known.

Code, README, and tests at:

https://github.com/tantshirt/susu-monorepo/tree/main/examples/with-token-extensions

The 60-second demo video in the [project README](https://github.com/tantshirt/susu-monorepo) shows the curve invariant, the live integration code, and the reference app.

Would the Token Extensions team be open to a tweet, a short doc page, or a reference link? Susu is a clean case study for the full extension matrix in a non-trivial app. We'd love to cite Token-2022 as our canonical mint substrate.

Happy to jump on a 15-minute call.

Thanks,
Andre
