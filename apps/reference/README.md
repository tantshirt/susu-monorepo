# `@susu/reference`

The reference Next.js 15 application for the Susu Protocol monorepo.

This story (7.1) only ships the scaffold: Next.js 15 App Router, the locked
provider chain, and a Zod-validated environment loader. Visual tokens (7.2),
typography (7.3), shadcn primitives (7.4), routing for locales (7.7), live
Convex schema (7.13), and the One-Tap flows (7.14, 7.15) all land in later
Epic 7 stories.

## Provider order is locked

`app/layout.tsx` composes three client wrappers in this exact order:

```
<PrivyProviderWrapper>
  <ConvexProviderWrapper>
    <IntlProviderWrapper>
      {children}
    </IntlProviderWrapper>
  </ConvexProviderWrapper>
</PrivyProviderWrapper>
```

**`PrivyProvider` must be outermost** so that Convex queries can read the
authenticated identity at hydration. If `ConvexProvider` mounts before
`PrivyProvider`, any `convex/react` hook that reads auth state during the
first render will see an unauthenticated session and either flicker or
return stale data.

`IntlProvider` is innermost because it only owns localization context, which
no other provider needs to read.

Do not reorder these wrappers without coordinating an Epic 7 architecture
change. The order is enforced by the `tests/atdd/story-7-1-*.test.mjs` ATDD
tests and asserted via `app/layout.tsx` review.

## Environment variables

All environment variables are validated at startup by `lib/env.ts`. Reading
`process.env.*` anywhere outside that module is a CI failure
(`scripts/check-patterns.sh`).

To run the app locally:

```bash
cp apps/reference/.env.example apps/reference/.env.local
# fill in real values
pnpm --filter @susu/reference dev
```

The env loader throws a structured error on startup if any required key is
missing, so misconfigured environments fail loudly rather than silently
serving broken pages.

## Source layout

This project uses the flat App Router layout (no `src/` directory):

- `app/` — App Router routes, layouts, providers
- `components/` — shared UI components (added in Story 7.4)
- `lib/` — utilities, including the `env.ts` loader
- `messages/` — locale message bundles (expanded in Story 7.7)
- `public/` — static assets
