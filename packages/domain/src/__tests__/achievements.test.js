import { buildAchievements } from '../achievements';

describe('achievements.js', () => {
    test('builds unlocked achievements from sessions and progress', () => {
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
