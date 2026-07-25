[简体中文](./README.md) | English

# TypeRift 1.0

TypeRift is a deterministic typing roguelite built around one fantasy: typing a word is combat. Its single product loop is calibration → hub → run → three-choice build → boss or extraction → debrief → weak-key repair → unlock.

This is an intentionally incompatible clean slate. Historical TypeMaster / Typing Raid routes, state, contracts, migrations, assets, and browser data are never read or converted. On first launch, v1 deletes only app-owned legacy keys and databases. Clerk identity may remain, while the application profile starts fresh.

## Routes

- `/onboarding`
- `/`
- `/play?mode=first-rift|expedition|daily-rift|repair-trial|quick-pulse`
- `/missions`
- `/archive`
- `/debrief/[runId]`

## Development

Node.js 20.9+ and pnpm 10 are required.

```bash
pnpm install
pnpm dev
pnpm check
pnpm test:e2e
```

Web runs on `http://localhost:5173`; API runs on `http://localhost:8080`. Development and tests use `.data/typerift-v1.json` when Postgres is absent. Production fails at startup without `DATABASE_URL`.

The workspace contains strict TypeScript domain and Zod contract packages, a Next.js Canvas/DOM client, and a Hono API backed by five v1 tables. Ranked Daily Rift results are accepted only after server replay verifies seed, content version, command log, and final hash. Offline unranked runs sync idempotently with client run IDs.

Original v1 game assets live in `apps/web/public/game/v1`; their manifest includes dimensions, SHA-256, color space, and accessibility label keys. AI coaching is optional and receives aggregate metrics only—never raw input or full keystroke history.

See [architecture](./docs/architecture.md), [game design](./docs/game-design.md), [art direction](./docs/art-direction.md), and [operations](./docs/operations.md).
