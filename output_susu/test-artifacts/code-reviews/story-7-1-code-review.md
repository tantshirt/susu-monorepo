# Story 7.1 Code Review

## Scope

Reviewed branch diff against `origin/main` for Story 7.1 (Next.js 15 reference app scaffold + locked provider order + Zod env loader).

Files reviewed:

- `apps/reference/app/layout.tsx`
- `apps/reference/app/providers/{PrivyProviderWrapper,ConvexProviderWrapper,IntlProviderWrapper}.tsx`
- `apps/reference/lib/env.ts`
- `apps/reference/.env.example`
- `apps/reference/.gitignore`
- `apps/reference/README.md`
- `apps/reference/package.json`
- `scripts/check-patterns.sh`
- `tests/atdd/story-7-1-*.{atdd.md,static.red.test.mjs}`

## Findings (triage)

### Must-fix before merge — APPLIED

#### Fixed: Privy app-id length validated upstream of Privy itself

The initial Zod schema only required `NEXT_PUBLIC_PRIVY_APP_ID` to be `min(1)`. Privy itself rejects any value whose length is not exactly 25 characters at SSR-prerender time, and the resulting error (`Cannot initialize the Privy provider with an invalid Privy app ID`) does not cite `.env.example`. Tightened the schema to `z.string().length(25, …)` so missing-or-shaped-wrong values fail loudly through the env loader's structured error, matching the AC3 promise that "missing required env vars throw with a helpful error citing `.env.example`."

#### Fixed: `apps/reference/.env.example` was being .gitignored by the local Next.js scaffold

`create-next-app` writes a local `.gitignore` with `.env*` but no `!.env.example` exception, so the example file was tracked-as-ignored even though the root `.gitignore` permits it. Added `!.env.example` to the local file so AC4 ("`.env.example` is committed") actually holds.

#### Fixed: `convex/react` import in the provider wrapper crossed the existing `convex` import lockdown

`scripts/check-patterns.sh` already forbids `convex` / `convex/react` imports outside `apps/reference/lib/convex/`. The locked provider chain requires `ConvexProvider` + `ConvexReactClient` inside `apps/reference/app/providers/ConvexProviderWrapper.tsx`. Extended the exemption list to allow that single file (and only that file). Story 7.13's Convex schema work will continue to be confined to `apps/reference/lib/convex/`.

### Nice-to-have / follow-up — RECORDED

1. **Runtime test for `lib/env.ts` failure path.** The static red test asserts the schema mentions `.env.example`; it does not actually import the module with a missing key to confirm the thrown error includes that citation. Add a `tsx`-backed runner (or compile-then-import) when the project formalizes `.ts` test execution. Owner: Story 7.13 or whichever story first introduces `tsx`-backed unit tests.
2. **`next.config.ts` vs `next.config.mjs`.** `create-next-app@latest` produced `next.config.ts`; the original prompt referenced `.mjs`. Today this file does not read `process.env`, so the `check-patterns.sh` grandfather entry remains hypothetical. If a later story adds a runtime config that needs `process.env`, extend the exemption or proxy through `lib/env.ts`.
3. **Privy SSR opt-out.** Privy validates the app id and tries to spin up its embedded-wallet runtime during SSR-prerender of error pages (`/_not-found`). With a real Privy app id this is fine, but it does mean a missing/short id breaks the entire build. Story 7.9 (Privy email-onboarding) should consider wrapping `PrivyProvider` in a `dynamic(... , { ssr: false })` boundary or mounting it only after auth-required routes. For 7.1 the current behaviour is acceptable because the failure mode is precisely "fail loudly at startup," which matches AC3.
4. **Provider order asserted positionally, not structurally.** The static test compares opening-tag indices in `layout.tsx`. A structural AST-level check would be more robust against conditional rendering. Defer until the project adopts a `ts-morph`/`@typescript-eslint/parser` test infra.
5. **Workspace-root warning from Next.js Turbopack.** `next build` emits a warning about multiple lockfiles because the worktree shares lockfiles with the main checkout. Setting `turbopack.root` in `next.config.ts` would silence it; deferred because the warning is harmless and would couple the worktree to a hardcoded path.

## Lenses

### Blind Hunter

Caught the Privy 25-char and gitignore issues above. Other potentially-blind spots reviewed and cleared:

- env.ts uses `safeParse` + structured error (good); errors are caught with key path + message instead of a stringified Zod tree.
- env.ts is imported in three downstream files; no circular dependencies.
- `IntlProviderWrapper` ships an inline `messages` stub — fine for 7.1; replaced wholesale by 7.7.

### Edge Case Hunter

- Empty string for `NEXT_PUBLIC_PRIVY_APP_ID` → caught by `length(25)`.
- `NEXT_PUBLIC_SPHERE_ENABLED` = `"True"` (capital T) → caught by enum.
- Missing `NEXT_PUBLIC_CLUSTER` → caught.
- `NEXT_PUBLIC_HELIUS_RPC_URL` = `"localhost:8899"` (no scheme) → rejected by `z.string().url()`. Acceptable; Surfpool runs on `http://127.0.0.1:8899`.
- Provider chain inverted (e.g. Convex outside Privy) → caught by ATDD.

### Acceptance Auditor

Walked AC1–AC7 against current files; all map to at least one assertion in the static red test plus the implementation files. AC6 (`pnpm dev` boots) is proven by a successful `next build` against `.env.example` values during implementation; CI automation of that smoke is intentionally deferred to Story 7.13.

## Evidence

- `node --test tests/atdd/story-7-1-next-app-scaffold.static.red.test.mjs` — 7/7 pass
- `pnpm test` — 197/197 pass
- `bash scripts/check-patterns.sh` — OK
- `bash scripts/check-sdk-parity.sh` — OK
- `pnpm exec tsx scripts/check-i18n-parity.ts` — OK
- `cp apps/reference/.env.example apps/reference/.env.local && pnpm --filter @susu/reference build` — Compiled successfully, all 4 routes prerendered

## Result

Approved after applying the three must-fix items.
