import { describe, expect, it } from 'vitest';
import type { LocalRun } from '../../lib/storage';
import { activeStreak, aggregateWeakKeys, metricAverage, metricDelta, weeklyInsight } from './hub-stats';

function run(overrides: Partial<LocalRun> & { id: string; completedAt: string }): LocalRun {
    return {
        id: overrides.id,
        completedAt: overrides.completedAt,
        verified: true,
        result: {
            contentVersion: 2,
            runId: overrides.id,
            mode: 'expedition',
            difficulty: 'standard',
            seed: 'seed',
            score: 1_000,
            accuracy: 90,
            wpm: 60,
            maxCombo: 40,
            durationMs: 60_000,
            areaIndex: 0,
            endReason: 'timeout',
            defeated: 10,
            bosses: 0,
            weakChars: [],
            upgradeIds: [],
            encounteredIds: [],
            defeatedBossIds: [],
            ...overrides.result
        }
    };
}

const t = (key: string) => key;

/** Builds an ISO string from local calendar parts so the streak logic is timezone-independent. */
function localIso(year: number, month: number, day: number, hour = 10) {
    return new Date(year, month - 1, day, hour).toISOString();
}

describe('hub stats', () => {
    it('ranks weak keys by how often they appear', () => {
        const history = [
            run({ id: 'a', completedAt: '2026-09-13T10:00:00.000Z', result: { weakChars: ['r', 't'] } as never }),
            run({ id: 'b', completedAt: '2026-09-12T10:00:00.000Z', result: { weakChars: ['r', 'p'] } as never }),
            run({ id: 'c', completedAt: '2026-09-11T10:00:00.000Z', result: { weakChars: ['r'] } as never })
        ];
        expect(aggregateWeakKeys(history)).toEqual(['r', 'p', 't']);
    });

    it('averages only the recent window', () => {
        const history = Array.from({ length: 12 }, (_, index) =>
            run({
                id: `r${index}`,
                completedAt: `2026-09-${String(13 - index).padStart(2, '0')}T10:00:00.000Z`,
                result: { accuracy: index < 10 ? 80 : 100 } as never
            })
        );
        expect(metricAverage(history.slice(0, 10), 'accuracy')).toBe(80);
    });

    it('reports no delta until a previous window exists', () => {
        const history = [run({ id: 'a', completedAt: '2026-09-13T10:00:00.000Z' })];
        expect(metricDelta(history, 'accuracy')).toBeNull();
    });

    it('compares the recent window against the one before it', () => {
        const history = [
            ...Array.from({ length: 10 }, (_, index) => run({ id: `new${index}`, completedAt: '2026-09-13T10:00:00.000Z', result: { accuracy: 95 } as never })),
            ...Array.from({ length: 10 }, (_, index) => run({ id: `old${index}`, completedAt: '2026-08-01T10:00:00.000Z', result: { accuracy: 90 } as never }))
        ];
        expect(metricDelta(history, 'accuracy')).toBe(5);
    });

    it('counts consecutive active days ending today', () => {
        const now = new Date(2026, 8, 13, 18);
        const history = [
            run({ id: 'a', completedAt: localIso(2026, 9, 13) }),
            run({ id: 'b', completedAt: localIso(2026, 9, 12) }),
            run({ id: 'c', completedAt: localIso(2026, 9, 11) }),
            run({ id: 'd', completedAt: localIso(2026, 9, 8) })
        ];
        expect(activeStreak(history, now)).toBe(3);
    });

    it('tolerates a streak that ended yesterday', () => {
        const now = new Date(2026, 8, 13, 18);
        expect(activeStreak([run({ id: 'a', completedAt: localIso(2026, 9, 12) })], now)).toBe(1);
    });

    it('returns the onboarding insight when there is nothing to compare', () => {
        expect(weeklyInsight([], t)).toBe('hub.insightStart');
    });
});
