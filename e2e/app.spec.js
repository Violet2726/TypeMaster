const { test, expect } = require('@playwright/test');

async function seedEnglishState(page, extra = {}) {
    await page.addInitScript((payload) => {
        window.localStorage.clear();
        window.localStorage.setItem('typemaster:v2:settings', JSON.stringify({
            language: 'en-US',
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
        }));

        Object.entries(payload).forEach(([key, value]) => {
            window.localStorage.setItem(key, JSON.stringify(value));
        });
    }, extra);
}

async function configureWordsRound(page) {
    await page.goto('/#/practice');
    await page.getByRole('button', { name: 'Words' }).click();
    await page.getByRole('button', { name: '10', exact: true }).click();
}

async function finishRound(page) {
    const words = await page.locator('.word').evaluateAll((nodes) => nodes.slice(0, 10).map((node) => node.textContent.trim()));
    await page.locator('.typing-capture-input').click({ force: true });
    await page.locator('.typing-capture-input').type(`${words.join(' ')} `, { delay: 5 });
}

test('completes a practice round and reaches the result page', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop flow only');
    await seedEnglishState(page);
    await page.route('**/api/chat', async (route) => {
        await route.fulfill({
            status: 500,
            contentType: 'text/plain',
            body: 'server error'
        });
    });
    await configureWordsRound(page);
    await finishRound(page);

    await expect(page).toHaveURL(/#\/result/);
    await expect(page.getByRole('region', { name: 'Key metrics' })).toBeVisible();
    await expect(page.getByText('Next action', { exact: true })).toBeVisible();
});

test('falls back to local coach advice when AI coach request fails', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop flow only');
    await seedEnglishState(page);
    await page.route('**/api/chat', async (route) => {
        await route.fulfill({
            status: 500,
            contentType: 'text/plain',
            body: 'server error'
        });
    });

    await configureWordsRound(page);
    await finishRound(page);

    await expect(page).toHaveURL(/#\/result/);
    await expect(page.getByText('Local advice')).toBeVisible();
});

test('mobile plan flow continues into practice with sticky controls visible', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile flow only');
    await seedEnglishState(page, {
        'typemaster:v4:skill-profile': {
            createdAt: '2026-06-08T00:00:00.000Z',
            level: { id: 'builder', label: 'Builder' },
            summary: 'Your next phase should focus on reinforcing accuracy.',
            primaryFocus: 'accuracy',
            weakZones: [{ id: 'accuracy', label: 'accuracy', score: 92 }],
            metrics: { avgAccuracy: 92, avgConsistency: 84 }
        },
        'typemaster:v4:training-plan': {
            id: 'plan-1',
            title: '7-day starter plan',
            summary: 'Stabilize the clearest weakness first, then add pressure.',
            status: 'active',
            currentStepIndex: 0,
            steps: [
                {
                    id: 'starter-day-1',
                    order: 1,
                    title: 'Reset accuracy',
                    summary: 'Use a mid-length round to bring hit rate back under control.',
                    status: 'pending',
                    config: {
                        source: 'builtin',
                        mode: 'time',
                        durationSeconds: 45,
                        wordCount: 25,
                        includeNumbers: false,
                        includePunctuation: false,
                        aiTemplate: 'daily',
                        difficulty: 'medium'
                    }
                }
            ]
        }
    });

    await page.goto('/#/');
    await page.getByRole('button', { name: /Continue today\'s task/i }).click();

    await expect(page).toHaveURL(/#\/practice/);
    await expect(page.locator('.sticky-action-bar')).toBeVisible();
    await expect(page.locator('.panel').first().getByRole('heading', { name: 'Reset accuracy' })).toBeVisible();
});
