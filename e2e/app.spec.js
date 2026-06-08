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

    await page.waitForURL(/#\/result/, { timeout: 10000 });
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

test('starts the daily challenge directly from the home action hub', async ({ page }) => {
    await seedEnglishState(page);

    await page.goto('/#/');
    await page.getByRole('button', { name: 'Start challenge' }).click();

    await expect(page).toHaveURL(/#\/practice/);
    await expect(page.locator('.panel').first().getByRole('heading', { name: 'Daily challenge' })).toBeVisible();
    await expect(page.getByText('Challenge round')).toBeVisible();
});

test('opens the challenge page from the home leaderboard shortcut', async ({ page }) => {
    const challengeId = `daily-${new Date().toISOString().slice(0, 10)}`;
    await seedEnglishState(page, {
        'typemaster:v4:skill-profile': {
            createdAt: '2026-06-08T00:00:00.000Z',
            level: { id: 'builder', label: 'Builder' },
            summary: 'Keep pushing challenge consistency.',
            primaryFocus: 'accuracy',
            weakZones: [{ id: 'accuracy', label: 'accuracy', score: 92 }],
            metrics: { avgAccuracy: 92, avgConsistency: 84 }
        },
        'typemaster:v2:sessions': [
            {
                id: 'session-0',
                trainingMeta: {
                    type: 'challenge',
                    stepId: challengeId,
                    title: 'Daily challenge'
                },
                result: {
                    wpm: 80,
                    accuracy: 97,
                    completedAt: '2026-06-08T07:00:00.000Z'
                }
            },
            {
                id: 'session-1',
                trainingMeta: {
                    type: 'challenge',
                    stepId: challengeId,
                    title: 'Daily challenge'
                },
                result: {
                    wpm: 88,
                    accuracy: 98,
                    completedAt: '2026-06-08T08:00:00.000Z'
                }
            }
        ],
        'typemaster:v4:cloud-store': {
            currentUserId: 'user-1',
            users: {
                'user-1': {
                    id: 'user-1',
                    displayName: 'Alice',
                    createdAt: '2026-06-08T00:00:00.000Z',
                    sessions: [],
                    trainingPlan: null,
                    skillProfile: { level: { id: 'builder', label: 'Builder' } },
                    challengeResults: {},
                    achievements: [],
                    streakState: null
                }
            },
            challenges: {
                [challengeId]: {
                    id: challengeId,
                    dateKey: new Date().toISOString().slice(0, 10),
                    title: 'Daily challenge',
                    summary: 'Use one shared text to compare stability and accuracy.',
                    text: 'steady focus clear rhythm',
                    config: {
                        source: 'builtin',
                        mode: 'words',
                        durationSeconds: 45,
                        wordCount: 10,
                        includeNumbers: false,
                        includePunctuation: false,
                        aiTemplate: 'daily',
                        difficulty: 'medium'
                    },
                    leaderboard: [
                        {
                            id: 'entry-1',
                            sessionId: 'session-1',
                            displayName: 'Alice',
                            userId: 'user-1',
                            levelId: 'builder',
                            wpm: 88,
                            accuracy: 98,
                            createdAt: '2026-06-08T08:00:00.000Z'
                        }
                    ]
                }
            }
        }
    });

    await page.goto('/#/');
    await expect(page.getByText('Keep pushing the board. Today\'s speed curve is still moving upward.')).toBeVisible();
    await page.getByRole('button', { name: 'View leaderboard' }).click();

    await expect(page).toHaveURL(/#\/challenge/);
    await expect(page.getByText('Your challenge status')).toBeVisible();
    await expect(page.getByText('Peer group')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Today\'s trend' })).toBeVisible();
    await expect(page.getByText('Run focus')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Today\'s replay' })).toBeVisible();
    await expect(page.locator('.result-item-value').filter({ hasText: '#1' })).toHaveCount(2);
});

