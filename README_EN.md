[English](./README_EN.md) | [Chinese](./README.md)

# TypeMaster

TypeMaster is an English typing trainer built around an `assessment / plan / challenge / practice / review` loop.

The repo is organized as a pnpm + Turborepo workspace so the product shell, local API, shared contracts, pure domain logic, AI client, and reusable UI pieces each have a clear boundary.

## Workspace Layout

```text
typemaster/
|-- apps/
|   |-- web/               # Next.js + React app
|   `-- api/               # Hono API, static server, and Vercel-compatible handler
|-- packages/
|   |-- ai/                # AI text generation and coaching client
|   |-- config/            # Shared Vitest/config helpers
|   |-- contracts/         # Zod API contracts and storage/cache schemas
|   |-- domain/            # Pure typing, training, challenge, and insight logic
|   `-- ui/                # Shared UI primitives
|-- pnpm-workspace.yaml
|-- tsconfig.base.json
`-- turbo.json
```

## Main Boundaries

- `apps/web/app`: Next.js App Router route tree and root layout
- `apps/web/src/application`: providers, query client, app shell, and navigation adapters
- `apps/web/src/screens`: route screens for home, practice, result, challenge, insights, diagnostic, and training plan views
- `apps/web/src/features`: feature-owned models, components, hooks, and local UI state
- `apps/web/src/services/api`: browser-side API gateways plus local API fallback cache
- `apps/web/src/services/storage`: browser preferences and client cache repositories
- `apps/web/src/store`: Zustand/React Query bridge, persistence, thin feature action adapters, and tested product use cases
- `apps/api/routes`: Hono route registration by API boundary
- `apps/api/services`: backend user, session, plan, profile, challenge, and static helpers
- `apps/api/repositories`: service-layer data boundary; Postgres/Drizzle first, local JSON state fallback when unconfigured
- `apps/api/infra`: Clerk identity, Postgres/Drizzle, Upstash Redis, and Inngest adapters
- `apps/api/jobs`: Inngest background functions for coach feedback generation, profile recompute, and leaderboard cache refresh
- `apps/api/state`: local JSON-backed development state fallback and server-state use cases
- `packages/contracts/src`: shared storage keys, API schemas, server-state schemas, and OpenAPI source metadata
- `packages/domain/src`: pure rules and calculations with no React or IO
- `packages/ai/src`: AI request client and prompt-facing helpers
- `packages/ui/src`: reusable presentational primitives

## Requirements

- Node.js `20.9+`
- pnpm `10+`

## AI Configuration

AI features are optional. Built-in and custom text practice work without them.

```bash
AI_API_KEY=your_key_here
AI_API_URL=your_url_here
NEXT_PUBLIC_TYPEMASTER_AI_PROXY=1
```

You can also place server-side AI values in `config.js` at the repo root:

```js
module.exports = {
  AI_API_KEY: "your_key_here",
  AI_API_URL: "your_url_here"
};
```

`NEXT_PUBLIC_TYPEMASTER_AI_PROXY=1` is a frontend feature flag only. Secrets stay on the API side.

Web AI features call product-level API routes: `/api/practice-text` for generated drills and `/api/coach` for synchronous feedback. Session-completion feedback is persisted through the asynchronous `/api/coach-feedback` path. Provider details stay behind the API boundary.

## Server Infrastructure Configuration

The API now has production infrastructure boundaries in place. When these variables are not set, local development continues to use JSON state and a local development bearer token.

```bash
CLERK_SECRET_KEY=sk_...
CLERK_JWT_KEY=...
CLERK_AUTHORIZED_PARTIES=http://localhost:5173
DATABASE_URL=postgres://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
INNGEST_EVENT_KEY=...
INNGEST_SIGNING_KEY=...
INNGEST_DEV=1
```

- API identity is centralized on `Authorization: Bearer <token>`; production tokens are verified by Clerk, while local development without Clerk uses `typemaster-local:<userId>`.
- Clerk identities are mapped to internal accounts through `apps/api/services/auth-service.ts`; Postgres uses `users.clerk_user_id`, while the local JSON fallback uses an extended `authIdentity` field.
- Backend user/session/plan/profile/challenge services access data through `apps/api/repositories/training-repository.ts`; `DATABASE_URL` selects Postgres/Drizzle, otherwise JSON state fallback is used.
- Postgres table definitions live in `apps/api/infra/db/schema.ts`; migration entry points are `pnpm --filter @typemaster/api db:generate` and `pnpm --filter @typemaster/api db:push`.
- Daily challenge leaderboard caching uses the Upstash Redis adapter. Session completion, coach feedback, profile recompute, and leaderboard refresh events use the Inngest adapter. The Inngest worker endpoint is exposed at `/api/inngest`; the registered background functions currently handle coach feedback generation, profile recompute, and challenge leaderboard refresh, and local debugging can use `INNGEST_DEV=1`.
- Training data export/import uses `/api/exports` and the `TrainingDataBundle` v1 contract. The server assembles sessions, coach feedback, skill profile, and training plan through the repository instead of exporting a frontend store snapshot.

## Local Development

```bash
pnpm install
pnpm dev:web
pnpm dev:api
```

Main URLs:

- Web: `http://localhost:5173`
- API: `http://localhost:8080`

During development, Next.js rewrites `/api` from the web app to `http://localhost:8080`.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Runtime Model

- Routing uses Next.js App Router browser paths such as `/practice`, not hash routes.
- React Query owns server/API snapshots such as account, sessions, plans, skill profiles, and daily challenges.
- Zustand owns client interaction state such as the active typing draft, runtime controls, UI preferences, and in-progress training flow.
- Store action hooks stay thin. Product workflows such as account sync, draft generation, training flow launch, coach feedback, and session completion live in `*-use-cases.ts` modules with focused tests.
- Browser storage is split into localStorage preferences and IndexedDB-backed client cache. Preferences keep small UI settings, while client cache keeps recent sessions, training snapshots, recovery context, and local API fallback data.
- Old localStorage cache keys are no longer treated as data sources; client cache hydration clears those obsolete keys.
- `packages/contracts` is the shared contract source for Web/API request and response shapes.
- `packages/domain` is the single source of truth for typing, training, challenge, and insight rules.
- Export/import bundles use `TrainingDataBundle` v1 from `packages/contracts/storage`; local frontend import/export and API `/api/exports` share the same versioned shape.

## Suggested Reading Order

1. [`apps/web/app/layout.tsx`](./apps/web/app/layout.tsx)
2. [`apps/web/app/page.tsx`](./apps/web/app/page.tsx)
3. [`apps/web/src/store/app-state-bootstrap.tsx`](./apps/web/src/store/app-state-bootstrap.tsx)
4. [`apps/web/src/store/account-sync-use-cases.ts`](./apps/web/src/store/account-sync-use-cases.ts)
5. [`apps/web/src/store/session-completion-use-cases.ts`](./apps/web/src/store/session-completion-use-cases.ts)
6. [`apps/web/src/services/api/index.ts`](./apps/web/src/services/api/index.ts)
7. [`apps/api/app.ts`](./apps/api/app.ts)
8. [`apps/api/repositories/training-repository.ts`](./apps/api/repositories/training-repository.ts)
9. [`packages/contracts/src/api.js`](./packages/contracts/src/api.js)
10. [`packages/domain/src/index.js`](./packages/domain/src/index.js)
