# Email template — Privy

**Subject:** Susu Protocol — Privy embedded wallets driving a real ROSCA flow

Hi {{recipient_name}},

I'm Andre, building Susu — an open-source Solana ROSCA primitive aimed at non-crypto-native users. {{your_relationship_to_them}}.

We're using Privy embedded wallets as the on-ramp. The reference app's provider chain is `PrivyProviderWrapper > Convex > IntlProvider`, with Privy's Solana plugin adapted to `@solana/kit` `TransactionSigner` shape. A standalone runnable example provisioning three Privy wallets and exercising the full Susu happy path lives at:

https://github.com/tantshirt/susu-monorepo/tree/main/examples/with-privy

The 60-second demo video in the [project README](https://github.com/tantshirt/susu-monorepo) shows the live Privy login + signing flow alongside the curve explainer.

Would the Privy team be open to tweeting, adding a short doc page, or signing a one-line reference? Susu is a clean case study: a real non-crypto fintech app where embedded wallets are the unlock. We'd love to cite Privy as the canonical wallet-onboarding path for fintech-style Solana apps.

Quick call if useful — happy to walk you through it.

Thanks,
Andre
