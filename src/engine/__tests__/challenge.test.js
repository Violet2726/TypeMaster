import {
    compareChallengeScores,
    createChallengeEntryPreview,
    getChallengePersonalBest,
    getChallengeStanding,
    mergeChallengeLeaderboardEntries
} from '../challenge';

describe('challenge helpers', () => {
    test('sorts challenge scores by wpm first and accuracy second', () => {
        expect(compareChallengeScores(
            { wpm: 90, accuracy: 97 },
            { wpm: 84, accuracy: 100 }
        )).toBeLessThan(0);

        expect(compareChallengeScores(
            { wpm: 84, accuracy: 99 },
            { wpm: 84, accuracy: 95 }
        )).toBeLessThan(0);
    });

    test('merges leaderboard entries by session id and keeps best-first order', () => {
        const leaderboard = mergeChallengeLeaderboardEntries([
            { sessionId: 'session-1', wpm: 82, accuracy: 96 },
            { sessionId: 'session-2', wpm: 88, accuracy: 94 }
        ], {
            sessionId: 'session-1',
            wpm: 91,
            accuracy: 97
        });

        expect(leaderboard).toHaveLength(2);
        expect(leaderboard[0].sessionId).toBe('session-1');
        expect(leaderboard[0].wpm).toBe(91);
    });

    test('builds challenge standing from leaderboard order', () => {
        const standing = getChallengeStanding([
            { sessionId: 'session-1', wpm: 101, accuracy: 99 },
            { sessionId: 'session-2', wpm: 96, accuracy: 98 },
            { sessionId: 'session-3', wpm: 93, accuracy: 97 }
        ], 'session-2');

        expect(standing).toMatchObject({
            rank: 2,
            total: 3,
            beatPercent: 50
        });
    });

    test('detects personal best and gap for a challenge session', () => {
        const sessions = [
            {
                id: 'challenge-1',
                trainingMeta: { type: 'challenge', stepId: 'daily-1' },
                result: { wpm: 80, accuracy: 95 }
            },
            {
                id: 'challenge-2',
                trainingMeta: { type: 'challenge', stepId: 'daily-1' },
                result: { wpm: 87, accuracy: 96 }
            },
            {
                id: 'challenge-3',
                trainingMeta: { type: 'challenge', stepId: 'daily-2' },
                result: { wpm: 120, accuracy: 99 }
            }
        ];

        const current = getChallengePersonalBest(sessions, 'daily-1', 'challenge-2');
        const previous = getChallengePersonalBest(sessions, 'daily-1', 'challenge-1');

        expect(current.isPersonalBest).toBe(true);
        expect(current.attempts).toBe(2);
        expect(previous.isPersonalBest).toBe(false);
        expect(previous.gapWpm).toBe(7);
    });

    test('creates a challenge preview entry from the active account', () => {
        const entry = createChallengeEntryPreview({
            account: { id: 'user-1', displayName: 'Alice' },
            skillProfile: { level: { id: 'builder' } },
            sessionId: 'session-1',
            result: { wpm: 90, accuracy: 98, completedAt: '2026-06-08T08:00:00.000Z' }
        });

        expect(entry).toMatchObject({
            sessionId: 'session-1',
            displayName: 'Alice',
            userId: 'user-1',
            levelId: 'builder',
            wpm: 90,
            accuracy: 98
        });
    });
});
