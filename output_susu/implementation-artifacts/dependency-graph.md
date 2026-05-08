# Story Dependency Graph
_Last updated: 2026-05-08T05:18:48Z_

## Epic Readiness Summary

| Epic | Sprint Status Evidence | GitHub Evidence | BAD Readiness |
|------|------------------------|-----------------|---------------|
| 1 | `sprint-status.yaml` marks `epic-1` and stories 1.1-1.6 `done`; `epic-1-retrospective` is `done`. | Merged PRs found for Epic 1 story branches: #1, #2, #3, #4, #7, #8, #9, #10, #11. | Complete |
| 2 | `sprint-status.yaml` marks `epic-2` and stories 2.1-2.6 `done`; `epic-2-retrospective` is `done`. | Merged PRs #12-#17. | Complete |
| 3 | `sprint-status.yaml` marks `epic-3` and stories 3.1-3.8 `done`; retrospective remains optional. | Merged PRs #94, #95, #96, and #153. | Complete |
| 4 | `sprint-status.yaml` marks `epic-4` `in-progress`; Stories 4.1, 4.2, 4.3, 4.4, and 4.5 are `done`; Story 4.6 is `ready-for-dev`. | Story 4.1 merged via PR #157; Story 4.2 merged via PR #158; Story 4.3 merged via PR #159; Story 4.4 merged via PR #161; Story 4.5 merged via PR #160. | Ready to continue at 4.6 |

## Stories

