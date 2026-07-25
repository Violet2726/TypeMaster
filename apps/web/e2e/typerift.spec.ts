import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('TypeRift v1 mainline', () => {
    test('hub has one clear expedition action and no legacy brand', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toContainText(/节奏|rhythm/i);
        await expect(page.getByRole('link', { name: /进入远征|Enter Expedition|校准|calibration/i })).toBeVisible();
        await expect(page.getByText('TypeMaster')).toHaveCount(0);
    });

    test('hub keeps a stable responsive visual hierarchy', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page).toHaveScreenshot('hub.png', {
            animations: 'disabled',
            fullPage: true
        });
    });

    test('hub meets the LCP and CLS runtime budgets', async ({ page }) => {
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
        const metrics = await page.evaluate(() => (window as Window & { __typeriftVitals: { lcp: number; cls: number } }).__typeriftVitals);
        expect(metrics.lcp).toBeGreaterThan(0);
        expect(metrics.lcp).toBeLessThan(2_500);
        expect(metrics.cls).toBeLessThan(0.1);
    });

    test('first calibration enters First Rift', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name.includes('mobile'), 'full First Rift requires a physical keyboard');
        await page.goto('/onboarding');
        await page.getByLabel(/呼号|Call sign/).fill('Nova');
        const sample = await page.getByLabel('Calibration text').textContent();
        await page.getByLabel('Signal input').fill(sample ?? '');
        await page.getByRole('button', { name: /First Rift/ }).click();
        await expect(page).toHaveURL(/\/play\?mode=first-rift/);
        await expect(page.getByText('First Rift')).toBeVisible({ timeout: 10000 });
    });

    test('Daily Rift uses the combat HUD and keyboard input', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name.includes('mobile'), 'ranked Daily Rift requires a physical keyboard');
        await page.goto('/play?mode=daily-rift');
        await expect(page.getByText('Daily Rift')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(/Score/).first()).toBeVisible();
        const p95FrameTime = await page.evaluate(
            () =>
                new Promise<number>((resolve) => {
                    const samples: number[] = [];
                    let previous = 0;
                    const sample = (timestamp: number) => {
                        if (previous > 0) samples.push(timestamp - previous);
                        previous = timestamp;
                        if (samples.length < 120) requestAnimationFrame(sample);
                        else {
                            samples.sort((a, b) => a - b);
                            resolve(samples[Math.floor(samples.length * 0.95)] ?? Number.POSITIVE_INFINITY);
                        }
                    };
                    requestAnimationFrame(sample);
                })
        );
        expect(p95FrameTime).toBeLessThan(20);
        await page.keyboard.press('a');
        await expect(page.getByText('Fracture', { exact: true })).toBeVisible();
    });

    test('settings restore accessibility preferences', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('button', { name: /设置|Settings/ }).click();
        await page.getByRole('switch', { name: /减少动态|Reduce motion/ }).check();
        await page.reload();
        await expect.poll(() => page.locator('html').getAttribute('data-reduce-motion')).toBe('true');
    });

    test('settings support 200% text, enhanced contrast, and keyboard dismissal', async ({ page }) => {
        await page.goto('/');
        const settingsButton = page.getByRole('button', { name: /设置|Settings/ });
        await settingsButton.click();
        await page.getByRole('slider', { name: /文字大小|Text size/ }).fill('2');
        await page.getByRole('switch', { name: /增强对比度|Increase contrast/ }).check();
        await expect.poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).getPropertyValue('--user-text-scale').trim())).toBe('2');
        await expect.poll(() => page.locator('html').getAttribute('data-contrast')).toBe('true');
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
        await expect(settingsButton).toBeFocused();
    });

    test('primary pages pass automated WCAG checks', async ({ page }) => {
        await page.goto('/missions');
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(results.violations).toEqual([]);
    });

    test('legacy URLs are real 404s', async ({ page }) => {
        for (const path of ['/practice', '/insights', '/result']) {
            const response = await page.goto(path);
            expect(response?.status()).toBe(404);
            await expect(page.getByText(/no longer exists/i)).toBeVisible();
        }
    });
});

test.describe('responsive companion', () => {
    test('mobile enters Quick Pulse and exposes a touch input', async ({ page }, testInfo) => {
        test.skip(!testInfo.project.name.includes('mobile'), 'mobile-only companion flow');
        await page.goto('/play?mode=expedition');
        await expect(page.getByRole('heading', { name: /物理键盘|physical keyboard/i })).toBeVisible();
        await page.getByRole('button', { name: /Quick Pulse/ }).click();
        await expect(page.getByLabel('Type signal')).toBeVisible({ timeout: 10000 });
    });
});
