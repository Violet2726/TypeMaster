import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { SEEDED_RUN_ID, openWithHistory, waitForPlayable } from './support/fixtures';

/**
 * Visual regression gates (guidance §22).
 *
 * One project sweeps every breakpoint instead of four projects repeating the same
 * assertions. Dynamic regions — the canvas, the live word, the elapsed clock — are
 * masked so the gate protects layout and typography rather than frame timing.
 *
 * Baselines live in `visual.spec.ts-snapshots/`. Refresh them deliberately with
 * `pnpm --filter @typerift/web test:e2e -- --update-snapshots`.
 */

const BREAKPOINTS = [
    { name: 'narrow', width: 320, height: 720 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 }
] as const;

const SETTINGS_KEY = 'typerift:v2:settings';
const BASE_SETTINGS = {
    theme: 'light',
    locale: 'zh-CN',
    reduceMotion: false,
    reduceTransparency: false,
    reduceEffects: false,
    enhancedContrast: false,
    colorSafe: false,
    noFlash: false,
    reactionAssist: false,
    music: false,
    effects: false,
    voice: false,
    textScale: 1
};

/** The breakpoint matrix is swept inside one project rather than repeated four times. */
function visualOnly(testInfo: TestInfo) {
    test.skip(testInfo.project.name !== 'visual', 'this spec sweeps every breakpoint internally');
}

/** The dev server draws its own indicator button; it is not part of the product. */
async function hideDevChrome(page: Page) {
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
}

async function applySettings(page: Page, overrides: Partial<typeof BASE_SETTINGS>) {
    await page.addInitScript(
        ({ key, settings }) => localStorage.setItem(key, JSON.stringify(settings)),
        { key: SETTINGS_KEY, settings: { ...BASE_SETTINGS, ...overrides } }
    );
}

test.describe('visual regression', () => {
    test('the hub holds its hierarchy at every breakpoint', async ({ page }, testInfo) => {
        visualOnly(testInfo);
        for (const breakpoint of BREAKPOINTS) {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await openWithHistory(page, '/');
            await hideDevChrome(page);
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
            await expect(page).toHaveScreenshot(`hub-${breakpoint.name}.png`, { fullPage: true });
        }
    });

    test('the first-run hub stays honest about having no data', async ({ page }, testInfo) => {
        visualOnly(testInfo);
        for (const breakpoint of BREAKPOINTS) {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await page.goto('/');
            await hideDevChrome(page);
            await expect(page.locator('.hub-signals article')).toHaveCount(3);
            await expect(page).toHaveScreenshot(`hub-first-${breakpoint.name}.png`, { fullPage: true });
        }
    });

    test('the mode gate asks one question at every breakpoint', async ({ page }, testInfo) => {
        visualOnly(testInfo);
        for (const breakpoint of BREAKPOINTS) {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await page.goto('/play');
            await hideDevChrome(page);
            await expect(page.getByRole('dialog')).toBeVisible();
            await expect(page).toHaveScreenshot(`mode-gate-first-${breakpoint.name}.png`);
        }
    });

    test('the returning mode list keeps Expedition loudest', async ({ page }, testInfo) => {
        visualOnly(testInfo);
        for (const breakpoint of BREAKPOINTS) {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await openWithHistory(page, '/play');
            await hideDevChrome(page);
            await expect(page.locator('.mode-option')).toHaveCount(4);
            await expect(page).toHaveScreenshot(`mode-gate-returning-${breakpoint.name}.png`);
        }
    });

    test('the debrief leads with one next action', async ({ page }, testInfo) => {
        visualOnly(testInfo);
        for (const breakpoint of BREAKPOINTS) {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await page.goto('/');
            await openWithHistory(page, `/debrief/${SEEDED_RUN_ID}`);
            await hideDevChrome(page);
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
            await expect(page).toHaveScreenshot(`debrief-${breakpoint.name}.png`, { fullPage: true });
        }
    });

    test('the combat HUD keeps its three tiers', async ({ page }, testInfo) => {
        visualOnly(testInfo);
        for (const breakpoint of BREAKPOINTS) {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await page.goto('/play?mode=daily-rift');
            await hideDevChrome(page);
            await waitForPlayable(page);
            // The HUD is full-viewport and near-transparent, so the canvas and the enemy plates
            // would dominate the frame. Hide them and mask only the live values, leaving a gate
            // on the chrome: layout, spacing, type scale, touch targets.
            await page.addStyleTag({
                content: '.battle-canvas, .word-layer { visibility: hidden !important; }'
            });
            await expect(page.locator('.hud')).toHaveScreenshot(`hud-${breakpoint.name}.png`, {
                mask: [page.locator('.hud__word'), page.locator('.hud__area-value'), page.locator('.hud__signal')]
            });
        }
    });

    test('the pause dialog keeps the run one action away', async ({ page }, testInfo) => {
        visualOnly(testInfo);
        for (const breakpoint of BREAKPOINTS) {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await page.goto('/play?mode=daily-rift');
            await hideDevChrome(page);
            await waitForPlayable(page);
            await page.keyboard.press('Escape');
            const dialog = page.getByRole('dialog');
            await expect(dialog).toBeVisible();
            await expect(dialog).toHaveScreenshot(`pause-${breakpoint.name}.png`, {
                mask: [dialog.locator('.game-dialog__description')]
            });
        }
    });
});

test.describe('preference variants', () => {
    for (const breakpoint of [
        { name: 'phone', width: 390, height: 844 },
        { name: 'desktop', width: 1440, height: 900 }
    ]) {
        test(`200% text keeps every word readable at ${breakpoint.name}`, async ({ page }, testInfo) => {
            visualOnly(testInfo);
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await applySettings(page, { textScale: 2 });
            await openWithHistory(page, '/');
            await hideDevChrome(page);
            // No content may be pushed outside the viewport by the larger type.
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
            expect(overflow).toBeLessThanOrEqual(0);
            await expect(page).toHaveScreenshot(`hub-text-200-${breakpoint.name}.png`, { fullPage: true });
        });

        test(`the English interface does not overflow at ${breakpoint.name}`, async ({ page }, testInfo) => {
            visualOnly(testInfo);
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await applySettings(page, { locale: 'en-US' });
            await openWithHistory(page, '/');
            await hideDevChrome(page);
            await expect(page.getByRole('heading', { level: 1 })).toContainText('One thing to do today');
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
            expect(overflow).toBeLessThanOrEqual(0);
            await expect(page).toHaveScreenshot(`hub-en-${breakpoint.name}.png`, { fullPage: true });
        });

        test(`reduced motion renders the same static layout at ${breakpoint.name}`, async ({ page }, testInfo) => {
            visualOnly(testInfo);
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await applySettings(page, { reduceMotion: true, reduceEffects: true });
            await openWithHistory(page, '/');
            await hideDevChrome(page);
            await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', 'true');
            await expect(page).toHaveScreenshot(`hub-reduced-motion-${breakpoint.name}.png`, { fullPage: true });
        });
    }

    test('enhanced contrast keeps the hub legible', async ({ page }, testInfo) => {
        visualOnly(testInfo);
        await page.setViewportSize({ width: 1440, height: 900 });
        await applySettings(page, { enhancedContrast: true });
        await openWithHistory(page, '/');
        await hideDevChrome(page);
        await expect(page.locator('html')).toHaveAttribute('data-contrast', 'true');
        await expect(page).toHaveScreenshot('hub-contrast-desktop.png', { fullPage: true });
    });
});
