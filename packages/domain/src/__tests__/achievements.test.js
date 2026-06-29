import { describe, it, expect } from 'vitest';
import { buildAchievements } from '../achievements.js';

function makeRaidSession(overrides = {}) {
    return {
        id: 'raid-1',
        trainingMeta: { type: 'raid', maxCombo: 10, threatLevel: 5, endReason: 'extract', livesRemaining: 2 },
        result: { completedAt: '2026-06-20T12:00:00Z', score: 500, wpm: 60, accuracy: 95 },
        ...overrides
    };
}

describe('achievements.js', () => {
    it('builds unlocked achievements from sessions and progress', () => {
        const sessions = [
            {
                trainingMeta: { type: 'challenge' },
                result: {
                    completedAt: '2026-06-01T00:00:00.000Z',
                    accuracy: 98,
                    consistency: 91,
                    wpm: 102
                }
            }
        ];

        const achievements = buildAchievements({
            sessions,
            sessionStreak: 3,
            weeklyGoal: { completed: 3, target: 3 },
            skillProfile: { createdAt: '2026-06-02T00:00:00.000Z' }
        });

        expect(achievements.find((item) => item.id === 'first-session')?.unlocked).toBe(true);
        expect(achievements.find((item) => item.id === 'assessment-online')?.unlocked).toBe(true);
        expect(achievements.find((item) => item.id === 'steady-hand')?.unlocked).toBe(true);
        expect(achievements.find((item) => item.id === 'challenge-posted')?.unlocked).toBe(true);
        expect(achievements.find((item) => item.id === 'fast-lane')?.unlocked).toBe(true);
    });
});

describe('Game achievements', () => {
    it('first-raid unlocks when a raid session exists', () => {
        const result = buildAchievements({ sessions: [makeRaidSession()] });
        const raid = result.find((a) => a.id === 'first-raid');
        expect(raid.unlocked).toBe(true);
    });

    it('first-raid stays locked without raid sessions', () => {
        const result = buildAchievements({ sessions: [{ id: 's1', trainingMeta: { type: 'free' } }] });
        const raid = result.find((a) => a.id === 'first-raid');
        expect(raid.unlocked).toBe(false);
    });

    it('combo-20 unlocks when maxCombo >= 20', () => {
        const result = buildAchievements({ sessions: [makeRaidSession({ trainingMeta: { type: 'raid', maxCombo: 20, threatLevel: 5 } })] });
        const combo = result.find((a) => a.id === 'combo-20');
        expect(combo.unlocked).toBe(true);
    });

    it('combo-20 stays locked when maxCombo < 20', () => {
        const result = buildAchievements({ sessions: [makeRaidSession({ trainingMeta: { type: 'raid', maxCombo: 10 } })] });
        const combo = result.find((a) => a.id === 'combo-20');
        expect(combo.unlocked).toBe(false);
    });

    it('wave-10 unlocks when threatLevel >= 10', () => {
        const result = buildAchievements({ sessions: [makeRaidSession({ trainingMeta: { type: 'raid', threatLevel: 10 } })] });
        const wave = result.find((a) => a.id === 'wave-10');
        expect(wave.unlocked).toBe(true);
    });

    it('raid-perfect unlocks when the player extracts cleanly', () => {
        const result = buildAchievements({ sessions: [makeRaidSession({ trainingMeta: { type: 'raid', endReason: 'extract', livesRemaining: 2 } })] });
        const perfect = result.find((a) => a.id === 'raid-perfect');
        expect(perfect.unlocked).toBe(true);
    });

    it('raid-1000 unlocks when score >= 1000', () => {
        const result = buildAchievements({ sessions: [makeRaidSession({ result: { completedAt: '2026-06-20T12:00:00Z', score: 1000, wpm: 80, accuracy: 96 } })] });
        const cmd = result.find((a) => a.id === 'raid-1000');
        expect(cmd.unlocked).toBe(true);
    });

    it('raid-1000 stays locked when score < 1000', () => {
        const result = buildAchievements({ sessions: [makeRaidSession({ result: { completedAt: '2026-06-20T12:00:00Z', score: 500 } })] });
        const cmd = result.find((a) => a.id === 'raid-1000');
        expect(cmd.unlocked).toBe(false);
    });
});
