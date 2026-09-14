import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { SEEDED_RUN_ID, openWithHistory, seedRuns } from './support/fixtures';

const isDesktop = (name: string) => name === 'desktop';
/** Touch projects emulate a coarse pointer, which unlocks the Quick Pulse companion mode. */
const isTouch = (name: string) => name === 'phone' || name === 'narrow';

/** The settings sheet lives in the desktop top bar; mobile uses the bottom nav. */
function desktopOnly(testInfo: TestInfo) {
    test.skip(!isDesktop(testInfo.project.name), 'the settings sheet lives in the desktop top bar');
}

async function openSettings(page: Page) {
    await page.locator('.topbar').getByRole('button', { name: /设置|Settings/ }).click();
}

/** Wait until the HUD has a real word to read, then return it. */
async function waitForTargetWord(page: Page) {
    let word = '';
    await expect
        .poll(async () => {
            word = (await page.locator('.hud__word').first().getAttribute('data-word')) ?? '';
            return word.length;
        })
        .toBeGreaterThan(0);
    return word;
}

test.describe('entry and hub', () => {
    test('the hub leads with a single action and no legacy brand', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toContainText(/今天只需要做一件事|One thing to do today/);
        // One screen, one primary action.
        await expect(page.locator('.hub-hero__cta')).toHaveCount(1);
        await expect(page.locator('.hub-hero__cta')).toHaveText(/开始训练|Start training|继续远征|Continue Expedition/);
        await expect(page.getByText('TypeMaster')).toHaveCount(0);
    });

    test('a returning player sees a delta against the previous run', async ({ page }) => {
        await openWithHistory(page, '/');
        await expect(page.locator('.hub-signals article')).toHaveCount(3);
        await expect(page.locator('.hub-signal__value').first()).toHaveText(/9[0-9]/);
        await expect(page.locator('.hub-hero__cta')).toHaveText(/继续远征|Continue Expedition/);
    });

    test('the hub meets the LCP and CLS runtime budgets', async ({ page }) => {
        await page.addInitScript(() => {
            const metrics = { lcp: 0, cls: 0 };
            (window as Window & { __typeriftVitals: typeof metrics }).__typeriftVitals = metrics;
            new PerformanceObserver((list) => {
                metrics.lcp = Math.max(...list.getEntries().map((entry) => entry.startTime));
            }).observe({ type: 'largest-contentful-paint', buffered: true });
            new PerformanceObserver((list) => {
                for (const entry of list.getEntries() as Array<PerformanceEntry & { hadRecentInput: boolean; value: number }>) {
                    if (!entry.hadRecentInput) metrics.cls += entry.value;
                }
            }).observe({ type: 'layout-shift', buffered: true });
        });
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await page.waitForTimeout(350);
        const metrics = await page.evaluate(
            () => (window as Window & { __typeriftVitals: { lcp: number; cls: number } }).__typeriftVitals
        );
        expect(metrics.lcp).toBeGreaterThan(0);
        expect(metrics.lcp).toBeLessThan(2_500);
        expect(metrics.cls).toBeLessThan(0.1);
    });

    test('first calibration enters First Rift', async ({ page }, testInfo) => {
        test.skip(!isDesktop(testInfo.project.name), 'calibration needs a physical keyboard');
        await page.goto('/onboarding');
        await page.getByLabel(/呼号|Call sign/).fill('Nova');
        await page.getByRole('button', { name: /继续|Continue/ }).click();
        await page.getByLabel(/信号输入|Signal input/).fill('the quiet signal becomes a blade of light');
        await page.getByRole('button', { name: /开始 First Rift|Start First Rift/ }).click();
        await expect(page).toHaveURL(/\/play\?mode=first-rift/);
        await expect(page.locator('.hud')).toBeVisible({ timeout: 15_000 });
    });
});

