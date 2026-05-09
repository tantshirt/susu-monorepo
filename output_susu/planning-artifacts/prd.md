---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
releaseMode: 'phased'
inputDocuments:
  - '../product_brief/susu-protocol-brief-2026-05-04.md'
  - '../brainstorming/brainstorming-session-2026-05-04-1530.md'
workflowType: 'prd'
project_name: 'Susu Protocol'
author: 'Andre Exilien'
date: '2026-05-05'
mode: 'YOLO single-pick'
classification:
  projectType: 'blockchain_web3 + developer_tool'
  domain: 'fintech'
  complexity: 'high'
  projectContext: 'greenfield'
prdSpine: 'The Curve Invariant — the dynamic-collateral curve, codified as (a) property test proving expected_default_payoff(i) < 0 ∀ i, (b) 10K-case adversarial simulation artifact, (c) post-audit immutability gate (upgrade authority burned, IDL hash frozen) — IS the acceptance bar around which all FRs/NFRs/epics organize.'
---

# Product Requirements Document — Susu Protocol

**Author:** Andre Exilien
**Date:** 2026-05-05
**Status:** Draft v0.1 (PRD workflow complete, ready for Architecture phase)

## How to Read This PRD

This PRD is organized around one provable claim — **the Curve Invariant** — that no rational defector profits at any rotation position under Susu's dynamic-collateral curve. Every section below traces back to that spine.

Reading order recommended for each audience:

| Audience | Read in this order |
|---|---|
| Frontier Hackathon Judge | Executive Summary → Innovation & Novel Patterns → Success Criteria (Tertiary metrics) → Functional Requirements (skim FR21–FR30) |
| Crypto-native auditor | Executive Summary → Innovation → Blockchain/Web3 Specific Requirements → Functional Requirements (FR1–FR30) → NFRs (Security, Reproducibility) |
| Forking developer | Executive Summary → User Journeys (Aisha, Linh) → Functional Requirements (FR31–FR58) → NFRs (Performance, Integration) |
| Solana Foundation grants reviewer | Executive Summary → Domain-Specific Requirements → Innovation → Success Criteria → Project Scoping |
| Andre (architect handoff) | Whole document, top-to-bottom — every FR/NFR is a binding clause for Architecture and Epics |

Cross-references throughout use `FR#` (Functional Requirement) and `NFR-X#` (Non-Functional Requirement, where X is the category prefix: P=Performance, S=Security, R=Reliability, A=Accessibility, I=Integration, Re=Reproducibility, O=Observability, C=Compliance).

## Executive Summary

Susu Protocol is open-source developer infrastructure for rotating savings circles on Solana — a single audited Anchor program (MIT, no fees, no yield, no company-controlled keys, USDC/USDT only) plus a TypeScript SDK, a Rust client crate, three runnable composability examples, and a dual-skin multi-language reference Next.js app, all in one public monorepo (`susu-monorepo`). The submission target is the Frontier Hackathon Public Goods Award ($10K USDC) and accelerator track ($250K pre-seed). The 10-year goal is canonical primitive status alongside Squads, Privy, Token Extensions, and Helius — the thing future Solana developers reach for whenever they need a recurring stablecoin obligation graph with collateral.

The PRD is organized around one provable claim — **the Curve Invariant** — that no rational defector profits at any rotation position under the dynamic-collateral curve. Every functional requirement, non-functional requirement, epic, and acceptance criterion downstream of this PRD inherits that spine: codified as a property test, an adversarial-simulation artifact, and a post-audit immutability gate (upgrade authority burned, IDL hash frozen).

### What Makes This Special

Nine years of prior on-chain ROSCA attempts (WeTrust, ROSCA.network, multiple EVM and Solana experiments) failed at one specific point: **strategic default at late rotation positions** — participants who have already received the pot have less to lose by walking away. Prior projects either ignored this or used naive flat-collateral models that broke under realistic incentive analysis. Susu's headline novelty is the **dynamic-collateral curve** that scales required collateral with rotation position, eliminating strategic default at every position — and Susu commits to making this claim *executable*: a `proptest`-driven property test plus a 10,000-case adversarial multi-agent simulation (`susu-adversary`) that any judge, auditor, or forker reproduces with one `cargo run`. The curve IS the moat; the proof object IS the primitive.

Three further design commitments distinguish Susu from any prior on-chain ROSCA artifact:

1. **Permissionless payout claim model** — payouts are pulled by recipients, not pushed by a scheduled-execution dependency. The protocol has no scheduler, no keeper network, no off-chain executor.
2. **Immutability as a feature** — post-audit, the program's upgrade authority is burned to the System Program incinerator and the SHA-256 of the deployed IDL is frozen in the tagged release. Susu becomes infrastructure that downstream integrators do not have to price as governance risk.
3. **Reconciled duality** — heritage authenticity (diaspora savings circle origin, multi-language reference app) lives in `/apps/reference`; pure infrastructure neutrality (MIT, audited Anchor program, no fees, no keys) lives in `/programs/susu`. Both true; brief addresses both lenses without forcing a collapse.

The reference app is documentation-by-example, not a productized consumer business. Other developers fork it (or skip it entirely and build their own) for their own communities.

### Why now

Solana's sub-second finality and sub-cent fees make recurring micro-contributions ($25/month) economically viable in a way they were not on Ethereum L1; the Solana primitive layer has matured (Squads, Privy, Token Extensions, Helius all stable and composable); Token Extensions enables a credible v2 confidential-reputation roadmap; and the Frontier Public Goods category has rewarded developer infrastructure across four prior hackathons (Zircon, Attest Protocol, IDL Space, Samui Wallet) — Susu maps directly to that pattern.

## Project Classification

| Field | Value |
|---|---|
| **Project Type** | `blockchain_web3` (primary) + `developer_tool` (secondary) |
| **Domain** | `fintech` |
| **Complexity** | High (novel cryptoeconomics, smart-contract audit, regulated-adjacent FinCEN framing, multi-language i18n, multi-stakeholder coordination) |
| **Project Context** | Greenfield (no prior code in working tree; composability is outward to mature externals: Squads, Privy, Token Extensions, Helius, Sphere) |
| **PRD Spine** | The Curve Invariant — every FR, NFR, and epic inherits this acceptance bar |

## Success Criteria

### User Success

The primary "user" of Susu Protocol is **a downstream Solana developer** (community-app builder, fintech engineer, future ROSCA-adjacent integrator). Consumer-end savers are reached only via downstream apps — they are not Susu's direct customer surface.

- **Time-to-first-rotation ≤ 60 seconds.** A developer cloning `susu-monorepo` at HEAD reaches a running reference app executing a complete mock ROSCA cycle (create → join → contribute → rotate → payout) against devnet in ≤60s of wall-clock time, via a single documented command (`pnpm susu:demo`). Verified by CI on every main-branch commit.
- **Fork-to-deploy in one afternoon.** A developer who has read the README and `collateral-curve.md` can fork the reference app, swap branding/strings/i18n, and deploy to devnet against the audited program in ≤4 hours.
- **Curve legibility.** A reader of `docs/collateral-curve.md` who is not a cryptoeconomist understands the strategic-default problem, why prior attempts failed, and why the curve solves it — verified informally via three external dev reviews before submission.
- **Composability self-evidence.** A developer who reads any one of the three `/examples` repos can copy-paste the integration pattern into a new app in under 30 minutes — no Susu-internals knowledge required.

### Business Success

| Tier | Metric | Target | Window |
|---|---|---|---|
| Primary | Frontier Public Goods Award | Won ($10K USDC) | Submission close |
| Secondary | Accelerator track eligibility | Qualified ($250K pre-seed pathway) | Post-judging |
| Tertiary | Independent third-party forks | ≥3 | T+24 weeks from mainnet |
| Tertiary | Solana Foundation ecosystem listing | Listed as primitive | T+12 weeks |
| Tertiary | Ecosystem partner public reference | ≥1 partner (Squads, Privy, Helius, or Token Extensions team) cites Susu in their docs | Submission close |
| Tertiary | Solana Foundation grant cycle | Application submitted | T+12 weeks |

Susu Protocol itself has no revenue model — it is infrastructure. The funding path is grants + accelerator + future front-end optionality, not user-fee revenue.

### Technical Success

Every clause below traces to **the Curve Invariant** as the PRD spine.

- **No-Strategic-Default property test passes.** `tests/invariants/no_strategic_default.rs` runs ≥10,000 `proptest` cases proving `expected_default_payoff(i, curve) < 0` ∀ i ∈ [0, n) across `n ∈ [3, 12]`, contribution ∈ [$10, $10,000], for both USDC and USDT. CI fails if it fails.
- **Adversarial simulation artifact published.** `cargo run --bin susu-adversary -- --circles 10000 --seed $COMMIT_SHA` exits 0 against the deployed devnet program ID, producing `audits/adversary/adversary-report.json` with `max_defector_profit_lamports: 0` across all rotation positions for circle sizes {3, 5, 7, 10, 12}. JSON + Surfpool replay script committed under `audits/adversary/` and linked from the README headline. The "30% Cartel" scenario (10-member circle, members 4–6 collude post-position-3-payout) is the named headline test in the README.
- **Audit complete with no Critical findings.** Crypto-native audit firm engagement closed before mainnet deploy, with the audit report linked from the README and explicitly citing `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json` by file path.
- **Immutability gate fired.** Post-audit, the mainnet program's upgrade authority is set to the System Program incinerator (`1nc1nerator11111111111111111111111111111111`), and the SHA-256 of the deployed IDL matches `idl/susu.json` in the tagged release. CI assertion via `solana program show` and IDL hash diff.
- **SDK parity.** `@susu/sdk` (TypeScript) and `susu-client` (Rust) generated from the same Anchor IDL source; CI parity check on every PR ensures both expose the identical instruction surface and account decoders.
- **Surfpool integration suite.** Full happy-path and adversarial scenarios pass against a Surfpool fork of devnet/mainnet realistic state, including Squads multisig governance, Privy embedded wallet flow, and Token Extensions Token-2022 account interop.
- **Reproducible artifact.** Any judge or auditor reproduces every test result with `git clone && pnpm install && pnpm verify` in <10 minutes on a clean machine.

### Measurable Outcomes (time-bound)

