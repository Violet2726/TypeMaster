import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('TypeMaster Studio', () => {
    test('starts timing with the first keystroke and supports corrections, pause, and resume', async ({ page }) => {
        const apiRequests: string[] = [];
        page.on('request', (request) => {
            if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url());
        });

        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1, name: /让文字，落在指尖/ })).toBeVisible();
        const input = page.getByRole('textbox', { name: /点击这里/ });
        await expect(input).toHaveValue('');
        await input.fill('T');
        await expect(input).toHaveValue('T');
        await expect(page.locator('.live-metric.is-emphasized strong')).toContainText('00:');

        await input.fill('Tx');
        await expect(page.locator('.passage-character.is-mistake')).toHaveCount(1);
        await input.press('Escape');
        await expect(page.locator('.paused-state')).toBeVisible();
        await page.getByRole('button', { name: /继续练习/ }).click();
        await expect(input).toBeEnabled();
        await expect(input).toBeFocused();
        expect(apiRequests).toEqual([]);
    });

    test('places focus and the visible caret in the passage instead of showing a second input field', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('.typing-field')).toHaveCount(0);
        await expect(page.locator('.typing-capture-input')).toBeVisible();

        await page.locator('.passage-workspace').click({ position: { x: 40, y: 30 } });
        await expect(page.getByRole('textbox', { name: /点击这里/ })).toBeFocused();
        await expect(page.locator('.practice-room')).toHaveClass(/is-focused/);
        await expect(page.getByRole('textbox', { name: /点击这里/ })).toHaveValue('');
        const caretWidth = await page.locator('.passage-character.is-current').evaluate((element) => getComputedStyle(element, '::before').width);
        expect(caretWidth).toBe('2px');
    });

    test('keeps the active character visible as a passage advances on a phone', async ({ page }) => {
        await page.setViewportSize({ width: 320, height: 720 });
        await page.goto('/');
        const text = await page.locator('.passage-text').textContent();
        expect(text).toBeTruthy();
        await page.getByRole('textbox', { name: /点击这里/ }).fill(text!.slice(0, 250));

        const visibility = await page.locator('.passage-text').evaluate((element) => {
            const current = element.querySelector('.passage-character.is-current');
            if (!current) return null;
            const container = element.getBoundingClientRect();
            const target = current.getBoundingClientRect();
            return { scrollTop: element.scrollTop, isVisible: target.top >= container.top && target.bottom <= container.bottom };
        });
        expect(visibility?.scrollTop).toBeGreaterThan(0);
        expect(visibility?.isVisible).toBe(true);
    });

    test('saves a completed session locally and exposes useful progress notes', async ({ page }) => {
        await page.clock.install({ time: new Date('2026-10-11T12:00:00.000Z') });
        await page.goto('/');
        await page.getByRole('button', { name: '30 秒' }).click();
        await page.getByRole('textbox', { name: /点击这里/ }).fill('T');
        await page.clock.fastForward(30_000);

        await expect(page.getByRole('heading', { name: '你的节奏，清晰可见。' })).toBeVisible();
        await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('typemaster-studio:v1:sessions') ?? '[]').length)).toBe(1);
        await page.getByRole('button', { name: /查看进展/ }).click();
        await expect(page.getByRole('heading', { level: 2, name: '最近练习' })).toBeVisible();
        await expect(page.locator('.history-row')).toHaveCount(1);
    });

    test('clears only retired product data and keeps other local applications untouched', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(async () => {
            localStorage.removeItem('typemaster-studio:v1:legacy-cleaned');
            localStorage.setItem('typerift:v2:settings', 'legacy');
            localStorage.setItem('pulsefield:v1:sessions', 'legacy');
            localStorage.setItem('another-app:theme', 'dark');
            await new Promise<void>((resolve, reject) => {
                const request = indexedDB.open('typerift-v2', 1);
                request.onupgradeneeded = () => request.result.createObjectStore('runs');
                request.onsuccess = () => {
                    request.result.close();
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        });
        await page.reload();

        await expect.poll(() => page.evaluate(() => localStorage.getItem('typerift:v2:settings'))).toBeNull();
        await expect.poll(() => page.evaluate(() => localStorage.getItem('pulsefield:v1:sessions'))).toBeNull();
        expect(await page.evaluate(() => localStorage.getItem('another-app:theme'))).toBe('dark');
        await expect.poll(() => page.evaluate(async () => (await indexedDB.databases()).some((database) => database.name === 'typerift-v2'))).toBe(false);
    });

    test('keeps the workspace accessible and free of horizontal overflow', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);

        await page.getByRole('button', { name: '选文' }).click();
        await expect(page.getByRole('heading', { level: 1, name: /挑一篇文字/ })).toBeVisible();
        await page.getByRole('button', { name: '进展' }).click();
        await expect(page.getByRole('heading', { level: 1, name: /来自每一次练习/ })).toBeVisible();
        overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow).toBeLessThanOrEqual(0);

        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(results.violations).toEqual([]);
        await page.emulateMedia({ colorScheme: 'dark' });
        const darkResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(darkResults.violations).toEqual([]);
        await page.emulateMedia({ contrast: 'more' });
        const highContrast = await page.evaluate(() => {
            const styles = getComputedStyle(document.documentElement);
            return styles.getPropertyValue('--ink').trim() === styles.getPropertyValue('--ink-secondary').trim();
        });
        expect(highContrast).toBe(true);
        const highContrastResults = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(highContrastResults.violations).toEqual([]);
    });

    test('follows system appearance and supports language and text-size preferences', async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto('/');
        await page.getByRole('button', { name: '显示与语言设置' }).click();
        const settings = page.getByRole('dialog');
        await settings.getByRole('button', { name: 'English' }).click();
        await settings.getByRole('switch', { name: 'Reduce motion' }).check();
        await settings.getByRole('slider', { name: /Text size/ }).fill('2');
        await settings.getByRole('button', { name: 'Close preferences' }).click();

        await expect(page.getByRole('heading', { level: 1, name: /Let the words/ })).toBeVisible();
        await expect(page.locator('html')).toHaveAttribute('lang', 'en-US');
        await expect(page.locator('html')).toHaveAttribute('data-reduce-motion', 'true');
        await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(23, 25, 29)');
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
        await page.emulateMedia({ colorScheme: 'light' });
        await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(245, 246, 248)');
    });
});
