# Repository Guidelines

## Project Structure
TypeMaster Studio is a pnpm and Turborepo workspace. `apps/web` contains the Next.js App Router interface and browser storage; `packages/domain` contains deterministic typing-practice rules and original passages; `packages/config` contains shared Vitest setup. Put routes and public assets in `apps/web/app` and `apps/web/public`, and colocate frontend tests under `apps/web/src` or `apps/web/e2e`.

## Development Commands
Run `pnpm install` at the repository root. Use `pnpm dev` to start the local site at `http://localhost:5173`, `pnpm build` for static output, `pnpm typecheck` for TypeScript, `pnpm test` for Vitest, and `pnpm test:e2e` for Playwright. `pnpm check` runs formatting, lint, types, unit tests, design-token audit, and build.

## Coding Style
Follow `.editorconfig`: UTF-8, LF, final newline, and four-space indentation. Prefer ESM modules. Keep domain logic deterministic and free of React, browser APIs, clocks, and network access. Use `PascalCase` for components and `camelCase` for functions and variables. Keep comments short and focused on non-obvious constraints.

## Product and Accessibility
Make the first screen the practice experience, not a marketing page. Preserve clear keyboard focus, native touch and system-keyboard support, reduced motion, enhanced contrast, and text scaling. The interface follows system appearance by default and must work in both light and dark themes. Create original artwork; do not use Apple marks or reproduce Apple screens.

## Local Data
Settings and the latest 20 practice sessions use the app-owned `typemaster-studio:v1:*` local-storage namespace. First-launch cleanup may remove only the enumerated legacy TypeMaster, Typing Raid, TypeRift, and Pulsefield namespaces and databases in `apps/web/src/lib/storage.ts`; never call `localStorage.clear()` in application code or delete unrelated origin data. The one-time SQL retirement script drops only the five TypeRift-owned tables listed in `scripts/purge-typerift-data.sql`.

## Verification
For domain changes, cover deterministic transitions, character errors and corrections, timing, pause/resume, and results. For interface changes, verify desktop, tablet, and phone layouts, no horizontal overflow, local-data cleanup, and accessibility. Real iOS Safari is required to verify software-keyboard viewport behavior; mobile emulation does not reproduce the on-screen keyboard.

## Security and Retirement
Do not commit secrets. The current application has no runtime API or account integration. Any remaining cleanup of the retired online database or Clerk tenant must be verified in that project's own control plane; do not touch shared tables or unrelated accounts. Preserve Git history.