| Milestone | T-relative | Definition of done |
|---|---|---|
| Monorepo public, IDL frozen, audit firm engaged, legal firm engaged, translation outreach started | T+0 (Day 1) | Public GitHub repo with directory skeleton, `IDL_FREEZE.md` tagged commit, signed audit SOW, signed legal-opinion SOW, ≥1 outbound message per language to community translator |
| `docs/collateral-curve.md` + `audits/adversary/adversary-report.json` published | T+2w | Both files committed, README headline links to both |
| 3 composability examples runnable + `pnpm susu:demo` ≤60s | T+3w | CI-verified |
| Submission ship | T+4w | All MVP scope items below land; legal opinion appendix landed at whatever scope is signed; English + Vietnamese baseline live; demo video embedded in README; daily `/log` unbroken since T+0; 1 partner reference confirmed |
| Mainnet deploy + immutability gate fired | T+6–10w | Post-audit; upgrade authority burned; tagged `v0.1.0-mainnet` |
| 5 i18n locales live | T+12w | vi, es, ar, yo, ht-kreyol all populated by community translators |
| ≥3 forks observed | T+24w | GitHub fork graph + ≥3 forks with substantive commits beyond default skin |

## Product Scope

### MVP — Minimum Viable Product (the v0.1.0 submission ship, 4-week window)

**The protocol layer (`/programs/susu`)**

- Anchor 1.0 program implementing: group creation, member registration, contribution, dynamic-collateral-curve enforcement, rotation scheduling, permissionless payout claim, slashing for non-payment, deterministic PDA-based vault accounts
- USDC and USDT support (SPL Token)
- Full Anchor test suite covering the happy path + the strategic-default edge cases
- `tests/invariants/no_strategic_default.rs` (proptest, ≥10K cases)
- `susu-adversary` simulation binary + published artifact
- Devnet deployment for submission window; mainnet path post-audit
- IDL frozen at `IDL_FREEZE.md` commit; SHA-256 hash committed

**The SDK layer (`/sdk/ts`, `/sdk/rust`)**

- `@susu/sdk` (TypeScript) — built on `@solana/kit`, idiomatic helpers (`createGroup`, `contribute`, `claimPayout`, `queryHistory`), types from Anchor IDL via Codama or equivalent codegen
- `susu-client` (Rust) — generated from same IDL, CI parity check vs. TS SDK
- `@solana/web3-compat` adapter at boundary for any legacy-web3.js library that integrators bring

**The reference app layer (`/apps/reference`)**

- Next.js 15 App Router + Convex (group metadata) + Privy (wallets) + Helius (RPC) + shadcn/Tailwind
- Dual-skin: diaspora skin + brand-neutral skin, toggleable via single env flag
- i18n: English baseline + Vietnamese live; ar / es / yo / ht-kreyol stub locales committed with `CONTRIBUTING-TRANSLATIONS.md` flow open
- `pnpm susu:demo` one-command flow runs the full happy-path against devnet in ≤60s
- Sphere fiat on-ramp: optional flag, NOT on demo happy-path

**The composability examples (`/examples`)**

- `with-squads` — Susu group governed by a Squads multisig, runnable, ~200 LOC
- `with-privy` — Susu group with Privy embedded wallet onboarding, runnable
- `with-token-extensions` — Token-2022 confidential reputation v2 teaser using Token Extensions, runnable

**The documentation layer (`/docs`)**

- `collateral-curve.md` — formal write-up + proof sketch + worked examples
- `threat-model.md` — adversary model, attack surfaces, mitigations
- `fincen-cvc-framing.md` — non-custodial / non-fee / non-yield posture under FinCEN 2019 CVC
- `legal-opinion.pdf` — published at submission close at whatever scope the crypto-native law firm has signed
- `composability-diagram.svg` — visual map of Susu in the Solana primitive ecosystem
- README first viewport: audit badge, license badge, devnet/mainnet status, 60s demo video embed, fork-me CTA, link to curve write-up + adversary artifact

**The narrative layer (`/log`)**

- Daily engineering-log entries from T+0 onwards, unbroken to submission close

**The submission artifacts**

- 60–90 second demo video embedded in README (rotating-money animation → curve explainer → integration code → fork-me CTA, both skins shown briefly)
- ≥1 ecosystem partner public reference (Squads, Privy, Helius, or Token Extensions) confirmed before submission close

### Growth Features (Post-MVP, T+4w to T+24w)

- All 5 i18n locales live with community translators (vi already MVP; add es, ar, yo, ht-kreyol)
- Mainnet deploy with upgrade authority burned + IDL hash frozen
- `npx create-susu-app` scaffolder for one-command project initialization
- 3rd-party fork ecosystem nurturing (issue-tag triage, "good first PR" labels)
- Solana Foundation grant cycle application
- Composability stress-test repo (single demo wiring 5 Solana primitives in one flow)
- Additional `/examples` integrations (Phantom, Backpack, Helius webhooks, Sphere on-ramp deep flow)
- Curve simulator web demo (interactive parameter exploration of the curve)

### Vision (T+24w+)

- **v2 confidential reputation** — on-chain participation history rendered confidential via Token Extensions Token-2022 ZK extension; queryable as a credit primitive without revealing transaction-level history. *Confidential reputation depends on the ZK ElGamal program's re-enablement (currently in security audit on mainnet/devnet); v2 timing is gated on Solana Foundation re-enable.*
- **Multi-stablecoin support** — PayPal USD, EURC, regional stablecoins as community demand emerges
- **Reference implementations cross-language** — Python and standalone Rust ports of the curve formula for use outside Solana
- **Cross-chain bridge optionality** — Wormhole or equivalent if real demand emerges (not pursued without demand)
- **Solana Foundation primitive ecosystem listing** — Susu as a first-class primitive cited in Foundation docs alongside Squads, Privy, Token Extensions
- **≥3 consumer apps in production** — built on Susu, serving real diaspora communities or fintech use cases at scale
- **Optional Foundation governance treasury** — only if real adoption emerges and a community wants stewardship; no token, no DAO unless required by adoption

## User Journeys

Susu's stakeholder surface is heterogeneous: forking developers, hackathon judges, auditors, end-savers (via reference app), and community translators. The PRD maps a journey per stakeholder so functional requirements downstream cover the full surface, not just the developer happy path.

### Journey 1 — Aisha, the Forking Developer (Primary user, happy path)

**Opening.** Aisha is a Lagos-based Solana engineer building a community app for a Yoruba diaspora savings circle. Her circle organizer has run an offline `èsúsú` for 12 years; members trust each other but want on-chain receipts. Aisha has surveyed every prior on-chain ROSCA — they all collapse on late-position default — and given up twice. It's 11pm. She finds `susu-monorepo` from a tweet.

**Rising action.** README first viewport: audit badge, MIT badge, devnet status, 60s demo video, fork-me CTA. She watches the 60s video — money rotating around avatars, curve explainer, integration code. She runs `git clone && pnpm install && pnpm susu:demo`. 47 seconds later her terminal shows a complete mock ROSCA cycle: 5-member circle, 3 contributions, 1 rotation, payout claimed. She opens `apps/reference` in localhost, sees the dual-skin toggle, reads `docs/collateral-curve.md` headline ("for every rotation slot i, expected default payoff is strictly negative — proven by `tests/invariants/no_strategic_default.rs`, 10,000 cases").

**Climax.** She opens `examples/with-privy` to see how embedded wallet onboarding works for users without crypto experience. ~200 LOC. She copy-pastes the integration into her Yoruba-skinned fork, swaps the i18n bundle, deploys to her own devnet program — total elapsed ≈3 hours. Her fork is on GitHub by 2am.

**Resolution.** She tags @susu-protocol on Twitter with a screenshot of her devnet circle running. The protocol's official account RTs. Her circle organizer is the first onboarded member of her fork's mainnet deploy six weeks later.

**Capabilities revealed:** README scan-optimization; one-command demo (`pnpm susu:demo`); dual-skin reference app; i18n bundle architecture; example integrations as documentation; Privy embedded-wallet flow; devnet-first developer ergonomics.

### Journey 2 — Marcus, the Frontier Hackathon Judge (Critical, 30-second window)

**Opening.** Marcus is a Solana Foundation grants reviewer assigned to score 200 Frontier submissions in 6 hours. He has ~108 seconds per submission, optimistically, before context-switching. He opens `susu-monorepo` at 2:47pm on submission close + 18 hours.

