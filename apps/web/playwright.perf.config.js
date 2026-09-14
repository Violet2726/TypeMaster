import { defineConfig, devices } from '@playwright/test';

/**
 * Performance budgets (guidance §21), measured against a **production build**.
 *
 * These are user-facing ceilings, so they have to be taken on the artefact a user actually
 * loads. A dev server serves unminified bundles and compiles routes on demand, which inflates
 * every start-up figure by an order of magnitude and drowns out real regressions: measured on
 * dev the cold start read 923ms, on the production build 99ms.
 *
 * The build and the server are owned here rather than in a package script so that the required
 * environment reaches the *build* step on every platform. `rewrites()` is resolved at build
 * time, so an env var set only when starting the server would arrive too late.
 *
 * `TYPERIFT_API_ORIGIN` restores the /api proxy that a deployed build receives from the edge
 * (see vercel.json). Without it the API calls would 404 and the timings would be flattering.
 *
 * This gate builds into the shared `.next`, exactly as `pnpm build` does, so it must not run
 * while `pnpm dev:web` is open: Next.js cannot serve a dev session and a production build from
 * one output directory. It also runs alone by design — parallel workers sharing one server
 * measure contention instead of the app.
 */

const PORT = Number(process.env.TYPERIFT_PERF_PORT ?? 4175);
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * Playwright's `webServer` health check uses Node's own HTTP client. Some sandboxes block that
 * while still allowing the browser to reach localhost, which makes the check time out even
 * though the server is up. Set `TYPERIFT_E2E_NO_SERVER=1` when the servers are already running
 * and Playwright should only attach to them.
 */
const managedServers = process.env.TYPERIFT_E2E_NO_SERVER !== '1';

export default defineConfig({
    testDir: './e2e',
    testMatch: /performance\.spec\.ts/,
    timeout: 90_000,
    workers: 1,
    expect: { timeout: 10_000 },
    use: {
        baseURL: BASE_URL,
        channel: 'chrome',
        trace: 'on-first-retry'
    },
    projects: [
        {
            name: 'performance',
            use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } }
        }
    ],
    webServer: managedServers
        ? [
              {
                  command: 'pnpm --dir ../.. --filter @typerift/api dev',
                  url: 'http://127.0.0.1:8080/health',
                  reuseExistingServer: true,
                  timeout: 60_000
              },
              {
                  // Build then serve, every run: a budget taken on a stale bundle is worthless.
                  command: `node ./node_modules/next/dist/bin/next build && node ./node_modules/next/dist/bin/next start -H 127.0.0.1 -p ${PORT}`,
                  env: {
                      CODEBUDDY_SAFE_DELETE_ENABLED: '0',
                      TYPERIFT_API_ORIGIN: 'http://127.0.0.1:8080'
                  },
                  url: BASE_URL,
                  reuseExistingServer: false,
                  timeout: 300_000
              }
          ]
        : undefined
});
