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

test('shows the Arcade Rift Command Center and navigates only through vNext routes', async ({ page }) => {
    await seedVNextState(page);

    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Arcade Rift 指挥台' })).toBeVisible();
    await expect(page.getByRole('button', { name: '开始 Arcade Rift' })).toBeVisible();

    await page.getByRole('button', { name: '查看任务' }).click();
    await expect(page).toHaveURL(/\/missions/);
    await expect(page.getByRole('heading', { name: '任务中心' })).toBeVisible();

    await page.getByRole('button', { name: '回到 Arcade Rift' }).click();
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

test('starts Arcade Rift with a non-empty battle canvas and DOM HUD', async ({ page }) => {
    await seedVNextState(page);

    await page.goto('/raid');
    await expect(page.getByRole('application', { name: 'Arcade Rift 打字街机游戏' })).toBeVisible();
    await page.getByRole('button', { name: '开始无尽裂隙' }).click();

    await expect(page.getByText(/裂隙\s+1/)).toBeVisible();
    await expect(page.getByRole('img', { name: 'Arcade Rift 发光裂隙战场，输入怪物身上的词以清除目标' })).toBeVisible();
});
