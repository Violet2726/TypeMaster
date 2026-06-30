import { test, expect } from '@playwright/test';
import { STORAGE_KEYS } from '@typemaster/contracts';

const seedPreferences = {
    language: 'zh-CN',
    theme: 'serika-dark',
    fontScale: 'md',
    focusMode: false,
    soundEffects: false,
    keyboardLayout: 'qwerty',
    customWordBankText: '',
    lastConfig: {
        source: 'builtin',
        mode: 'words',
        durationSeconds: 30,
        wordCount: 10,
        includePunctuation: false,
        includeNumbers: false,
        aiTemplate: 'daily',
        difficulty: 'medium'
    }
};

async function seedVNextState(page, extra = {}) {
    await page.addInitScript(({ preferences, entries, settingsKey }) => {
        window.localStorage.clear();
        window.localStorage.setItem(settingsKey, JSON.stringify(preferences));
        for (const [key, value] of Object.entries(entries)) {
            window.localStorage.setItem(key, JSON.stringify(value));
        }
    }, {
        preferences: extra[STORAGE_KEYS.settings] || seedPreferences,
        entries: Object.fromEntries(Object.entries(extra).filter(([key]) => key !== STORAGE_KEYS.settings)),
        settingsKey: STORAGE_KEYS.settings
    });
}

async function openFocusLab(page) {
    await page.goto('/practice');
    await expect(page.locator('.typing-capture-input')).toBeVisible();
}

async function finishRound(page) {
    const words = await page.locator('.word').evaluateAll((nodes) => nodes.slice(0, 10).map((node) => node.textContent.trim()));
    const input = page.locator('.typing-capture-input');
    await input.click({ force: true });

    for (const [index, word] of words.entries()) {
        if (index === words.length - 1) {
            await input.evaluate((element, value) => {
                const valueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                valueSetter?.call(element, value);
                element.dispatchEvent(new InputEvent('input', {
                    bubbles: true,
                    data: value,
                    inputType: 'insertText'
                }));
            }, word);
            break;
        }

        await input.type(word, { delay: 5 });
        await input.press('Space');
        await expect(input).toHaveValue('');
    }

    await page.waitForURL(/\/result/, { timeout: 10000 });
}

test('shows the TypeRift command center and keeps the v7 route loop', async ({ page }) => {
    await seedVNextState(page);

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'TypeRift Command Center' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start TypeRift' })).toBeVisible();

    await page.getByRole('button', { name: 'View missions' }).click();
    await expect(page).toHaveURL(/\/missions/);
    await expect(page.getByRole('heading', { name: 'Mission Center' })).toBeVisible();

    await page.getByRole('button', { name: 'Back to TypeRift' }).click();
    await expect(page).toHaveURL(/\/raid/);
});

test('completes a Focus Lab round and reaches the unified result page', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop typing flow only');
    await seedVNextState(page);
    await page.route('**/api/coach', async (route) => {
        await route.fulfill({
            status: 500,
            contentType: 'text/plain',
            body: 'server error'
        });
    });

    await openFocusLab(page);
    await finishRound(page);

    await expect(page).toHaveURL(/\/result/);
    await expect(page.getByText('This round', { exact: true })).toBeVisible();
    await expect(page.getByText('Next action', { exact: true })).toBeVisible();
});

test('starts TypeRift with a non-empty battle canvas and DOM HUD', async ({ page }) => {
    await seedVNextState(page);

    await page.goto('/raid');
    await expect(page.getByRole('application', { name: 'TypeRift roguelite typing survival game' })).toBeVisible();
    await page.getByRole('button', { name: 'Expedition' }).click();

    await expect(page.getByText('Target')).toBeVisible();
    await expect(page.getByRole('img', { name: 'TypeRift Echo Siege battlefield with enemies carrying typed words' })).toBeVisible();

    const pixels = await page.locator('canvas').evaluate((canvas) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return 0;
        const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let lit = 0;
        for (let index = 0; index < data.length; index += 4) {
            if (data[index] + data[index + 1] + data[index + 2] > 12) lit += 1;
        }
        return lit;
    });
    expect(pixels).toBeGreaterThan(500);
});
