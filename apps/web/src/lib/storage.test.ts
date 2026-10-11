import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    DEFAULT_SETTINGS,
    deleteLegacyDatabase,
    initializeStorage,
    loadRuns,
    loadSettings,
    removeLegacyLocalStorage,
    saveRun,
    saveSettings,
    type Settings
} from './storage';
import type { RunResult } from '@typemaster/domain';

type FakeDeleteRequest = {
    onsuccess: ((event: Event) => void) | null;
    onerror: ((event: Event) => void) | null;
    onblocked: ((event: IDBVersionChangeEvent) => void) | null;
};

function fakeDatabase(blockName?: string): IDBFactory {
    return {
        deleteDatabase: vi.fn((name: string) => {
            const request: FakeDeleteRequest = { onsuccess: null, onerror: null, onblocked: null };
            window.setTimeout(() => {
                if (name === blockName) request.onblocked?.(new Event('blocked') as IDBVersionChangeEvent);
                else request.onsuccess?.(new Event('success'));
            }, 0);
            return request as unknown as IDBOpenDBRequest;
        })
    } as unknown as IDBFactory;
}

function result(wpm: number): RunResult {
    return {
        durationMs: 60_000,
        elapsedMs: 60_000,
        wpm,
        accuracy: 96,
        typedChars: 300,
        correctChars: 288,
        errors: 12,
        maxStreak: 35,
        completedPassages: 1,
        weakKeys: [{ key: 'e', mistakes: 3 }]
    };
}

describe('local practice storage', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.stubGlobal('indexedDB', fakeDatabase());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('removes only known legacy namespaces and preserves unrelated local data', () => {
        localStorage.setItem('typemaster:profile', 'old');
        localStorage.setItem('typing-raid:state', 'old');
        localStorage.setItem('typerift:v2:settings', 'old');
        localStorage.setItem('pulsefield:v1:sessions', '[]');
        localStorage.setItem('another-app:theme', 'dark');

        removeLegacyLocalStorage(localStorage);

        expect(localStorage.getItem('typemaster:profile')).toBeNull();
        expect(localStorage.getItem('typing-raid:state')).toBeNull();
        expect(localStorage.getItem('typerift:v2:settings')).toBeNull();
        expect(localStorage.getItem('pulsefield:v1:sessions')).toBeNull();
        expect(localStorage.getItem('another-app:theme')).toBe('dark');
    });

    it('tolerates missing storage keys while enumerating an old namespace', () => {
        const removed: string[] = [];
        removeLegacyLocalStorage({
            length: 2,
            key: (index) => (index === 0 ? null : 'typerift:v2:settings'),
            removeItem: (key) => removed.push(key)
        });
        expect(removed).toEqual(['typerift:v2:settings']);
    });

    it('does not mark cleanup complete when an old database is blocked', async () => {
        vi.stubGlobal('indexedDB', fakeDatabase('typerift-v2'));
        localStorage.setItem('typerift:v2:settings', 'old');

        await expect(initializeStorage()).resolves.toBe(false);
        expect(localStorage.getItem('typemaster-studio:v1:legacy-cleaned')).toBeNull();
        expect(localStorage.getItem('typerift:v2:settings')).toBeNull();
    });

    it('marks cleanup complete only after all legacy databases are removed', async () => {
        await expect(initializeStorage()).resolves.toBe(true);
        expect(localStorage.getItem('typemaster-studio:v1:legacy-cleaned')).toBe('done');
    });

    it('skips database deletion after a successful cleanup marker', async () => {
        const database = fakeDatabase();
        localStorage.setItem('typemaster-studio:v1:legacy-cleaned', 'done');
        vi.stubGlobal('indexedDB', database);

        await expect(initializeStorage()).resolves.toBe(true);
        expect(database.deleteDatabase).not.toHaveBeenCalled();
    });

    it('reports database request errors, exceptions, and timeouts', async () => {
        const errorFactory = {
            deleteDatabase: () => {
                const request: FakeDeleteRequest = { onsuccess: null, onerror: null, onblocked: null };
                window.setTimeout(() => request.onerror?.(new Event('error')), 0);
                return request as unknown as IDBOpenDBRequest;
            }
        } as unknown as IDBFactory;
        const throwingFactory = {
            deleteDatabase: () => {
                throw new Error('denied');
            }
        } as unknown as IDBFactory;
        const pendingFactory = { deleteDatabase: () => ({}) } as unknown as IDBFactory;

        await expect(deleteLegacyDatabase(errorFactory, 'error-db')).resolves.toBe(false);
        await expect(deleteLegacyDatabase(throwingFactory, 'throwing-db')).resolves.toBe(false);
        await expect(deleteLegacyDatabase(pendingFactory, 'pending-db', 1)).resolves.toBe(false);
    });

    it('uses defaults for invalid preferences and persists valid settings', () => {
        localStorage.setItem('typemaster-studio:v1:settings', '{broken');
        expect(loadSettings()).toEqual(DEFAULT_SETTINGS);

        localStorage.setItem(
            'typemaster-studio:v1:settings',
            JSON.stringify({ locale: 'fr-FR', durationMs: 123, reduceMotion: 1, enhancedContrast: 0, textScale: 1.3 })
        );
        expect(loadSettings()).toEqual(DEFAULT_SETTINGS);

        const settings: Settings = { ...DEFAULT_SETTINGS, locale: 'en-US', durationMs: 30_000, textScale: 1.5, reduceMotion: true };
        saveSettings(settings);
        expect(loadSettings()).toEqual(settings);
    });

    it('keeps only the latest twenty local sessions', () => {
        for (let speed = 1; speed <= 25; speed += 1) saveRun(result(speed));
        expect(loadRuns()).toHaveLength(20);
        expect(loadRuns()[0]?.result.wpm).toBe(25);
        expect(loadRuns().at(-1)?.result.wpm).toBe(6);
    });

    it('filters malformed sessions and handles invalid JSON', () => {
        localStorage.setItem('typemaster-studio:v1:sessions', JSON.stringify([{ id: 1 }, { id: 'incomplete', completedAt: '2026-01-01', result: {} }]));
        expect(loadRuns()).toHaveLength(0);
        localStorage.setItem('typemaster-studio:v1:sessions', '{}');
        expect(loadRuns()).toEqual([]);
        localStorage.setItem('typemaster-studio:v1:sessions', '{broken');
        expect(loadRuns()).toEqual([]);
    });
});
