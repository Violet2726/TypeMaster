import { defineConfig, devices } from '@playwright/test';

const PORT = Number(process.env.TYPEMASTER_E2E_PORT ?? 4174);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHANNEL = process.env.TYPEMASTER_E2E_CHANNEL ?? (process.env.CI ? undefined : 'chrome');
const BROWSER_CHANNEL = CHANNEL ? { channel: CHANNEL } : {};

export default defineConfig({
    testDir: './e2e',
    timeout: 45_000,
    expect: {
        timeout: 10_000,
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.02,
            animations: 'disabled',
            caret: 'hide'
        }
    },
    use: {
        baseURL: BASE_URL,
        ...BROWSER_CHANNEL,
        trace: 'on-first-retry'
    },
    projects: [
        {
            name: 'desktop',
            use: { ...devices['Desktop Chrome'], ...BROWSER_CHANNEL, viewport: { width: 1440, height: 900 } },
            testIgnore: /visual\.spec\.ts/
        },
        {
            name: 'tablet',
            use: { ...devices['Desktop Chrome'], ...BROWSER_CHANNEL, viewport: { width: 768, height: 1024 } },
            testMatch: /practice\.spec\.ts/
        },
        {
            name: 'phone',
            use: { ...devices['Desktop Chrome'], ...BROWSER_CHANNEL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true },
            testMatch: /practice\.spec\.ts/
        },
        {
            name: 'narrow',
            use: { ...devices['Desktop Chrome'], ...BROWSER_CHANNEL, viewport: { width: 320, height: 720 }, hasTouch: true, isMobile: true },
            testMatch: /practice\.spec\.ts/
        },
        {
            name: 'visual',
            use: { ...devices['Desktop Chrome'], ...BROWSER_CHANNEL, viewport: { width: 1440, height: 900 } },
            testMatch: /visual\.spec\.ts/
        }
    ],
    webServer: {
        command: `node ./node_modules/next/dist/bin/next dev -H 127.0.0.1 -p ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: true,
        timeout: 120_000
    }
});
