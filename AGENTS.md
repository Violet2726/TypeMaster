# Repository Guidelines

## Project Structure & Module Organization

TypeMaster is a pnpm + Turborepo workspace. The main app lives in `apps/web`, a Next.js/React frontend using App Router pages in `apps/web/app` and feature code in `apps/web/src`. The local/server API lives in `apps/api`, with Hono routes under `apps/api/routes`, services under `apps/api/services`, infrastructure adapters under `apps/api/infra`, and Drizzle migrations in `apps/api/drizzle`.

Shared packages are under `packages`: `domain` contains pure typing/training logic, `contracts` contains API and storage schemas, `ai` wraps AI client behavior, `ui` holds reusable components, and `config` provides shared Vitest configuration.

## Build, Test, and Development Commands

- `pnpm install --frozen-lockfile`: install workspace dependencies exactly from `pnpm-lock.yaml`.
- `pnpm dev`: run all package/app dev tasks through Turbo in parallel.
- `pnpm dev:web`: start the web app on port `5173`.
- `pnpm dev:api`: start the API server with `tsx`.
- `pnpm build`: run workspace builds.
- `pnpm typecheck`: type-check web and API TypeScript projects.
- `pnpm test`: run all Vitest suites through Turbo.
- `pnpm test:coverage`: run coverage-enabled Vitest suites.
- `pnpm test:e2e`: run Playwright tests for `apps/web`.

## Coding Style & Naming Conventions

Use ESM imports and keep package boundaries clear: React/UI work belongs in `apps/web` or `packages/ui`, pure business rules in `packages/domain`, and API contracts in `packages/contracts`. Source files in this repo use 4-space indentation, single quotes, and semicolons. Prefer descriptive kebab-case filenames for feature modules such as `use-practice-page-model.ts`, and use PascalCase for React components such as `TypingArea.tsx`. There is no dedicated lint script, so rely on local consistency and `pnpm typecheck`.

## Testing Guidelines

Vitest is the default test runner. Place tests beside related code in `__tests__` folders or as `*.test.js`, `*.test.jsx`, `*.test.ts`, or `*.test.tsx`. Use `@vitest-environment jsdom` for browser-facing React tests. Playwright specs live in `apps/web/e2e`. Add or update tests when changing domain calculations, store use cases, route behavior, or user-visible React flows.

## Commit & Pull Request Guidelines

Recent commits use short imperative, Chinese-language summaries that name the changed area and action. Keep commits focused and describe the user-visible or architectural change. Pull requests should include a concise summary, tests run, linked issues when applicable, and screenshots or recordings for UI changes. CI runs install, build, test, and coverage commands, so verify the relevant subset locally before requesting review.

## Security & Configuration Tips

Do not commit secrets. Keep local values in `.env.local` or `config.js`; AI and infrastructure variables should stay server-side unless explicitly prefixed with `NEXT_PUBLIC_`.