| Story | Epic | Title | Sprint Status | Issue | PR | PR Status | Dependencies | Ready to Work |
|-------|------|-------|---------------|-------|----|-----------|--------------|---------------|
| 1.1 | 1 | Initialize pnpm + Cargo workspace monorepo with directory skeleton | done | — | — | — | none | ✅ Done |
| 1.2 | 1 | Initialize Anchor program shell + freeze IDL | done | — | — | — | 1.1 | ✅ Done |
| 1.3 | 1 | Wire Codama codegen for TS + Rust clients | done | — | — | — | 1.2 | ✅ Done |
| 1.4 | 1 | GitHub Actions CI scaffold with IDL hash + pattern checks | done | — | — | — | 1.1, 1.2, 1.3, 1.5 | ✅ Done |
| 1.5 | 1 | License, README skeleton, contribution docs, CODEOWNERS | done | — | — | — | 1.1 | ✅ Done |
| 1.6 | 1 | Daily engineering log discipline + Day-1 spikes | done | — | — | — | 1.1, 1.2, 1.3, 1.4, 1.5 | ✅ Done |
| 2.1 | 2 | Account types + SusuError enum + i18n key parity scaffolding | done | — | #12 | merged | 1.2 | ✅ Done |
| 2.2 | 2 | Implement create_group instruction (FR1) | done | — | #13 | merged | 2.1 | ✅ Done |
| 2.3 | 2 | Implement on-chain invite mechanism (FR2) | done | — | #14 | merged | 2.2 | ✅ Done |
| 2.4 | 2 | Implement accept_invite instruction (FR3) with rotation-slot placeholder | done | — | #15 | merged | 2.3 | ✅ Done |
| 2.5 | 2 | Implement cancel_group instruction (FR5) | done | — | #16 | merged | 2.4 | ✅ Done |
| 2.6 | 2 | Group state + participation history query helpers | done | — | #17 | merged | 2.5 | ✅ Done |
| 3.1 | 3 | Implement closed-form O(n) dynamic-collateral curve module | done | — | #95 | merged | none | ✅ Done |
| 3.2 | 3 | Implement post_collateral instruction | done | — | #153 | merged | 2.4, 3.1 | ✅ Done |
| 3.3 | 3 | Initialize PDA Vault accounts | done | — | #153 | merged | 2.2, 3.2 | ✅ Done |
| 3.4 | 3 | Implement contribute instruction | done | — | #94 | merged | none | ✅ Done |
| 3.5 | 3 | Implement top_up_collateral instruction | done | — | #96 | merged | none | ✅ Done |
| 3.6 | 3 | Implement slash_member instruction | done | — | #153 | merged | none | ✅ Done |
| 3.7 | 3 | Implement withdraw_collateral instruction | done | — | #153 | merged | 2.5 | ✅ Done |
| 3.8 | 3 | Enforce all-collateralized gate before contributions can start | done | — | #153 | merged | 3.4 | ✅ Done |
| 4.1 | 4 | Deterministic on-chain rotation-slot assignment algorithm | done | #38 | #157 | merged | 3.8 | ✅ Done |
| 4.2 | 4 | Implement claim_payout instruction | done | #39 | #158 | merged | 4.1 | — |
| 4.3 | 4 | claim_payout guard — non-recipient rejection | done | #40 | #159 | merged | 4.2 | ✅ Done |
| 4.4 | 4 | claim_payout guard — pre-deadline rejection | done | #41 | #161 | merged | 4.3 | ✅ Done |
| 4.5 | 4 | claim_payout guard — double-claim rejection via RotationReceipt PDA | done | #42 | #160 | merged | 4.2 | ✅ Done |
| 4.6 | 4 | End-to-end full ROSCA lifecycle integration test on Surfpool | ready-for-dev | #43 | — | — | 4.1, 4.2, 4.3, 4.4, 4.5 | ✅ Yes |
| 5.1 | 5 | tests/invariants/no_strategic_default.rs proptest (FR21) | ready-for-dev | — | — | — | 3.1 | ❌ No (Epic 4 not complete) |
| 5.2 | 5 | susu-adversary CLI binary skeleton (FR22 part 1) | ready-for-dev | — | — | — | none | ❌ No (Epic 4 not complete) |
| 5.3 | 5 | 30% Cartel scenario named as headline test (FR23) | ready-for-dev | — | — | — | 5.2 | ❌ No (Epic 4 not complete) |
| 5.4 | 5 | Byte-deterministic adversary-report.json from --seed $COMMIT_SHA (FR22 part 2 + NFR-Re1) | ready-for-dev | — | — | — | 5.2, 5.3 | ❌ No (Epic 4 not complete) |
| 5.5 | 5 | docs/collateral-curve.md formal write-up (FR24) | ready-for-dev | — | — | — | 5.1, 5.4 | ❌ No (Epic 4 not complete) |
| 5.6 | 5 | docs/threat-model.md + tests/coverage/threat-model.md traceability (FR25) | ready-for-dev | — | — | — | none | ❌ No (Epic 4 not complete) |
| 5.7 | 5 | docs/fincen-cvc-framing.md (FR26) | ready-for-dev | — | — | — | none | ❌ No (Epic 4 not complete) |
| 5.8 | 5 | Audit firm engagement + report linking (FR57, NFR-S1) | ready-for-dev | — | — | — | 1.2 | ❌ No (Epic 4 not complete) |
| 5.9 | 5 | Legal opinion engagement + docs/legal-opinion.pdf publication (FR27) | ready-for-dev | — | — | — | 5.7 | ❌ No (Epic 4 not complete) |
| 6.1 | 6 | TS SDK (@susu/sdk) idiomatic helpers + fluent client | ready-for-dev | — | — | — | 1.2, 1.3 | ❌ No (Epic 5 not complete) |
| 6.2 | 6 | SDK simulate-by-default + explicit-cluster gate | ready-for-dev | — | — | — | 6.1 | ❌ No (Epic 5 not complete) |
| 6.3 | 6 | SDK error classes — typed discriminated union | ready-for-dev | — | — | — | 1.3, 6.1, 6.2 | ❌ No (Epic 5 not complete) |
| 6.4 | 6 | Codama-generated Rust client (susu-client) with same surface | ready-for-dev | — | — | — | 1.2, 1.3, 6.1, 6.2, 6.3 | ❌ No (Epic 5 not complete) |
| 6.5 | 6 | SDK parity CI check | ready-for-dev | — | — | — | 1.3, 6.1, 6.2, 6.3, 6.4 | ❌ No (Epic 5 not complete) |
| 6.6 | 6 | examples/with-privy (~200 LOC) | ready-for-dev | — | — | — | 6.1, 6.2, 6.3 | ❌ No (Epic 5 not complete) |
| 6.7 | 6 | examples/with-squads (~200 LOC) | ready-for-dev | — | — | — | 6.1, 6.2, 6.3 | ❌ No (Epic 5 not complete) |
| 6.8 | 6 | examples/with-token-extensions (~200 LOC) | ready-for-dev | — | — | — | 6.1, 6.2, 6.3 | ❌ No (Epic 5 not complete) |
| 6.9 | 6 | docs/integration-{partner}.md per partner | ready-for-dev | — | — | — | 6.6, 6.7, 6.8 | ❌ No (Epic 5 not complete) |
| 6.10 | 6 | pnpm susu:demo orchestrator hitting NFR-P2 ≤60s | ready-for-dev | — | — | — | 6.1, 6.2, 6.3 | ❌ No (Epic 5 not complete) |
| 6.11 | 6 | pnpm verify orchestrator hitting NFR-Re4 ≤10min | ready-for-dev | — | — | — | 5.4, 6.10 | ❌ No (Epic 5 not complete) |
| 6.12 | 6 | SDK + crate publishing pipeline via OIDC | ready-for-dev | — | — | — | 6.1, 6.2, 6.3, 6.4 | ❌ No (Epic 5 not complete) |
| 7.1 | 7 | Next.js 15 reference app scaffold + provider order + Zod env loader | ready-for-dev | — | — | — | 1.1, 1.4 | ❌ No (Epic 6 not complete) |
| 7.2 | 7 | Design tokens — tokens.css + dual-skin overrides + Tailwind config (UX-DR1–8) | ready-for-dev | — | — | — | 7.1 | ❌ No (Epic 6 not complete) |
| 7.3 | 7 | Typography self-hosted via next/font + type scale + .numeric utility | ready-for-dev | — | — | — | 7.1, 7.2 | ❌ No (Epic 6 not complete) |
| 7.4 | 7 | shadcn/ui primitives copied + reskinned via tokens (UX-DR24) | ready-for-dev | — | — | — | 7.2, 7.3, 7.7 | ❌ No (Epic 6 not complete) |
| 7.5 | 7 | <SkinToggle /> with cookie + localStorage persistence + server-side hydration | ready-for-dev | — | — | — | 7.2, 7.3, 7.4 | ❌ No (Epic 6 not complete) |
| 7.6 | 7 | Top nav with always-visible <ClusterPill /> + locale dropdown + skin toggle + wallet status | ready-for-dev | — | — | — | 7.4, 7.5 | ❌ No (Epic 6 not complete) |
| 7.7 | 7 | next-intl multi-locale routing — en + vi live, 4 stubs (FR43) | ready-for-dev | — | — | — | 7.1 | ❌ No (Epic 6 not complete) |
| 7.8 | 7 | i18n parity check + workflow + CONTRIBUTING-TRANSLATIONS.md (FR48, FR49, FR50) | ready-for-dev | — | — | — | 1.4, 1.5, 7.7 | ❌ No (Epic 6 not complete) |
| 7.9 | 7 | Privy email-onboarding integration + Wallet-Standard fallback (FR39, FR46) | ready-for-dev | — | — | — | 6.2, 7.6, 7.7 | ❌ No (Epic 6 not complete) |
| 7.10 | 7 | <TransactionConfirmModal /> with simulation result block (FR40, FR41 prerequisite) | ready-for-dev | — | — | — | 7.4, 7.5, 7.6, 7.7, 7.8, 7.9 | ❌ No (Epic 6 not complete) |
| 7.11 | 7 | <RotationCard />, <MemberAvatar />, <CurveVisualizer /> static-svg | ready-for-dev | — | — | — | 7.4, 7.6, 7.7, 7.10 | ❌ No (Epic 6 not complete) |
| 7.12 | 7 | Supporting components — <CodeBlock />, <ReceiptCard />, <Banner />, <FieldError /> | ready-for-dev | — | — | — | 7.2, 7.3, 7.4 | ❌ No (Epic 6 not complete) |
| 7.13 | 7 | Convex schema + group metadata + isolation lock (ARCH-30, ARCH-31) | ready-for-dev | — | — | — | 7.1 | ❌ No (Epic 6 not complete) |
| 7.14 | 7 | One-tap Contribute flow (FR40) | ready-for-dev | — | — | — | 7.9, 7.10, 7.11, 7.12 | ❌ No (Epic 6 not complete) |
| 7.15 | 7 | One-tap Claim Payout flow (FR41) | ready-for-dev | — | — | — | 7.9, 7.10, 7.11, 7.12, 7.14 | ❌ No (Epic 6 not complete) |
| 7.16 | 7 | Helius RPC fallback to public + Sphere on-ramp optional flag | ready-for-dev | — | — | — | 7.1, 7.7, 7.12 | ❌ No (Epic 6 not complete) |
| 7.17 | 7 | Mobile-first responsive layout 360px floor + breakpoints + Playwright visual regression | ready-for-dev | — | — | — | 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13, 7.14, 7.15, 7.16 | ❌ No (Epic 6 not complete) |
| 7.18 | 7 | Accessibility surface — WCAG 2.1 AA + RTL + reduced-motion + axe-core CI + non-crypto pilot | ready-for-dev | — | — | — | none | ❌ No (Epic 6 not complete) |
| 8.1 | 8 | README first-viewport with badge architecture | ready-for-dev | — | — | — | 1.4, 5.1, 5.6, 8.2, 8.3, 8.4 | ❌ No (Epic 7 not complete) |
| 8.2 | 8 | <AdversaryBadge /> server-rendered from latest report | ready-for-dev | — | — | — | 5.4 | ❌ No (Epic 7 not complete) |
| 8.3 | 8 | <UpgradeBurnedBadge /> server-rendered from solana program show | ready-for-dev | — | — | — | 1.1, 5.4, 8.2 | ❌ No (Epic 7 not complete) |
| 8.4 | 8 | Inline animated SVG curve plot + <CurveVisualizer /> interactive variant | ready-for-dev | — | — | — | 1.4, 7.11, 8.1 | ❌ No (Epic 7 not complete) |
| 8.5 | 8 | README link cluster | ready-for-dev | — | — | — | 8.1 | ❌ No (Epic 7 not complete) |
| 8.6 | 8 | 60-90s demo video production + embed | ready-for-dev | — | — | — | 6.7, 8.4 | ❌ No (Epic 7 not complete) |
| 8.7 | 8 | Ecosystem partner reference outreach + landing | ready-for-dev | — | — | — | 6.6, 6.7, 6.8, 8.5, 8.6 | ❌ No (Epic 7 not complete) |
| 9.1 | 9 | Audit sign-off gate verification (NFR-S1) | ready-for-dev | — | — | — | 5.8 | ❌ No (Epic 8 not complete) |
| 9.2 | 9 | Mainnet deploy with upgrade authority burned at deploy | ready-for-dev | — | — | — | 9.1 | ❌ No (Epic 8 not complete) |
| 9.3 | 9 | scripts/check-immutability.sh + immutability-check.yml workflow (FR30) | ready-for-dev | — | — | — | 9.2 | ❌ No (Epic 8 not complete) |
| 9.4 | 9 | <UpgradeBurnedBadge /> wired live + tagged release v0.1.0-mainnet (ARCH-37) | ready-for-dev | — | — | — | 8.3, 9.2, 9.3 | ❌ No (Epic 8 not complete) |