test('routes challenge recovery advice back into the plan', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop flow only');
    const challengeId = `daily-${new Date().toISOString().slice(0, 10)}`;
    await seedEnglishState(page, {
        'typemaster:v4:skill-profile': {
            createdAt: '2026-06-08T00:00:00.000Z',
            level: { id: 'builder', label: 'Builder' },
            summary: 'Keep pushing challenge consistency.',
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
        },
        'typemaster:v2:sessions': [
            {
                id: 'session-0',
                trainingMeta: { type: 'challenge', stepId: challengeId, title: 'Daily challenge' },
                result: { wpm: 96, accuracy: 98, completedAt: '2026-06-08T07:00:00.000Z' }
            },
            {
                id: 'session-1',
                trainingMeta: { type: 'challenge', stepId: challengeId, title: 'Daily challenge' },
                result: { wpm: 88, accuracy: 97, completedAt: '2026-06-08T08:00:00.000Z' }
            },
            {
                id: 'session-2',
                trainingMeta: { type: 'challenge', stepId: challengeId, title: 'Daily challenge' },
                result: { wpm: 82, accuracy: 95, completedAt: '2026-06-08T09:00:00.000Z' }
            }
        ],
        'typemaster:v4:cloud-store': {
            currentUserId: 'user-1',
            users: {
                'user-1': {
                    id: 'user-1',
                    displayName: 'Alice',
                    createdAt: '2026-06-08T00:00:00.000Z',
                    sessions: [],
                    trainingPlan: null,
                    skillProfile: { level: { id: 'builder', label: 'Builder' } },
                    challengeResults: {},
                    achievements: [],
                    streakState: null
                }
            },
            challenges: {
                [challengeId]: {
                    id: challengeId,
                    dateKey: new Date().toISOString().slice(0, 10),
                    title: 'Daily challenge',
                    summary: 'Use one shared text to compare stability and accuracy.',
                    text: 'steady focus clear rhythm',
                    config: {
                        source: 'builtin',
                        mode: 'words',
                        durationSeconds: 45,
                        wordCount: 10,
                        includeNumbers: false,
                        includePunctuation: false,
                        aiTemplate: 'daily',
                        difficulty: 'medium'
                    },
                    leaderboard: [
                        { id: 'entry-2', sessionId: 'session-2', displayName: 'Alice', userId: 'user-1', levelId: 'builder', wpm: 82, accuracy: 95, createdAt: '2026-06-08T09:00:00.000Z' }
                    ]
                }
            }
        }
    });

    await page.goto('/#/');
    await expect(page.getByText('The leaderboard push is flattening out. Step away from challenge mode and return to plan work.')).toBeVisible();
    await page.getByRole('button', { name: 'Back to plan' }).click();

    await expect(page).toHaveURL(/#\/practice/);
    await expect(page.locator('.panel').first().getByRole('heading', { name: 'Reset accuracy' })).toBeVisible();
});

