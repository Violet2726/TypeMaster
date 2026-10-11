import { expect, test } from '@playwright/test';

const BREAKPOINTS = [
    { name: 'narrow', width: 320, height: 720 },
    { name: 'phone', width: 390, height: 844 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 }
] as const;

async function hideDevChrome(page: import('@playwright/test').Page) {
    await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
}

test.describe('responsive studio surfaces', () => {
    test('practice stays readable and ready to use at every viewport', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'visual');
        for (const breakpoint of BREAKPOINTS) {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await page.goto('/');
            await hideDevChrome(page);
            await expect(page.getByRole('heading', { level: 1, name: /让文字，落在指尖/ })).toBeVisible();
            await expect(page.getByRole('textbox', { name: /点击这里/ })).toBeVisible();
            await expect(page.locator('.desk-feature img')).toBeVisible();
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
            expect(overflow).toBeLessThanOrEqual(0);
            await expect(page).toHaveScreenshot(`practice-${breakpoint.name}.png`, { fullPage: true });
        }
    });

    test('reading and progress views remain coherent at touch sizes', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'visual');
        for (const breakpoint of BREAKPOINTS.filter(({ name }) => name !== 'desktop')) {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await page.goto('/');
            await page.getByRole('button', { name: '选文' }).click();
            await expect(page.getByRole('heading', { level: 1, name: /挑一篇文字/ })).toBeVisible();
            await expect(page).toHaveScreenshot(`reading-${breakpoint.name}.png`, { fullPage: true });
            await page.getByRole('button', { name: '进展' }).click();
            await expect(page.getByRole('heading', { level: 1, name: /来自每一次练习/ })).toBeVisible();
            await expect(page).toHaveScreenshot(`progress-${breakpoint.name}.png`, { fullPage: true });
        }
    });

    test('system dark appearance keeps the passage and photograph balanced', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'visual');
        for (const breakpoint of [
            { name: 'phone', width: 390, height: 844 },
            { name: 'desktop', width: 1440, height: 900 }
        ]) {
            await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
            await page.emulateMedia({ colorScheme: 'dark' });
            await page.goto('/');
            await hideDevChrome(page);
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
            await expect(page.locator('.desk-feature img')).toHaveCSS('filter', 'brightness(0.84)');
            await expect(page).toHaveScreenshot(`practice-dark-${breakpoint.name}.png`, { fullPage: true });
        }
    });
});
