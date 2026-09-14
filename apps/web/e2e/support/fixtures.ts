import { expect, type Page } from '@playwright/test';

/**
 * Shared fixtures for the TypeRift gates.
 *
 * Runs are seeded straight into IndexedDB so a screen that normally needs a
 * multi-minute run can be reviewed in milliseconds. The shape mirrors what
 * `saveLocalRun` writes in `src/lib/storage.ts`.
 */

export const SEEDED_RUN_ID = 'e2e-run-0001';
export const SEEDED_PREVIOUS_ID = 'e2e-run-0000';

type SeededRun = {
    id: string;
    result: Record<string, unknown>;
    completedAt: string;
    verified: boolean;
};

const RESULT = {
    contentVersion: 2,
    runId: SEEDED_RUN_ID,
    mode: 'expedition',
    difficulty: 'standard',
    seed: 'e2e-seed',
    score: 18420,
    accuracy: 96.4,
    wpm: 71,
    maxCombo: 148,
    durationMs: 402_000,
    areaIndex: 1,
    endReason: 'timeout',
    defeated: 63,
    bosses: 1,
    weakChars: ['r', 't', 'p'],
    upgradeIds: ['clean-strike', 'echo-lance', 'steady-heart'],
    encounteredIds: ['drift', 'flare', 'veil'],
    defeatedBossIds: ['harbor-mind']
};

/** A run plus the run before it, so the hub and the debrief both have a delta to show. */
export const SEEDED_RUNS: SeededRun[] = [
    { id: SEEDED_RUN_ID, result: RESULT, completedAt: '2026-09-13T09:00:00.000Z', verified: true },
    {
        id: SEEDED_PREVIOUS_ID,
        result: { ...RESULT, runId: SEEDED_PREVIOUS_ID, score: 15_980, accuracy: 93.2, wpm: 67, maxCombo: 120 },
        completedAt: '2026-09-10T10:00:00.000Z',
        verified: true
    }
];

/** Write runs into the `typerift-v2` database. Must run after the app has opened the origin once. */
export async function seedRuns(page: Page, runs: SeededRun[] = SEEDED_RUNS) {
    await page.evaluate(async (records) => {
        const open = () =>
            new Promise<IDBDatabase>((resolve, reject) => {
                const request = indexedDB.open('typerift-v2', 1);
                request.onupgradeneeded = () => {
                    const database = request.result;
                    for (const store of ['runs', 'snapshot', 'outbox']) {
                        if (!database.objectStoreNames.contains(store)) {
                            database.createObjectStore(store, { keyPath: store === 'outbox' ? 'runId' : 'id' });
                        }
                    }
                };
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        const database = await open();
        const transaction = database.transaction('runs', 'readwrite');
        for (const record of records) transaction.objectStore('runs').put(record);
        await new Promise((resolve) => {
            transaction.oncomplete = resolve;
            transaction.onerror = resolve;
        });
        database.close();
    }, runs);
}

/** Visit the origin once, seed history, then land on the page under test. */
export async function openWithHistory(page: Page, path: string, runs: SeededRun[] = SEEDED_RUNS) {
    await page.goto('/');
    await seedRuns(page, runs);
    await page.goto(path, { waitUntil: 'domcontentloaded' });
}

/** Wait until the run is genuinely playable: the HUD is mounted and the engine is ticking. */
export async function waitForHud(page: Page) {
    await page.waitForSelector('.hud', { timeout: 30_000 });
    await expect(page.locator('.hud__pause')).toBeVisible();
}

/**
 * Wait until there is an enemy to type at.
 *
 * This is gameplay cadence, not load time: the engine's first spawn cooldown is up to
 * 2.1s, so never use it to measure start-up performance.
 */
export async function waitForPlayable(page: Page) {
    await waitForHud(page);
    await expect(page.locator('.hud__word')).toBeVisible();
}

/** The HUD word currently in focus, as a plain string. */
export async function currentWord(page: Page) {
    return (await page.locator('.hud__word').first().getAttribute('data-word')) ?? '';
}

/**
 * Type the focused word correctly. Returns the number of words completed.
 *
 * The engine spawns on a cooldown, so we re-read the target after every kill
 * instead of assuming a fixed cadence.
 */
export async function typeWords(page: Page, count: number) {
    let completed = 0;
    let guard = 0;
    while (completed < count && guard < count * 40) {
        guard += 1;
        const word = await currentWord(page);
        if (!word) {
            await page.waitForTimeout(120);
            continue;
        }
        const before = word;
        for (const character of before) await page.keyboard.press(character);
        completed += 1;
        await page.waitForTimeout(90);
        // Wait for a fresh target before starting the next word.
        let waited = 0;
        while ((await currentWord(page)) === before && waited < 20) {
            await page.waitForTimeout(100);
            waited += 1;
        }
    }
    return completed;
}