test('shows challenge standing after completing a home-started daily challenge', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop flow only');
    await seedEnglishState(page, {
        'typemaster:v4:cloud-store': {
            currentUserId: 'user-1',
            users: {
                'user-1': {
                    id: 'user-1',
                    displayName: 'Alice',
                    createdAt: '2026-06-08T00:00:00.000Z',
                    sessions: [],
                    trainingPlan: null,
                    skillProfile: null,
                    challengeResults: {},
                    achievements: [],
                    streakState: null
                }
            },
            challenges: {
                [`daily-${new Date().toISOString().slice(0, 10)}`]: {
                    id: `daily-${new Date().toISOString().slice(0, 10)}`,
                    dateKey: new Date().toISOString().slice(0, 10),
                    title: 'Daily challenge',
                    summary: 'Use one shared text to compare stability and accuracy.',
                    text: 'steady focus clear rhythm sharp control calm output daily sprint',
                    config: {
                        source: 'builtin',
                        mode: 'words',
                        durationSeconds: 45,
                        wordCount: 10,
                        includeNumbers: false,
                        includePunctuation: false,
                        aiTemplate: 'daily',
                        difficulty: 'medium'
                    },
                    leaderboard: []
                }
            }
        }
    });

    await page.goto('/#/');
    await page.getByRole('button', { name: 'Start challenge' }).click();
    await expect(page).toHaveURL(/#\/practice/);
    await expect(page.locator('.panel').first().getByRole('heading', { name: 'Daily challenge' })).toBeVisible();
    await finishRound(page);

    await expect(page).toHaveURL(/#\/result/);
    await expect(page.getByRole('heading', { name: 'Daily challenge standing' })).toBeVisible();
    await expect(page.getByText('Run focus')).toBeVisible();
    await expect(page.getByText('Current rank')).toBeVisible();
    await expect(page.getByText('Personal best')).toBeVisible();
    await expect(page.getByRole('button', { name: 'View leaderboard' })).toBeVisible();
});

test('routes result-page challenge risk advice back into the plan', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop flow only');
    const challengeId = `daily-${new Date().toISOString().slice(0, 10)}`;
    await seedEnglishState(page, {
        'typemaster:v4:skill-profile': {
            createdAt: '2026-06-08T00:00:00.000Z',
            level: { id: 'builder', label: 'Builder' },
            summary: 'Keep pushing challenge consistency.',
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
        },
        'typemaster:v4:active-session-context': {
            type: 'plan',
            planId: 'plan-1',
            stepId: 'starter-day-1'
        },
        'typemaster:v2:sessions': [
            {
                id: 'session-1',
                trainingMeta: { type: 'challenge', stepId: challengeId, title: 'Daily challenge' },
                sourceTextMeta: { source: 'builtin', label: 'Daily challenge' },
                result: {
                    wpm: 80,
                    rawWpm: 86,
                    accuracy: 92,
                    consistency: 88,
                    durationSeconds: 45,
                    correctChars: 45,
                    incorrectChars: 4,
                    extraChars: 1,
                    missedChars: 0,
                    completedAt: '2026-06-08T09:00:00.000Z'
                },
                timeline: { labels: [], wpm: [], raw: [], accuracy: [], burst: [], errors: [], samples: [], pauseMoments: [] }
            },
            {
                id: 'session-0',
                trainingMeta: { type: 'challenge', stepId: challengeId, title: 'Daily challenge' },
                sourceTextMeta: { source: 'builtin', label: 'Daily challenge' },
                result: {
                    wpm: 74,
                    rawWpm: 82,
                    accuracy: 98,
                    consistency: 92,
                    durationSeconds: 45,
                    correctChars: 49,
                    incorrectChars: 1,
                    extraChars: 0,
                    missedChars: 0,
                    completedAt: '2026-06-08T08:00:00.000Z'
                },
                timeline: { labels: [], wpm: [], raw: [], accuracy: [], burst: [], errors: [], samples: [], pauseMoments: [] }
            }
        ],
        'typemaster:v4:cloud-store': {
            currentUserId: 'user-1',
            users: {
                'user-1': {
                    id: 'user-1',
                    displayName: 'Alice',
                    createdAt: '2026-06-08T00:00:00.000Z',
                    sessions: [],
                    trainingPlan: null,
                    skillProfile: { level: { id: 'builder', label: 'Builder' } },
                    challengeResults: {},
                    achievements: [],
                    streakState: null
                }
            },
            challenges: {
                [challengeId]: {
                    id: challengeId,
                    dateKey: new Date().toISOString().slice(0, 10),
                    title: 'Daily challenge',
                    summary: 'Use one shared text to compare stability and accuracy.',
                    text: 'steady focus clear rhythm',
                    config: {
                        source: 'builtin',
                        mode: 'words',
                        durationSeconds: 45,
                        wordCount: 10,
                        includeNumbers: false,
                        includePunctuation: false,
                        aiTemplate: 'daily',
                        difficulty: 'medium'
                    },
                    leaderboard: [
                        { id: 'entry-self', sessionId: 'session-1', displayName: 'Alice', userId: 'user-1', levelId: 'builder', wpm: 80, accuracy: 92, createdAt: '2026-06-08T09:00:00.000Z' }
                    ]
                }
            }
        }
    });

    await page.goto('/#/result?session=session-1');

    await expect(page.getByRole('heading', { name: 'Daily challenge standing' })).toBeVisible();
    await expect(page.getByText('Speed may be coming from accuracy leakage. Slow the next run down slightly.')).toBeVisible();
    await expect(page.getByText('Vs previous: +6 WPM / -6%')).toBeVisible();
    await page.getByRole('button', { name: 'Back to plan' }).click();

    await expect(page).toHaveURL(/#\/practice/);
    await expect(page.locator('.panel').first().getByRole('heading', { name: 'Reset accuracy' })).toBeVisible();
    await expect.poll(async () => page.evaluate(() => JSON.parse(window.localStorage.getItem('typemaster:v4:active-session-context')))).toMatchObject({
        type: 'plan',
        planId: 'plan-1',
        stepId: 'starter-day-1'
    });
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
