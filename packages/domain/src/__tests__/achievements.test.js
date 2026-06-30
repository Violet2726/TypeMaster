import { describe, it, expect } from 'vitest';
import { buildAchievements } from '../achievements.js';

function makeGameSession(overrides = {}) {
    return {
        id: 'game-1',
        trainingMeta: { type: 'game', maxCombo: 10, depth: 3, endReason: 'extract', livesRemaining: 2 },
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
    it('first-game unlocks when a game session exists', () => {
        const result = buildAchievements({ sessions: [makeGameSession()] });
        const game = result.find((a) => a.id === 'first-game');
        expect(game.unlocked).toBe(true);
    });

    it('first-game stays locked without game sessions', () => {
        const result = buildAchievements({ sessions: [{ id: 's1', trainingMeta: { type: 'free' } }] });
        const game = result.find((a) => a.id === 'first-game');
        expect(game.unlocked).toBe(false);
    });

    it('combo-20 unlocks when maxCombo >= 20', () => {
        const result = buildAchievements({ sessions: [makeGameSession({ trainingMeta: { type: 'game', maxCombo: 20, depth: 3 } })] });
        const combo = result.find((a) => a.id === 'combo-20');
        expect(combo.unlocked).toBe(true);
    });

    it('combo-20 stays locked when maxCombo < 20', () => {
        const result = buildAchievements({ sessions: [makeGameSession({ trainingMeta: { type: 'game', maxCombo: 10 } })] });
        const combo = result.find((a) => a.id === 'combo-20');
        expect(combo.unlocked).toBe(false);
    });

    it('depth-5 unlocks when depth >= 5', () => {
        const result = buildAchievements({ sessions: [makeGameSession({ trainingMeta: { type: 'game', depth: 5 } })] });
        const depth = result.find((a) => a.id === 'depth-5');
        expect(depth.unlocked).toBe(true);
    });

    it('game-extract unlocks when the player extracts cleanly', () => {
        const result = buildAchievements({ sessions: [makeGameSession({ trainingMeta: { type: 'game', endReason: 'extract', livesRemaining: 2 } })] });
        const perfect = result.find((a) => a.id === 'game-extract');
        expect(perfect.unlocked).toBe(true);
    });

    it('game-1000 unlocks when score >= 1000', () => {
        const result = buildAchievements({ sessions: [makeGameSession({ result: { completedAt: '2026-06-20T12:00:00Z', score: 1000, wpm: 80, accuracy: 96 } })] });
        const cmd = result.find((a) => a.id === 'game-1000');
        expect(cmd.unlocked).toBe(true);
    });

    it('game-1000 stays locked when score < 1000', () => {
        const result = buildAchievements({ sessions: [makeGameSession({ result: { completedAt: '2026-06-20T12:00:00Z', score: 500 } })] });
        const cmd = result.find((a) => a.id === 'game-1000');
        expect(cmd.unlocked).toBe(false);
    });
});