## Dependency Chains

- **1.2** depends on: 1.1
- **1.3** depends on: 1.2
- **1.4** depends on: 1.1, 1.2, 1.3, 1.5
- **1.5** depends on: 1.1
- **1.6** depends on: 1.1, 1.2, 1.3, 1.4, 1.5
- **2.1** depends on: 1.2
- **2.2** depends on: 2.1
- **2.3** depends on: 2.2
- **2.4** depends on: 2.3
- **2.5** depends on: 2.4
- **2.6** depends on: 2.5
- **3.2** depends on: 2.4, 3.1
- **3.3** depends on: 2.2, 3.2
- **3.7** depends on: 2.5
- **3.8** depends on: 3.4
- **4.1** depends on: 3.8
- **4.2** depends on: 4.1
- **4.3** depends on: 4.2
- **4.4** depends on: 4.3
- **4.5** depends on: 4.2
- **4.6** depends on: 4.1, 4.2, 4.3, 4.4, 4.5
- **5.1** depends on: 3.1
- **5.3** depends on: 5.2
- **5.4** depends on: 5.2, 5.3
- **5.5** depends on: 5.1, 5.4
- **5.8** depends on: 1.2
- **5.9** depends on: 5.7
- **6.1** depends on: 1.2, 1.3
- **6.2** depends on: 6.1
- **6.3** depends on: 1.3, 6.1, 6.2
- **6.4** depends on: 1.2, 1.3, 6.1, 6.2, 6.3
- **6.5** depends on: 1.3, 6.1, 6.2, 6.3, 6.4
- **6.6** depends on: 6.1, 6.2, 6.3
- **6.7** depends on: 6.1, 6.2, 6.3
- **6.8** depends on: 6.1, 6.2, 6.3
- **6.9** depends on: 6.6, 6.7, 6.8
- **6.10** depends on: 6.1, 6.2, 6.3
- **6.11** depends on: 5.4, 6.10
- **6.12** depends on: 6.1, 6.2, 6.3, 6.4
- **7.1** depends on: 1.1, 1.4
- **7.2** depends on: 7.1
- **7.3** depends on: 7.1, 7.2
- **7.4** depends on: 7.2, 7.3, 7.7
- **7.5** depends on: 7.2, 7.3, 7.4
- **7.6** depends on: 7.4, 7.5
- **7.7** depends on: 7.1
- **7.8** depends on: 1.4, 1.5, 7.7
- **7.9** depends on: 6.2, 7.6, 7.7
- **7.10** depends on: 7.4, 7.5, 7.6, 7.7, 7.8, 7.9
- **7.11** depends on: 7.4, 7.6, 7.7, 7.10
- **7.12** depends on: 7.2, 7.3, 7.4
- **7.13** depends on: 7.1
- **7.14** depends on: 7.9, 7.10, 7.11, 7.12
- **7.15** depends on: 7.9, 7.10, 7.11, 7.12, 7.14
- **7.16** depends on: 7.1, 7.7, 7.12
- **7.17** depends on: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 7.11, 7.12, 7.13, 7.14, 7.15, 7.16
- **8.1** depends on: 1.4, 5.1, 5.6, 8.2, 8.3, 8.4
- **8.2** depends on: 5.4
- **8.3** depends on: 1.1, 5.4, 8.2
- **8.4** depends on: 1.4, 7.11, 8.1
- **8.5** depends on: 8.1
- **8.6** depends on: 6.7, 8.4
- **8.7** depends on: 6.6, 6.7, 6.8, 8.5, 8.6
- **9.1** depends on: 5.8
- **9.2** depends on: 9.1
- **9.3** depends on: 9.2
- **9.4** depends on: 8.3, 9.2, 9.3

## Notes
- GitHub was reconciled on 2026-05-08: Epics 1-3 are complete on `main` through PR #153 (`feat(program): Epic 3 collateral lifecycle (Stories 3.2-3.8)`). Story 4.1 merged via PR #157 (`feat(epic4): implement rotation slot algorithm`).
- **Ready to Work** for Epic 4 now points to 4.6; 4.1 merged via PR #157, 4.2 via PR #158, 4.3 via PR #159, 4.4 via PR #161, and 4.5 via PR #160. 4.6 is unblocked.
- **Ready to Work** for Epic 5+ remains blocked by epic ordering until Epic 4 is `done`.
- Re-run this reconciliation after each Epic 4 story PR merges so BAD can select the next unblocked story batch.
