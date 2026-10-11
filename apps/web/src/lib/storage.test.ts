import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RunResult } from '@typemaster/domain';
import { DEFAULT_SETTINGS, loadRuns, loadSettings, saveRun, saveSettings, type Settings } from './storage';

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
    beforeEach(() => localStorage.clear());

    afterEach(() => vi.unstubAllGlobals());

    it('uses defaults for invalid settings and persists valid preferences', () => {
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

    it('keeps defaults when browser storage is unavailable', () => {
        vi.stubGlobal('localStorage', {
            getItem: () => {
                throw new Error('storage denied');
            },
            setItem: () => {
                throw new Error('storage denied');
            }
        });

        expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
        expect(loadRuns()).toEqual([]);
        expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();
        expect(() => saveRun(result(42))).not.toThrow();
    });

    it('creates an id when crypto.randomUUID is unavailable', () => {
        vi.stubGlobal('crypto', {});
        expect(saveRun(result(42)).id).toContain('-');
    });
});
