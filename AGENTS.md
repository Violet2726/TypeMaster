# Repository Guidelines

## Project Structure & Module Organization
This repository is a `pnpm` + Turborepo monorepo. Product apps live in `apps/`: `apps/web` is the Next.js App Router frontend, and `apps/api` is the Hono-based API and local server entry. Shared code lives in `packages/`: `domain` for core typing/game rules, `contracts` for shared schemas, `ui` for reusable components, `ai` for coaching text generation, and `config` for shared test config. Put frontend assets in `apps/web/public`, route files in `apps/web/app`, and colocated tests near features or in `__tests__`.

## Build, Test, and Development Commands
Run `pnpm install` once at the repo root. Use `pnpm dev:web` for the frontend on `http://localhost:5173` and `pnpm dev:api` for the API on `http://localhost:8080`. Use `pnpm dev` to run both through Turbo. Build everything with `pnpm build`. Validate types with `pnpm typecheck`. Run all tests with `pnpm test`, coverage with `pnpm test:coverage`, and browser flows with `pnpm test:e2e`. Use `pnpm audit:tokens` when changing design tokens or visual foundations.

## Coding Style & Naming Conventions
Follow `.editorconfig`: UTF-8, LF, final newline, and 4-space indentation. Prefer ESM modules, keep domain logic free of React and IO, and place UI state adapters in `apps/web/src/store` or feature hooks. Use `PascalCase` for React components, `camelCase` for functions and variables, and kebab-case or descriptive folder names for feature areas. Keep comments short and only where structure is not obvious.

## Testing Guidelines
Vitest is the default unit and integration test runner across apps and packages; Playwright covers end-to-end browser checks in `apps/web/e2e`. Name tests `*.test.js`, `*.test.jsx`, or `*.test.ts` and keep them close to the code they verify. Before opening a PR, run the smallest relevant package test plus any impacted root checks, then rerun `pnpm test` for cross-package changes.

## Commit & Pull Request Guidelines
Recent history uses short Chinese commit messages focused on user-visible outcomes, often centered on verbs such as “unify”, “tighten”, or “optimize” a surface or flow. Keep commits scoped and descriptive in the same style. PRs should explain the product intent, list verification commands, link related issues, and include screenshots or recordings for UI changes. Call out config, schema, or migration impact explicitly.

## Security & Configuration Tips
Do not commit secrets. Use environment variables for Clerk, Postgres, Upstash, Inngest, and optional AI settings. When infra vars are absent, the API falls back to local JSON state, so test both happy-path data flows and fallback behavior when touching persistence.