**Rising action.** First viewport: audit badge (linked to firm's report), MIT badge, devnet/mainnet status, 60s demo video embed, fork-me CTA, two badges he hasn't seen before — "10,000 adversarial circles passed" and "Upgrade authority: burned." He clicks the demo video. 60 seconds. He clicks `docs/collateral-curve.md`. The headline assertion is in the first 100 words. He clicks `audits/adversary/adversary-report.json` — sees `max_defector_profit_lamports: 0` and the "30% Cartel" scenario named.

**Climax.** He scrolls the monorepo directory tree. Programs, SDKs (TS + Rust both), 3 composability examples runnable, formal math doc, threat model, FinCEN framing, public legal opinion PDF, daily engineering log unbroken for 28 days, full test suite. He scores Public Goods category at the top of his rubric: "infrastructure quality and verifiability are present and reproducible."

**Resolution.** Marcus closes the tab at 2:51pm. Total time spent: ~4 minutes — well over the 30-second floor and the strongest signal he has seen all afternoon.

**Capabilities revealed:** README first-viewport budget; audit linkage; reproducible adversary artifact; legal opinion as appendix; daily log discipline; test suite count + coverage % surfaced.

### Journey 3 — Priya, the Audit Engineer

**Opening.** Priya is a senior auditor at the crypto-native firm Andre engaged on T+0. The SOW is narrow: Anchor program + the curve invariant + slashing + permissionless claim semantics. Two-week timeline.

**Rising action.** She receives the IDL frozen at `IDL_FREEZE.md` commit on Day 1. Her audit proceeds against that artifact. She reviews `programs/susu/src/lib.rs`, `programs/susu/src/curve.rs`, `programs/susu/src/instructions/*`. She runs the local test suite: LiteSVM unit tests pass; Mollusk fuzz tests pass; the property test in `tests/invariants/no_strategic_default.rs` runs ≥10K cases in ~90 seconds and passes. She runs `cargo run --bin susu-adversary -- --circles 10000` — 8 minutes, exits 0, produces report.

**Climax.** She probes the curve at edge cases: n=3 (smallest viable circle), n=12 (largest scope), USDT (different decimals from USDC). All hold. She probes the slashing code path with a 30%-cartel scenario manually — collateral covers honest members; defectors net negative. She files three Informational findings, zero Critical, zero High.

**Resolution.** Final report links to the property test and the adversary artifact by file path. Andre publishes the report at `audits/firm-name-2026-XX.pdf`. The README badge updates to "Audit: passed."

**Capabilities revealed:** IDL freeze policy + freeze commit; LiteSVM/Mollusk unit fixtures; reproducible property + adversary tests; auditor-friendly file layout.

### Journey 4 — Linh, the End-Saver via Reference App (Edge case, downstream UX)

**Opening.** Linh is a Vietnamese-American student in Houston whose family has run a `hụi` for years offline. Her aunt — the trusted organizer — wants to move it on-chain because three relatives in Vietnam want to join. Aunt sends Linh a link to a fork of Susu's reference app, branded for the family circle and translated to Vietnamese.

**Rising action.** Linh opens the link in mobile Safari. Privy onboards her via email-based embedded wallet — no seed phrase, no wallet app required. The reference app shows the circle: 8 members, $50/month USDC, 8-month rotation. She sees the collateral required for her position (position 4 of 8) — calculated by the curve, displayed in plain Vietnamese. She funds her wallet via Sphere on-ramp (optional flag, on for this fork) using a debit card. She joins.

**Climax.** Month 1 contribution: she taps "Contribute," signs via Privy, the transaction confirms in <1 second, the app shows her on-chain receipt. Month 4: she receives the pot, $400 USDC, claims it permissionlessly with one tap. She bridges via Sphere off-ramp to her bank account.

**Resolution.** She forwards the on-chain receipt to her aunt as proof. Her family's `hụi` is now an auditable, slashing-protected, sub-second-finality artifact. Three relatives in Vietnam are onboarded by the next rotation cycle.

**Capabilities revealed:** Privy embedded wallet integration; mobile-first reference app UX; vi i18n live; Sphere on-ramp + off-ramp flag wired; permissionless payout claim from the reference UI; on-chain receipt UX.

### Journey 5 — Yves, the Community Translator

**Opening.** Yves is a Haitian-American developer who runs a Kreyòl-language Solana developer Discord. He sees Andre's tweet recruiting translators. He clicks `CONTRIBUTING-TRANSLATIONS.md`.

**Rising action.** The doc explains: i18n bundle structure, locale stub committed at `apps/reference/i18n/ht-kreyol.json`, list of strings to translate, style guide ("savings circle" → "èskò" or "tonòl" — community decides), PR template. He clones the repo, populates ~180 strings over a Saturday afternoon, opens a PR.

**Climax.** Andre reviews and merges within 24 hours. Yves's PR triggers CI — i18n tests verify all keys present in the new locale match the English baseline; reference app rebuilds with `ht-kreyol` selectable. Yves shares the locale switch with his Discord; three Haitian developers ask if they can fork the reference app for their communities.

**Resolution.** The repo's contributors list grows. Yves becomes a `CODEOWNER` for `apps/reference/i18n/ht-kreyol.*`. The Solana Foundation's diversity report cites Susu as an example of community-translated infrastructure two months later.

**Capabilities revealed:** i18n bundle architecture; `CONTRIBUTING-TRANSLATIONS.md` flow; CI key-parity check across locales; CODEOWNERS pattern for community contributors.

### Journey Requirements Summary

The five journeys collapse into the following capability clusters that downstream FRs and epics must cover:

| Capability cluster | Journeys it serves |
|---|---|
| **README scan-optimization + first-viewport signal density** | Aisha, Marcus |
| **One-command developer experience (`pnpm susu:demo`)** | Aisha |
| **Dual-skin reference app + skin toggle** | Aisha, Linh |
| **i18n bundle + locale stubs + CI parity check + `CONTRIBUTING-TRANSLATIONS.md`** | Aisha, Linh, Yves |
| **Composability examples as runnable documentation** | Aisha |
| **Privy embedded wallet onboarding for non-crypto users** | Linh, Aisha |
| **Sphere on-ramp/off-ramp optional flag** | Linh |
| **Permissionless payout claim from UI and SDK** | Linh, Aisha |
| **Curve invariant property test + adversary artifact + reproducibility** | Marcus, Priya |
| **IDL freeze policy + frozen commit reference** | Priya, Aisha |
| **LiteSVM / Mollusk / Surfpool test fixtures** | Priya |
| **Audit report linkage + audit badge in README** | Marcus, Priya |
| **Public legal opinion PDF as appendix** | Marcus |
| **Daily engineering log unbroken** | Marcus |
| **Multi-stakeholder CODEOWNERS for community contributions** | Yves |
| **Devnet + mainnet program ID surfacing in README** | Aisha, Marcus, Linh |
| **TS SDK + Rust crate parity (CI-enforced)** | Aisha, Priya |
| **On-chain participation history queryable** | Linh, Aisha (foundation for v2 reputation) |

## Domain-Specific Requirements

Susu Protocol sits at the **fintech / DeFi / regulated-adjacent** boundary. The protocol is not itself a money services business under FinCEN 2019 CVC guidance because it is non-custodial, non-fee-extracting, and non-yield-routing — but proximity to that classification is the dominant compliance constraint, and the PRD must be explicit about which postures preserve that exemption and which would forfeit it.

### Compliance & Regulatory

- **FinCEN 2019 CVC guidance posture (non-custodial, non-fee, non-yield).** The protocol layer MUST never (a) take custody of user funds in a wallet controlled by the protocol team, (b) charge a protocol-level fee, or (c) route any portion of contributions or collateral to a yield-generating venue. Any change to any of these clauses requires a re-litigation of the legal opinion letter and a new PRD revision.
- **Public legal opinion letter as submission appendix.** A crypto-native law firm's letter, narrowly scoped to "non-custodial / non-fee / non-yield posture under FinCEN 2019 CVC guidance," is published at `docs/legal-opinion.pdf` by submission close. Whatever scope the firm signs by submission date is what ships — narrow scope is preferred over broad scope to compress turnaround.
- **No state Money Transmitter License (MTL) required by design.** The non-custodial architecture is the legal basis for not registering as a money transmitter in any US state. The reference app inherits this posture by deferring all custody to the user's Privy embedded wallet (the user controls keys; Privy is a non-custodial wallet provider per their published posture).
- **No tokenized governance, no protocol token, no airdrop.** Avoids securities classification under US `Howey` test. PRD explicitly forbids any future feature that would introduce one without a full legal review and re-litigation.
- **AML / KYC pushed downstream.** Susu Protocol does not perform KYC at the program level — it is permissionless infrastructure. The reference app's optional Sphere on-ramp inherits Sphere's KYC obligations; Privy embedded-wallet onboarding inherits Privy's compliance posture. Downstream developers integrating Susu inherit responsibility for KYC at their own application layer.
- **OFAC / sanctions.** The protocol does not operate any sanctions-list-checking on-chain. Downstream integrators are responsible for any required sanctions screening at their UI/onboarding layer. The reference app DOES NOT hardcode sanctions checks (forks decide for their own jurisdiction); this design choice is documented in `docs/threat-model.md`.
- **EU MiCA / GDPR.** The protocol stores only pseudonymous on-chain data (wallet addresses, contribution amounts, rotation positions) — no PII at the protocol layer. The reference app's Convex-backed group-metadata layer (display names, invite link metadata) is the only place PII exists; that layer commits to GDPR Article 17 erasure-on-request and minimal collection. EU MiCA classification: Susu does not issue an asset-referenced token or e-money token, so MiCA Title III/IV do not apply; only the broader CASP framework would, and only if a downstream consumer-facing front-end positions itself as a regulated service in the EU — that's the integrator's call, not Susu's.
- **Stablecoin regulatory inheritance.** USDC inherits Circle's regulatory posture (NY DFS, MTL state coverage); USDT inherits Tether's. Susu does not warrant either; integrators choose based on their jurisdiction.

### Technical Constraints

- **Anchor 1.0 program safety.** All Anchor account-validation constraints (`#[account(...)]`), CPI guards, signer/writability declarations, and PDA derivation must be explicit and audit-cited. No unsafe arithmetic — checked math everywhere; saturating math forbidden in the curve calculation. `cargo deny` + `cargo audit` on every CI run.
- **PDA-only vault accounts.** No protocol-controlled token accounts owned by user-supplied keys. Every vault is a deterministic PDA derived from the group identifier. Rent-exemption pre-funded by the group creator at group creation.
- **Token program variant explicitness.** SPL Token vs Token-2022 distinction surfaced in IDL and SDK types. v0.1.0 supports SPL Token (USDC, USDT). Token-2022 reputation extension is v2 roadmap; the PRD documents the upgrade path without committing to it pre-audit.
- **Compute budget & priority fees.** All instruction handlers must complete within Solana's compute budget headroom (CU < 200,000 per instruction nominal). Reference app sets prioritization fees per Helius's recommended algorithm; SDK exposes a `priorityFee` parameter on every transaction-building helper.
- **Cluster discipline.** Devnet for the submission window, mainnet path post-audit. Reference app surfaces the active cluster prominently; SDK refuses to send mainnet transactions unless `cluster: 'mainnet-beta'` is explicitly passed (no implicit mainnet).
- **Signing UX safety (per solana-dev guardrails).** No automated transaction signing without explicit user approval per session in any reference-app flow. All transactions display recipient, amount, token, fee payer, cluster, and a `simulateTransaction` result before requesting a signature.
- **No private-key handling in the codebase.** No code path reads, stores, or transmits seed phrases or keypair files. Wallet-Standard signing flows (Privy, browser-extension wallets) are the only signing surface in the reference app.
- **Immutability of the program post-audit.** Upgrade authority burned to the System Program incinerator. SHA-256 of deployed IDL frozen in tagged release. Documented in `docs/threat-model.md` as both a security feature and a constraint (no hotfixes; bugs require redeploy at new program ID and social migration).
- **Untrusted on-chain data.** All deserialization from on-chain accounts validates ownership, length, and discriminator before reading. No instruction-handler logic depends on values pulled from accounts the program does not own without explicit verification. Memo fields and any string-typed account data are treated as adversarial input — never used in formatting or downstream system calls.

### Integration Requirements

| Integration | Layer | Compliance posture inherited |
|---|---|---|
| **USDC SPL** | Protocol | Circle's NY DFS + MTL coverage |
| **USDT SPL** | Protocol | Tether's posture |
| **Squads** | Reference app + `examples/with-squads` | Squads' multisig audit + posture |
| **Privy** | Reference app + `examples/with-privy` | Privy's non-custodial wallet posture + their KYC layer when integrators enable it |
| **Token Extensions (Token-2022)** | `examples/with-token-extensions` | Solana Foundation's program; Susu uses the public Token-2022 program ID |
| **Helius** | Reference app + SDK default RPC | Helius RPC infrastructure |
| **Sphere** | Reference app (optional flag) | Sphere's KYC + on-ramp licensing in supported regions |
| **Convex** | Reference app metadata only | Group display names, invite metadata; PII per GDPR Article 17 erasable |

### Risks & Mitigations (domain-specific)

| Risk | Likelihood × Impact | Mitigation |
|---|---|---|
| FinCEN classification slip via inadvertent custodial action | Low × Catastrophic | PRD spine forbids custodial paths; legal opinion letter cites the specific clauses; threat model audits any code path that touches user funds for non-custodial property; CI test asserts no protocol-owned token accounts |
| USDC or USDT depeg event during submission or audit window | Low × High | Reference app handles depeg gracefully (display warning, allow withdrawal of unclaimed payouts); protocol has no depeg-sensitive math because curve is denominated in stablecoin-units, not USD |
| Audit firm slips schedule beyond submission window | Medium × High | Devnet deployment is the submission artifact; mainnet is post-audit. Audit cites the property test + adversary artifact directly. Submission ships with `audit-pending` badge if firm has not signed off; full report linked when published. |
| Legal opinion letter scope insufficient or delayed | Medium × Medium | Engage Day 1; narrow scope (non-custodial / non-fee / non-yield only) to compress turnaround; publish whatever scope the firm has signed by submission close; expand scope post-submission |
| Privy or Sphere outage during demo | Low × Medium | Reference app degrades to wallet-extension-only signing if Privy fails; Sphere on-ramp is an optional flag and not on the demo happy-path |
| Helius RPC outage | Low × Medium | SDK accepts any Solana RPC URL; defaults to Helius but is not Helius-locked; reference app falls back to public RPC with a banner |
| Strategic-default proof contested by an auditor or judge | Low × Catastrophic | Property test + 10K-case adversarial sim + formal proof sketch all reproducible by judges and auditors with one command; "30% Cartel" headline test is the named falsification target |
| Token Extensions confidential transfer not production-ready by v2 | Medium × Low | v2 roadmap teaser only; no v0.1.0 dependency; `examples/with-token-extensions` demonstrates current Token-2022 features that ARE available, with confidential-reputation framed as the future direction |
| Reference app inadvertently regulated as money transmitter in a US state | Low × High | Non-custodial architecture documented in `docs/threat-model.md`; reference app does not act as intermediary for funds; community forks adopt their own MTL posture per jurisdiction |

## Innovation & Novel Patterns

Susu Protocol's claim is genuine novelty in a category with nine years of documented failure (WeTrust, ROSCA.network, multiple EVM and Solana experiments — none solved strategic default; none audited; none composable). Innovation signals are not aesthetic — they are mechanism-level claims that the PRD must commit to validating.

### Detected Innovation Areas

**1. Dynamic-collateral curve (PRIMARY headline novelty).** The required collateral at each rotation slot scales with the participant's position-relative payoff profile. Concretely: a participant in an early rotation slot (who has not yet received the pot) has lower potential strategic-default benefit and posts lower collateral; a participant in a late rotation slot (who has accumulated payout obligations from earlier rounds) has higher potential strategic-default benefit and posts proportionally higher collateral. The curve is parameterized by `n` (circle size), contribution amount, and stablecoin denomination, and is closed-form computable on-chain in O(n) compute units.

This is the first clean cryptoeconomic solution to the strategic-default problem on-chain — a problem that has eliminated every prior on-chain ROSCA. The curve is the moat. Without it, Susu is just another on-chain savings circle. With it, Susu is the canonical primitive.

**2. Permissionless payout claim model (no scheduled-execution dependency).** Prior on-chain ROSCAs typically required a keeper network, scheduled-execution infrastructure (e.g., Chainlink Automation), or a centralized cron to trigger payouts. Susu inverts the model: payouts are *claimed* by the recipient via a permissionless instruction, gated by on-chain rotation-position validation. No off-chain scheduler. No keeper. No external infra dependency. This is novel for the category and material for composability — integrators don't have to wire keeper infrastructure to use Susu.

**3. Post-audit immutability gate (burned upgrade authority + frozen IDL hash).** Standard Solana program practice is multisig-controlled or timelocked upgrade authority, retaining the ability to ship hotfixes or feature additions. Susu commits to the opposite: post-audit, the upgrade authority is irrevocably burned to the System Program incinerator and the SHA-256 of the deployed IDL is frozen in the tagged release. This is rare for Solana programs and constitutes a credibility signal — Susu is not governable infrastructure that prices governance risk into integration; it is a frozen primitive in the literal sense.

**4. Heritage-and-neutrality reconciliation in one monorepo (a new category claim).** "Infrastructure with heritage" — a project simultaneously a universal Solana primitive (MIT, audited, no fees, no keys) AND an authentic diaspora-cultural artifact (Vietnamese hụi, Mexican tanda, Egyptian gameya, Nigerian susu, Korean kye, Haitian sòl as the founder's voice in the reference app). Reconciled by treating the protocol layer as universal artifact and the reference app as documentation-by-example with cultural-flavor optionality (dual-skin toggle). No prior Solana primitive has explicitly claimed this duality.

**5. Confidential reputation via Token Extensions (v2 roadmap teaser).** Token-2022 confidential transfer extension enables Susu's queryable participation history to be rendered as a confidential reputation primitive — provable participation without revealing transaction-level history. v0.1.0 ships the foundation (queryable participation history); v2 ships the confidential-transfer overlay. The v2 teaser is documented and a working `examples/with-token-extensions` demonstrates current Token-2022 features as a stepping stone — but v0.1.0 does NOT depend on v2.

**6. Adversarial-simulation-as-marketing (SQLite-style test-count posture).** SQLite famously markets itself via test count and coverage (>1000:1 test-to-code ratio). Susu adopts the analogous posture: the headline marketing artifact is the published, reproducible result of a 10,000-case adversarial simulation. Judges, auditors, and forkers can re-run the simulation with one command. This is innovation in submission packaging more than in protocol mechanism — but it converts an unprovable narrative claim ("we eliminated strategic default") into an executable, reproducible artifact that survives adversarial scrutiny in <10 minutes of probing.

### Market Context & Competitive Landscape

| Prior attempt | Stack | Why it failed |
|---|---|---|
| WeTrust (2017) | Ethereum L1 | Gas costs made micro-contributions uneconomic; no solution to late-position strategic default; abandoned |
| ROSCA.network | Ethereum | Flat-collateral model — strategic default at late positions broke incentives in realistic adversarial play |
| Multiple Solana experiments (2021–2024, unaudited) | Solana | None audited; none solved strategic default; none composable; none with formal write-up |
| Off-chain/Web2 apps (Pluto, Esusu, Rotativa) | Centralized custody | Inherit MSB/MTL regulatory burden; not infrastructure; not forkable |

Susu's position: first audited, MIT-licensed, composable on-chain ROSCA primitive that solves strategic default with a published proof object. Not "another ROSCA app" — the missing primitive layer underneath all future ROSCA apps.

Adjacent Solana primitives Susu composes with (NOT competes with): Squads (multisig governance), Privy (embedded wallets), Token Extensions (Token-2022 features), Helius (RPC), Sphere (fiat on-ramp). Each is consumed by Susu's reference app or examples. Each is a potential ecosystem-partner reference channel.

### Validation Approach

The innovation claims are not validated by assertion — they are validated by reproducible artifacts:

- **Curve correctness** — `tests/invariants/no_strategic_default.rs` (proptest, ≥10K cases) + `audits/adversary/adversary-report.json` (10K randomized lifecycles, `max_defector_profit_lamports: 0`) + formal `docs/collateral-curve.md` write-up with worked examples and a proof sketch + crypto-native audit firm sign-off citing the test files by path.
- **Permissionless claim correctness** — Anchor test suite covering happy-path claim, double-claim attempt (must fail), claim-before-rotation-position-due (must fail), claim-by-non-recipient (must fail), claim-by-malicious-PDA-collision (must fail). All edge cases reproducible with `anchor test`.
- **Immutability gate fired** — CI assertion `solana program show $PROGRAM_ID --url mainnet-beta` returns the incinerator address as upgrade authority; `anchor idl fetch | sha256sum` matches `idl/susu.json` hash. README badges these as live signals.
- **Heritage/neutrality duality** — dual-skin reference app demonstrably toggles via single env flag; both skins runnable in CI; both skins shown briefly in the 60-second demo video; `docs/composability-diagram.svg` makes the protocol-vs-reference-app boundary visually obvious.
- **v2 confidential reputation** — `examples/with-token-extensions` runs against Token-2022; the v2 roadmap clause in `docs/collateral-curve.md` is explicit about what is shipped now (foundation) vs what is roadmap (overlay).
- **Adversarial simulation as marketing** — `cargo run --bin susu-adversary -- --circles 10000 --seed $COMMIT_SHA` reproduces the full report on a clean machine in <10 minutes. The artifact is committed; the seed is the commit SHA, so re-running on a tagged release reproduces byte-for-byte.

### Innovation Risk Mitigation

| Innovation risk | Likelihood | Fallback |
|---|---|---|
| Curve has a flaw at a rotation slot we didn't simulate | Low (10K randomized cases, proptest, formal sketch) | Disclose, document at `docs/collateral-curve-errata.md`, ship a corrected curve and a versioned `v0.1.1` with a public errata note. Honesty preserves canonical-primitive credibility better than silent patching. |
| Permissionless claim model has an unforeseen DoS vector | Low (model is the simplest possible — pull, not push) | Threat model documents the attack surface; rate-limiting at the RPC layer (Helius) is the integrator's responsibility; protocol-level rate-limiting NOT added (would compromise permissionlessness) |
| Burned upgrade authority forecloses on a future fix | Certain (this is the trade-off) | Documented as a feature, not a bug. A bug requires `susu-v2` redeploy at new program ID + social migration. This is the price of being a primitive — paid up-front, not amortized. |
| Token Extensions confidential-transfer feature not production-ready by v2 timeline | Medium | v2 timeline is unbounded; not on the v0.1.0 critical path; teaser only |
| "Infrastructure with heritage" framing reads as marketing rather than substance to a Solana-Foundation reviewer | Medium | Substance test: protocol is in `/programs/susu`, reference app is in `/apps/reference`, dual-skin is real, both skins runnable, neither skin appears in the audit scope — the duality is structural, not narrative |
| Adversarial simulation harness has a bug that masks a real vulnerability | Low | Audit firm independently reproduces and probes the harness; harness source is public; "30% Cartel" headline test is the named falsification target — anyone in the ecosystem can challenge it |

## Blockchain / Web3 + Developer-Tool Specific Requirements

Susu is a hybrid project type — primary `blockchain_web3` (Anchor program is the canonical artifact), secondary `developer_tool` (SDK + Rust crate + reference app + examples are the developer-facing surface). This section covers the technical-architecture clauses specific to each lens.

### Project-Type Overview

The submission artifact is one monorepo containing:
1. A Solana mainnet program (Anchor 1.0)
2. A TypeScript SDK + a Rust client crate, both generated from the same Anchor IDL
3. A dual-skin multi-language Next.js 15 reference app
4. Three runnable composability examples
5. Formal documentation (curve write-up, threat model, FinCEN framing, legal opinion)
6. Daily engineering log
7. Full test suite (Anchor + LiteSVM + Mollusk + Surfpool + property + adversary)

Every artifact is MIT-licensed and public from commit zero.

### Chain & Cluster Specs

- **Chain:** Solana
- **Cluster (submission window):** Devnet — primary deployment for the 4-week submission window; submission ships against a devnet program ID that judges/auditors interact with directly
- **Cluster (post-audit):** Mainnet-beta — deploy once audit is signed off; upgrade authority burned at deploy
- **Anchor framework version:** Anchor 1.0 (latest stable; specific minor version pinned in `Anchor.toml` and CI matrix)
- **Solana CLI version:** pinned in `rust-toolchain.toml` and `solana-install init` documented in `CONTRIBUTING.md`
- **Local development:** Surfpool (preferred — realistic mainnet/devnet state fork) with LiteSVM/Mollusk for unit-test fast feedback. `solana-test-validator` only when Surfpool/LiteSVM cannot emulate a needed RPC behavior.
- **CLI invocation:** all CLI commands prefixed with `NO_DNA=1` per non-human-operator standard (used in CI scripts, documented in CONTRIBUTING)

### Wallet Support & Signing UX

- **Reference app primary signing surface:** Privy embedded wallets (email-based onboarding for non-crypto users)
- **Reference app secondary signing surface:** Wallet Standard discovery for browser-extension wallets (Phantom, Backpack, Solflare); discovered via `@solana/react-hooks` per framework-kit-first stack
- **SDK signing surface:** `@solana/kit` `Signer` abstraction; `signer()` / `signerFromFile()` / `generatedSigner()` helpers exposed in dev/test paths; production paths require integrator-provided signer
- **No private-key handling in the codebase.** No code reads, stores, or transmits seed phrases, mnemonics, or keypair files. Wallet-Standard signing is the only signing surface.
- **Transaction simulation before signing.** Every transaction in the reference app and SDK calls `simulateTransaction` and surfaces the result before requesting a signature. SDK helpers expose a `simulate` boolean (default `true`).
- **Cluster confirmation UX.** Reference app surfaces the active cluster (`devnet` / `mainnet-beta`) prominently; SDK requires `cluster: 'mainnet-beta'` to be explicitly passed for mainnet — no implicit mainnet sends.

### Smart Contract Architecture

**Program-level invariants (must hold for v0.1.0 ship)**

1. Non-custodial: protocol team holds no keys to any user-controlled token account
2. Zero-fee: no fee path in any instruction handler
3. Zero-yield: no contribution or collateral routing to a yield-generating venue
4. Permissionless claim: payouts pulled by recipient; no scheduled-execution path exists
5. Curve enforced: dynamic-collateral curve calculated on-chain at every contribution and claim instruction
6. Slashing on default: missed contribution within grace window triggers collateral slashing per curve
7. Deterministic PDAs: all vault and metadata accounts derived deterministically from group ID; no off-curve keys

**Account model (high-level — to be detailed in Architecture phase)**

- `Group` account — group config, member roster, rotation schedule, USDC/USDT mint, curve parameters
- `MemberPosition` account (PDA per (group, member)) — rotation slot, contribution history, collateral posted, slash status
- `Vault` token account (PDA per group) — escrow for contributions and collateral; SPL Token (USDC or USDT)
- `RotationReceipt` account (PDA per (group, rotation index)) — record of each rotation's payout

**Token program variant**

- v0.1.0: SPL Token (USDC, USDT)
- v2 roadmap: Token-2022 with confidential-transfer extension for confidential reputation overlay; documented in roadmap, not on v0.1.0 critical path

### Compute Budget & Gas Optimization

- **Per-instruction CU target:** ≤ 200,000 compute units nominal; documented per instruction in `docs/cu-budget.md`
- **Curve calculation:** O(n) closed-form; n is bounded ∈ [3, 12], so worst-case CU is bounded
- **Priority fee handling:** SDK exposes `priorityFee` parameter on every transaction-builder helper; reference app uses Helius's recommended priority fee algorithm (`getRecentPrioritizationFees` + sliding-window heuristic)
- **Compute budget instructions:** SDK auto-prepends `ComputeBudgetProgram.setComputeUnitLimit` and `setComputeUnitPrice` instructions per Helius best practice
- **No needless allocations in instruction handlers** — Anchor's `#[derive(Accounts)]` validates account writability/signer/owner without runtime allocation

### Security Audit

- **Audit firm:** crypto-native firm engaged Day 1 (T+0)
- **Audit scope:** `programs/susu/` (Anchor program), the dynamic-collateral curve, slashing, permissionless-claim semantics, PDA derivation, account-validation constraints, CPI safety
- **Audit timeline:** ~2 weeks against frozen IDL; aggressive but feasible for the scope
- **Audit deliverable:** signed report linked from README; final report cites `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json` by file path
- **Findings policy:** zero Critical, zero High accepted before mainnet deploy; all Informational findings tracked as GitHub issues with mitigation status
- **Pre-audit hardening:** `cargo deny`, `cargo audit`, `cargo clippy --all-targets`, Anchor `verifiable-build`, all dependencies pinned to exact versions in `Cargo.lock`

### SDK & Developer-Tool Surface

**Language matrix**

| Language | Crate / Package | Source of truth |
|---|---|---|
| TypeScript | `@susu/sdk` | Anchor IDL → Codama codegen → `@solana/kit`-based fluent client |
| Rust | `susu-client` | Anchor IDL → matching codegen → idiomatic Rust client |

**Installation methods**

- TypeScript: `pnpm add @susu/sdk` (or npm/yarn), peer dep `@solana/kit`
- Rust: `cargo add susu-client`, peer dep `solana-program`, `anchor-lang`
- Both published to public registries from CI on tagged releases

**API surface (illustrative, full surface in Architecture phase)**

```ts
// TypeScript
import { createSusuClient, createGroup, contribute, claimPayout, queryHistory } from '@susu/sdk';

const client = createSusuClient()
  .use(signer(mySigner))
  .use(solanaDevnetRpc({ rpcUrl: process.env.HELIUS_RPC }));

const group = await createGroup(client, { members, contribution, mint: USDC });
await contribute(client, { group, amount });
const payout = await claimPayout(client, { group, rotation: 3 });
const history = await queryHistory(client, { wallet });
```

**CI parity check**

- Every PR runs a CI job that regenerates both clients from `programs/susu/idl/susu.json` and asserts that the public API surface (instruction names, account structs, error codes) is identical between TS and Rust. Divergence fails CI.

**Documentation surface**

- `README.md` — root, scan-optimized, badges
- `docs/quickstart.md` — developer's first 60 seconds
- `docs/sdk-typescript.md` — TS SDK API reference
- `docs/sdk-rust.md` — Rust crate API reference
- `docs/collateral-curve.md` — formal write-up
- `docs/threat-model.md` — security posture
- `docs/fincen-cvc-framing.md` — regulatory framing
- `docs/composability-diagram.svg` — visual map
- `docs/integration-{squads,privy,token-extensions}.md` — partner integration guides
- `examples/with-{squads,privy,token-extensions}/README.md` — runnable example READMEs
- `apps/reference/README.md` — reference app local-dev guide

**Code examples**

- Each example repo (`examples/with-squads`, `examples/with-privy`, `examples/with-token-extensions`) is ~200 LOC, runnable end-to-end with one command, has its own README, ships its own minimal devnet config

**Migration guide (none for v0.1.0; required at v0.2.0+)**

- v0.1.0 is the foundation release; no prior version to migrate from
- Subsequent releases (v0.2.0+) ship a migration guide if the public SDK surface changes; semver-strict

### Skipped Sections (per CSV `skip_sections`)

- **Traditional auth** — N/A; Susu is non-custodial, signing is via Wallet Standard / Privy
- **Centralized DB** — N/A; protocol layer is fully on-chain; reference app's Convex layer is for non-PII metadata only and is documented as optional/replaceable
- **Visual design system at protocol-tool level** — reference app inherits shadcn/ui + Tailwind; no protocol-level visual system needed
- **Store compliance** — Susu is not a mobile app store submission; web-only

### Implementation Considerations

- **IDL freeze on Day 1.** `IDL_FREEZE.md` committed at T+0 with the SHA-256 of `programs/susu/idl/susu.json`. Audit, SDKs, reference app, and examples all proceed against the frozen artifact. Any pre-audit IDL change requires a re-freeze commit and a public log entry justifying the change.
- **Verifiable builds.** Anchor `verifiable-build` enabled; Docker-reproducible build pipeline so the deployed program byte-matches the source.
- **CI matrix.** Run on every PR: `anchor build`, `anchor test` (LiteSVM + Mollusk fixtures), `cargo test --workspace`, `pnpm test` (TS SDK + reference app), TypeScript-Rust SDK parity check, IDL hash consistency check, `pnpm susu:demo` 60s smoke test (against a Surfpool fork), `cargo run --bin susu-adversary -- --circles 1000` (smoke version, full 10K runs nightly).
- **Reproducible adversary artifact.** `audits/adversary/adversary-report.json` committed and is byte-reproducible from the tagged release commit SHA via `cargo run --bin susu-adversary -- --circles 10000 --seed $COMMIT_SHA`.
- **Untrusted on-chain data discipline.** Per solana-dev guardrails: every account deserialization validates owner, length, and discriminator. Memo fields and any string-typed account data are treated as adversarial input; never used in formatting, logging, or downstream calls without sanitization.

## Project Scoping & Phased Development

The user's input documents (product brief + brainstorming session) explicitly define phased delivery: **MVP (v0.1.0 submission, 4-week window)** → **Growth (T+4w to T+24w)** → **Vision (T+24w+)**. The Product Scope section above (Success Criteria) enumerates the feature set per phase. This section captures the strategic frame, the must-have/nice-to-have decision logic, and contingency cuts under resource pressure.

### MVP Strategy & Philosophy

**MVP Approach:** *Platform MVP* (per the standard taxonomy) — Susu's MVP is a primitive that downstream developers consume, not a consumer-facing product validated against end-user love. The MVP is "validated" when:

1. A judge can score it against Section 8 criteria in <30 seconds and arrive at "this is canonical Public Goods infrastructure."
2. A forking developer can clone, run, and integrate it in <1 afternoon.
3. An auditor can sign off on the curve invariant + permissionless claim semantics in 2 weeks.

**Resource requirements:** Solo entrant (Andre Exilien). External dependencies: 1 audit firm engaged Day 1; 1 crypto-native law firm engaged Day 1 with narrow scope; 1+ community translators per language sourced via direct outreach.

**Phasing rationale:** the brief and brainstorming explicitly request three phases. The 4-week window is a hard binding constraint; growth/vision items that have external dependencies on community uptake (3rd-party forks, partner integrations citing Susu, foundation grants) cannot be compressed into the submission window without forfeiting validity.

### Must-Have vs Nice-to-Have within MVP (v0.1.0)

The MVP feature list in Product Scope is dense. Within MVP, items are tiered to handle contingency:

#### MVP must-have (v0.1.0 ship-gates — non-negotiable)

| Item | Why non-negotiable |
|---|---|
| Anchor program with curve, slashing, permissionless claim, USDC/USDT | The protocol IS the submission |
| `tests/invariants/no_strategic_default.rs` (≥10K proptest cases) passing | The Curve Invariant — the PRD spine |
| `susu-adversary` 10K-case artifact + JSON committed | The reproducibility claim that makes the spine survive 30s of judge scrutiny |
| `docs/collateral-curve.md` with formal write-up + proof sketch | The legible novelty surface — judges and auditors verify the math |
| Devnet deployment with program ID surfaced in README | Ships against actual cluster, not just localhost |
| TS SDK (`@susu/sdk`) | Without it, integrators have only the IDL — too high friction for JTBD #1 |
| Reference app with at least one runnable skin + English baseline + `pnpm susu:demo` ≤60s | JTBD #1 (Aisha) and Journey #4 (Linh) require it |
| MIT license + public from commit zero | Public Goods category fit |
| Daily `/log` entries unbroken from T+0 | "Building in public" credibility |

#### MVP nice-to-have (v0.1.0 ship-target, contingency-cuttable if calendar slips)

| Item | Cut order (1 = cut first) | Cut consequence |
|---|---|---|
| Rust client crate (`susu-client`) | 4 | Ships in v0.1.1 if not ready by submission close — TS SDK alone covers JTBD #1; Rust crate is for backend integrators (smaller audience for the submission) |
| Dual-skin reference app (both skins both runnable) | 3 | Ships diaspora skin only if neutral skin not ready; loses some "fork-readiness signal" but doesn't kill submission |
| 5 i18n locales live | 2 | Cut to English + Vietnamese (the founder-narrative locale) only — meets the "minimum bar English + 1" clause from brief |
| 3 composability examples ALL runnable | 1 | Cut to 1 example (`with-privy`, per Journey #1 dependency) if 4-week constraint binds — Squads and Token Extensions examples ship in v0.2 |
| `legal-opinion.pdf` published at submission close | DO NOT CUT | Material to the FinCEN posture; if firm slips, ship at whatever scope they have signed by deadline (even partial) |
| 60-second demo video embedded in README | DO NOT CUT | The 60s video is the judge's first-touch artifact |
| ≥1 ecosystem partner public reference | 5 | If no partner confirms by deadline, ship without — reduces tertiary success metric but doesn't kill submission |

If the calendar slips dramatically (T+3w status check shows >25% of must-haves at risk), cut nice-to-haves in order 1→5 above. Document each cut in `docs/cut-list-v0.1.0.md` with reasoning so the cut narrative is itself a "building-in-public" artifact.

**⚠️ Scope-change confirmation gate.** Andre — none of the items above are silently re-scoped. The contingency-cut list is a *plan*, not an execution. If a real cut becomes necessary at T+3w status, that's a checkpoint conversation, not a unilateral move.

### Phased Roadmap

Per the brief's submission strategy and brainstorming pick, phases are committed:

#### Phase 1 — MVP (v0.1.0, T+0 to T+4w)

Per "Product Scope → MVP" section above. Submission ship.

#### Phase 2 — Growth (T+4w to T+24w)

Post-submission, pre-grant cycle. Includes:

- All 5 i18n locales live with community translators
- Mainnet deploy + immutability gate fired (upgrade authority burned, IDL hash frozen)
- `npx create-susu-app` scaffolder
- 3rd-party fork ecosystem nurturing
- Solana Foundation grant cycle application (T+12w)
- Composability stress-test repo (5-primitive demo)
- Additional `/examples` integrations (Phantom, Backpack, Helius webhooks, Sphere on-ramp deep flow)
- Curve simulator web demo (interactive parameter exploration)
- Rust client crate (`susu-client`) if not shipped in MVP
- `with-squads` and `with-token-extensions` examples if cut from MVP

#### Phase 3 — Vision (T+24w+)

Per "Product Scope → Vision" section above. Token Extensions confidential reputation v2, multi-stablecoin support, cross-language reference implementations, ≥3 consumer apps in production, Solana Foundation primitive listing, optional Foundation governance treasury (only if real adoption emerges).

### Risk Mitigation Strategy

**Technical risks**

- Curve flaw or strategic-default vector unfound by audit/sim → 10K-case property test + 10K-case adversarial sim + formal proof sketch + audit firm independent reproduction; "30% Cartel" headline test as named falsification target. Errata path documented (`docs/collateral-curve-errata.md`) if a flaw is found post-ship.
- Audit firm slips schedule → submission ships against devnet with `audit-pending` badge; mainnet deploy waits for audit sign-off (no mainnet without audit).
- Compute-budget overrun on curve calculation → curve is O(n) closed-form, n ∈ [3, 12] bounded — worst-case CU is bounded; CI test enforces per-instruction CU ≤200K.
- IDL change requested mid-window → re-freeze commit + public log entry + re-issue to audit/SDK pipeline. Cost: at least 3 days lost. Mitigation: aggressive Day-1 freeze discipline.

**Market risks**

- Frontier judges don't recognize ROSCA category → README first viewport carries "73 countries, $100B+ flow" framing; brief's 4-prior-PG-winners pattern-match is mirrored in submission narrative.
- "No fees, no revenue" weakens Business Plan score → explicit sustainability framing in brief + PRD: grants + accelerator + future front-end optionality, not user-fee revenue.
- Composability claims look hollow → 3 runnable example repos ship; 1+ partner reference confirmed before submission close.
- Competing hackathon submission solves strategic default first → defensibility is in the audit + immutability + reproducibility — competing teams cannot cheaply replicate the audited Anchor + 10K-case adversary report + frozen IDL surface in 4 weeks.

**Resource risks**

- Solo entrant burns out under 4-week pressure → daily `/log` is light-touch (notes, not essays); contingency-cut list pre-defined; party-mode-style review at T+2w mid-window status.
- External dependencies (audit, legal, translators) slip → all engaged Day 1; narrow-scope mandates compress turnaround; whatever scope is signed by submission close ships as an appendix; missing items move to Phase 2.
- Helius/Privy/Sphere/Squads outages during the demo → reference app degrades gracefully (wallet-extension fallback for Privy; public RPC fallback for Helius; Sphere is optional-flag, not on demo path; Squads is example-only, not on demo path).

**Acceptance gates between phases**

- MVP → Growth gate: submission shipped + judges' scoring complete (Public Goods Award outcome known).
- Growth → Vision gate: Mainnet deployed + immutability gate fired + ≥1 third-party fork observed + Solana Foundation grant cycle status known.

## Functional Requirements

This section is **the capability contract** for Susu Protocol. Every UX decision, architectural decision, epic, and story downstream must trace to one or more FRs below. A capability not listed here will not exist in v0.1.0 unless explicitly added. FRs are implementation-agnostic — they specify WHAT, not HOW.

Actors: **Group Creator**, **Group Member**, **Forking Developer**, **Integrator** (Solana developer using SDK from a separate codebase), **Auditor**, **Judge**, **Translator**, **Reference-App End-Saver**, **Susu Maintainer** (Andre + future contributors).

### Group Lifecycle Management

- **FR1:** A Group Creator can create a savings-circle group on-chain by specifying member count (`n` ∈ [3, 12]), contribution amount, contribution period, stablecoin mint (USDC or USDT), and curve parameters.
- **FR2:** A Group Creator can invite specified members to a group via an invite mechanism that does not require off-chain centralized infrastructure.
- **FR3:** A Group Member can accept a group invitation and assume their assigned rotation slot.
- **FR4:** The protocol enforces that a group cannot start contributions until all `n` members have accepted and posted required initial collateral per the curve.
- **FR5:** A Group Creator can cancel a group prior to contribution start, returning any posted collateral to members.
- **FR6:** A Group Member can query the full state of any group they are a member of (rotation schedule, member roster, contribution history, collateral posted, slash status).
- **FR7:** Anyone can publicly query the participation history (groups joined, rotations completed, defaults) of any wallet.

### Contributions & Collateral

- **FR8:** A Group Member can post a scheduled contribution within the contribution-period window for an active group.
- **FR9:** The protocol calculates required collateral for each member at each rotation slot using the dynamic-collateral curve, parameterized by circle size, contribution amount, and stablecoin denomination.
- **FR10:** A Group Member must post the curve-determined collateral before being assigned a rotation slot; rotation assignment is rejected on insufficient collateral.
- **FR11:** A Group Member can top up collateral mid-rotation if curve parameters change due to a member dropout (subject to slashing rules).
- **FR12:** The protocol slashes a Group Member's collateral when they fail to contribute within the contribution-period grace window, distributing the slashed amount to honest members per the slashing rule documented in `docs/collateral-curve.md`.
- **FR13:** A Group Member can withdraw their unslashed collateral after the group's final rotation completes.
- **FR14:** The protocol holds all contributions and collateral in deterministic PDA-derived vault accounts owned only by the Susu program — never by user-supplied keys or protocol-team keys.

### Rotations & Permissionless Payouts

- **FR15:** The protocol assigns rotation slots to members at group start using a deterministic, on-chain reproducible algorithm (specific algorithm chosen during Architecture phase; FR locks the property of determinism, not the algorithm).
- **FR16:** A Group Member designated as the recipient of rotation `i` can claim the rotation `i` payout permissionlessly via a single instruction call, after rotation `i`'s contribution-period closes.
- **FR17:** The protocol rejects payout-claim instructions submitted by any wallet other than the rotation-`i` recipient.
- **FR18:** The protocol rejects payout-claim instructions before rotation `i`'s contribution-period closes.
- **FR19:** The protocol rejects double-claim attempts on the same rotation.
- **FR20:** The protocol does not depend on any scheduled-execution infrastructure (keeper network, off-chain cron, Chainlink Automation, etc.) to trigger payouts; all triggers are on-chain pull-based.

### Curve Verification & Audit Artifacts

- **FR21:** The repository includes an executable property test (`tests/invariants/no_strategic_default.rs`) that runs ≥10,000 randomized cases proving `expected_default_payoff(i, curve) < 0` for every rotation slot `i ∈ [0, n)` across the supported parameter space.
- **FR22:** The repository includes an adversarial multi-agent simulation binary (`susu-adversary`) reproducible with `cargo run --bin susu-adversary -- --circles 10000 --seed $COMMIT_SHA`, that produces `audits/adversary/adversary-report.json` with `max_defector_profit_lamports: 0` across all rotation positions for circle sizes {3, 5, 7, 10, 12}.
- **FR23:** The repository names the "30% Cartel" scenario as the headline adversarial test: a 10-member circle where members 4–6 collude and default simultaneously after member 3's payout — assertion: honest members are made whole from collateral, defectors net negative, no admin intervention.
- **FR24:** The repository includes a formal write-up of the dynamic-collateral curve at `docs/collateral-curve.md` containing closed-form formula, derivation, worked examples, proof sketch, and references to FR21/FR22 by file path.
- **FR25:** The repository includes a threat-model document at `docs/threat-model.md` enumerating adversary models, attack surfaces, and mitigations for each.
- **FR26:** The repository includes a FinCEN 2019 CVC framing document at `docs/fincen-cvc-framing.md` explaining the non-custodial / non-fee / non-yield posture.
- **FR27:** The repository publishes a public legal opinion letter at `docs/legal-opinion.pdf` from a crypto-native law firm by submission close — at whatever scope the firm has signed by deadline.

### IDL Freeze & Immutability

- **FR28:** The repository commits an `IDL_FREEZE.md` file at T+0 containing the SHA-256 hash of `programs/susu/idl/susu.json` and the date of freeze.
- **FR29:** The CI pipeline asserts on every PR that `programs/susu/idl/susu.json` SHA-256 matches the hash recorded in `IDL_FREEZE.md`; mismatch fails CI.
- **FR30:** Post-audit, the mainnet program's upgrade authority is set to the System Program incinerator address (`1nc1nerator11111111111111111111111111111111`), and the SHA-256 of the deployed IDL matches the tagged release IDL hash. CI assertion via `solana program show` and IDL hash diff.

### Developer Integration Surface (SDKs, Examples, Documentation)

- **FR31:** A TypeScript SDK package `@susu/sdk` is published to npm and exposes idiomatic helpers for every public protocol instruction (group create, member accept, contribute, claim payout, query history, top up collateral, withdraw collateral, cancel group).
- **FR32:** A Rust client crate `susu-client` is published to crates.io exposing the same public instruction surface as `@susu/sdk`. *(MVP nice-to-have: cuttable to v0.1.1 per scoping section.)*
- **FR33:** A CI parity check on every PR asserts that `@susu/sdk` and `susu-client` expose the identical instruction surface, account decoders, and error codes; divergence fails CI.
- **FR34:** The SDK exposes a transaction-simulation parameter (default `true`) that runs `simulateTransaction` before requesting a signature for any state-changing instruction.
- **FR35:** The SDK requires explicit `cluster: 'mainnet-beta'` to be passed for mainnet sends; no implicit mainnet sends.
- **FR36:** Three composability example repos exist at `examples/with-squads`, `examples/with-privy`, `examples/with-token-extensions`; each is runnable end-to-end with a single documented command, ~200 LOC, and includes its own README. *(MVP cuttable to 1 example minimum per scoping section.)*
- **FR37:** A Forking Developer can clone `susu-monorepo` and run `pnpm susu:demo` to execute a complete mock ROSCA cycle (create → join → contribute → rotate → payout) against devnet in ≤60 seconds of wall-clock time. CI verifies this on every main-branch commit.
- **FR38:** Each integration partner has a corresponding `docs/integration-{partner}.md` document explaining the integration pattern.

### Reference App User Experience

- **FR39:** A Reference-App End-Saver can create or join a group from the reference app via a Privy embedded wallet (email-based onboarding) without holding a seed phrase or installing a wallet extension.
- **FR40:** A Reference-App End-Saver can post a scheduled contribution from the reference app with one tap, after viewing transaction summary (recipient, amount, token, fee payer, cluster) and explicitly confirming.
- **FR41:** A Reference-App End-Saver can claim their rotation payout from the reference app permissionlessly with one tap, after viewing transaction summary and confirming.
- **FR42:** The reference app supports two visual skins (diaspora skin + brand-neutral skin) toggleable via a single env or config flag, both runnable from the same codebase. *(Cuttable to single skin under MVP contingency; see scoping section.)*
- **FR43:** The reference app supports multiple locale bundles (English baseline + Vietnamese live in MVP minimum; ar / es / yo / ht-kreyol stubs committed); locale selection is a runtime UI control.
- **FR44:** The reference app supports an optional Sphere fiat on-ramp flag — disabled by default in the demo happy-path, enableable for forks that need it.
- **FR45:** The reference app falls back gracefully to public Solana RPC if the configured Helius RPC URL is unreachable, with a UI banner indicating degraded performance.
- **FR46:** The reference app falls back to Wallet-Standard browser-extension wallets (Phantom, Backpack, Solflare) if Privy embedded-wallet onboarding is unavailable.
- **FR47:** The reference app surfaces the active Solana cluster (`devnet` / `mainnet-beta`) prominently in the UI; transactions cannot be sent unless the cluster is explicitly confirmed.

### Community Contribution & i18n Surface

- **FR48:** A Translator can find a `CONTRIBUTING-TRANSLATIONS.md` document explaining the i18n bundle structure, locale stub layout, string list, style guide, and PR process.
- **FR49:** A Translator can populate a locale stub by editing `apps/reference/i18n/{locale}.json` (or equivalent) and submitting a PR.
- **FR50:** The CI pipeline asserts that every locale bundle has all keys present in the English baseline; missing keys fail the build.
- **FR51:** A Forking Developer can find a `CONTRIBUTING.md` document explaining the contribution flow, first-issue tags, and CODEOWNERS structure.

### Submission & Marketing Surface

- **FR52:** The README's first viewport contains: project name, one-line description, audit badge linked to the audit report, MIT license badge, devnet/mainnet status badges, embedded 60-second demo video, fork-me CTA, "10,000 adversarial circles passed" badge, "Upgrade authority: burned" badge (post-audit).
- **FR53:** The README links directly to `docs/collateral-curve.md`, `audits/adversary/adversary-report.json`, `docs/legal-opinion.pdf`, the most recent `/log` entry, and at least one ecosystem partner's reference page (when published).
- **FR54:** A 60-90 second demo video is embedded in the README showing: rotating-money animation → curve explainer → integration code shown live → fork-me CTA. Both reference-app skins are visible briefly.
- **FR55:** The repository contains a `/log/YYYY-MM-DD.md` daily engineering-log entry from T+0 to submission close, unbroken.

### Auditor & Judge Reproducibility Surface

- **FR56:** An Auditor or Judge can reproduce all key claims (`pnpm susu:demo` 60s smoke, `cargo run --bin susu-adversary` 10K artifact, `anchor test` full suite, IDL hash check, immutability check) on a clean machine in <10 minutes via `git clone && pnpm install && pnpm verify`.
- **FR57:** The audit firm's report is published at `audits/firm-name-YYYY-MM.pdf` and explicitly cites `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json` by file path.
- **FR58:** The repository's CI workflow files (`/.github/workflows/`) are public and re-runnable by anyone who forks the repo, demonstrating that all checks run identically on third-party machines.

## Non-Functional Requirements

NFRs specify HOW WELL Susu must perform. Categories included only where they materially apply.

### Performance

- **NFR-P1 (Protocol compute budget):** Every protocol instruction handler completes within ≤200,000 compute units nominal on Solana mainnet. Curve calculation is closed-form O(n) where `n ∈ [3, 12]`, bounding worst-case CU.
- **NFR-P2 (Reference app demo latency):** `pnpm susu:demo` executes the complete create → join → contribute → rotate → payout cycle against devnet in ≤60 seconds wall-clock on a clean clone, verified by CI on every main-branch commit.
- **NFR-P3 (Reference app transaction confirmation UX):** From user "Confirm" tap to confirmed transaction visible in UI: ≤3 seconds median on devnet, ≤5 seconds p95, leveraging Solana's sub-second finality.
- **NFR-P4 (Property test execution time):** `cargo test --test no_strategic_default` (≥10K proptest cases) completes in ≤180 seconds on a 4-core developer laptop.
- **NFR-P5 (Adversary simulation execution time):** `cargo run --bin susu-adversary -- --circles 10000 --seed $COMMIT_SHA` completes in ≤10 minutes on a 4-core developer laptop.
- **NFR-P6 (Full reproducibility window):** A clean clone of the repository to all key claims verified via `pnpm verify` completes in ≤10 minutes wall-clock on a 4-core developer laptop with stable Helius RPC.
- **NFR-P7 (Reference app initial load):** Time-to-interactive on a 4G mobile connection ≤3 seconds for the reference app's "join group" landing page.

### Security

- **NFR-S1 (Audit gating):** No mainnet deploy occurs before a crypto-native audit firm's report is published showing zero Critical findings, zero High findings.
- **NFR-S2 (Anchor safety):** All Anchor account-validation constraints (`#[account(...)]`) are explicit and audit-cited. No unsafe arithmetic; checked math everywhere; saturating math forbidden in the curve calculation.
- **NFR-S3 (Dependency hygiene):** `cargo deny` and `cargo audit` pass on every CI run; all dependencies pinned to exact versions in `Cargo.lock` and `pnpm-lock.yaml`.
- **NFR-S4 (Verifiable build):** Anchor `verifiable-build` enabled; the deployed program byte-matches a Docker-reproducible build from the source.
- **NFR-S5 (Immutability):** Post-audit, the upgrade authority is set to the System Program incinerator and the IDL hash is frozen; CI assertion verifies both on every main-branch commit.
- **NFR-S6 (No private-key handling):** No code path reads, stores, or transmits seed phrases, mnemonics, or keypair files. Wallet-Standard signing is the sole signing surface.
- **NFR-S7 (Transaction simulation before signing):** All state-changing transactions simulate via `simulateTransaction` and surface the result before requesting a signature.
- **NFR-S8 (Cluster discipline):** SDK refuses to send mainnet transactions unless `cluster: 'mainnet-beta'` is explicitly passed; no implicit mainnet sends.
- **NFR-S9 (Untrusted on-chain data):** Every account deserialization validates owner, length, and discriminator. Memo fields and string-typed account data are treated as adversarial input — never used in formatting, logging, or downstream calls without sanitization.
- **NFR-S10 (Threat model published):** `docs/threat-model.md` enumerates adversary models, attack surfaces, mitigations, and residual risks.

### Reliability & Availability

- **NFR-R1 (RPC fallback):** Reference app falls back to public Solana RPC if the configured Helius RPC URL is unreachable, surfacing a UI banner indicating degraded state.
- **NFR-R2 (Wallet fallback):** Reference app falls back to Wallet-Standard browser-extension wallets if Privy embedded-wallet onboarding is unavailable.
- **NFR-R3 (Sphere optional):** Sphere fiat on-ramp is an optional flag, not on the demo happy-path; reference app fully functional without Sphere.
- **NFR-R4 (Devnet/mainnet status surfacing):** Reference app and README both surface the active cluster and the program's deployment status (e.g., `devnet: deployed`, `mainnet: pending audit`).
- **NFR-R5 (Daily log unbroken):** Engineering log entries are committed daily from T+0 to submission close — no skipped days. A skipped day is documented in the next entry as a deliberate exception with reason.

### Accessibility & Internationalization

- **NFR-A1 (Locale parity):** Every locale bundle has all keys present in the English baseline; CI fails on missing keys.
- **NFR-A2 (Locale minimum):** MVP ships English baseline + Vietnamese fully populated; ar / es / yo / ht-kreyol stubs committed with `CONTRIBUTING-TRANSLATIONS.md` flow open.
- **NFR-A3 (RTL readiness):** The reference app's CSS and layout primitives support right-to-left rendering for the Arabic locale stub (no hardcoded `left`/`right` direction assumptions).
- **NFR-A4 (Mobile-first reference app):** Reference app is fully usable on a 360px-wide viewport (small Android handset baseline). All key interactions (create, join, contribute, claim) work without horizontal scroll.
- **NFR-A5 (WCAG 2.1 AA target):** Reference app targets WCAG 2.1 AA conformance for color contrast, keyboard navigation, and screen-reader semantics. Not a release-gate for MVP; documented as a v0.2 target with key violations triaged.
- **NFR-A6 (Embedded wallet onboarding for non-crypto users):** A user without prior crypto experience can complete the create-or-join flow via Privy email-based embedded wallet without seed-phrase or wallet-extension knowledge.

### Integration

- **NFR-I1 (USDC + USDT support):** Both USDC and USDT mints supported at the protocol layer with identical instruction surface; SDK exposes both as first-class options.
- **NFR-I2 (Squads composability):** A Squads multisig can serve as the `Group Creator` for a Susu group; demonstrated end-to-end in `examples/with-squads`.
- **NFR-I3 (Privy composability):** A Privy embedded wallet can serve as a `Group Member`'s signer; demonstrated end-to-end in `examples/with-privy`.
- **NFR-I4 (Token Extensions composability):** A `Token-2022` mint can be used in Susu where SPL Token would be used (same protocol surface); demonstrated in `examples/with-token-extensions` along with v2 confidential-reputation roadmap.
- **NFR-I5 (Helius RPC compatibility):** SDK accepts any Solana RPC URL and is not Helius-locked; defaults to Helius for known-good performance.
- **NFR-I6 (Sphere on-ramp/off-ramp):** Reference app supports Sphere fiat on-ramp (USD → USDC) and off-ramp (USDC → USD) when the Sphere flag is enabled.
- **NFR-I7 (web3-compat boundary):** `@solana/web3-compat` is the only adapter point where legacy `@solana/web3.js` types may appear in the codebase; all primary code paths use `@solana/kit` types.

### Reproducibility (Susu-specific)

- **NFR-Re1 (Deterministic adversary artifact):** `audits/adversary/adversary-report.json` is byte-reproducible from any tagged release commit SHA via `cargo run --bin susu-adversary -- --circles 10000 --seed $COMMIT_SHA`.
- **NFR-Re2 (Deterministic IDL):** `programs/susu/idl/susu.json` is byte-reproducible from `anchor build` against a pinned toolchain.
- **NFR-Re3 (Verified build pipeline):** Docker-based reproducible build pipeline in CI; deployed binary byte-matches build output.
- **NFR-Re4 (One-command verify):** `pnpm verify` runs the full claim-verification suite (60s demo, 10K adversary, anchor test, IDL hash check, immutability check post-audit) on a clean clone in ≤10 minutes.

### Observability

- **NFR-O1 (Daily engineering log):** `/log/YYYY-MM-DD.md` entries from T+0 onwards capture daily progress, blockers, and decisions. Light-touch (notes, not essays).
- **NFR-O2 (CI surfacing):** README displays current CI status badge; failed CI runs are publicly visible.
- **NFR-O3 (Deployment status):** README surfaces current devnet program ID, mainnet program ID (post-audit), audit firm + report link, and audit status badge.

### Compliance

Cross-references the Domain-Specific Requirements section above. Compliance NFRs:

- **NFR-C1 (FinCEN posture preserved):** No instruction handler or reference-app code path takes custody of user funds, charges a protocol fee, or routes contributions/collateral to a yield-generating venue. CI test asserts no protocol-owned token accounts exist.
- **NFR-C2 (Legal opinion published):** `docs/legal-opinion.pdf` from a crypto-native law firm is committed by submission close at whatever scope the firm has signed (narrow scope acceptable; broader scope post-submission).
- **NFR-C3 (No tokenization, no governance token):** v0.1.0 ships no protocol token, no tokenized governance, no airdrop. Future feature additions in this category require legal review and PRD revision.
- **NFR-C4 (PII minimization):** Protocol layer stores zero PII (only on-chain pseudonymous wallet addresses and amounts). Reference app's Convex layer commits to GDPR Article 17 erasure-on-request and minimal collection.

## Design Principles & Tone

The PRD locks acceptance bars; this section locks the *qualitative posture* that the brainstorming session committed to but does not fit cleanly into FR/NFR format. These principles inform every doc, every README, every demo, and every public-facing surface.

### Inspirational lineage

Susu's developer surface deliberately remixes proven patterns from prior primitives:

- **Stripe** for SDK ergonomics — idiomatic helpers, sensible defaults, explicit-when-it-matters parameters, error messages that link to docs.
- **Vercel** for documentation UX — first-viewport scan-optimization, copy-pasteable code blocks, runnable demos one click from the README.
- **Squads** for README structure — clear protocol/SDK/examples separation, audit/license badges above the fold, ecosystem partner references prominent.
- **Anchor** for repository conventions — judges and auditors already navigate Anchor projects; mirror the directory layout they expect rather than inventing a new one.
- **SQLite** for testing posture — test count as marketing; the 10K-case adversary report is Susu's analog of SQLite's coverage flex.

### Founder voice in public artifacts

- **Authorial honesty over corporate polish.** Daily `/log` entries are notes, not essays — the personality is "engineer thinking in public," not "marketing pretending to be technical."
- **Heritage acknowledged, never instrumentalized.** Diaspora-savings-circle origin is the founder's voice in the reference app's diaspora skin; the protocol layer is silent about heritage and speaks only as universal infrastructure.
- **Demo-video opener tone.** The 60-second demo's voiceover or title-card opens with disarming plain-English framing — for example: *"Your grandma's savings circle, on a blockchain, with the math worked out this time."* This is intentional — it disarms judges (signals heritage authenticity) AND signals math-rigor (the curve write-up is one click away). Don't over-polish into corporate-marketing tone.
- **Brevity over comprehensiveness in public-facing surfaces.** README first viewport carries dense, scannable signals; long-form context lives in `docs/`. Judges with 30 seconds get the headline; auditors with 30 minutes get the formal write-up.

### Documentation-quality bar

- Every public document carries a `## TL;DR` first section.
- Every code example in docs is runnable end-to-end from a clean clone — no "imagine you have..." pseudo-code.
- Every claim that asserts a property of the protocol or curve links to the specific test file or proof that verifies it.
- Diagrams are Mermaid or SVG, not screenshots of whiteboards.

### Anti-patterns to avoid (engineered inverse from the brainstorming "anti-solution" pass)

- ❌ Hidden audit findings — link the report from the README badge.
- ❌ Private repo until submission — public from commit zero, daily commits visible.
- ❌ Marketing-only novelty claims — every novelty claim has an executable verification.
- ❌ Generic Solana-protocol README — Susu's README mirrors Squads/Anchor structure judges already navigate.
- ❌ Composability claims without runnable proof — every partner integration ships a runnable example.
- ❌ Multi-hour daily-log essays — light-touch notes, not narrative posts.
