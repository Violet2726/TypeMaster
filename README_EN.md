[English](./README_EN.md) | [简体中文](./README.md)

# TypeMaster

TypeMaster is an English typing workspace built around a `TypeRift / Focus Lab / Missions / Insights` loop.

The current major version uses `TypeRift: Echo Siege` as the primary game experience: players type enemy words, build weapon/relic/glyph synergies, survive Roguelite runs, and feed exposed weak characters back into focused drills and insights. Legacy game logic and history are no longer compatible. v7 is the new starting point for game data.

## Workspace Layout

```text
typemaster/
|-- apps/
|   |-- web/               # Next.js + React product app
|   `-- api/               # Hono API, static server, and Vercel-compatible handler
|-- packages/
|   |-- ai/                # AI text generation and coaching client
|   |-- config/            # Shared Vitest/config helpers
|   |-- contracts/         # Zod API contracts, storage keys, and cache schemas
|   |-- domain/            # Pure typing, training, insight, and TypeRift rules
|   `-- ui/                # Shared UI primitives
|-- docs/                  # Cross-module design and maintenance docs
|-- pnpm-workspace.yaml
|-- tsconfig.base.json
`-- turbo.json
```

## Product Modules

- `TypeRift: Echo Siege`: the main game module runs as a card inside the command center. UI copy, tests, and data models use TypeRift/game terminology.
- `Focus Lab`: short drills that repair weak characters, rhythm issues, and accuracy problems surfaced by TypeRift or practice.
- `Missions`: calibration, daily tasks, and plan entry points around the TypeRift loop.
- `Insights`: review speed, accuracy, weak characters, game depth, extraction stability, and achievement progress.

See [docs/typerift-v7.md](./docs/typerift-v7.md) for the game module design and maintenance contract.

## Main Boundaries

- `apps/web/app`: Next.js App Router route tree and root layout.
- `apps/web/src/application`: providers, query client, app shell, and navigation adapters.
- `apps/web/src/screens`: route orchestration for Home, Game, Practice, Missions, Insights, and Result.
- `apps/web/src/features/game-vnext`: TypeRift runtime, Canvas renderer, asset loader, HUD, and overlays.
- `apps/web/src/services/api`: browser-side API gateways plus local API fallback cache.
- `apps/web/src/services/storage`: browser preferences and IndexedDB client cache repositories.
- `apps/web/src/store`: Zustand/React Query bridge, persistence, feature action adapters, and tested product use cases.
- `apps/api/routes`: Hono route registration by API boundary.
- `apps/api/services`: backend user, session, plan, profile, challenge, and static helpers.
- `apps/api/repositories`: service-layer data boundary; Postgres/Drizzle first, local JSON state fallback when unconfigured.
- `apps/api/infra`: Clerk identity, Postgres/Drizzle, Upstash Redis, and Inngest adapters.
- `apps/api/jobs`: background functions for coach feedback generation, profile recompute, and leaderboard cache refresh.
- `packages/contracts/src`: shared storage keys, API schemas, server-state schemas, and OpenAPI metadata.
- `packages/domain/src`: pure rules and calculations with no React or IO.
- `packages/domain/src/game-vnext`: TypeRift domain module exporting `createGameState`, `dispatchGameCommand`, `updateGameState`, `buildGameSnapshot`, `buildGameResult`, and `GAME_MODES`.

## Data And Storage Contract

- Current client storage prefix: `typemaster:v7:*`.
- `TrainingDataBundleSchema.version` is `7`.
- TypeRift results are saved as unified sessions with `kind: 'game'`, `trainingMeta.type: 'game'`, and `gameMeta.version: 'typerift-v1'`.
- v6 keys and old `typing-raid-*` keys are cleanup-only entries in `OBSOLETE_STORAGE_KEYS`; they are not migrated and are not treated as data sources.
- Home, Missions, Insights, Achievements, and Codex read only v7 game session fields.

## TypeRift Assets

Bitmap game assets live in `apps/web/public/game/typerift/`:

- `backgrounds/`: 5 area backgrounds.
- `enemies/`: 12 regular enemy sprites.
- `bosses/`: 5 area boss sprites.
- `relics/`: 24 weapon/relic/glyph icons.
- `manifest.json`: the runtime asset loader manifest.

Canvas handles particles, light effects, projectiles, HUD support, and fallback rendering. Core backgrounds, enemies, bosses, and icons prefer generated bitmap assets.

## Requirements

- Node.js `20.9+`
- pnpm `10+`

## AI Configuration

AI features are optional. Built-in text, Focus Lab, and TypeRift do not require AI.

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

## Server Infrastructure Configuration

When these variables are not set, local development continues to use JSON state and a local development bearer token.

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
- Backend user/session/plan/profile/challenge services access data through `apps/api/repositories/training-repository.ts`.
- Postgres table definitions live in `apps/api/infra/db/schema.ts`; migration entry points are `pnpm --filter @typemaster/api db:generate` and `pnpm --filter @typemaster/api db:push`.
- The Inngest worker endpoint is exposed at `/api/inngest`; current jobs handle coach feedback, profile recompute, and challenge leaderboard refresh.

## Local Development

```bash
pnpm install
pnpm dev:web
pnpm dev:api
```

Main URLs:

- Web: `http://localhost:5173`
- API: `http://localhost:8080`
- TypeRift: `http://localhost:5173/#typerift`

During development, Next.js rewrites `/api` from the web app to `http://localhost:8080`.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

TypeRift-focused verification should cover:

- `packages/domain`: deterministic seeds, spawning, targeting, hit input, error penalties, kills, leaks, boss phases, upgrades, snapshots, and results.
- `apps/web`: mode select, HUD, upgrade overlay, result overlay, and v7 game session writing.
- Playwright: command-center TypeRift card, non-empty canvas, desktop/mobile layout, asset-loaded pixels, and fallback clarity.

## Runtime Model

- Routing uses Next.js App Router browser paths; TypeRift is opened from the command-center `#typerift` card anchor.
- `/raid` is no longer a retained TypeRift entry path.
- React Query owns account, sessions, plans, skill profiles, daily challenges, and other API snapshots.
- Zustand owns active drafts, runtime controls, UI preferences, and in-progress training flow.
- Store action hooks stay thin. Product workflows such as account sync, draft generation, training launch, coach feedback, and session completion live in `*-use-cases.ts`.
- `packages/contracts` is the shared source for Web/API request and response shapes.
- `packages/domain` is the single source of truth for typing, training, TypeRift, and insight rules.

## Suggested Reading Order

1. [`apps/web/app/layout.tsx`](./apps/web/app/layout.tsx)
2. [`apps/web/app/page.tsx`](./apps/web/app/page.tsx)
3. [`apps/web/src/screens/GamePage.tsx`](./apps/web/src/screens/GamePage.tsx)
4. [`apps/web/src/features/game-vnext/runtime/game-engine.ts`](./apps/web/src/features/game-vnext/runtime/game-engine.ts)
5. [`apps/web/src/features/game-vnext/runtime/canvas-renderer.ts`](./apps/web/src/features/game-vnext/runtime/canvas-renderer.ts)
6. [`packages/domain/src/game-vnext/index.js`](./packages/domain/src/game-vnext/index.js)
7. [`apps/web/src/store/session-completion-use-cases.ts`](./apps/web/src/store/session-completion-use-cases.ts)
8. [`apps/web/src/services/storage/json-store.ts`](./apps/web/src/services/storage/json-store.ts)
9. [`packages/contracts/src/index.js`](./packages/contracts/src/index.js)
10. [`docs/typerift-v7.md`](./docs/typerift-v7.md)
