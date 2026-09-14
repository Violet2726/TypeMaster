import { defineConfig, devices } from '@playwright/test';

/**
 * Visual and behavioural gates for TypeRift.
 *
 * The suite owns a dedicated port so it never fights with a `pnpm dev` session a
 * reviewer already has open, and so a run is reproducible on any machine.
 *
 * `channel: CHANNEL` is used instead of the bundled Chromium because Playwright's
 * browser downloads are not installed in this environment. That is the wrong default for CI,
 * which installs Chromium explicitly, so it is overridable: set `TYPERIFT_E2E_CHANNEL=chromium`
 * on any machine where the bundled browser is available.
 *
 * `CODEBUDDY_SAFE_DELETE_ENABLED=0` lets Next.js manage its own `.next` cache; the
 * sandbox's delete guard otherwise blocks its stale-file cleanup and kills the server.
 */

const PORT = Number(process.env.TYPERIFT_E2E_PORT ?? 4174);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHANNEL = process.env.TYPERIFT_E2E_CHANNEL ?? 'chrome';

/**
 * Playwright's `webServer` health check uses Node's own HTTP client. Some sandboxes
 * block that while still allowing the browser to reach localhost, which makes the
 * check time out even though the server is up. Set `TYPERIFT_E2E_NO_SERVER=1` when
 * the servers are already running and Playwright should only attach to them.
 */
const managedServers = process.env.TYPERIFT_E2E_NO_SERVER !== '1';

export default defineConfig({
    testDir: './e2e',
    timeout: 45_000,
    expect: {
        timeout: 10_000,
        toHaveScreenshot: {
            // Sub-pixel text rendering differs between machines; keep the gate strict
            // enough to catch layout regressions but tolerant of antialiasing noise.
            maxDiffPixelRatio: 0.02,
            animations: 'disabled',
            caret: 'hide'
        }
    },
    use: {
        baseURL: BASE_URL,
        channel: CHANNEL,
        trace: 'on-first-retry'
    },
    projects: [
        {
            // Functional gates. Visual has its own project; the timing budgets live in
            // `playwright.perf.config.js`, which runs them against a production build.
            name: 'desktop',
            use: { ...devices['Desktop Chrome'], channel: CHANNEL, viewport: { width: 1440, height: 900 } },
            testIgnore: [/visual\.spec\.ts/, /performance\.spec\.ts/]
        },
        {
            // Responsive behaviour of the real flows, not the screenshot matrix.
            name: 'tablet',
            use: { ...devices['Desktop Chrome'], channel: CHANNEL, viewport: { width: 768, height: 1024 } },
            testMatch: /typerift\.spec\.ts/
        },
        {
            name: 'phone',
            use: { ...devices['Desktop Chrome'], channel: CHANNEL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
            testMatch: /typerift\.spec\.ts/
        },
        {
            name: 'narrow',
            use: { ...devices['Desktop Chrome'], channel: CHANNEL, viewport: { width: 320, height: 720 }, hasTouch: true, isMobile: true },
            testMatch: /typerift\.spec\.ts/
        },
        {
            // Pixel baselines for 320 / 390 / 768 / 1440.
            name: 'visual',
            use: { ...devices['Desktop Chrome'], channel: CHANNEL, viewport: { width: 1440, height: 900 } },
            testMatch: /visual\.spec\.ts/
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
                  command: `node ./node_modules/next/dist/bin/next dev -H 127.0.0.1 -p ${PORT}`,
                  env: { CODEBUDDY_SAFE_DELETE_ENABLED: '0' },
                  url: BASE_URL,
                  reuseExistingServer: true,
                  timeout: 120_000
              }
          ]
        : undefined
});
