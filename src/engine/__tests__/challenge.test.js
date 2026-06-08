import {
    buildChallengeTrend,
    compareChallengeScores,
    createChallengeEntryPreview,
    getChallengeTrendState,
    getChallengeLevelLeaderboard,
    getChallengeSessions,
    getLatestChallengeSession,
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

    test('returns the latest session for the current challenge id', () => {
        const latest = getLatestChallengeSession([
            {
                id: 'session-3',
                trainingMeta: { type: 'challenge', stepId: 'daily-2' },
                result: { completedAt: '2026-06-08T09:00:00.000Z' }
            },
            {
                id: 'session-2',
                trainingMeta: { type: 'challenge', stepId: 'daily-1' },
                result: { completedAt: '2026-06-08T08:00:00.000Z' }
            },
            {
                id: 'session-4',
                trainingMeta: { type: 'challenge', stepId: 'daily-1' },
                result: { completedAt: '2026-06-08T10:00:00.000Z' }
            },
            { id: 'session-1', trainingMeta: { type: 'free', stepId: null } }
        ], 'daily-1');

        expect(latest?.id).toBe('session-4');
    });

    test('filters leaderboard to the same level when a level id exists', () => {
        const cohort = getChallengeLevelLeaderboard([
            { sessionId: 'session-1', levelId: 'builder' },
            { sessionId: 'session-2', levelId: 'sprinter' },
            { sessionId: 'session-3', levelId: 'builder' }
        ], 'builder');

        expect(cohort).toHaveLength(2);
        expect(cohort.every((entry) => entry.levelId === 'builder')).toBe(true);
    });

    test('returns challenge sessions ordered by latest completion time', () => {
        const ordered = getChallengeSessions([
            {
                id: 'session-1',
                trainingMeta: { type: 'challenge', stepId: 'daily-1' },
                result: { completedAt: '2026-06-08T08:00:00.000Z' }
            },
            {
                id: 'session-2',
                trainingMeta: { type: 'challenge', stepId: 'daily-1' },
                result: { completedAt: '2026-06-08T09:00:00.000Z' }
            },
            {
                id: 'session-3',
                trainingMeta: { type: 'challenge', stepId: 'daily-2' },
                result: { completedAt: '2026-06-08T10:00:00.000Z' }
            }
        ], 'daily-1');

        expect(ordered.map((session) => session.id)).toEqual(['session-2', 'session-1']);
    });

    test('builds chronological challenge trend points and deltas', () => {
        const trend = buildChallengeTrend([
            {
                id: 'session-2',
                result: { completedAt: '2026-06-08T09:00:00.000Z', wpm: 90, accuracy: 97 }
            },
            {
                id: 'session-1',
                result: { completedAt: '2026-06-08T08:00:00.000Z', wpm: 82, accuracy: 96 }
            }
        ]);

        expect(trend.points.map((point) => point.id)).toEqual(['session-1', 'session-2']);
        expect(trend.deltaWpm).toBe(8);
        expect(trend.deltaAccuracy).toBe(1);
        expect(trend.best?.id).toBe('session-2');
    });

    test('derives the correct challenge trend state', () => {
        expect(getChallengeTrendState({ attempts: 0 })).toBe('idle');
        expect(getChallengeTrendState({ attempts: 1 })).toBe('warm');
        expect(getChallengeTrendState({ attempts: 2, deltaWpm: 6, deltaAccuracy: 0 })).toBe('improving');
        expect(getChallengeTrendState({ attempts: 2, deltaWpm: -6, deltaAccuracy: -1 })).toBe('cooling');
        expect(getChallengeTrendState({ attempts: 3, deltaWpm: 2, deltaAccuracy: 0 })).toBe('steady');
    });
});
