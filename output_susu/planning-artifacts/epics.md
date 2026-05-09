---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories']
inputDocuments:
  - 'output_susu/planning-artifacts/prd.md'
  - 'output_susu/planning-artifacts/architecture.md'
  - 'output_susu/planning-artifacts/ux-design-specification.md'
workflowType: 'epics-and-stories'
project_name: 'Susu Protocol'
author: 'Andre Exilien'
date: '2026-05-06'
mode: 'YOLO single-pick'
prdSpine: 'The Curve Invariant — every epic and story inherits this acceptance bar'
---

# Susu Protocol - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Susu Protocol, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories for the 4-week submission window (T+0 to T+4w → Frontier Public Goods Award).

Every epic and story inherits the **Curve Invariant** PRD spine: no rational defector profits at any rotation position under the dynamic-collateral curve, codified as (a) a 10K-case property test, (b) a 10K-case adversarial simulation artifact, (c) post-audit immutability gate.

## Requirements Inventory

### Functional Requirements

**Group Lifecycle Management**
- FR1: Group Creator can create a savings-circle group on-chain with member count n ∈ [3, 12], contribution amount, contribution period, USDC/USDT mint, curve parameters
- FR2: Group Creator can invite members via on-chain-only invite mechanism (no off-chain centralized infra)
- FR3: Group Member can accept invitation and assume assigned rotation slot
- FR4: Protocol enforces group cannot start contributions until all n members have accepted and posted required initial collateral per the curve
- FR5: Group Creator can cancel group prior to contribution start, returning posted collateral
- FR6: Group Member can query full state of any group they are a member of (rotation schedule, roster, contribution history, collateral, slash status)
- FR7: Anyone can publicly query participation history (groups joined, rotations completed, defaults) of any wallet

**Contributions & Collateral**
- FR8: Group Member can post scheduled contribution within contribution-period window
- FR9: Protocol calculates required collateral at each rotation slot using dynamic-collateral curve (parameterized by n, contribution amount, stablecoin denomination)
- FR10: Group Member must post curve-determined collateral before rotation slot assignment; rotation rejected on insufficient collateral
- FR11: Group Member can top up collateral mid-rotation if curve parameters change due to a member dropout
- FR12: Protocol slashes Group Member's collateral when they fail to contribute within grace window, distributing slashed amount to honest members per documented slashing rule
- FR13: Group Member can withdraw unslashed collateral after group's final rotation completes
- FR14: Protocol holds all contributions and collateral in deterministic PDA-derived vault accounts owned only by the Susu program

**Rotations & Permissionless Payouts**
- FR15: Protocol assigns rotation slots at group start using a deterministic, on-chain-reproducible algorithm
- FR16: Designated recipient of rotation i can claim payout permissionlessly via single instruction call after rotation i's contribution period closes
- FR17: Protocol rejects payout-claim instructions submitted by any wallet other than the rotation-i recipient
- FR18: Protocol rejects payout-claim instructions before rotation i's contribution period closes
- FR19: Protocol rejects double-claim attempts on the same rotation
- FR20: Protocol does not depend on any scheduled-execution infrastructure (keeper, off-chain cron, Chainlink Automation); all triggers are on-chain pull-based

**Curve Verification & Audit Artifacts**
- FR21: Repository includes executable property test (`tests/invariants/no_strategic_default.rs`) running ≥10,000 randomized cases proving expected_default_payoff(i, curve) < 0 for every rotation slot
- FR22: Repository includes adversarial multi-agent simulation binary (`susu-adversary`) reproducible with `cargo run --bin susu-adversary -- --circles 10000 --seed $COMMIT_SHA`, producing `audits/adversary/adversary-report.json` with `max_defector_profit_lamports: 0`
- FR23: Repository names the "30% Cartel" scenario as headline adversarial test (10-member circle, members 4–6 collude post-position-3-payout)
- FR24: Repository includes formal write-up at `docs/collateral-curve.md` (closed-form formula, derivation, worked examples, proof sketch, FR21/FR22 references)
- FR25: Repository includes threat-model document at `docs/threat-model.md` enumerating adversary models, attack surfaces, mitigations
- FR26: Repository includes FinCEN 2019 CVC framing document at `docs/fincen-cvc-framing.md`
- FR27: Repository publishes public legal opinion letter at `docs/legal-opinion.pdf` from a crypto-native law firm by submission close

**IDL Freeze & Immutability**
- FR28: Repository commits `IDL_FREEZE.md` at T+0 containing SHA-256 of `programs/susu/idl/susu.json` + freeze date
- FR29: CI asserts on every PR that IDL SHA-256 matches `IDL_FREEZE.md`; mismatch fails CI
- FR30: Post-audit, mainnet program's upgrade authority set to System Program incinerator (`1nc1nerator11111111111111111111111111111111`); IDL hash matches tagged release; CI assertion via `solana program show` and IDL hash diff

**Developer Integration Surface**
- FR31: TypeScript SDK package `@susu/sdk` published to npm exposing idiomatic helpers for every public protocol instruction
- FR32: Rust client crate `susu-client` published to crates.io exposing same public instruction surface (MVP nice-to-have, cuttable to v0.1.1)
- FR33: CI parity check on every PR asserting `@susu/sdk` and `susu-client` expose identical instruction surface, account decoders, error codes
- FR34: SDK exposes transaction-simulation parameter (default true) running `simulateTransaction` before any state-changing instruction signature
- FR35: SDK requires explicit `cluster: 'mainnet-beta'` for mainnet sends; no implicit mainnet
- FR36: Three composability example repos at `examples/with-{squads,privy,token-extensions}`; each runnable end-to-end with single command, ~200 LOC, own README (cuttable to 1 example minimum)
- FR37: Forking Developer can clone repo and run `pnpm susu:demo` executing complete mock ROSCA cycle against devnet in ≤60s; CI verifies on every main commit
- FR38: Each integration partner has corresponding `docs/integration-{partner}.md` document

**Reference App User Experience**
- FR39: Reference-App End-Saver can create or join group via Privy embedded wallet (email-based) without seed phrase or wallet extension
- FR40: Reference-App End-Saver can post scheduled contribution with one tap after viewing transaction summary (recipient, amount, token, fee payer, cluster) and confirming
- FR41: Reference-App End-Saver can claim rotation payout permissionlessly with one tap after viewing transaction summary
- FR42: Reference app supports two visual skins (diaspora + brand-neutral) toggleable via single env/config flag, both runnable from same codebase (cuttable to single skin)
- FR43: Reference app supports multiple locale bundles (English baseline + Vietnamese live in MVP; ar/es/yo/ht-kreyol stubs); locale selection is runtime UI control
- FR44: Reference app supports optional Sphere fiat on-ramp flag — disabled by default, enableable per fork
- FR45: Reference app falls back gracefully to public Solana RPC if Helius RPC unreachable, with UI banner indicating degraded performance
- FR46: Reference app falls back to Wallet-Standard browser-extension wallets (Phantom, Backpack, Solflare) if Privy unavailable
- FR47: Reference app surfaces active Solana cluster (devnet/mainnet-beta) prominently; transactions cannot send unless cluster confirmed

**Community Contribution & i18n Surface**
- FR48: Translator can find `CONTRIBUTING-TRANSLATIONS.md` explaining i18n bundle structure, locale stub layout, string list, style guide, PR process
- FR49: Translator can populate locale stub by editing `apps/reference/messages/{locale}.json` and submitting PR
- FR50: CI asserts every locale bundle has all keys present in English baseline; missing keys fail build
- FR51: Forking Developer can find `CONTRIBUTING.md` explaining contribution flow, first-issue tags, CODEOWNERS structure

**Submission & Marketing Surface**
- FR52: README first viewport contains: project name, one-line description, audit badge linked to report, MIT badge, devnet/mainnet status badges, embedded 60s demo video, fork-me CTA, "10,000 adversarial circles passed" badge, "Upgrade authority: burned" badge (post-audit)
- FR53: README links directly to `docs/collateral-curve.md`, `audits/adversary/adversary-report.json`, `docs/legal-opinion.pdf`, most recent `/log` entry, ≥1 ecosystem partner reference
- FR54: 60-90s demo video embedded in README showing rotating-money animation → curve explainer → integration code → fork-me CTA; both reference-app skins visible briefly
- FR55: Repository contains `/log/YYYY-MM-DD.md` daily engineering-log entries from T+0 to submission close, unbroken

**Auditor & Judge Reproducibility Surface**
- FR56: Auditor or Judge can reproduce all key claims (`pnpm susu:demo` 60s smoke, adversary 10K artifact, anchor test, IDL hash check, immutability check) on clean machine in <10 minutes via `git clone && pnpm install && pnpm verify`
- FR57: Audit firm's report published at `audits/firm-name-YYYY-MM.pdf` explicitly citing `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json` by file path
- FR58: Repository's CI workflow files (`.github/workflows/`) are public and re-runnable by anyone who forks the repo

### NonFunctional Requirements

**Performance**
- NFR-P1: Every protocol instruction handler ≤200,000 compute units nominal; curve closed-form O(n) where n ∈ [3, 12]
- NFR-P2: `pnpm susu:demo` executes complete ROSCA cycle against devnet in ≤60s wall-clock; CI verifies on every main commit
- NFR-P3: Reference app transaction confirmation UX: ≤3s median on devnet, ≤5s p95 (from "Confirm" tap to confirmed in UI)
- NFR-P4: `cargo test --test no_strategic_default` (≥10K proptest cases) ≤180s on 4-core developer laptop
- NFR-P5: `cargo run --bin susu-adversary -- --circles 10000` ≤10 minutes on 4-core developer laptop
- NFR-P6: Full reproducibility: clean clone to all key claims via `pnpm verify` ≤10 minutes
- NFR-P7: Reference app initial load: time-to-interactive on 4G mobile ≤3s for "join group" landing

**Security**
- NFR-S1: No mainnet deploy before crypto-native audit firm's report shows zero Critical, zero High findings
- NFR-S2: All Anchor account-validation constraints explicit and audit-cited; checked math everywhere; saturating math forbidden in curve
- NFR-S3: `cargo deny` and `cargo audit` pass on every CI run; all dependencies pinned exact in `Cargo.lock` and `pnpm-lock.yaml`
- NFR-S4: Anchor `verifiable-build` enabled; deployed program byte-matches Docker-reproducible build
- NFR-S5: Post-audit, upgrade authority set to System Program incinerator; IDL hash frozen; CI assertion verifies both
- NFR-S6: No code path reads, stores, or transmits seed phrases, mnemonics, keypair files; Wallet-Standard signing is sole signing surface
- NFR-S7: All state-changing transactions simulate via `simulateTransaction` and surface result before requesting signature
- NFR-S8: SDK refuses to send mainnet transactions unless `cluster: 'mainnet-beta'` explicitly passed
- NFR-S9: Every account deserialization validates owner, length, discriminator; memo/string fields treated as adversarial input
- NFR-S10: `docs/threat-model.md` enumerates adversary models, attack surfaces, mitigations, residual risks

**Reliability & Availability**
- NFR-R1: Reference app falls back to public Solana RPC if Helius unreachable, surfacing UI banner
- NFR-R2: Reference app falls back to Wallet-Standard browser-extension wallets if Privy unavailable
- NFR-R3: Sphere fiat on-ramp is optional flag, not on demo happy-path
- NFR-R4: Reference app and README surface active cluster and program's deployment status
- NFR-R5: Engineering log entries committed daily from T+0 to submission close — no skipped days

**Accessibility & Internationalization**
- NFR-A1: Every locale bundle has all keys present in English baseline; CI fails on missing keys
- NFR-A2: MVP ships English baseline + Vietnamese fully populated; ar/es/yo/ht-kreyol stubs committed
- NFR-A3: Reference app CSS and layout primitives support right-to-left rendering for Arabic locale
- NFR-A4: Reference app fully usable on 360px-wide viewport; all key interactions work without horizontal scroll
- NFR-A5: Reference app targets WCAG 2.1 AA conformance for color contrast, keyboard nav, screen-reader semantics (v0.2 release-gate; key violations triaged for MVP)
- NFR-A6: User without prior crypto experience completes create-or-join flow via Privy email-based embedded wallet without seed-phrase or wallet-extension knowledge

**Integration**
- NFR-I1: USDC and USDT mints both supported at protocol layer with identical instruction surface; SDK exposes both
- NFR-I2: Squads multisig can serve as Group Creator; demonstrated end-to-end in `examples/with-squads`
- NFR-I3: Privy embedded wallet can serve as Group Member's signer; demonstrated in `examples/with-privy`
- NFR-I4: Token-2022 mint usable in Susu where SPL Token would be; demonstrated in `examples/with-token-extensions`
- NFR-I5: SDK accepts any Solana RPC URL; defaults to Helius but not Helius-locked
- NFR-I6: Reference app supports Sphere fiat on-ramp (USD → USDC) and off-ramp (USDC → USD) when flag enabled
- NFR-I7: `@solana/web3-compat` is sole adapter point where legacy `@solana/web3.js` types may appear; primary code paths use `@solana/kit` types

**Reproducibility**
- NFR-Re1: `audits/adversary/adversary-report.json` byte-reproducible from any tagged release commit SHA via `cargo run --bin susu-adversary -- --circles 10000 --seed $COMMIT_SHA`
- NFR-Re2: `programs/susu/idl/susu.json` byte-reproducible from `anchor build` against pinned toolchain
- NFR-Re3: Docker-based reproducible build pipeline in CI; deployed binary byte-matches build output
- NFR-Re4: `pnpm verify` runs full claim-verification suite on clean clone in ≤10 minutes

**Observability**
- NFR-O1: `/log/YYYY-MM-DD.md` entries from T+0 onwards capture daily progress, blockers, decisions
- NFR-O2: README displays current CI status badge; failed CI runs publicly visible
- NFR-O3: README surfaces current devnet program ID, mainnet program ID (post-audit), audit firm + report link, audit status badge

**Compliance**
- NFR-C1: No instruction handler or reference-app code path takes custody, charges fee, or routes to yield venue; CI test asserts no protocol-owned token accounts
- NFR-C2: `docs/legal-opinion.pdf` from crypto-native law firm committed by submission close
- NFR-C3: v0.1.0 ships no protocol token, no tokenized governance, no airdrop
- NFR-C4: Protocol layer stores zero PII; reference app's Convex layer commits to GDPR Article 17 erasure-on-request

### Additional Requirements