test.describe('the mode gate', () => {
    test('a first-time player gets exactly one decision', async ({ page }) => {
        await page.goto('/play');
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('heading')).toContainText('TypeRift');
        await expect(dialog.getByRole('button', { name: /开始|Begin/ })).toHaveCount(1);
        await expect(dialog.locator('.mode-option')).toHaveCount(0);
    });

    test('a returning player chooses from the full mode list', async ({ page }, testInfo) => {
        await openWithHistory(page, '/play');
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        // Expedition stays the loudest option, and touch devices get Quick Pulse as a fifth.
        await expect(dialog.locator('.mode-option.is-accent')).toHaveCount(1);
        await expect(dialog.locator('.mode-option')).toHaveCount(isTouch(testInfo.project.name) ? 5 : 4);
    });
});

test.describe('combat', () => {
    test('a run reaches the HUD and reacts to the keyboard', async ({ page }, testInfo) => {
        test.skip(!isDesktop(testInfo.project.name), 'ranked runs need a physical keyboard');
        await page.goto('/play?mode=daily-rift');
        await expect(page.locator('.hud')).toBeVisible({ timeout: 20_000 });
        const word = await waitForTargetWord(page);
        await page.keyboard.press(word[0]!);
        await expect.poll(async () => (await page.locator('.hud__word-typed').textContent()) ?? '').toBe(word[0]!);
    });

    test('Escape pauses, and the pause dialog owns focus', async ({ page }, testInfo) => {
        test.skip(!isDesktop(testInfo.project.name), 'ranked runs need a physical keyboard');
        await page.goto('/play?mode=daily-rift');
        await expect(page.locator('.hud')).toBeVisible({ timeout: 20_000 });
        await page.keyboard.press('Escape');
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
        await expect(dialog).toContainText(/已暂停|Paused/);
        await expect(dialog.getByRole('button', { name: /继续战局|Resume run/ })).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
    });

    test('a touch device is routed to Quick Pulse', async ({ page }, testInfo) => {
        test.skip(!isTouch(testInfo.project.name), 'needs a coarse pointer');
        await page.goto('/play?mode=expedition');
        await expect(page.getByRole('heading', { name: /完整战局需要物理键盘|physical keyboard/i })).toBeVisible();
        await page.getByRole('button', { name: /Quick Pulse/ }).click();
        await expect(page).toHaveURL(/mode=quick-pulse/);
        await expect(page.getByLabel(/输入信号|Type signal/)).toBeAttached({ timeout: 20_000 });
    });
});

test.describe('accessibility preferences', () => {
    test('settings restore motion preferences across reloads', async ({ page }, testInfo) => {
        desktopOnly(testInfo);
        await page.goto('/');
        await openSettings(page);
        await page.getByRole('switch', { name: /减少动态|Reduce motion/ }).check();
        await page.reload();
        await expect.poll(() => page.locator('html').getAttribute('data-reduce-motion')).toBe('true');
    });

    test('settings support 200% text, contrast, and keyboard dismissal', async ({ page }, testInfo) => {
        desktopOnly(testInfo);
        await page.goto('/');
        await openSettings(page);
        await page.getByRole('slider', { name: /文字大小|Text size/ }).fill('2');
        await page.getByRole('switch', { name: /增强对比度|Increase contrast/ }).check();
        await expect
            .poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--user-text-scale').trim()))
            .toBe('2');
        await expect.poll(() => page.locator('html').getAttribute('data-contrast')).toBe('true');
        // The setting must actually move type, not just the variable.
        await expect.poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).fontSize)).toBe('32px');
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
    });

    test('primary pages pass automated WCAG checks', async ({ page }, testInfo) => {
        desktopOnly(testInfo);
        for (const path of ['/missions', '/archive', '/']) {
            await page.goto(path);
            const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
            expect(results.violations, `violations on ${path}`).toEqual([]);
        }
    });
});

test.describe('routing', () => {
    test('legacy URLs are real 404s', async ({ page }) => {
        for (const path of ['/practice', '/insights', '/result']) {
            const response = await page.goto(path);
            expect(response?.status()).toBe(404);
            await expect(page.getByText(/no longer exists/i)).toBeVisible();
        }
    });

    test('the debrief is reachable for a stored run', async ({ page }) => {
        await page.goto('/');
        await seedRuns(page);
        await page.goto(`/debrief/${SEEDED_RUN_ID}`, { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
});