**Architecture Setup & Tooling**
- ARCH-1: Custom pnpm-workspace monorepo scaffolded from `anchor init` (programs/susu) + `create-next-app@latest` (apps/reference) + hand-rolled SDK packages; Day-1 scaffold sequence is the literal first implementation story
- ARCH-2: Codama codegen wiring at repo root via `codama.config.mjs` to generate TS + Rust clients from frozen IDL (`@codama/renderers-js`, `@codama/renderers-rust`)
- ARCH-3: Cargo workspace at repo root with members: programs/susu, sdk/rust, crates/susu-adversary
- ARCH-4: Pinned root configs: `rust-toolchain.toml`, `.nvmrc` (Node 20 LTS), `Anchor.toml`, `tsconfig.base.json`, `pnpm-workspace.yaml`
- ARCH-5: Day-1 spike: validate Codama Rust renderer maturity; documented fallback to hand-rolled thin Rust crate (PRD Cut #4)
- ARCH-6: Day-1 spike: validate Surfpool integration with Anchor 1.0; LiteSVM-only fallback for unit tests

**On-chain Account Model**
- ARCH-7: PDA seed constants single source-of-truth at `programs/susu/src/seeds.rs` (GROUP_SEED, MEMBER_SEED, VAULT_SEED, ROTATION_SEED); SDK clients import/mirror this; CI grep forbids inline seed literals elsewhere
- ARCH-8: Anchor accounts: Group (config + roster), MemberPosition (PDA per group+member), Vault (token account, PDA, authority = group PDA), RotationReceipt (PDA per group+rotation_index)
- ARCH-9: Single `SusuError` enum source-of-truth at `programs/susu/src/error.rs`; new variants require matching `apps/reference/messages/en.json` key in same PR

**Static Analysis & CI Scripts**
- ARCH-10: `scripts/check-fincen-posture.sh` static-analysis CI script asserting non-custodial / non-fee / non-yield posture
- ARCH-11: `scripts/check-patterns.sh` CI grep for forbidden patterns (inline seed literals outside seeds.rs, Convex imports outside boundary, ml-/mr-/pl-/pr-/left-/right- Tailwind classes, process.env outside lib/env.ts)
- ARCH-12: `scripts/check-sdk-parity.sh` Codama regen + diff for parity check (FR33 enforcement)
- ARCH-13: `scripts/check-i18n-parity.ts` for locale key parity (FR50/NFR-A1 enforcement)
- ARCH-14: `scripts/check-idl-hash.sh` for IDL_FREEZE.md hash assertion (FR29 enforcement)
- ARCH-15: `scripts/check-immutability.sh` post-mainnet immutability assertion (FR30 enforcement)
- ARCH-16: `scripts/susu-demo.sh` orchestrator for `pnpm susu:demo` (FR37/NFR-P2)
- ARCH-17: `scripts/verify.sh` orchestrator for `pnpm verify` ≤10min budget (NFR-Re4)

**GitHub Actions Workflows**
- ARCH-18: `.github/workflows/ci.yml` — every PR + push to main: install, anchor build, anchor test (LiteSVM + Mollusk), cargo test --workspace, pnpm test, pnpm build, parity check, IDL hash check, FinCEN posture check, axe-core a11y
- ARCH-19: `.github/workflows/verify.yml` — every push to main, runs in clean Docker container, `pnpm verify` total wall-clock ≤10min release-blocker
- ARCH-20: `.github/workflows/adversary.yml` — nightly on main + on tagged release; runs adversary; commits artifact if SHA changed
- ARCH-21: `.github/workflows/release.yml` — tagged release: verifiable Anchor build via Docker → publish to npm + crates.io via OIDC → GitHub release with attestations
- ARCH-22: `.github/workflows/immutability-check.yml` — every push to main post-mainnet: solana program show + IDL hash assertion
- ARCH-23: `.github/workflows/i18n-parity.yml` — every PR touching messages: locale key parity
- ARCH-24: GitHub PR template, issue templates (bug_report, feature_request, translation_pr), dependabot.yml

**Hosting & Publishing**
- ARCH-25: Vercel deployment for `apps/reference`; preview deploys on every PR; production on main merge
- ARCH-26: GitHub Actions OIDC trusted-publishing for npm (@susu/sdk) + crates.io (susu-client) on tagged release
- ARCH-27: Verifiable Anchor build via Docker (`solana-verify` + Anchor `verifiable-build`)
- ARCH-28: Vercel/CI environment variables; `.env.example` committed; Zod-validated env loader at `apps/reference/lib/env.ts`

**Reference App Architecture**
- ARCH-29: Provider order in `apps/reference/app/layout.tsx`: PrivyProvider > ConvexProvider > IntlProvider; documented in app README
- ARCH-30: Convex schema with `groupMetadata`, `inviteLinks`, `memberDisplayNames` tables; GDPR Article 17 erasure mutation
- ARCH-31: Convex isolation enforced — files outside `apps/reference/lib/convex/` MUST NOT import `convex/*`; CI grep enforces
- ARCH-32: Zustand stores: skin (cookie-persisted, hydrated server-side, localStorage sync), locale, wallet/cluster
- ARCH-33: i18n via `next-intl` middleware at `/[locale]/...` with cookie-based locale; en, vi, ar, es, yo, ht-kreyol bundles in `apps/reference/messages/`
- ARCH-34: Cookie-based skin/locale persistence; `data-skin` attribute set server-side to prevent flash-of-unstyled-content; localStorage syncs the cookie on toggle, not source of truth
- ARCH-35: Bundle size budget for `apps/reference` initial route: ≤220KB gzipped

**Server-Rendered Badge APIs**
- ARCH-36: `app/api/badge/adversary/route.ts` — `<AdversaryBadge />` server-renders from latest `audits/adversary/adversary-report.json` (verified/pending/failed states)
- ARCH-37: `app/api/badge/upgrade-burned/route.ts` — `<UpgradeBurnedBadge />` server-renders from `solana program show $PROGRAM_ID --url mainnet-beta` (verified/pending/failed states)

**Test Stack**
- ARCH-38: Anchor test suite (LiteSVM + Mollusk fixtures) for protocol unit tests; Surfpool for realistic integration tests; Vitest for SDK + reference-app unit; Playwright + @axe-core/playwright for E2E + a11y; proptest for Rust property; bespoke Rust binary for adversary
- ARCH-39: `tests/coverage/threat-model.md` traceability matrix mapping each documented attack to a test file

**SDK Implementation**
- ARCH-40: TS SDK fluent client pattern from `@solana/kit` — `createSusuClient().use(signer(...)).use(solanaDevnetRpc({...}))`
- ARCH-41: Helius `getRecentPrioritizationFees` priority-fee algorithm + auto-prepended `ComputeBudgetProgram.setComputeUnitLimit/setComputeUnitPrice` instructions in SDK
- ARCH-42: SDK error classes: `SusuError`, `SusuSimulationError`, `SusuRpcError` discriminated union; never throw bare Error

### UX Design Requirements

**Design Tokens & Theming**
- UX-DR1: Dark-first base; CSS custom properties on `[data-skin]` attribute on `<html>`; `tokens.css` default = neutral skin
- UX-DR2: Cross-skin identity tokens (`--bg`, `--signal` mint, `--warn`, `--danger`) MUST NOT swap across skins — they ARE the protocol-identity layer
- UX-DR3: Brand-neutral skin tokens — `--surface #13191B`, `--surface-2 #1C2427`, `--border #1F2528`, `--text #E8EDED`, `--text-muted #7A8489`, `--primary #14F195` (Solana mint), `--secondary #00D1FF` (Solana cyan), `--signal #14F195`
- UX-DR4: Diaspora skin tokens — `--surface #16120E`, `--surface-2 #211B15`, `--border #29211A`, `--text #F0E9DE`, `--text-muted #9E8974`, `--primary #E5A552` (kente copper), `--secondary #C2533D` (terracotta); `--signal` stays mint
- UX-DR5: Tailwind config maps semantic tokens to CSS custom properties (bg, surface, surface2, border, text, muted, primary, secondary, signal, warn, danger); `colors: { bg: 'rgb(var(--bg) / <alpha-value>)', ... }`
- UX-DR6: Spacing 4px base scale tokens (space-1=4, space-2=8, space-3=12, space-4=16, space-6=24, space-8=32, space-12=48, space-16=64, space-24=96)
- UX-DR7: Border-radius scale (radius-sm=6, radius-md=10, radius-lg=14, radius-xl=20, radius-pill=9999)
- UX-DR8: Shadow tokens — `--shadow-1` (hairline highlight), `--shadow-2` (modal); subtle Phantom-style elevation, no heavy shadows
- UX-DR9: Typography stack self-hosted via `next/font`: Geist (display), Inter (body multilingual), Geist Mono (code/amounts/addresses); Noto Sans Yoruba/Arabic fallbacks
- UX-DR10: Type scale — display-1 (56/64), display-2 (40/48), h1 (32/40), h2 (24/32), h3 (20/28), body (16/24), body-sm (14/22), caption (12/16), mono-md (14/22), mono-sm (12/16)
- UX-DR11: `.numeric` utility class with `font-feature-settings: 'tnum' on, 'lnum' on` for tabular numerics on all amounts

**Custom Components (Susu-specific)**
- UX-DR12: `<CurveVisualizer />` — animated/interactive plot of dynamic-collateral curve; X-axis rotation positions, Y-axis required collateral, mint stroke; variants `default | interactive | cartel | static-svg`; sizes `sm | md | lg`; ARIA `role="img"` + hidden `<table>` for screen readers; respects `prefers-reduced-motion`
- UX-DR13: `<TransactionConfirmModal />` — mandatory before any state-change; simulation-result block (recipient PDA truncated, amount with mint accent, token, network fee, cluster pill, will-succeed/fail line); states `loading-simulation | success | failure | signing | signed`; trapped focus, `aria-modal`, escape closes (except mid-signing); variants per action type
- UX-DR14: `<SkinToggle />` — pill control with two segments (Neutral / Heritage), animated thumb, persists to cookie + localStorage, switches `data-skin` on `<html>`, animates CSS-custom-property transition over 300ms; `role="radiogroup"` keyboard-navigable
- UX-DR15: `<RotationCard />` — group name, cluster pill, member roster (8 avatars, current-recipient highlighted in mint), current month / total months, member's position + next action, curve-required collateral with tooltip → CurveVisualizer; states active / awaiting-start / completed / slashed; compact (mobile) and expanded (desktop) variants
- UX-DR16: `<ClusterPill />` — always-visible cluster indicator on every reference-app screen including /404; mint background for devnet, mint+border for mainnet-beta (label is source of truth, not color)
- UX-DR17: `<AdversaryBadge />` — server-rendered from latest `audits/adversary/adversary-report.json`; shows "10,000 adversarial circles passed ✓" if `max_defector_profit_lamports: 0`, else "FAILED — view report"; states verified/pending/failed
- UX-DR18: `<UpgradeBurnedBadge />` — server-rendered from `solana program show $PROGRAM_ID --url mainnet-beta`; shows "Upgrade authority: burned ✓" if returns incinerator, else "Upgrade: <authority>"; states verified/pending/failed
- UX-DR19: `<CodeBlock />` — copy-on-click + language toggle (TS/Rust/curl), Geist Mono with syntax highlighting (Shiki), optional "verified at $COMMIT_SHA" subtext
- UX-DR20: `<MemberAvatar />` — deterministic dicebear-style SVG generated from wallet pubkey hash; mint-tinted in neutral skin, copper-tinted in diaspora skin; no real photos
- UX-DR21: `<ReceiptCard />` — permanent receipt UI for state-change confirmations (vs ephemeral toasts); shows tx signature, explorer link, "what's next" guidance
- UX-DR22: `<Banner />` — degraded-state banner (RPC fallback, audit pending, on devnet) in `--warn` color
- UX-DR23: `<FieldError />` — inline form validation error in `--danger` color with `aria-describedby` linkage

**shadcn/ui Foundation**
- UX-DR24: shadcn/ui primitives copied into `apps/reference/components/ui/` (Button, Dialog, Input, Label, Textarea, Select, Combobox, Tooltip, Popover, DropdownMenu, Tabs, Card, Badge, Toast, Skeleton, Switch, Checkbox, RadioGroup, Progress, Avatar, ScrollArea, Separator) — themed via tokens

**README Hero & Marketing Surface**
- UX-DR25: README first viewport — logo + nav, H1 "Susu Protocol" (Geist Display 56/64), subhead, badge row (audit, MIT, devnet, mainnet, "10K passed", "Upgrade burned", CI), copy-on-click `pnpm susu:demo` block with "demo took 47s last verified at $COMMIT_SHA" subtext, watch-60s-demo button + fork-on-github CTA, curve-novelty hook line + 2 inline links, inline animated SVG curve plot (320×120 mobile, 480×180 desktop)
- UX-DR26: 60-90s demo video showing rotating-money animation → curve explainer → integration code → fork-me CTA; both reference-app skins shown briefly; subtitled English + Vietnamese for MVP

**Accessibility**
- UX-DR27: WCAG 2.1 AA target with documented contrast ratios per token combination (most clear AAA); axe-core via `@axe-core/playwright` in CI fails build on AA violations
- UX-DR28: Focus rings 2px mint (`--signal` cross-skin) at 2px offset on every interactive element via `:focus-visible`
- UX-DR29: Touch targets minimum 44×44; primary mobile CTAs 48×48; spacing between adjacent targets ≥8px
- UX-DR30: Skip-to-content link as first focusable element on each page
- UX-DR31: ARIA live regions — `aria-live="polite"` for non-critical state-changes (locale switched, copy succeeded); `aria-live="assertive"` for errors and critical state-changes
- UX-DR32: All animations respect `prefers-reduced-motion: reduce` (palette transitions instant, curve animations static, modal entry/exit instant, receipt checkmark static)
- UX-DR33: All layout uses Tailwind logical properties (ms-, me-, ps-, pe-, start-, end-) — never ml-, mr-, pl-, pr-, left-, right-; CI grep enforces; directional icons flip via `[dir="rtl"]` CSS

**Responsive**
- UX-DR34: Mobile-first design with 360px floor; bottom-anchored primary CTAs on mobile; full-screen dialogs on mobile (<640px); centered card on tablet+
- UX-DR35: Breakpoints sm 640, md 768, lg 1024, xl 1280, 2xl 1536; max content width 1200px (docs) / 1440px (reference app)
- UX-DR36: Tablet 2-column layout for group dashboard; Desktop 3-column where appropriate; hover states active on desktop
- UX-DR37: Playwright visual regression at all breakpoints (iPhone SE, iPhone 14, Pixel 6, iPad, Desktop) in CI

**Patterns & Discipline**
- UX-DR38: Button hierarchy — primary (only one per view, mint bg + ink text), secondary (surface-2 bg + border), ghost (transparent), destructive (danger bg), link (primary text + underline); sizes sm 32 / md 40 / lg 48
- UX-DR39: Receipt persists; toasts ephemeral; never use toast for state-changes
- UX-DR40: Form labels above inputs (never floating); helper text below in `--text-muted`; validation on blur for non-critical, on-submit for critical; disabled submit until valid; errors linked via `aria-describedby`; required fields marked with `*` and `aria-required`
- UX-DR41: Top nav — logo + cluster pill + skin toggle + locale dropdown + wallet status; mobile collapses non-cluster items into hamburger; cluster pill always visible
- UX-DR42: Dialog discipline — trapped focus, `aria-modal="true"`, escape closes (except `<TransactionConfirmModal />` mid-signing), max one open at a time, mobile full-screen
- UX-DR43: Empty/Loading/Error/Degraded states — illustrated empty + single CTA, Skeleton matching final layout (never spinners alone), classified error card with cause + recovery hint, warn banner for degraded RPC

**Skin & Locale UX**
- UX-DR44: Skin toggle persists via cookie (server-readable, source of truth) + localStorage (sync target); `data-skin` set server-side to prevent flash-of-unstyled-content
- UX-DR45: Locale switching — top-nav dropdown, no full-page reload; CSS `dir="rtl"` flips for Arabic; `lang` attribute on `<html>` updates; URL prefix `/[locale]/...` via next-intl middleware; default locale = en
- UX-DR46: All UI strings come via i18n keys; no string literals in components; `useTranslation()` is the only path
- UX-DR47: `CONTRIBUTING-TRANSLATIONS.md` forbids auto-translation; all locales come from community translators; CODEOWNERS pattern per-locale

**End-Saver Mobile Flow (DE3 / Linh)**
- UX-DR48: Linh-style mobile flow — welcome (skin=diaspora, lang=vi) → tap "Tham gia" → Privy email entry → email code → wallet auto-created → position+collateral display with tooltip explainer → Sphere on-ramp (when fork-enabled) → confirmation modal (recipient/amount/token/fee/cluster) → Privy signing modal → confirmed receipt with explorer link + next action; <5min end-to-end for non-crypto user
- UX-DR49: Pre-submission pilot test with 3 non-crypto users (Vietnamese-speaker, Arabic-speaker, English-speaker) completing full Linh flow on mobile

**DE1 Demo Experience**
- UX-DR50: `pnpm susu:demo` terminal output structured + colored — bootstrapping checks (Anchor toolchain, Solana CLI, devnet RPC, funded keypair), group create with tx hash, members joining with 5 tx, rounds 1-N with checkmarks, total wall-clock printed at completion (verifies NFR-P2 ≤60s in real time), explorer-link helpers, localhost:3000 prompt for next action

### FR Coverage Map

FR1: Epic 2 - create_group instruction + Group account
FR2: Epic 2 - invite mechanism (PDA-derived invite tokens)
FR3: Epic 2 - accept_invite instruction + MemberPosition account
FR4: Epic 2 - protocol enforces all-members-collateralized gate before contributions
FR5: Epic 2 - cancel_group instruction
FR6: Epic 2 - account-fetch SDK helpers for group state
FR7: Epic 2 - participation-history query helper
FR8: Epic 3 - contribute instruction
FR9: Epic 3 - curve module (closed-form O(n))
FR10: Epic 3 - post_collateral instruction; rotation rejection on insufficient
FR11: Epic 3 - top_up_collateral instruction
FR12: Epic 3 - slash_member instruction + distribution rule
FR13: Epic 3 - withdraw_collateral instruction
FR14: Epic 3 - PDA vault enforcement; CI assertion no protocol-owned non-PDA token accounts
FR15: Epic 4 - deterministic rotation-slot algorithm
FR16: Epic 4 - claim_payout instruction (permissionless)
FR17: Epic 4 - non-recipient claim rejection
FR18: Epic 4 - pre-deadline claim rejection
FR19: Epic 4 - double-claim rejection (RotationReceipt PDA)
FR20: Epic 4 - architectural assertion: no scheduler dependency
FR21: Epic 5 - tests/invariants/no_strategic_default.rs (proptest, 10K cases)
FR22: Epic 5 - susu-adversary binary + JSON artifact + commit-SHA seeding
FR23: Epic 5 - 30% Cartel scenario module + named in README
FR24: Epic 5 - docs/collateral-curve.md formal write-up
FR25: Epic 5 - docs/threat-model.md
FR26: Epic 5 - docs/fincen-cvc-framing.md
FR27: Epic 5 - docs/legal-opinion.pdf (vendor deliverable; story tracks workflow)
FR28: Epic 1 - IDL_FREEZE.md + SHA-256
FR29: Epic 1 - check-idl-hash.sh + ci.yml IDL hash job
FR30: Epic 9 - immutability-check.yml + post-mainnet upgrade-authority burn (post-MVP scope, story scaffolds workflow)
FR31: Epic 6 - @susu/sdk publication via Codama codegen
FR32: Epic 6 - susu-client publication (cuttable to v0.1.1)
FR33: Epic 6 - check-sdk-parity.sh + ci.yml parity job
FR34: Epic 6 - SDK simulate parameter (default true)
FR35: Epic 6 - SDK explicit-cluster gate
FR36: Epic 6 - examples/with-{squads,privy,token-extensions}
FR37: Epic 6 - susu-demo.sh + scripts/susu-demo.sh CI smoke
FR38: Epic 6 - docs/integration-{partner}.md
FR39: Epic 7 - Privy email-onboarding integration
FR40: Epic 7 - one-tap contribute flow with TransactionConfirmModal
FR41: Epic 7 - one-tap claim flow with TransactionConfirmModal
FR42: Epic 7 - dual-skin via [data-skin] + SkinToggle
FR43: Epic 7 - next-intl multi-locale (en + vi live, 4 stubs)
FR44: Epic 7 - Sphere optional-flag integration
FR45: Epic 7 - Helius RPC fallback to public + Banner
FR46: Epic 7 - Wallet-Standard browser-extension fallback
FR47: Epic 7 - ClusterPill always-visible
FR48: Epic 7 - CONTRIBUTING-TRANSLATIONS.md
FR49: Epic 7 - locale stub editing + PR flow
FR50: Epic 7 - i18n-parity.yml + check-i18n-parity.ts
FR51: Epic 1 - CONTRIBUTING.md + CODEOWNERS
FR52: Epic 8 - README first viewport with all badges + AdversaryBadge + UpgradeBurnedBadge components
FR53: Epic 8 - README link cluster
FR54: Epic 8 - 60-90s demo video embedded
FR55: Epic 1 - log/ scaffolding + daily entries (cross-cutting commitment, kicks off in Epic 1)
FR56: Epic 6 - pnpm verify orchestrator (scripts/verify.sh)
FR57: Epic 5 - audit firm engagement workflow + report linking
FR58: Epic 1 - public CI workflows (.github/workflows/) re-runnable

## Epic List

### Epic 1: Project Bootstrap, Foundation & IDL Freeze (T+0 to T+1d)

**Goal:** Stand up the public `susu-monorepo` from commit zero with the complete directory structure, workspace configuration, frozen IDL, root-level tooling, CI scaffolding, license, contribution docs, and the daily engineering log. After this epic, every subsequent piece of work has a place to land and a CI signal that backs it. The IDL freeze is the architectural anchor — every downstream artifact (Codama codegen, audit, SDKs, examples) proceeds against this fixed surface.

**FRs covered:** FR28, FR29, FR51, FR55, FR58

### Epic 2: Group Lifecycle Anchor Program

**Goal:** Implement the on-chain group creation, invite, accept, cancellation, and state-query lifecycle in the Anchor program. After this epic, a developer can create a 3–12 member savings circle on devnet, invite members via on-chain-only mechanism, accept invitations, query group state, and cancel pre-start. This delivers the "Group Lifecycle Management" cluster (FR1–FR7) standalone — no curve, no contributions, no rotations yet, but the foundation for all of those is in place. PDA seed module + SusuError enum + Group/MemberPosition account types are established here as single-source-of-truth surfaces that Epic 3+ build on.

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7

### Epic 3: Curve Module, Contributions & Collateral Lifecycle

**Goal:** Implement the **Curve Invariant** as live code: the closed-form O(n) dynamic-collateral curve module, plus the contribute / post_collateral / top_up_collateral / withdraw_collateral / slash_member instruction set. After this epic, members of an active group can post curve-determined collateral, make scheduled contributions, top up under member-dropout conditions, get slashed for non-payment with distribution to honest members, and withdraw unslashed collateral after group completion. PDA vault accounts (owned by the program, never by user keys) are the core safety surface here. This is the single largest epic by surface area but it is one cohesive component (the contribution+collateral state machine) with ordered stories — splitting would force file-churn across instructions sharing curve.rs.

**FRs covered:** FR8, FR9, FR10, FR11, FR12, FR13, FR14

### Epic 4: Permissionless Rotation & Payout Claim

**Goal:** Implement the deterministic rotation-slot assignment algorithm and the permissionless `claim_payout` instruction with its full guard surface (non-recipient rejection, pre-deadline rejection, double-claim rejection via RotationReceipt PDA). After this epic, a complete ROSCA cycle works on devnet end-to-end: create → invite → accept → collateralize → contribute → rotate → claim — entirely on-chain, with no scheduler / keeper / off-chain executor dependency. This epic is what makes the "permissionless payout claim" novelty claim true at the program level.

**FRs covered:** FR15, FR16, FR17, FR18, FR19, FR20

### Epic 5: Curve Verification, Adversary Simulation & Public Documentation

**Goal:** Make the **Curve Invariant** *provable, reproducible, and legible* to judges, auditors, and forking developers. Ship the proptest property test (≥10K cases), the `susu-adversary` simulation binary with the named "30% Cartel" scenario producing the byte-deterministic JSON artifact, the formal `docs/collateral-curve.md` write-up with proof sketch, the `docs/threat-model.md`, the `docs/fincen-cvc-framing.md`, and the workflow that engages the audit firm + crypto-native law firm and lands their deliverables. This epic turns the protocol's central novelty claim from a narrative assertion into an executable artifact set; without it Susu is just another savings-circle program.

**FRs covered:** FR21, FR22, FR23, FR24, FR25, FR26, FR27, FR57

### Epic 6: SDK Surface, Examples & One-Command Reproducibility

**Goal:** Make Susu a *primitive* that downstream Solana developers consume rather than a one-off program. Ship the Codama-generated TypeScript SDK (`@susu/sdk`) and Rust client crate (`susu-client`) with full instruction surface + simulate-by-default + explicit-cluster gate + priority-fee handling; the parity-check CI job; the three composability example repos (`with-privy`, `with-squads`, `with-token-extensions`); the `pnpm susu:demo` orchestrator hitting NFR-P2 ≤60s; the `pnpm verify` orchestrator hitting NFR-Re4 ≤10min; the partner integration docs. After this epic, Aisha-style forking developers can clone-to-deploy in one afternoon, and judges can verify every claim with one command.

**FRs covered:** FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR56

### Epic 7: Reference App — Dual-Skin Multi-Locale End-Saver Experience

**Goal:** Ship the Next.js 15 reference app that operationalizes "documentation-by-example" — Linh's mobile-first end-saver flow with Privy email-onboarding, the dual-skin runtime swap via `[data-skin]` with cross-skin mint identity tokens, the six locales (English baseline + Vietnamese live for MVP, ar/es/yo/ht-kreyol stubs with the parity check enforced), Sphere on-ramp optional-flag, Helius RPC fallback, Wallet-Standard fallback, the always-visible ClusterPill, the `<TransactionConfirmModal />` mandated for every state-change, the full custom-component set, the WCAG 2.1 AA accessibility surface, the responsive 360px-floor mobile layout, and the `CONTRIBUTING-TRANSLATIONS.md` flow with i18n parity enforcement. After this epic, a non-crypto user on mobile Safari completes the full join + first-contribution flow in <5 minutes, and a community translator can land a locale PR in one Saturday.

**FRs covered:** FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR47, FR48, FR49, FR50

### Epic 8: README Hero, Demo Video & Submission Marketing Surface

**Goal:** Ship the public-facing surface that wins the 30-second judge scan: the README first viewport with all required badges (audit / MIT / devnet / mainnet / "10K adversarial circles passed" / "Upgrade authority: burned" / CI status) including the live-CI server-rendered `<AdversaryBadge />` and `<UpgradeBurnedBadge />`; the inline animated SVG curve plot; the copy-on-click `pnpm susu:demo` block; the badge-anchored link cluster; the 60-90 second demo video embedded showing rotating-money animation → curve explainer → integration code → fork-me CTA with both skins visible; the ecosystem-partner reference. After this epic, the submission scans correctly in 30 seconds for Marcus and converts into a clone-attempt for Aisha.

**FRs covered:** FR52, FR53, FR54

### Epic 9: Mainnet Deploy & Immutability Gate (Post-Audit, Bridges to Phase 2)

**Goal:** Once audit closes with zero Critical / zero High findings, deploy the program to mainnet-beta, set the upgrade authority to the System Program incinerator (`1nc1nerator11111111111111111111111111111111`), and wire the immutability-check CI workflow that asserts on every push that the upgrade authority remains burned and the deployed IDL hash matches `IDL_FREEZE.md`. This epic is post-MVP critical-path and may slip past submission close if the audit slips — the workflow scaffolding ships with the MVP (so the badge wires up the moment mainnet lands) but the actual mainnet deploy + upgrade burn is gated on audit sign-off. The submission ships with `audit-pending` / `mainnet-pending` badges if needed; this epic moves them to `verified`.

**FRs covered:** FR30

## Epic 1: Project Bootstrap, Foundation & IDL Freeze

Stand up the public `susu-monorepo` from commit zero with the complete directory structure, workspace configuration, frozen IDL, root-level tooling, CI scaffolding, license, contribution docs, and the daily engineering log. The IDL freeze is the architectural anchor — every downstream artifact (Codama codegen, audit, SDKs, examples) proceeds against this fixed surface.

### Story 1.1: Initialize pnpm + Cargo workspace monorepo with directory skeleton

**GH Issue:** #18

As a Susu maintainer,
I want to scaffold the `susu-monorepo` with the locked directory structure and workspace configurations,
So that every subsequent piece of work has a place to land and forks can navigate the tree as ambient 2026 Solana convention.

**Acceptance Criteria:**

**Given** an empty working tree
**When** the scaffold sequence runs (`pnpm init` at root, `pnpm-workspace.yaml` with members `apps/*`, `sdk/ts`, `examples/*`; root `Cargo.toml` workspace with members `programs/susu`, `sdk/rust`, `crates/*`; `Anchor.toml`, `rust-toolchain.toml`, `.nvmrc` Node 20 LTS, `tsconfig.base.json`, `.editorconfig`, `.eslintrc.js`, `.prettierrc`, `.gitignore`, `.env.example`)
**Then** the working tree contains the full directory skeleton from architecture §"Complete Project Directory Structure" — `programs/susu`, `sdk/{ts,rust}`, `apps/reference`, `examples/with-{squads,privy,token-extensions}`, `crates/susu-adversary`, `tests/{invariants,coverage}`, `audits/adversary`, `docs`, `log`, `scripts`, `.github/workflows`
**And** `pnpm install` completes without error against the empty workspace
**And** `cargo metadata --format-version 1` resolves the empty Rust workspace without error
**And** the `LICENSE` file contains the MIT license verbatim
**And** the repo is committed and pushed to `github.com/susu-protocol/susu-monorepo` as a public repository
**And** `MIT` and `public-from-commit-zero` postures are documented in the root `README.md` skeleton

### Story 1.2: Initialize Anchor program shell + freeze IDL

**GH Issue:** #19

As a Susu maintainer,
I want to declare the full instruction surface in `programs/susu/src/lib.rs` (signatures only, no logic), generate the IDL, and commit `IDL_FREEZE.md` with its SHA-256,
So that the audit firm, Codama codegen, SDKs, reference app, and examples all proceed against a fixed artifact and any pre-audit drift requires a public re-freeze justification.

**Acceptance Criteria:**

**Given** the monorepo skeleton from Story 1.1
**When** `anchor init programs/susu --no-git` runs and `lib.rs` declares the full instruction surface (`create_group`, `accept_invite`, `post_collateral`, `contribute`, `claim_payout`, `top_up_collateral`, `withdraw_collateral`, `slash_member`, `cancel_group`) with empty handler bodies returning `Ok(())`
**Then** `anchor build` succeeds and produces `programs/susu/target/idl/susu.json`
**And** the IDL is copied to `programs/susu/idl/susu.json` (committed location)
**And** `IDL_FREEZE.md` is committed at repo root containing the SHA-256 of `programs/susu/idl/susu.json`, the freeze date `2026-05-06`, the program ID, and a paragraph explaining the freeze policy (re-freeze requires public log entry)
**And** all 9 instruction names + their argument types appear in the IDL
**And** the `seeds.rs` module is committed at `programs/susu/src/seeds.rs` with constants `GROUP_SEED`, `MEMBER_SEED`, `VAULT_SEED`, `ROTATION_SEED`
**And** the empty `error.rs` module declares the `SusuError` enum (variants added per story; placeholder `Unimplemented` is acceptable on Day 1)

### Story 1.3: Wire Codama codegen for TS + Rust clients

**GH Issue:** #20

As a Susu maintainer,
I want `codama.config.mjs` at repo root that generates both `sdk/ts/src/generated/` and `sdk/rust/src/generated/` from the frozen IDL,
So that the TS SDK and Rust crate share a single parity-checked codegen surface and CI can structurally catch any drift.

**Acceptance Criteria:**

**Given** the frozen IDL at `programs/susu/idl/susu.json`
**When** `pnpm sdk:codegen` runs (which invokes `codama` with `@codama/renderers-js` and `@codama/renderers-rust` per `codama.config.mjs`)
**Then** `sdk/ts/src/generated/` and `sdk/rust/src/generated/` are populated with instruction builders, account decoders, error enums, and seed constants — all derived from the IDL
**And** `sdk/ts/package.json` declares `name: "@susu/sdk"` with peer deps on `@solana/kit` and `@solana/web3-compat`
**And** `sdk/rust/Cargo.toml` declares `name = "susu-client"` and is a Cargo workspace member
**And** the generated TS instruction names use `camelCase` (e.g., `createGroup`); the generated Rust instruction names use `snake_case` (e.g., `create_group`)
**And** both generated trees include a banner comment "DO NOT EDIT — generated by codama" at the top of every file
**And** if the Rust renderer's coverage is incomplete, the gap is documented at `docs/codama-rust-status.md` with a fallback plan (hand-rolled thin Rust crate per PRD Cut #4)

### Story 1.4: GitHub Actions CI scaffold with IDL hash + pattern checks

**GH Issue:** #21

As a Susu maintainer,
I want a `.github/workflows/ci.yml` running on every PR + push to main that asserts the IDL hash matches `IDL_FREEZE.md`, runs forbidden-pattern grep checks, and runs `anchor build`, `cargo test --workspace`, and `pnpm test`,
So that the freeze contract is structurally enforced from Day 1 and stack discipline (kit-first imports, logical CSS, Convex isolation) cannot drift.

**Acceptance Criteria:**

**Given** the monorepo with frozen IDL + Codama codegen
**When** a PR opens or pushes to main land
**Then** `ci.yml` runs jobs: `pnpm install` (cached), `anchor build`, `cargo test --workspace`, `pnpm test`, `scripts/check-idl-hash.sh`, `scripts/check-patterns.sh`, `scripts/check-sdk-parity.sh` (initial: vacuously passing if Rust SDK is empty), `scripts/check-i18n-parity.ts` (initial: vacuously passing), `scripts/check-fincen-posture.sh` (initial: vacuously passing)
**And** `scripts/check-idl-hash.sh` computes SHA-256 of `programs/susu/idl/susu.json` and asserts it equals the value committed in `IDL_FREEZE.md`; mismatch exits 1
**And** `scripts/check-patterns.sh` greps for forbidden patterns (inline `b"group"` / `b"member"` / `b"vault"` / `b"rotation"` outside `seeds.rs`; `convex/` imports outside `apps/reference/lib/convex/`; `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-` Tailwind classes; `process.env` reads outside `apps/reference/lib/env.ts`) — exits 1 on any match
**And** every job runs on Ubuntu latest with pnpm 9.x, Node 20 LTS, and pinned Rust toolchain from `rust-toolchain.toml`
**And** the workflow file is documented in `CONTRIBUTING.md` so that forks can re-run it identically

### Story 1.5: License, README skeleton, contribution docs, CODEOWNERS

**GH Issue:** #22

As a forking developer,
I want a clear `README.md`, `CONTRIBUTING.md`, `CONTRIBUTING-TRANSLATIONS.md`, and `CODEOWNERS` from commit zero,
So that I can navigate the repo, understand contribution flow, and find the i18n process without reverse-engineering.

**Acceptance Criteria:**

**Given** the monorepo from prior stories
**When** the contribution-docs commit lands
**Then** `LICENSE` contains the MIT license
**And** `README.md` contains a placeholder hero (replaced in Epic 8) plus the directory tree, the audit/MIT/devnet/CI badge slots, and links to `docs/`, `examples/`, `programs/`
**And** `CONTRIBUTING.md` documents: dev setup (Node 20, pnpm 9, Rust toolchain), first-issue-tag flow, PR template usage, CODEOWNERS pattern, the IDL re-freeze policy, the FinCEN posture clauses
**And** `CONTRIBUTING-TRANSLATIONS.md` documents: the i18n bundle structure (`apps/reference/messages/{locale}.json`), the locale stub layout, the auto-translation prohibition, the style guide ("savings circle" → community decides equivalent), the PR template for translation PRs, and the recognition path (CODEOWNERS for the contributor's locale)
**And** `CODEOWNERS` declares per-locale owners (initially Andre as fallback for all locales) and protected paths (`programs/susu/src/curve.rs`, `programs/susu/src/seeds.rs`, `programs/susu/src/error.rs`, `IDL_FREEZE.md`)
**And** `.github/PULL_REQUEST_TEMPLATE.md` and `.github/ISSUE_TEMPLATE/{bug_report,feature_request,translation_pr}.md` exist with templates appropriate to each
**And** `.github/dependabot.yml` is configured for npm + cargo + GitHub Actions weekly updates

### Story 1.6: Daily engineering log discipline + Day-1 spikes

**GH Issue:** #23

As a building-in-public maintainer,
I want the `/log` directory live with the T+0 entry committed and Day-1 spikes (Codama Rust renderer maturity + Surfpool integration) validated,
So that the daily-log NFR-O1 / NFR-R5 commitment starts unbroken and the architecture's two flagged "important gaps" are closed before Epic 2 starts.

**Acceptance Criteria:**

**Given** all prior Epic 1 stories committed
**When** the T+0 log entry is written and the spikes complete
**Then** `log/2026-05-06.md` exists with notes covering the day's actual work (scaffold, IDL freeze, CI scaffold, contribution docs)
**And** the Codama Rust renderer spike runs `pnpm sdk:codegen` and produces output that compiles via `cargo build -p susu-client`; spike result documented at `docs/codama-rust-status.md` (status: working / partial / fallback)
**And** the Surfpool integration spike runs a hello-world `anchor test` against a Surfpool fork; spike result documented at `docs/surfpool-status.md` (status: working / LiteSVM-fallback)
**And** if either spike fails, the architecture-documented fallback (hand-rolled thin Rust crate; LiteSVM-only unit tests) is invoked and noted in the log entry
**And** the log entry is committed before EOD T+0 (per founder commitment)

## Epic 2: Group Lifecycle Anchor Program

Implement on-chain group creation, invite, accept, cancellation, and state-query lifecycle. After this epic a developer can create a 3–12 member savings circle on devnet, invite members, accept invitations, query group state, and cancel pre-start.

### Story 2.1: Account types + SusuError enum + i18n key parity scaffolding

**GH Issue:** #24

As a Susu program developer,
I want the `Group`, `MemberPosition`, `RotationReceipt` Anchor account types defined alongside the canonical `SusuError` enum and matching `apps/reference/messages/en.json` error keys,
So that every downstream instruction handler builds against single-source-of-truth types and the error→i18n parity invariant is in place from the start.

**Acceptance Criteria:**

**Given** the program shell from Epic 1
**When** the account-state PR lands
**Then** `programs/susu/src/state/group.rs` defines `Group` account (mint, contribution_amount, contribution_period, n, curve_params, members[], status enum, created_at)
**And** `programs/susu/src/state/member_position.rs` defines `MemberPosition` PDA-derived account (group, member_pubkey, rotation_slot, contribution_history[], collateral_posted, slash_status)
**And** `programs/susu/src/state/rotation_receipt.rs` defines `RotationReceipt` PDA per `(group, rotation_index)` with amount, recipient, claimed_at, signature
**And** `programs/susu/src/error.rs` declares `SusuError` enum with initial variants for Group lifecycle (`GroupFull`, `GroupAlreadyStarted`, `MemberNotInvited`, `InvalidMemberCount`, `MintNotSupported`, `GroupCancelled`)
**And** every `SusuError` variant has a corresponding key under `errors.*` in `apps/reference/messages/en.json` with a recovery-hint-bearing string
**And** `anchor build` regenerates the IDL — but the IDL hash check **passes** because the IDL was frozen with these account/error placeholders in Story 1.2 (i.e., the freeze anticipated them)

### Story 2.2: Implement create_group instruction (FR1)

**GH Issue:** #25

As a Group Creator,
I want a `create_group` instruction that validates n ∈ [3, 12], contribution amount, period, mint (USDC or USDT), and curve params,
So that I can establish a savings circle on-chain with all parameters bounded and audit-traceable.

**Acceptance Criteria:**

**Given** Story 2.1 lands
**When** `create_group(n, contribution_amount, contribution_period, mint, curve_params)` is invoked with valid arguments
**Then** a new `Group` PDA is initialized at seeds `[GROUP_SEED, group_id]` owned by the Susu program
**And** the instruction returns `SusuError::InvalidMemberCount` if `n < 3` or `n > 12`
**And** the instruction returns `SusuError::MintNotSupported` if mint is neither USDC nor USDT for the active cluster
**And** the rent-exempt minimum for the `Group` PDA is paid by the caller (the Group Creator)
**And** an Anchor `msg!("group_created", ...)` event is emitted with group PDA + creator + n
**And** an Anchor LiteSVM unit test in `programs/susu/tests/happy_path.rs` covers the happy path
**And** Anchor LiteSVM tests cover invalid-n (n=0, n=2, n=13), unsupported mint, and double-create (same group_id) error paths
**And** `cargo test -p susu` passes locally and in CI

### Story 2.3: Implement on-chain invite mechanism (FR2)

**GH Issue:** #26

As a Group Creator,
I want to invite specified members via an on-chain-only invite mechanism (no centralized off-chain server required),
So that group membership is auditable from the chain alone and forks don't need to operate a server to invite users.

**Acceptance Criteria:**

**Given** a `Group` PDA exists with status `Forming`
**When** the Group Creator invokes the invite mechanism with a list of member pubkeys
**Then** the `Group.members[]` array is populated with the invitee pubkeys with `accepted: false` for each
**And** the instruction rejects with `SusuError::GroupAlreadyStarted` if the group has any non-`Forming` status
**And** the instruction rejects with `SusuError::InvalidMemberCount` if `members.len() != n`
**And** the invitation surface is permissionless to read — `MemberPosition` PDAs do NOT exist yet, but the `Group.members` list is publicly queryable
**And** the architecture decision (invite-via-Group-roster, not a separate `Invite` PDA) is documented in `docs/architecture-notes.md` with rationale (saves PDA rent, simplifies state)
**And** Anchor tests cover the happy path, the post-start rejection, and the wrong-member-count rejection

### Story 2.4: Implement accept_invite instruction (FR3) with rotation-slot placeholder

**GH Issue:** #27

As a Group Member,
I want to accept a group invitation by invoking `accept_invite`, which creates my `MemberPosition` PDA and marks me as accepted,
So that I'm registered on-chain as a member and the group can track who has joined.

**Acceptance Criteria:**

**Given** a `Group` PDA exists with my pubkey in `members[]` and `accepted: false`
**When** I sign and submit `accept_invite(group)` with my keypair
**Then** a `MemberPosition` PDA is initialized at seeds `[MEMBER_SEED, group_pda, member_pubkey]`
**And** my entry in `Group.members[]` is flipped to `accepted: true`
**And** `MemberPosition.rotation_slot` is set to a placeholder value (e.g., `u8::MAX`); actual rotation-slot assignment is finalized in Epic 4 Story 4.1 (deterministic algorithm)
**And** the instruction rejects with `SusuError::MemberNotInvited` if my pubkey is not in `Group.members[]`
**And** the instruction rejects with `SusuError::AlreadyAccepted` if my entry is already `accepted: true`
**And** rent-exempt minimum for `MemberPosition` is paid by the accepting member (not the Group Creator)
**And** Anchor tests cover happy-path accept, non-invited rejection, double-accept rejection
**And** an `member_accepted` `msg!` event is emitted

### Story 2.5: Implement cancel_group instruction (FR5)

**GH Issue:** #28

As a Group Creator,
I want to cancel the group prior to contribution start, returning any posted collateral to members,
So that an aborted formation doesn't trap funds and members can reclaim what they posted.

**Acceptance Criteria:**

**Given** a `Group` PDA exists with status `Forming` (i.e., contributions have not started)
**When** the Group Creator invokes `cancel_group(group)`
**Then** the `Group.status` is set to `Cancelled`
**And** any collateral posted by accepted members (via the post_collateral path that ships in Epic 3) is refundable via a corresponding withdraw — the cancel itself just flips status and unlocks the refund path
**And** the instruction rejects with `SusuError::GroupAlreadyStarted` if status is `Active` or any later state
**And** only the Group Creator can invoke; non-creator invocations reject with Anchor's signer constraint
**And** Anchor tests cover happy-path cancel, post-start rejection, non-creator rejection
**And** a `group_cancelled` `msg!` event is emitted

### Story 2.6: Group state + participation history query helpers

**GH Issue:** #29

As a Group Member or downstream developer,
I want to fetch the full state of any group I'm a member of (rotation schedule, roster, contribution history, collateral, slash status) and to query any wallet's participation history across groups,
So that the reference app and integrations can render meaningful UI and dashboards without bespoke indexing.

**Acceptance Criteria:**

**Given** the program is deployed to devnet with Stories 2.2–2.5 active
**When** a developer calls the SDK helper `getGroup(groupPda)` or `getGroupByCreator(creator, groupId)`
**Then** the helper returns a typed `Group` object with all fields decoded (mint, contribution_amount, n, members[], status)
**And** a parallel helper `getMemberPosition(group, member)` returns the `MemberPosition` for any (group, member) pair
**And** a helper `queryParticipationHistory(wallet)` returns an array of `{ group, rotation_slot, contributions, slashed, completed }` for every group the wallet has ever joined (uses `getProgramAccounts` filter on `MemberPosition` PDAs)
**And** all helpers are typed via Codama-generated types (no hand-rolled decoders)
**And** unit tests in `sdk/ts/tests/queries.test.ts` cover each helper against a mock RPC response
**And** the helpers are exported from `sdk/ts/src/index.ts` and `sdk/rust/src/lib.rs`

## Epic 3: Curve Module, Contributions & Collateral Lifecycle

Implement the **Curve Invariant** as live code: the closed-form O(n) dynamic-collateral curve module, plus the contribute / post_collateral / top_up_collateral / withdraw_collateral / slash_member instruction set with PDA vault accounts.

### Story 3.1: Implement closed-form O(n) dynamic-collateral curve module (FR9)

**GH Issue:** #30

As a Susu program developer,
I want `programs/susu/src/curve.rs` with the closed-form O(n) curve formula computing `required_collateral(rotation_slot, n, contribution_amount, mint_decimals)`,
So that every contribution and claim instruction can call into one canonical implementation and the property test in Epic 5 has a single function to validate.

**Acceptance Criteria:**

**Given** the program from Epic 2
**When** `curve.rs` is committed with `calculate_collateral(slot: u8, n: u8, contribution: u64, decimals: u8) -> Result<u64, SusuError>`
**Then** the function is `pub` and is the only place curve math exists in the entire repo
**And** all arithmetic uses `checked_add`/`checked_mul`/`checked_sub` (no `saturating_*`; `cargo deny` ruleset enforces)
**And** the function returns `SusuError::CurveOverflow` on any arithmetic overflow
**And** computational complexity is provably O(n); n is bounded ∈ [3, 12]
**And** unit tests in `#[cfg(test)] mod tests` cover known-input/known-output cases for n ∈ {3, 5, 7, 10, 12}, contribution = $50 USDC and $50 USDT (different decimals)
**And** the documented formula matches the formula referenced in `docs/collateral-curve.md` (Story 5.5) — the doc and code are kept in sync via PR review
**And** `cargo test -p susu --test curve` runs in <1s

### Story 3.2: Implement post_collateral instruction (FR10)

**GH Issue:** #31

As a Group Member,
I want a `post_collateral` instruction that calculates the curve-required collateral for my rotation slot and accepts a transfer of that amount into the group's PDA vault,
So that I can secure my position and the protocol can enforce the Curve Invariant at the program level.

**Acceptance Criteria:**

**Given** a `Group` PDA with my `MemberPosition` accepted (Story 2.4) and the curve module from Story 3.1
**When** I invoke `post_collateral(group, rotation_slot, amount)` with my keypair
**Then** the instruction calls `curve::calculate_collateral(rotation_slot, group.n, group.contribution_amount, mint.decimals)` and asserts `amount >= required`
**And** if `amount < required`, the instruction rejects with `SusuError::InsufficientCollateral`
**And** on success, an SPL Token transfer moves `amount` from my token account to the group's PDA-derived `Vault` token account
**And** `MemberPosition.collateral_posted` is updated to reflect the new total
**And** Anchor tests cover happy path (n=5 USDC, slot=2), insufficient-collateral rejection, wrong-mint rejection, and double-post (member already at full collateral) handling
**And** a `collateral_posted` `msg!` event is emitted with member + amount

### Story 3.3: Initialize PDA Vault accounts (FR14)

**GH Issue:** #32

As a Susu program developer,
I want every group's collateral and contributions to live in a deterministic PDA-derived `Vault` SPL Token account whose authority is the group PDA itself, never a user-supplied or protocol-team key,
So that the FinCEN non-custodial posture (NFR-C1) is structurally enforceable and the FinCEN check-script can statically prove no protocol-owned non-PDA token accounts exist.

**Acceptance Criteria:**

**Given** Story 3.2 expects a vault to exist
**When** `create_group` (Story 2.2) is extended to also initialize the vault token account during group creation
**Then** the vault is created at PDA seeds `[VAULT_SEED, group_pda]`
**And** the vault is an SPL Token account whose mint matches `group.mint` (USDC or USDT)
**And** the vault's authority is the group PDA itself, never a user pubkey or protocol-team key
**And** rent-exemption is paid by the Group Creator at create_group time
**And** `scripts/check-fincen-posture.sh` (Epic 1 Story 1.4) is extended/finalized to assert no token-account `init` exists with a non-PDA authority — and this assertion passes
**And** Anchor tests verify the vault PDA matches the expected derivation and that transfers in/out work correctly under PDA-signed instructions

### Story 3.4: Implement contribute instruction (FR8)

**GH Issue:** #33

As a Group Member,
I want a `contribute` instruction that transfers my scheduled contribution amount into the group vault during the active contribution period,
So that I can fulfill my rotation obligation and the group can progress.

**Acceptance Criteria:**

**Given** a `Group` PDA with status `Active` and my `MemberPosition` with collateral fully posted
**When** I invoke `contribute(group, rotation_index)` during the active contribution period
**Then** an SPL Token transfer moves `group.contribution_amount` from my token account to the vault
**And** `MemberPosition.contribution_history[rotation_index]` is set to `Contributed` with `paid_at` timestamp
**And** the instruction rejects with `SusuError::OutsideContributionWindow` if invoked before window open or after window close
**And** the instruction rejects with `SusuError::AlreadyContributed` if my history entry for this rotation is already `Contributed`
**And** the instruction rejects with `SusuError::GroupNotActive` if status != `Active`
**And** Anchor tests cover happy path, all rejection paths, and the window boundary cases (1s before open, 1s after close)
**And** a `contribution_posted` `msg!` event is emitted

### Story 3.5: Implement top_up_collateral instruction (FR11)

**GH Issue:** #34

As a Group Member,
I want a `top_up_collateral` instruction that lets me post additional collateral if curve parameters change due to a member dropout,
So that I can remain in good standing when the group's membership shifts mid-cycle.

**Acceptance Criteria:**

**Given** a `Group` PDA with `Active` status and a member dropout has triggered curve recalculation
**When** I invoke `top_up_collateral(group, additional_amount)`
**Then** the instruction recomputes my required collateral via `curve::calculate_collateral` for the post-dropout n
**And** it asserts `MemberPosition.collateral_posted + additional_amount >= new_required`
**And** if insufficient, it rejects with `SusuError::InsufficientCollateral`
**And** on success, an SPL Token transfer moves `additional_amount` to the vault
**And** `MemberPosition.collateral_posted` is updated
**And** Anchor tests cover the dropout-triggered top-up scenario and the slashing-rule interaction
**And** a `collateral_topped_up` `msg!` event is emitted

### Story 3.6: Implement slash_member instruction (FR12)

**GH Issue:** #35

As a Susu protocol enforcer (anyone — permissionless),
I want a `slash_member` instruction that, when a member fails to contribute within the grace window, slashes their collateral and distributes the slashed amount to honest members per the documented slashing rule,
So that defection is economically punished and honest members are made whole.

**Acceptance Criteria:**

**Given** a `Group` PDA where a member's `contribution_history[rotation_index]` is `NotContributed` and the grace window has closed
**When** anyone invokes `slash_member(group, defector_pubkey, rotation_index)` permissionlessly
**Then** the instruction validates that `defector` did not contribute in `rotation_index` and that the grace window is closed
**And** the slashed amount equals the collateral required for `defector`'s position per `curve::calculate_collateral`
**And** the slashed amount is transferred from the vault to honest members proportionally per the documented slashing rule (rule documented in `docs/collateral-curve.md`)
**And** `MemberPosition.slash_status` is updated to `Slashed`
**And** the instruction rejects with `SusuError::WithinGracePeriod` if the grace window is still open
**And** the instruction rejects with `SusuError::AlreadySlashed` on double-slash
**And** Anchor tests cover the 30%-cartel scenario at small scale (3-of-10 defection) and verify honest members are made whole
**And** a `member_slashed` `msg!` event is emitted

### Story 3.7: Implement withdraw_collateral instruction (FR13)

**GH Issue:** #36

As a Group Member,
I want a `withdraw_collateral` instruction that returns my unslashed collateral to my token account after the group's final rotation completes,
So that my locked funds aren't permanently trapped after my obligations are fulfilled.

**Acceptance Criteria:**

**Given** a `Group` PDA with status `Completed` (all rotations executed) or `Cancelled` (Story 2.5)
**When** I invoke `withdraw_collateral(group)`
**Then** the instruction asserts `MemberPosition.slash_status != Slashed`
**And** the instruction transfers `MemberPosition.collateral_posted` from the vault to my token account
**And** `MemberPosition.collateral_posted` is set to 0 to prevent double-withdraw
**And** the instruction rejects with `SusuError::GroupNotCompleted` if status is not `Completed` or `Cancelled`
**And** the instruction rejects with `SusuError::CollateralAlreadyWithdrawn` if collateral is already 0
**And** the instruction rejects with `SusuError::CollateralForfeited` if `slash_status == Slashed` (slashed members forfeit their collateral entirely; documented in slashing rule)
**And** Anchor tests cover happy path on Completed and Cancelled, double-withdraw, slashed-member rejection
**And** a `collateral_withdrawn` `msg!` event is emitted

### Story 3.8: Enforce all-collateralized gate before contributions can start (FR4)

**GH Issue:** #37

As a Susu protocol enforcer,
I want the protocol to refuse to transition `Group.status` from `Forming` to `Active` until every accepted member has posted their full curve-required collateral,
So that no group ever reaches the contribution stage with under-collateralized members.

**Acceptance Criteria:**

**Given** a `Group` PDA in `Forming` status with all `n` members accepted
**When** the protocol's `start_contributions` transition is attempted (whether explicit instruction or auto-trigger from the last `post_collateral` call)
**Then** the transition only completes if every `MemberPosition.collateral_posted` ≥ `curve::calculate_collateral(member.rotation_slot, n, contribution, decimals)`
**And** if any member is under-collateralized, the transition is rejected with `SusuError::NotAllCollateralized`
**And** on success, `Group.status` flips to `Active` and the first contribution period opens
**And** Anchor tests cover: all-collateralized happy path, partial-collateralization rejection, late-joining-but-fully-collateralized happy path
**And** a `group_started` `msg!` event is emitted with the start timestamp

## Epic 4: Permissionless Rotation & Payout Claim

Implement the deterministic rotation-slot algorithm and `claim_payout` with full guard surface. After this epic a complete ROSCA cycle works end-to-end on devnet with no scheduler.

### Story 4.1: Deterministic on-chain rotation-slot assignment algorithm (FR15)

**GH Issue:** #38

As a Susu protocol enforcer,
I want rotation slots assigned to members at group start using a deterministic, on-chain-reproducible algorithm,
So that no off-chain randomness or trusted oracle is required, and any auditor or judge can replay the assignment from the chain alone.

**Acceptance Criteria:**

**Given** a `Group` PDA transitioning from `Forming` to `Active` (Story 3.8)
**When** the slot-assignment routine fires
**Then** rotation slots `[0..n)` are assigned to members deterministically using `sha256(group_pda || member_pubkey || slot_seed)` ranking
**And** every `MemberPosition.rotation_slot` is updated from its placeholder (Story 2.4) to its final value
**And** the assignment is reproducible: re-running the algorithm with the same group state produces the same slot mapping byte-for-byte
**And** the algorithm is documented at `docs/rotation-assignment.md` with worked examples
**And** Anchor tests verify determinism (run twice, same output) and that all `n` slots are assigned exactly once
**And** a `slots_assigned` `msg!` event is emitted listing the (member, slot) pairs

### Story 4.2: Implement claim_payout instruction (FR16)

**GH Issue:** #39

As a Group Member designated as recipient of rotation `i`,
I want a `claim_payout(group, rotation_index)` instruction that transfers the rotation's payout from the vault to my token account, callable permissionlessly with no scheduler dependency,
So that I can collect my pot the moment my rotation's contribution period closes, with no off-chain infrastructure required.

**Acceptance Criteria:**

**Given** a `Group` PDA with `Active` status and rotation `i`'s contribution period closed
**When** the rotation-`i` recipient invokes `claim_payout(group, i)`
**Then** the instruction validates that `MemberPosition.rotation_slot == i` for the signer
**And** the instruction validates that rotation `i`'s contribution period is closed (current time > rotation start + contribution period)
**And** a `RotationReceipt` PDA at `[ROTATION_SEED, group_pda, i.to_le_bytes()]` is initialized with `recipient`, `amount`, `claimed_at`, `signature`
**And** an SPL Token transfer moves `n * group.contribution_amount` (the full pot) from the vault to the recipient's token account
**And** Anchor tests cover happy path on a 5-member full-cycle scenario
**And** a `payout_claimed` `msg!` event is emitted

### Story 4.3: claim_payout guard — non-recipient rejection (FR17)

**GH Issue:** #40

As a Susu protocol enforcer,
I want `claim_payout` to reject any wallet other than the rotation-`i` recipient,
So that no one but the slot's intended recipient can claim that pot.

**Acceptance Criteria:**

**Given** a `Group` PDA with rotation `i` ready to claim and a wallet whose `MemberPosition.rotation_slot != i`
**When** that wallet invokes `claim_payout(group, i)`
**Then** the instruction rejects with `SusuError::NotRotationRecipient`
**And** no `RotationReceipt` is created and no transfer occurs
**And** Anchor tests cover non-member wallets, wrong-slot members, and the malicious-PDA-collision edge case (an attacker tries to forge a `MemberPosition` at the recipient's slot but with their own pubkey)
**And** the test suite asserts that the program's PDA derivation prevents the malicious-PDA-collision case structurally

### Story 4.4: claim_payout guard — pre-deadline rejection (FR18)

**GH Issue:** #41

As a Susu protocol enforcer,
I want `claim_payout` to reject claims submitted before rotation `i`'s contribution period closes,
So that recipients cannot drain the vault before all members have contributed.

**Acceptance Criteria:**

**Given** a `Group` PDA in `Active` status, rotation `i` is the current rotation, and the contribution period for `i` is still open
**When** the rotation-`i` recipient invokes `claim_payout(group, i)`
**Then** the instruction rejects with `SusuError::ContributionPeriodOpen`
**And** the test verifies the rejection holds at exactly 1 second before period close (lower bound) and the success holds at 1 second after period close (upper bound)
**And** Anchor tests cover the pre-deadline rejection on multiple n values (3, 7, 10)

### Story 4.5: claim_payout guard — double-claim rejection via RotationReceipt PDA (FR19)

**GH Issue:** #42

As a Susu protocol enforcer,
I want `claim_payout` to reject double-claim attempts on the same rotation via the existence of a `RotationReceipt` PDA,
So that no rotation can ever be claimed twice and the receipt itself becomes the on-chain proof of payout.

**Acceptance Criteria:**

**Given** a successful prior `claim_payout(group, i)` call has created `RotationReceipt[i]`
**When** the same recipient invokes `claim_payout(group, i)` a second time
**Then** the instruction rejects with `SusuError::AlreadyClaimed` (the Anchor `init` constraint on the receipt PDA fails since it already exists)
**And** Anchor tests cover the same-recipient-double-claim scenario and verify no second transfer occurs
**And** the `RotationReceipt` PDA's existence-as-proof property is documented in `docs/threat-model.md` (Story 5.6)

### Story 4.6: End-to-end full ROSCA lifecycle integration test on Surfpool (FR20)

**GH Issue:** #43

As an auditor or judge,
I want a Surfpool-based integration test that runs a complete 5-member ROSCA cycle (create → invite → accept → collateralize → start → contribute → claim → ... → withdraw_collateral) entirely on-chain with no scheduler dependency anywhere in the test harness,
So that the "no scheduled-execution dependency" architectural claim (FR20) is verified end-to-end and the full happy path serves as a regression suite for all downstream changes.

**Acceptance Criteria:**

**Given** all Epic 2 + 3 + 4 instructions are implemented
**When** `anchor test --provider surfpool` runs `tests/integration/full_lifecycle.rs`
**Then** the test creates a 5-member group, invites + accepts all members, posts curve-correct collateral for each, transitions to Active, executes 5 full rotations (contribute → claim) with `claim_payout` called by each recipient at the moment their period closes
**And** all 5 `RotationReceipt` PDAs exist at the end with correct recipients and amounts
**And** all 5 members successfully `withdraw_collateral` after completion
**And** the test harness contains zero references to any scheduler, keeper, cron, or off-chain executor — every state transition is triggered by an explicit signed transaction
**And** the test runs to completion in <30 seconds
**And** the test is documented in `tests/coverage/threat-model.md` as covering the "no-scheduler-dependency" architectural assertion

## Epic 5: Curve Verification, Adversary Simulation & Public Documentation

Make the **Curve Invariant** provable, reproducible, and legible. This epic turns the central novelty claim from narrative assertion into executable artifact set.

### Story 5.1: tests/invariants/no_strategic_default.rs proptest (FR21)

**GH Issue:** #44

As an auditor or judge,
I want `tests/invariants/no_strategic_default.rs` running ≥10,000 randomized proptest cases proving `expected_default_payoff(i, curve) < 0` for every rotation slot `i ∈ [0, n)` across `n ∈ [3, 12]`, contribution ∈ [$10, $10,000], for both USDC and USDT,
So that the Curve Invariant is verifiable from a clean clone with one command and the proptest is the property-test artifact the audit firm cites by file path.

**Acceptance Criteria:**

**Given** the curve module from Story 3.1
**When** `cargo test --test no_strategic_default --release` runs
**Then** the test executes ≥10,000 cases via `proptest!` macro with strategies sampling `n ∈ [3, 12]`, `contribution ∈ [10_000_000, 10_000_000_000]` (in USDC base units), `slot ∈ [0, n)`, and decimals ∈ {6 (USDC), 6 (USDT — same decimals)}
**And** for every case, the test computes `expected_default_payoff(slot, n, contribution, decimals)` and asserts the result is strictly negative (defection is unprofitable at every slot)
**And** the test completes in ≤180 seconds on a 4-core developer laptop (NFR-P4)
**And** the test is wired into `ci.yml` and runs on every PR
**And** `cargo test --test no_strategic_default` exits 0 against the curve module's known-good state
**And** if the curve has a flaw, the test fails with a counterexample showing `n`, `slot`, `contribution`, `expected_payoff` values

### Story 5.2: susu-adversary CLI binary skeleton (FR22 part 1)

**GH Issue:** #45

As an auditor or judge,
I want a `crates/susu-adversary/` binary invokable as `cargo run --bin susu-adversary -- --circles 10000 --seed $COMMIT_SHA` that runs N randomized ROSCA lifecycles and emits a structured JSON report,
So that the protocol's central novelty claim is reproducible from a clean clone with one command.

**Acceptance Criteria:**

**Given** the program from Epics 2–4 deployed to devnet
**When** `cargo run --bin susu-adversary -- --circles 10000 --seed <hex>` runs
**Then** the binary parses CLI args (`--circles`, `--seed`, `--cluster`)
**And** it constructs a deterministic RNG seeded from `--seed`
**And** it runs 10,000 randomized lifecycles (varying n, contribution, defection patterns) against the deployed program ID via Surfpool fork
**And** it emits a JSON report at `audits/adversary/adversary-report.json` with: `run_metadata` (seed, commit_sha, circles, started_at, finished_at), `summary` (total_runs, max_defector_profit_lamports, scenarios_covered), `per_scenario_results` array
**And** the binary exits 0 if `max_defector_profit_lamports == 0`, else exits 1
**And** the binary's source includes a `README.md` explaining `--seed $COMMIT_SHA` reproducibility and how to interpret the report

### Story 5.3: 30% Cartel scenario named as headline test (FR23)

**GH Issue:** #46

As an auditor or judge,
I want the "30% Cartel" scenario (10-member circle, members 4–6 collude and default simultaneously after member 3's payout) implemented as a named module in `susu-adversary` and called out in the README headline,
So that the named falsification target is structural and any challenger has a single explicit attack vector to reproduce and probe.

**Acceptance Criteria:**

**Given** the adversary skeleton from Story 5.2
**When** the 30% Cartel scenario module lands at `crates/susu-adversary/src/scenarios/thirty_percent_cartel.rs`
**Then** the scenario sets up a 10-member circle, executes contributions through rotation 3 (member 3 receives payout), then has members 4–6 simultaneously default
**And** the scenario asserts: honest members (0–3, 7–9) are made whole from defectors' collateral; defectors (4–6) net negative; no admin intervention occurs
**And** the scenario is run as part of `susu-adversary` invocations and is named in the JSON report's `scenarios_covered` list
**And** the README.md (Epic 8) calls out "30% Cartel" by name in the badge cluster's adversary link
**And** unit tests cover the scenario's setup correctness independent of the full adversary run

### Story 5.4: Byte-deterministic adversary-report.json from --seed $COMMIT_SHA (FR22 part 2 + NFR-Re1)

**GH Issue:** #47

As an auditor or judge,
I want `audits/adversary/adversary-report.json` to be byte-reproducible from any tagged release commit SHA,
So that I can independently verify the report on a clean machine in <10 minutes and the artifact's authenticity is structural.

**Acceptance Criteria:**

**Given** the adversary binary from Story 5.2 and the 30% Cartel scenario from Story 5.3
**When** `cargo run --bin susu-adversary --release -- --circles 10000 --seed $COMMIT_SHA` runs twice on different machines from the same commit
**Then** both runs produce byte-identical `audits/adversary/adversary-report.json` files
**And** all RNG sources in the simulator are seeded only from `--seed`; no system entropy, wall-clock, or thread-id leaks into outputs (timestamps in metadata are derived from the seed, not `now()`)
**And** the report execution completes in ≤10 minutes on a 4-core developer laptop (NFR-P5)
**And** `.github/workflows/adversary.yml` runs the binary nightly on main + on every tagged release and commits the artifact if its SHA changed
**And** `audits/adversary/README.md` documents the reproduction recipe and points to the seed = $COMMIT_SHA convention
**And** the 30% Cartel scenario shows `max_defector_profit_lamports: 0` in the committed artifact

### Story 5.5: docs/collateral-curve.md formal write-up (FR24)

**GH Issue:** #48

As an auditor, judge, or curious developer,
I want `docs/collateral-curve.md` containing the closed-form formula, derivation, worked examples for n ∈ {3, 5, 10}, a proof sketch, and explicit references to `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json` by file path,
So that the math is legible and every claim links to its verifier.

**Acceptance Criteria:**

**Given** Stories 5.1 and 5.4 land
**When** `docs/collateral-curve.md` is committed
**Then** the doc contains a `## TL;DR` first section restating the Curve Invariant in one paragraph
**And** the doc contains the closed-form formula in inline LaTeX (or unambiguous notation)
**And** the doc contains a derivation section walking through the strategic-default analysis at slot `i` and showing why `expected_default_payoff(i) < 0` follows from the curve definition
**And** the doc contains worked examples for n=3, n=5, n=10 with concrete USDC numbers
**And** the doc contains a proof sketch (informal but rigorous; full formal proof is a v2 stretch goal)
**And** the doc explicitly cites `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json` by file path
**And** the doc passes a "non-cryptoeconomist comprehension" test via at least one external dev review (per PRD User Success criterion)

### Story 5.6: docs/threat-model.md + tests/coverage/threat-model.md traceability (FR25)

**GH Issue:** #49

As an auditor,
I want `docs/threat-model.md` enumerating adversary models, attack surfaces, and mitigations, plus a `tests/coverage/threat-model.md` traceability matrix mapping each documented attack to a specific test file,
So that every claimed mitigation has a verifiable test artifact.

**Acceptance Criteria:**

**Given** the program from Epics 2–4
**When** the threat-model docs land
**Then** `docs/threat-model.md` enumerates at least: strategic-default (curve), late-position cartel (30%-Cartel scenario), DoS via permissionless claim, malicious PDA collision, untrusted on-chain data deserialization, custodial path inadvertent introduction, scheduler/keeper introduction
**And** for each adversary, the doc states the attack vector, the mitigation, and the residual risk
**And** `tests/coverage/threat-model.md` is a markdown table with columns: `attack`, `mitigation`, `test_file_path` — every documented attack has at least one test file referenced
**And** every test file referenced exists at the cited path
**And** the doc lists the immutability gate as both a security feature and a constraint (no hotfixes)

### Story 5.7: docs/fincen-cvc-framing.md (FR26)

**GH Issue:** #50

As a judge, integrator, or compliance reviewer,
I want `docs/fincen-cvc-framing.md` explaining Susu's non-custodial / non-fee / non-yield posture under FinCEN 2019 CVC guidance,
So that the regulatory framing is legible without a 30-minute legal-doc dive.

**Acceptance Criteria:**

**Given** the program design's structural compliance
**When** the framing doc lands
**Then** the doc contains a `## TL;DR` explaining why Susu is not a money services business under FinCEN 2019 CVC guidance
**And** the doc enumerates the three structural clauses: (a) protocol team holds no keys to user-controlled token accounts, (b) no fee path in any instruction handler, (c) no yield-routing CPIs
**And** the doc cites `scripts/check-fincen-posture.sh` (Story 3.3 / Story 1.4) by file path as the structural enforcement
**And** the doc explicitly states what changes would forfeit the posture and require legal re-review
**And** the doc does NOT make legal claims; it explains structural posture and points to the legal opinion (Story 5.9) for the firm's letter

### Story 5.8: Audit firm engagement + report linking (FR57, NFR-S1)

**GH Issue:** #51

As Andre,
I want a documented workflow for engaging the crypto-native audit firm on Day 1, delivering the IDL freeze artifact, receiving the report, and committing it to `audits/firm-name-YYYY-MM.pdf` with README badge linkage,
So that the audit closure is operational and the report's existence becomes a live README signal.

**Acceptance Criteria:**

**Given** the IDL freeze (Epic 1 Story 1.2) and the program implementation (Epics 2–4)
**When** the audit engagement workflow runs end-to-end
**Then** `audits/README.md` exists as an index of audit artifacts, listing the firm name, scope, engagement date, expected delivery date, and post-delivery report path
**And** the audit SOW (signed Day 1) is committed at `audits/audit-sow.pdf` (or referenced if confidentiality requires summary-only)
**And** the firm receives the frozen IDL commit + property test + adversary artifact + threat model on Day 1
**And** when the report lands, it is committed at `audits/firm-name-2026-XX.pdf` and explicitly cites `tests/invariants/no_strategic_default.rs` and `audits/adversary/adversary-report.json` by file path (as required by NFR-S1)
**And** the README badge transitions from `audit-pending` to `audit-passed` (or `audit-findings-tracked` if Informational issues exist)
**And** all Informational findings are tracked as public GitHub issues with mitigation status

### Story 5.9: Legal opinion engagement + docs/legal-opinion.pdf publication (FR27)

**GH Issue:** #52

As Andre,
I want a documented workflow for engaging the crypto-native law firm on Day 1 with narrow scope (non-custodial / non-fee / non-yield posture under FinCEN 2019 CVC), receiving whatever scope they sign by submission close, and publishing it at `docs/legal-opinion.pdf`,
So that the legal-posture appendix lands by submission and the framing in `docs/fincen-cvc-framing.md` is backed by a public letter.

**Acceptance Criteria:**

**Given** the FinCEN framing doc from Story 5.7
**When** the legal engagement workflow runs end-to-end
**Then** the SOW is signed by the law firm on T+0 with narrow scope (non-custodial / non-fee / non-yield)
**And** the firm receives the FinCEN framing doc, threat model, and architecture doc as background
**And** by submission close, whatever scope the firm has signed is published at `docs/legal-opinion.pdf` (even if narrower than originally hoped)
**And** the README links directly to `docs/legal-opinion.pdf` from the badge cluster
**And** if the firm's letter is delayed past submission close, a placeholder note at `docs/legal-opinion.pdf` documents the delay and links to the SOW
**And** the engagement is logged in `/log/2026-XX-XX.md` for transparency

## Epic 6: SDK Surface, Examples & One-Command Reproducibility

Ship the Codama-generated TS + Rust clients, parity check, three composability examples, the demo + verify orchestrators. Aisha-style forking developers clone-to-deploy in one afternoon.

### Story 6.1: TS SDK (@susu/sdk) idiomatic helpers + fluent client (FR31)

**GH Issue:** #53

As an integrator,
I want `@susu/sdk` to expose idiomatic TypeScript helpers (`createGroup`, `acceptInvite`, `postCollateral`, `contribute`, `claimPayout`, `topUpCollateral`, `withdrawCollateral`, `cancelGroup`, `queryHistory`, `getGroup`, `getMemberPosition`) over a fluent `createSusuClient()` builder,
So that I can integrate Susu into a Solana app in <30 minutes.

**Acceptance Criteria:**

**Given** the Codama-generated TS surface from Epic 1 Story 1.3
**When** `sdk/ts/src/index.ts` exposes the public API
**Then** the fluent client is `createSusuClient().use(signer(...)).use(solanaDevnetRpc({...}))`
**And** every helper accepts a typed argument bag (e.g., `contribute(client, { group, amount })`) and returns a `Promise<TransactionSignature>` for state-changing instructions or a typed account for reads
**And** every helper internally calls into the Codama-generated instruction builder; no hand-rolled instruction encoding
**And** the helpers are documented inline with JSDoc; every public export has at least one runnable example in the docstring
**And** unit tests in `sdk/ts/tests/` cover each helper against a mocked RPC

### Story 6.2: SDK simulate-by-default + explicit-cluster gate (FR34, FR35)

**GH Issue:** #54

As an integrator,
I want every SDK transaction-builder helper to run `simulateTransaction` by default before requesting a signature, and to refuse mainnet sends unless `cluster: 'mainnet-beta'` is explicitly passed,
So that integrators can't accidentally send a mainnet transaction or skip simulation.

**Acceptance Criteria:**

**Given** the SDK helpers from Story 6.1
**When** any state-changing helper is invoked
**Then** the helper accepts a `simulate: boolean` parameter defaulting to `true`
**And** when `simulate: true`, the helper calls `simulateTransaction` first; on simulation failure, it throws `SusuSimulationError` with the simulation log
**And** the SDK's `createSusuClient()` requires an explicit `cluster` parameter; if `cluster: 'mainnet-beta'` is not passed and the call resolves to mainnet, the helper throws `SusuClusterError` before any transaction is built
**And** unit tests cover: simulation-success path, simulation-failure path, missing-cluster rejection, explicit-mainnet success path
**And** the behavior is documented in `docs/sdk-typescript.md` with examples

### Story 6.3: SDK error classes — typed discriminated union (ARCH-42)

**GH Issue:** #55

As an integrator,
I want `SusuError`, `SusuSimulationError`, `SusuRpcError` typed error classes that I can pattern-match on,
So that I can build robust error UX without `instanceof Error` guards on bare strings.

**Acceptance Criteria:**

**Given** the SDK helpers from Stories 6.1–6.2
**When** an error path fires
**Then** it throws an instance of `SusuError` (program-level errors decoded from Anchor `SusuError` enum), `SusuSimulationError` (simulation reported failure), or `SusuRpcError` (RPC connectivity / timeout)
**And** every error class extends `Error` and adds typed fields (`code`, `instructionName`, `simulationLogs` where applicable)
**And** never throws a bare `Error` or rejects with a string
**And** unit tests cover the error-class branching for each error type
**And** the classes are documented in `docs/sdk-typescript.md`

### Story 6.4: Codama-generated Rust client (susu-client) with same surface (FR32)

**GH Issue:** #56

As an integrator using Rust,
I want `susu-client` (crates.io) to expose the same instruction surface, account decoders, and error codes as `@susu/sdk`,
So that backend integrators have a first-class Rust path with no parity drift.

**Acceptance Criteria:**

**Given** the Codama Rust output from Epic 1 Story 1.3 and the TS SDK from Stories 6.1–6.3
**When** `cargo build -p susu-client --release` runs
**Then** the build succeeds and produces a publishable crate
**And** every TS helper has a corresponding Rust idiomatic builder with the same instruction name (in `snake_case`)
**And** every TS error class has a corresponding Rust `enum` variant via `thiserror::Error`
**And** PDA derivation in `sdk/rust/src/pdas.rs` uses the canonical `seeds` constants module, not string literals
**And** unit tests in `sdk/rust/tests/parity.rs` verify a known PDA derivation matches between TS and Rust outputs
**And** if Codama Rust renderer maturity gaps prevent full parity (per Story 1.6 spike), this story executes against the documented hand-rolled fallback and the gap is noted in `docs/codama-rust-status.md`

### Story 6.5: SDK parity CI check (FR33)

**GH Issue:** #57

As Andre and the audit firm,
I want `scripts/check-sdk-parity.sh` regenerating both SDK clients from the frozen IDL on every PR and asserting their public API surfaces are identical (instruction names, account structs, error codes),
So that drift between TS and Rust SDKs is structurally impossible.

**Acceptance Criteria:**

**Given** Stories 6.1–6.4 land
**When** a PR opens
**Then** `scripts/check-sdk-parity.sh` runs `pnpm sdk:codegen` and diffs the generated outputs against the committed `sdk/ts/src/generated/` and `sdk/rust/src/generated/`
**And** the script extracts the instruction-name list, account-struct names, and error-code names from each generated tree and asserts the sets are identical
**And** any divergence exits 1 and fails CI
**And** the parity job is wired into `.github/workflows/ci.yml`
**And** the script handles the documented edge case where Codama renames `snake_case` ↔ `camelCase` (the parity is checked at the Codama-managed mapping level, not lexical)

### Story 6.6: examples/with-privy (~200 LOC) (FR36 part 1)

**GH Issue:** #58

As Aisha (forking developer),
I want `examples/with-privy/` runnable end-to-end with one command, demonstrating Privy embedded-wallet onboarding integrated with Susu group creation + contribution,
So that I can copy-paste the integration pattern into my own fork in <30 minutes.

**Acceptance Criteria:**

**Given** the SDK and the deployed devnet program
**When** `cd examples/with-privy && pnpm install && pnpm start` runs
**Then** the example completes a mini-ROSCA cycle (1 group, 3 mock members) using Privy embedded-wallet signing
**And** the example is ≤200 LOC across all source files (excluding generated and `.env.example`)
**And** the example has its own `README.md` explaining setup, env vars, and what the integration demonstrates
**And** the example does not depend on `apps/reference` — it is independently runnable
**And** unit + e2e tests cover the example's happy path

### Story 6.7: examples/with-squads (~200 LOC) (FR36 part 2)

**GH Issue:** #59

As Aisha (forking developer),
I want `examples/with-squads/` demonstrating a Susu group governed by a Squads multisig (multisig as the Group Creator),
So that I can build governance-controlled circles by copy-pasting the pattern.

**Acceptance Criteria:**

**Given** the SDK and Squads SDK
**When** `cd examples/with-squads && pnpm install && pnpm start` runs
**Then** the example creates a Squads multisig and uses it as the Group Creator for a Susu group
**And** the example is ≤200 LOC, has its own README, and is independently runnable
**And** unit/e2e tests cover the multisig-as-creator happy path
**And** the example documents the trade-offs of multisig governance in its README

### Story 6.8: examples/with-token-extensions (~200 LOC) (FR36 part 3)

**GH Issue:** #60

As Aisha (forking developer),
I want `examples/with-token-extensions/` demonstrating Susu interop with a Token-2022 mint (with a teaser for the v2 confidential-reputation roadmap),
So that I can see how Susu composes with Token-2022 extensions without committing to v2 features.

**Acceptance Criteria:**

**Given** the SDK
**When** `cd examples/with-token-extensions && pnpm install && pnpm start` runs
**Then** the example creates a Token-2022 mint and uses it in a Susu group (where SPL Token would be used)
**And** the example is ≤200 LOC, has its own README explaining the v2 roadmap teaser, and is independently runnable
**And** the README notes that v0.1.0 supports SPL Token; Token-2022 is documented as a v2 extension path
**And** unit/e2e tests cover the Token-2022 mint compatibility

### Story 6.9: docs/integration-{partner}.md per partner (FR38)

**GH Issue:** #61

As an integrator,
I want `docs/integration-squads.md`, `docs/integration-privy.md`, `docs/integration-token-extensions.md` explaining the integration pattern for each partner,
So that I have a long-form companion to each runnable example.

**Acceptance Criteria:**

**Given** the three example repos from Stories 6.6–6.8
**When** the integration docs land
**Then** each doc has a `## TL;DR`, an architecture diagram (Mermaid or SVG), the integration walkthrough, the trade-offs section, and links to the runnable example
**And** every code example in the doc is copy-paste-runnable from a clean clone
**And** every partner SDK version is pinned in the doc and matches the example's `package.json`

### Story 6.10: pnpm susu:demo orchestrator hitting NFR-P2 ≤60s (FR37)

**GH Issue:** #62

As Aisha (forking developer) and as a CI verifier,
I want `pnpm susu:demo` to execute a complete mock ROSCA cycle (create → join → contribute → rotate → payout) against devnet in ≤60 seconds wall-clock,
So that the "60-second demo" promise is structural and CI verifies it on every main commit.

**Acceptance Criteria:**

**Given** the program deployed to devnet and the SDK published
**When** `pnpm susu:demo` runs from a clean clone
**Then** `scripts/susu-demo.sh` orchestrates a 5-member mock circle end-to-end against devnet
**And** the script outputs are structured + colored matching the UX-DR50 mock (Anchor toolchain check, Solana CLI check, devnet RPC reachable, funded keypair, group create with tx hash, members joining, rounds 1–5 with checkmarks, total wall-clock printed)
**And** the total wall-clock from invocation to "Demo complete" is ≤60s on a 4-core developer laptop with stable Helius RPC (NFR-P2)
**And** failure paths are classified into 3 buckets (RPC reachability, devnet airdrop limit, dependency mismatch) with one-line recovery hints + docs links
**And** `.github/workflows/ci.yml` runs `pnpm susu:demo` against a Surfpool fork on every main-branch commit and asserts wall-clock ≤60s

### Story 6.11: pnpm verify orchestrator hitting NFR-Re4 ≤10min (FR56)

**GH Issue:** #63

As an auditor or judge,
I want `pnpm verify` to orchestrate the full reproducibility chain (`pnpm susu:demo` + `cargo run --bin susu-adversary -- --circles 10000` + `anchor test` + IDL hash check + immutability check) on a clean clone in ≤10 minutes,
So that I can verify every README claim with one command on my machine in <10 minutes.

**Acceptance Criteria:**

**Given** Stories 5.4 and 6.10 land
**When** `pnpm verify` runs from a clean clone
**Then** `scripts/verify.sh` runs in sequence: `pnpm install`, `anchor build`, `anchor test`, `cargo test --workspace`, `cargo run --bin susu-adversary --release -- --circles 10000 --seed $COMMIT_SHA`, `pnpm susu:demo`, `scripts/check-idl-hash.sh`, `scripts/check-immutability.sh` (post-mainnet only)
**And** the total wall-clock is ≤10 minutes on a 4-core developer laptop with stable Helius RPC (NFR-Re4)
**And** `.github/workflows/verify.yml` runs `pnpm verify` in a clean Docker container on every push to main and treats any regression past 10 minutes as a release-blocker
**And** `pnpm verify` exits 0 if all checks pass; exits 1 with a structured summary on any failure
**And** the script is documented in `CONTRIBUTING.md` as the "judge/auditor reproduction recipe"

### Story 6.12: SDK + crate publishing pipeline via OIDC (ARCH-26)

**GH Issue:** #64

As a downstream integrator,
I want `@susu/sdk` published to npm and `susu-client` published to crates.io on every tagged release via GitHub Actions OIDC trusted publishing,
So that I can `pnpm add @susu/sdk` or `cargo add susu-client` from public registries without registering keys.

**Acceptance Criteria:**

**Given** the SDK packages from Stories 6.1–6.4
**When** a tag matching `v*` is pushed
**Then** `.github/workflows/release.yml` runs: verifiable Anchor Docker build → `pnpm publish @susu/sdk` via OIDC → `cargo publish -p susu-client` via OIDC → GitHub release created with attestations
**And** OIDC trusted-publisher relationships are configured in npm and crates.io (no long-lived API tokens stored as repo secrets)
**And** the release workflow asserts the IDL hash matches `IDL_FREEZE.md` before publishing (no drift releases)
**And** failed publish attempts roll back cleanly (no half-published state)
**And** the workflow is documented in `CONTRIBUTING.md` as the release procedure

## Epic 7: Reference App — Dual-Skin Multi-Locale End-Saver Experience

Ship the Next.js 15 reference app: dual-skin runtime swap, six locales, mobile-first 360px floor, mandatory transaction confirmation, accessibility surface, contribution + claim flows.

### Story 7.1: Next.js 15 reference app scaffold + provider order + Zod env loader

**GH Issue:** #65

As a reference-app developer,
I want `apps/reference/` initialized with Next.js 15 App Router, the locked provider order (`PrivyProvider > ConvexProvider > IntlProvider`) in `app/layout.tsx`, and a Zod-validated env loader at `lib/env.ts`,
So that all subsequent UX work has a coherent provider chain and missing env vars fail loudly at startup.

**Acceptance Criteria:**

**Given** the monorepo from Epic 1
**When** `pnpm dlx create-next-app@latest apps/reference --ts --app --tailwind --eslint --import-alias "@/*" --no-src-dir --use-pnpm` runs followed by manual provider wiring
**Then** `apps/reference/app/layout.tsx` nests providers in order: `PrivyProvider > ConvexProvider > IntlProvider > children`
**And** `apps/reference/lib/env.ts` exports a Zod-validated env object covering: `NEXT_PUBLIC_HELIUS_RPC_URL`, `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_CLUSTER`, `NEXT_PUBLIC_SPHERE_ENABLED`
**And** missing required env vars throw with a helpful error citing `.env.example`
**And** `apps/reference/.env.example` is committed with all required keys and dummy values
**And** `apps/reference/README.md` documents the provider order with rationale (PrivyProvider outermost so Convex queries can read auth state)
**And** `pnpm dev` starts the app on `localhost:3000` against a Surfpool fork
**And** `scripts/check-patterns.sh` is extended to assert no `process.env.*` reads outside `apps/reference/lib/env.ts`

### Story 7.2: Design tokens — tokens.css + dual-skin overrides + Tailwind config (UX-DR1–8)

**GH Issue:** #66

As a reference-app developer,
I want `lib/theme/tokens.css`, `skin-neutral.css`, `skin-diaspora.css` with the locked color/spacing/radius/shadow tokens and a Tailwind config that maps semantic names to CSS custom properties,
So that the dual-skin runtime swap works via a single `[data-skin]` attribute on `<html>` and forks edit one file to rebrand.

**Acceptance Criteria:**

**Given** Story 7.1 lands
**When** the theme tokens commit lands
**Then** `lib/theme/tokens.css` defines all tokens at `:root[data-skin="neutral"]` per UX-DR3 (`--bg`, `--surface`, `--surface-2`, `--border`, `--text`, `--text-muted`, `--primary` mint, `--secondary` cyan, `--signal` mint, `--warn`, `--danger`, `--shadow-1`, `--shadow-2`)
**And** `lib/theme/skin-diaspora.css` defines `:root[data-skin="diaspora"]` overrides per UX-DR4 (warm-tinted surfaces, copper `--primary`, terracotta `--secondary`); `--bg`, `--signal`, `--warn`, `--danger` are NOT overridden (cross-skin invariants per UX-DR2)
**And** `tailwind.config.ts` maps `colors.{bg,surface,surface2,border,text,muted,primary,secondary,signal,warn,danger}` to `rgb(var(--*) / <alpha-value>)`
**And** spacing tokens follow the 4px base scale per UX-DR6
**And** border-radius scale per UX-DR7 is in the Tailwind config (radius-sm 6, radius-md 10, etc.)
**And** Phantom-style shadows per UX-DR8 are in the Tailwind config
**And** a smoke test renders a page with `data-skin="neutral"` and `data-skin="diaspora"` and confirms `--bg` and `--signal` do NOT change between the two

### Story 7.3: Typography self-hosted via next/font + type scale + .numeric utility

**GH Issue:** #67

As a reference-app developer,
I want Geist (display), Inter (body), Geist Mono (code/amounts) self-hosted via `next/font` with the locked type scale and a `.numeric` Tailwind utility for tabular numerics,
So that no external Google Fonts request happens at runtime and amounts always render with `tnum` ligatures.

**Acceptance Criteria:**

**Given** Story 7.2 lands
**When** the typography commit lands
**Then** `apps/reference/public/fonts/` contains self-hosted Geist, Inter, Geist Mono font files (woff2)
**And** `apps/reference/lib/theme/fonts.ts` exports `next/font/local` instances for each family
**And** `app/layout.tsx` wires the font CSS variables to `<body>` (e.g., `${geist.variable} ${inter.variable} ${geistMono.variable}`)
**And** Tailwind extends `fontFamily.{sans, display, mono}` to use the CSS variables
**And** the type scale per UX-DR10 is committed as utility classes (e.g., `.text-display-1` → 56/64)
**And** a `.numeric` utility class applies `font-feature-settings: 'tnum' on, 'lnum' on`
**And** a smoke test confirms no `fonts.googleapis.com` request is issued in production builds
**And** Noto Sans Yoruba and Noto Sans Arabic are wired as fallbacks per UX-DR9 multilingual chain

### Story 7.4: shadcn/ui primitives copied + reskinned via tokens (UX-DR24)

**GH Issue:** #68

As a reference-app developer,
I want shadcn/ui primitives (Button, Dialog, Input, Label, Textarea, Select, Combobox, Tooltip, Popover, DropdownMenu, Tabs, Card, Badge, Toast, Skeleton, Switch, Checkbox, RadioGroup, Progress, Avatar, ScrollArea, Separator) copied into `components/ui/` and reskinned to use my token system,
So that I have a battle-tested primitive layer that respects my dual-skin theming.

**Acceptance Criteria:**

**Given** Story 7.2 lands
**When** the shadcn primitives commit lands
**Then** `apps/reference/components/ui/` contains all 21 shadcn primitives listed in UX-DR24
**And** every primitive uses semantic Tailwind classes (`bg-surface`, `text-text`, `border-border`) that map to CSS custom properties — no hardcoded color values
**And** the Button variants per UX-DR38 (primary, secondary, ghost, destructive, link) are wired with appropriate token mappings
**And** size variants (sm 32, md 40, lg 48) are applied
**And** a Storybook-or-equivalent component preview page at `/[locale]/dev/components` renders every primitive in both skins (gated behind a `NEXT_PUBLIC_DEV_PAGES=true` env flag)
**And** the focus-visible ring (UX-DR28) is wired on every interactive primitive

### Story 7.5: <SkinToggle /> with cookie + localStorage persistence + server-side hydration

**GH Issue:** #69

As a forking developer or end-saver,
I want a `<SkinToggle />` pill control in the top nav that switches `data-skin` on `<html>` with a 300ms animated palette transition, persists via cookie (server-readable source of truth) plus localStorage sync, and prevents flash-of-unstyled-content,
So that the dual-skin claim is operationally proven and switching between skins feels instant.

**Acceptance Criteria:**

**Given** Stories 7.2–7.4 land
**When** the SkinToggle commit lands
**Then** `components/susu/SkinToggle.tsx` renders a pill with two segments (Neutral / Heritage), animated thumb, `role="radiogroup"`, keyboard-navigable
**And** clicking a segment writes `data-skin` to `<html>`, sets a `skin` cookie (max-age 1 year), and syncs localStorage
**And** the CSS-custom-property transition lasts 300ms on regular preference; instant when `prefers-reduced-motion: reduce` is set
**And** server-side rendering reads the `skin` cookie in `app/layout.tsx` and sets `data-skin` on the initial HTML response — no client-side flash
**And** Zustand store at `lib/stores/skin.ts` mirrors the cookie state for client components
**And** Playwright tests cover: switch toggles palette, cookie persists across reloads, server render matches cookie value (no FOUC)

### Story 7.6: Top nav with always-visible <ClusterPill /> + locale dropdown + skin toggle + wallet status

**GH Issue:** #70

As any reference-app user,
I want a top nav containing the logo, the always-visible `<ClusterPill />`, the `<SkinToggle />`, the locale dropdown, and wallet status — collapsing into a hamburger on mobile while keeping the cluster pill visible,
So that the active cluster is unmissable (FR47, NFR-S8) and core controls are reachable on every screen.

**Acceptance Criteria:**

**Given** Stories 7.4–7.5 land
**When** the top nav commit lands
**Then** `components/susu/TopNav.tsx` renders on every reference-app route including `/404`
**And** `components/susu/ClusterPill.tsx` shows `devnet` (mint background) or `mainnet-beta` (mint + border) per UX-DR16; the *label* is the source of truth, not the color
**And** the locale dropdown lists all 6 locales (en, vi, ar, es, yo, ht-kreyol) with native names
**And** the wallet status shows: not-connected, Privy email account, Wallet-Standard wallet, with disconnect action
**And** on mobile (<768px), the nav collapses non-cluster items into a hamburger menu; the ClusterPill remains visible at all times
**And** Playwright tests verify ClusterPill visibility on every route including `/404`

### Story 7.7: next-intl multi-locale routing — en + vi live, 4 stubs (FR43)

**GH Issue:** #71

As an end-saver or forking developer,
I want next-intl middleware routing locales at `/[locale]/...` with English baseline + Vietnamese fully populated and ar/es/yo/ht-kreyol as committed stubs,
So that Linh's flow renders in Vietnamese and translators can populate the other locales without code changes.

**Acceptance Criteria:**

**Given** Story 7.1 lands
**When** the i18n routing commit lands
**Then** `apps/reference/messages/en.json` contains the full English baseline with all UI strings keyed
**And** `apps/reference/messages/vi.json` contains the full Vietnamese translation
**And** `apps/reference/messages/{ar,es,yo,ht-kreyol}.json` exist as stubs with all keys present and English fallback values, per UX-DR47 (community translators populate later)
**And** `apps/reference/lib/i18n/config.ts` configures next-intl with cookie-based locale persistence; default locale = `en`
**And** the locale dropdown switches without full-page reload; CSS `dir="rtl"` flips for Arabic; `lang` attribute on `<html>` updates
**And** all components use `useTranslation()` (or next-intl equivalent); no string literals in component JSX (UX-DR46)
**And** Playwright tests verify locale switching, RTL flip for `ar`, and that `lang` attribute updates

### Story 7.8: i18n parity check + workflow + CONTRIBUTING-TRANSLATIONS.md (FR48, FR49, FR50)

**GH Issue:** #72

As a translator,
I want `scripts/check-i18n-parity.ts` asserting every locale bundle has all keys present in the English baseline, plus a `.github/workflows/i18n-parity.yml` running on every PR touching `messages/*.json`,
So that locale PRs cannot ship broken (missing keys) and translators have CI feedback within seconds.

**Acceptance Criteria:**

**Given** Story 7.7 lands
**When** the i18n parity check commit lands
**Then** `scripts/check-i18n-parity.ts` reads `messages/en.json` as the source of truth and asserts every other locale file has the identical key set (recursive, including nested keys)
**And** missing keys cause the script to exit 1 with a structured list of `(locale, missing_key)` pairs
**And** extra keys (in a non-English locale that aren't in English) also fail the script
**And** `.github/workflows/i18n-parity.yml` runs the script on every PR touching `apps/reference/messages/*.json`
**And** `CONTRIBUTING-TRANSLATIONS.md` (Epic 1 Story 1.5) is extended with the parity-check error format and the recovery workflow
**And** the script handles ICU MessageFormat plural/select branches correctly (parity at the key level, not the branch level)

### Story 7.9: Privy email-onboarding integration + Wallet-Standard fallback (FR39, FR46)

**GH Issue:** #73

As Linh (end-saver),
I want to sign in via Privy email-based embedded wallet without needing a seed phrase or browser extension, with Wallet-Standard browser-extension wallets (Phantom, Backpack, Solflare) as the fallback,
So that I can use Susu without prior crypto experience and forks can offer either path.

**Acceptance Criteria:**

**Given** Story 7.6 lands
**When** the Privy + Wallet-Standard integration commit lands
**Then** `apps/reference/lib/auth/privy.ts` configures `@privy-io/react-auth/solana` for embedded-wallet signing
**And** the signin page (`app/[locale]/login/page.tsx`) shows the Privy email entry as the primary CTA and "Use a wallet extension" as the secondary CTA
**And** the Wallet-Standard fallback uses `@solana/react-hooks` for browser-extension wallet discovery
**And** if Privy is unavailable (provider error or `NEXT_PUBLIC_PRIVY_APP_ID` not set), the app falls back to Wallet-Standard-only without crashing (NFR-R2)
**And** the signing surface integrates with the SDK's `Signer` abstraction (Story 6.2) so the same code paths work for both
**And** Playwright tests cover: Privy email happy path (mocked), Wallet-Standard happy path (mocked), Privy-unavailable fallback to Wallet-Standard

### Story 7.10: <TransactionConfirmModal /> with simulation result block (FR40, FR41 prerequisite)

**GH Issue:** #74

As Linh (end-saver),
I want every state-changing action to open a `<TransactionConfirmModal />` showing recipient (truncated PDA, click-to-expand), amount (mint accent on token), token (with explorer link), network fee, cluster pill, and the simulation result before requesting signature,
So that I never sign blind and every action has a single explicit confirmation surface.

**Acceptance Criteria:**

**Given** Stories 7.4–7.9 land
**When** the TransactionConfirmModal commit lands
**Then** `components/susu/TransactionConfirmModal.tsx` accepts a typed action descriptor (recipient, amount, token, fee, cluster, action label) and the SDK's prepared transaction
**And** on mount, it calls `simulateTransaction` via the SDK and displays loading state, then `Will succeed ✓` (mint) or `Will fail: <reason>` (danger) result
**And** the Confirm button is disabled until simulation result returns
**And** the modal traps focus, has `aria-modal="true"`, `<dialog>` semantic, escape closes (except mid-signing per UX-DR42)
**And** the modal is full-screen on mobile (<640px), centered card on tablet+
**And** simulation result is announced via `aria-live="polite"` for screen readers
**And** Playwright tests cover: simulation-success path → sign → confirmed; simulation-failure path → cannot confirm; mid-signing state cannot escape
**And** the modal supports variants by action type (contribute / claim / top-up / withdraw / cancel-group) with appropriate label and copy

### Story 7.11: <RotationCard />, <MemberAvatar />, <CurveVisualizer /> static-svg

**GH Issue:** #75

As Linh (end-saver),
I want a `<RotationCard />` showing my group's roster (8 avatars, current-recipient highlighted in mint), my position, my next action, and the curve-required collateral with a tooltip linking to a static SVG curve plot,
So that the group's state is legible at a glance and the curve novelty is one tap away.

**Acceptance Criteria:**

**Given** Story 7.10 lands
**When** the visualization-component commit lands
**Then** `components/susu/RotationCard.tsx` renders group name, ClusterPill, member avatar list (current-recipient highlighted in mint), current month / total months, member's position with their next action ("Contribute by Dec 1" / "Claim now"), and curve-required collateral with tooltip
**And** `components/susu/MemberAvatar.tsx` generates a deterministic dicebear-style SVG from the wallet pubkey hash; mint-tinted in neutral skin, copper-tinted in diaspora
**And** `components/susu/CurveVisualizer.tsx` ships in `static-svg` variant for the README hero — pure SVG, no JS, animated on scroll-into-view; respects `prefers-reduced-motion`
**And** the CurveVisualizer accepts `size: sm | md | lg` (320×120 / 480×180 / 720×320) and `variant: default | interactive | cartel | static-svg`
**And** the CurveVisualizer has `role="img"` + `aria-label` and a hidden `<table>` with the same data for screen readers (UX-DR12)
**And** the RotationCard has compact (mobile) and expanded (desktop) variants
**And** the RotationCard has states: active / awaiting-start / completed / slashed

### Story 7.12: Supporting components — <CodeBlock />, <ReceiptCard />, <Banner />, <FieldError />

**GH Issue:** #76

As any reference-app user,
I want supporting components for code surfaces, persistent receipts, degraded-state banners, and inline form errors,
So that the rest of the UX has the building blocks for confirmation, feedback, and error recovery.

**Acceptance Criteria:**

**Given** Story 7.4 lands
**When** the supporting-components commit lands
**Then** `components/susu/CodeBlock.tsx` renders Geist Mono with Shiki syntax highlighting, language toggle (TS/Rust/curl), copy-on-click button, optional "verified at $COMMIT_SHA" subtext (UX-DR19)
**And** `components/susu/ReceiptCard.tsx` is a permanent UI element showing tx signature with explorer link, "what's next" guidance, and the action's outcome — never replaces a receipt with a toast (UX-DR21, UX-DR39)
**And** `components/susu/Banner.tsx` renders in `--warn` color for degraded states (RPC fallback, audit pending, on devnet) with optional dismiss button (UX-DR22)
**And** `components/susu/FieldError.tsx` renders inline form errors in `--danger` color with `aria-describedby` linkage to the input (UX-DR23)
**And** all four components have unit + accessibility tests
**And** all four respect both skins via tokens

### Story 7.13: Convex schema + group metadata + isolation lock (ARCH-30, ARCH-31)

**GH Issue:** #77

As a reference-app developer,
I want Convex schema for `groupMetadata`, `inviteLinks`, `memberDisplayNames` tables with GDPR Article 17 erasure mutation, and a structural import-isolation rule that no file outside `apps/reference/lib/convex/` may import `convex/*`,
So that PII is minimized, locale + display-name metadata is editable, and the on-chain protocol remains 100% functional with Convex absent.

**Acceptance Criteria:**

**Given** Story 7.1 lands
**When** the Convex commit lands
**Then** `apps/reference/convex/schema.ts` defines the three tables per ARCH-30
**And** `apps/reference/convex/groups.ts` exports query + mutation functions for group metadata
**And** an `eraseUserData` mutation deletes all rows in `memberDisplayNames` for a given pubkey (Article 17 erasure)
**And** `apps/reference/lib/convex/{client.ts, use-group-metadata.ts, use-invite-link.ts}` are the only files that import from `convex/*` or `@convex-dev/*`
**And** `scripts/check-patterns.sh` is extended to grep for `convex/` imports outside `apps/reference/lib/convex/` and fail CI on violation
**And** Playwright tests confirm: when `NEXT_PUBLIC_CONVEX_URL` is unset, the on-chain join + contribute + claim flows still complete (Convex is non-blocking metadata, not a hard dep)

### Story 7.14: One-tap Contribute flow (FR40)

**GH Issue:** #78

As Linh (end-saver),
I want a one-tap Contribute action that opens the TransactionConfirmModal, signs via Privy, and renders a persistent ReceiptCard with explorer link and next-action guidance,
So that I can fulfill my monthly contribution in seconds without ever signing blind.

**Acceptance Criteria:**

**Given** Stories 7.9–7.12 land
**When** Linh taps "Contribute" from the RotationCard
**Then** the TransactionConfirmModal opens showing: recipient (vault PDA), amount (e.g., "50.00 USDC"), token (USDC mint with explorer link), network fee (~0.0001 SOL), cluster (devnet pill), simulation result
**And** on Confirm, the SDK's `contribute()` helper signs via the Privy signer
**And** on success (median ≤3s, p95 ≤5s per NFR-P3), the modal closes and a ReceiptCard renders with the tx signature, explorer link, "Next contribution: <date>", and "Claim date: <date>"
**And** on failure (RPC error, wallet error, simulation failure), the modal stays open with a classified error and recovery action (retry, switch RPC, reconnect wallet)
**And** Playwright tests cover the happy path on devnet (mocked) and each failure classification

### Story 7.15: One-tap Claim Payout flow (FR41)

**GH Issue:** #79

As Linh (end-saver),
I want a one-tap Claim Payout action analogous to Contribute,
So that I can collect my pot the moment my rotation closes with no scheduler waiting.

**Acceptance Criteria:**

**Given** Stories 7.9–7.12 land and Story 7.14's pattern is established
**When** Linh taps "Claim now" from the RotationCard (visible only when she is the rotation `i` recipient and the contribution period is closed)
**Then** the TransactionConfirmModal opens showing: recipient (Linh's token account), amount (full pot, e.g., "400.00 USDC"), token, network fee, cluster, simulation result
**And** on Confirm, the SDK's `claimPayout()` helper signs via the Privy signer
**And** on success, the modal closes and a ReceiptCard renders with the tx signature, explorer link, "Withdraw collateral after: <final rotation date>"
**And** the Claim button only appears when `MemberPosition.rotation_slot == current_rotation_index` AND contribution period has closed AND no `RotationReceipt` exists for this rotation
**And** Playwright tests cover the happy path (Linh as recipient at the right time) and the negative paths (non-recipient sees no button, recipient sees disabled button before period close)

### Story 7.16: Helius RPC fallback to public + Sphere on-ramp optional flag

**GH Issue:** #80

As any reference-app user,
I want the app to fall back to a public Solana RPC if the configured Helius RPC URL is unreachable (with a `<Banner />` indicating degraded performance), and to expose a Sphere fiat on-ramp behind an optional flag that's disabled on the demo happy-path,
So that RPC outages don't break the app and forks can choose whether to enable fiat on-ramp.

**Acceptance Criteria:**

**Given** Stories 7.12 (Banner) lands
**When** the resilience commit lands
**Then** `apps/reference/lib/susu-client/client.ts` configures the SDK with Helius as the default RPC and a public Solana RPC URL as the fallback
**And** RPC error detection triggers automatic fallback after 1 retry with exponential backoff (1s → 3s)
**And** when fallback is active, a `<Banner />` renders in `--warn` color with "On public RPC — performance may be reduced"
**And** the Sphere on-ramp/off-ramp is gated behind `NEXT_PUBLIC_SPHERE_ENABLED=true`; default is `false`
**And** when Sphere is enabled, a "Fund wallet" button appears in the join flow (Linh's Story 7.20 path)
**And** when Sphere is disabled, the join flow proceeds without on-ramp UI; the demo happy-path is Sphere-disabled (NFR-R3, FR44)
**And** Playwright tests cover: Helius success, Helius failure → public fallback with banner, Sphere enabled vs disabled

### Story 7.17: Mobile-first responsive layout 360px floor + breakpoints + Playwright visual regression

**GH Issue:** #81

As Linh (end-saver) on a 360px Android handset,
I want every page to be fully usable without horizontal scroll on a 360px viewport with bottom-anchored primary CTAs and full-screen dialogs,
So that the mobile floor is honored as a P0 constraint, not a fallback.

**Acceptance Criteria:**

**Given** all prior Epic 7 stories
**When** the responsive-layout commit lands
**Then** every page renders without horizontal scroll on a 360×640 viewport
**And** primary CTAs are bottom-anchored within thumb-reach on mobile (UX-DR34)
**And** dialogs are full-screen on mobile (<640px) and centered cards on tablet+
**And** the breakpoint usage follows UX-DR35 (sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536); max content widths 1200 docs / 1440 reference app
**And** tablet (md+) renders the group dashboard in 2 columns; desktop (lg+) renders 3 columns where appropriate (UX-DR36)
**And** Playwright visual regression tests cover iPhone SE (320), iPhone 14 (390), Pixel 6 (412), iPad (768), Desktop (1440) — runs on every PR
**And** touch targets are ≥44×44 minimum, ≥48×48 for primary mobile CTAs (UX-DR29)

### Story 7.18: Accessibility surface — WCAG 2.1 AA + RTL + reduced-motion + axe-core CI + non-crypto pilot

**GH Issue:** #82

As any user including those using a screen reader, keyboard-only navigation, RTL languages, or motion-sensitive preferences,
I want WCAG 2.1 AA conformance with focus rings, skip-to-content, ARIA live regions, RTL support via logical CSS properties, reduced-motion handling, and `@axe-core/playwright` CI enforcement, plus a pre-submission pilot test with 3 non-crypto users (Vietnamese-speaker, Arabic-speaker, English-speaker),
So that the reference app is genuinely accessible and the dual-skin/multi-locale claim isn't accessibility-broken.

**Acceptance Criteria:**

**Given** all prior Epic 7 stories
**When** the accessibility commit lands
**Then** focus-visible rings (2px mint at 2px offset per UX-DR28) are wired on every interactive element
**And** every page has a skip-to-content link as the first focusable element (UX-DR30)
**And** `aria-live="polite"` is wired for non-critical state changes (locale switched, copy succeeded); `aria-live="assertive"` for errors and critical state changes (UX-DR31)
**And** all animations respect `prefers-reduced-motion: reduce` per UX-DR32 (palette transitions instant, curve animations static, modal entry instant)
**And** all layouts use Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`); `scripts/check-patterns.sh` greps for `ml-`/`mr-`/`pl-`/`pr-`/`left-`/`right-` and fails CI on any match (UX-DR33)
**And** RTL locales (Arabic) flip directional icons via `[dir="rtl"]` CSS overrides; tabular numerics remain LTR
**And** `@axe-core/playwright` runs in CI on every PR and fails the build on AA violations (UX-DR27)
**And** the contrast ratios per UX-DR table are documented at `docs/accessibility-contrast.md` and verified
**And** before submission, 3 non-crypto users complete the full Linh-style flow on mobile (one Vietnamese-speaker, one Arabic-speaker, one English-speaker); findings + fixes documented in `/log` (UX-DR49)

## Epic 8: README Hero, Demo Video & Submission Marketing Surface

Ship the public-facing surface that wins the 30-second judge scan.

### Story 8.1: README first-viewport with badge architecture (FR52, UX-DR25)

**GH Issue:** #83

As Marcus (judge),
I want the README first viewport to show — without scrolling on a 1440px display — the project name, one-line description, badge row (audit / MIT / devnet / mainnet / "10K passed" / "Upgrade burned" / CI), copy-on-click `pnpm susu:demo` block, watch-60s-demo + fork-on-github CTAs, curve-novelty hook line, and inline animated SVG curve plot,
So that I can score against Section 8 in 30 seconds.

**Acceptance Criteria:**

**Given** all prior epics seed the artifacts the badges link to
**When** the README hero commit lands
**Then** the README first viewport contains all elements per UX-DR25 in the documented order
**And** the H1 uses Geist Display 56/64 styling rendered via GitHub-flavored markdown plus an inline SVG hero block
**And** the audit badge links to `audits/firm-name-2026-XX.pdf` (or shows `audit-pending` state pre-delivery)
**And** the "10K adversarial circles passed" badge links to `audits/adversary/adversary-report.json`
**And** the "Upgrade authority: burned" badge is `pending` until mainnet deploy + immutability gate fires (Epic 9), then transitions to `verified`
**And** the copy-on-click `pnpm susu:demo` block embeds the wall-clock subtext from CI (e.g., "demo took 47s last verified at $COMMIT_SHA")
**And** the inline animated SVG curve plot is rendered via `<CurveVisualizer />` static-svg variant
**And** the README renders correctly on GitHub.com (no broken images, no missing badges, no horizontal scroll on mobile GitHub)

### Story 8.2: <AdversaryBadge /> server-rendered from latest report (UX-DR17, ARCH-36)

**GH Issue:** #84

As Marcus (judge),
I want the "10,000 adversarial circles passed ✓" badge to be server-rendered from the latest `audits/adversary/adversary-report.json`, showing `verified` if `max_defector_profit_lamports == 0`, `pending` if no recent run, `failed` otherwise,
So that the badge is a live signal of the current state, not a static SVG that could be stale.

**Acceptance Criteria:**

**Given** Story 5.4 commits the adversary artifact
**When** the AdversaryBadge route lands
**Then** `apps/reference/app/api/badge/adversary/route.ts` reads the latest `audits/adversary/adversary-report.json` from the repo (committed file, not network) and returns an SVG response
**And** the SVG shows "10,000 adversarial circles passed ✓" in mint when verified, "Pending verification" in warn when no recent run, "FAILED — view report" in danger when `max_defector_profit_lamports > 0`
**And** the route caches the SVG with appropriate cache headers and revalidates on push (Vercel ISR)
**And** the README badge URL points to this route (e.g., `https://susu.protocol/api/badge/adversary`)
**And** unit tests cover the three badge states

### Story 8.3: <UpgradeBurnedBadge /> server-rendered from solana program show (UX-DR18, ARCH-37)

**GH Issue:** #85

As Marcus (judge),
I want the "Upgrade authority: burned ✓" badge to be server-rendered from `solana program show $PROGRAM_ID --url mainnet-beta`, showing `verified` only when the upgrade authority equals the System Program incinerator,
So that the immutability claim is a live RPC-verified signal, not a static badge.

**Acceptance Criteria:**

**Given** Story 5.4 establishes the AdversaryBadge pattern
**When** the UpgradeBurnedBadge route lands
**Then** `apps/reference/app/api/badge/upgrade-burned/route.ts` calls `solana program show $PROGRAM_ID --url mainnet-beta` (or equivalent RPC) and returns an SVG response
**And** the SVG shows "Upgrade authority: burned ✓" in mint when authority == `1nc1nerator11111111111111111111111111111111`
**And** the SVG shows "Upgrade: <authority>" in warn when authority is any other address
**And** the SVG shows "Mainnet pending audit" in muted when no mainnet program is deployed yet (pre-Epic 9)
**And** the route caches with Vercel ISR; revalidates on push
**And** the README badge URL points to this route
**And** unit tests cover the three badge states (pending mainnet, deployed but not burned, deployed + burned)

### Story 8.4: Inline animated SVG curve plot + <CurveVisualizer /> interactive variant

**GH Issue:** #86

As any developer or judge,
I want the README's inline animated SVG curve plot to render natively on GitHub (no JS) and an interactive `<CurveVisualizer />` variant to live in the docs and `/[locale]/docs/curve` route for parameter exploration,
So that the curve is legible at first scan and explorable on a follow-up click.

**Acceptance Criteria:**

**Given** Stories 7.11 (static-svg variant) and 8.1 land
**When** the interactive variant commit lands
**Then** the README's curve SVG is animated via SMIL or CSS @keyframes (no JS) and renders correctly in GitHub's rendering pipeline
**And** `components/susu/CurveVisualizer.tsx` interactive variant supports parameter sliders for `n` (3–12) and `contribution` ($10–$10,000)
**And** the interactive variant exposes a "30% Cartel" toggle that highlights positions 4–6 in coral with a labeled callout (UX-DR12)
**And** the docs page at `app/[locale]/docs/curve/page.tsx` embeds the interactive variant
**And** Playwright tests cover the parameter sliders, the cartel toggle, and the reduced-motion fallback

### Story 8.5: README link cluster (FR53)

**GH Issue:** #87

As Marcus (judge), Aisha (forking dev), or Priya (auditor),
I want the README to link directly to `docs/collateral-curve.md`, `audits/adversary/adversary-report.json`, `docs/legal-opinion.pdf`, the most recent `/log` entry, and at least one ecosystem-partner reference page,
So that every claim is one click from its verifier.

**Acceptance Criteria:**

**Given** Stories from Epics 5, 7, and 8.1 land
**When** the README link cluster commit lands
**Then** the README contains a "Verify every claim" or similarly-titled section linking to: `docs/collateral-curve.md`, `audits/adversary/adversary-report.json`, `docs/legal-opinion.pdf`, the latest `/log/YYYY-MM-DD.md` entry (auto-resolved at build time or referenced via `log/latest.md` symlink), and at least one ecosystem-partner reference (Squads, Privy, Helius, or Token Extensions citing Susu)
**And** the latest-log link is updated either automatically via a CI step or via a `log/latest.md` symlink that's pushed alongside each daily entry
**And** the ecosystem-partner reference is confirmed by submission close (Story 8.7)
**And** all links are tested via a markdown-link-checker CI step that fails on broken links

### Story 8.6: 60-90s demo video production + embed (FR54, UX-DR26)

**GH Issue:** #88

As Marcus (judge) and Aisha (forking dev),
I want a 60-90 second demo video embedded in the README showing rotating-money animation → curve explainer → integration code shown live → fork-me CTA, with both reference-app skins visible briefly and English + Vietnamese subtitles,
So that the headline narrative lands in 60 seconds.

**Acceptance Criteria:**

**Given** all prior epics provide the visual material
**When** the demo video commit lands
**Then** the video is recorded at 60–90 seconds total length
**And** the opener voiceover or title card matches the PRD design-principles voice (e.g., "Your grandma's savings circle, on a blockchain, with the math worked out this time")
**And** the video shows: rotating-money animation (≈10s) → curve explainer with the static SVG plot (≈20s) → live integration code from `examples/with-privy/index.ts` typed on screen (≈20s) → both skins briefly toggled in the reference app (≈10s) → fork-me CTA
**And** English and Vietnamese subtitles are committed as `.vtt` files alongside the video
**And** the video is hosted both on YouTube (for low-friction embed) and self-hosted at `apps/reference/public/demo.mp4` (for offline / forking)
**And** the README embeds the video with a click-to-play poster image
**And** the video file size is ≤25MB to fit within reasonable repo norms (or it's stored via Git LFS / hosted externally with the link in README)

### Story 8.7: Ecosystem partner reference outreach + landing

**GH Issue:** #89

As Andre,
I want at least one ecosystem partner (Squads, Privy, Helius, or Token Extensions team) to publicly cite Susu in their docs or social media before submission close,
So that the tertiary success criterion (ecosystem partner public reference) is hit and the README can link to a real partner page.

**Acceptance Criteria:**

**Given** Stories 6.6–6.8 ship the runnable partner integration examples
**When** the partner outreach workflow runs
**Then** Andre opens outreach to all four partner candidates (Squads, Privy, Helius, Token Extensions) on T+0 with the runnable example as the asset
**And** by submission close, at least one partner has either (a) tweeted/posted publicly citing Susu, (b) added a doc page or example referencing Susu, or (c) signed a public reference letter
**And** the partner reference URL is committed in the README's link cluster (Story 8.5)
**And** if no partner confirms by submission close, the "ecosystem partner reference" item is dropped from the README without breaking other badges (per PRD nice-to-have cut #5)
**And** outreach attempts and outcomes are documented in `/log/` entries

## Epic 9: Mainnet Deploy & Immutability Gate

Once audit closes with zero Critical / zero High, deploy to mainnet, burn the upgrade authority, wire the immutability check.

### Story 9.1: Audit sign-off gate verification (NFR-S1)

**GH Issue:** #90

As Andre,
I want a documented gate that blocks mainnet deploy until the audit firm's report shows zero Critical and zero High findings,
So that NFR-S1 is structurally enforced and Susu cannot accidentally ship to mainnet pre-audit.

**Acceptance Criteria:**

**Given** the audit engagement workflow from Story 5.8
**When** the gate-verification commit lands
**Then** `scripts/check-audit-passed.sh` reads the audit firm's report metadata (a structured `audits/audit-summary.json` committed alongside the PDF) and asserts `critical == 0 && high == 0`
**And** the script exits 1 if any Critical or High finding is unresolved
**And** `.github/workflows/release.yml` runs this script before any mainnet-related deploy job and blocks the workflow on failure
**And** the script is documented in `CONTRIBUTING.md` as the audit-passed precondition

### Story 9.2: Mainnet deploy with upgrade authority burned at deploy

**GH Issue:** #91

As Andre,
I want a documented mainnet deploy procedure that deploys the program and sets the upgrade authority to the System Program incinerator (`1nc1nerator11111111111111111111111111111111`) atomically,
So that the immutability gate fires structurally with no human-error window between deploy and burn.

**Acceptance Criteria:**

**Given** Story 9.1's gate passes
**When** the mainnet deploy commit lands
**Then** `scripts/deploy-mainnet.sh` runs `solana program deploy --upgrade-authority 1nc1nerator11111111111111111111111111111111` (or equivalent atomic deploy + burn)
**And** post-deploy, `solana program show $PROGRAM_ID --url mainnet-beta` returns the incinerator as the upgrade authority
**And** the deploy is tagged at `v0.1.0-mainnet` with the program ID committed at `MAINNET_PROGRAM_ID.md`
**And** the deploy log is captured in `/log/2026-XX-XX.md` with full output for transparency
**And** the deploy script is documented in `CONTRIBUTING.md` as the irreversible mainnet ceremony

### Story 9.3: scripts/check-immutability.sh + immutability-check.yml workflow (FR30)

**GH Issue:** #92

As Marcus (judge), Priya (auditor), or any integrator,
I want `.github/workflows/immutability-check.yml` running on every push to main post-mainnet, asserting via RPC that the upgrade authority remains the incinerator and the deployed IDL hash matches `IDL_FREEZE.md`,
So that the immutability claim is a live, structurally-asserted signal — not a one-time deploy event.

**Acceptance Criteria:**

**Given** Story 9.2 lands the mainnet deploy
**When** the immutability-check commit lands
**Then** `scripts/check-immutability.sh` runs `solana program show $MAINNET_PROGRAM_ID --url mainnet-beta` and asserts the upgrade authority equals `1nc1nerator11111111111111111111111111111111`
**And** the script runs `anchor idl fetch $MAINNET_PROGRAM_ID --url mainnet-beta`, computes its SHA-256, and asserts equality with the hash in `IDL_FREEZE.md`
**And** any mismatch on either assertion exits 1 and fails CI
**And** `.github/workflows/immutability-check.yml` runs the script on every push to main (post-mainnet only; gated on existence of `MAINNET_PROGRAM_ID.md`)
**And** the workflow status badge is wired to the README

### Story 9.4: <UpgradeBurnedBadge /> wired live + tagged release v0.1.0-mainnet

**GH Issue:** #93

As Marcus (judge),
I want the README's "Upgrade authority: burned ✓" badge to flip from `pending` to `verified` the moment Story 9.3's CI run succeeds against the live mainnet program ID, and a tagged release `v0.1.0-mainnet` to land with all the artifacts,
So that the badge IS the assertion and the release is the canonical-primitive moment.

**Acceptance Criteria:**

**Given** Stories 9.2 and 9.3 land
**When** the live-badge wiring commit lands
**Then** `apps/reference/app/api/badge/upgrade-burned/route.ts` (Story 8.3) is wired to the live mainnet program ID via `MAINNET_PROGRAM_ID.md`
**And** the badge transitions from `pending` to `verified` automatically when the immutability-check workflow first succeeds against mainnet
**And** the GitHub tag `v0.1.0-mainnet` is created with release notes citing: program ID, audit report path, adversary artifact, IDL hash, legal opinion path, deployed-at timestamp
**And** the release-notes call out the irreversible nature of the upgrade burn (no hotfixes; bugs require `susu-v2` redeploy at new program ID)
**And** `/log/2026-XX-XX.md` documents the moment the badge first flipped — this is the canonical "Susu became infrastructure" log entry

