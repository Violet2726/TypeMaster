import {
    createChallengeEntry,
    createLocalizedDailyChallenge,
    mergeDailyChallengeSnapshot,
    normalizeServerState
} from '../server-state.js';

describe('server-state contracts', () => {
    test('normalizes server state by dropping invalid records', () => {
        const state = normalizeServerState({
            currentUserId: 'user-1',
            users: {
                'user-1': {
                    id: 'user-1',
                    displayName: 'Alice',
                    createdAt: '2026-06-08T00:00:00.000Z',
                    lastSyncedAt: null,
                    sessions: [],
                    trainingPlan: null,
                    skillProfile: null,
                    achievements: [],
                    streakState: null,
                    userProfile: { displayName: 'Alice' },
                    challengeResults: {}
                },
                broken: {
                    displayName: 'Broken'
                }
            },
            challenges: {
                broken: {
                    title: 'Broken'
                }
            }
        });

        expect(state.currentUserId).toBe('user-1');
        expect(Object.keys(state.users)).toEqual(['user-1']);
        expect(state.challenges).toEqual({});
    });

    test('merges localized daily challenge content while keeping leaderboard state', () => {
        const localized = createLocalizedDailyChallenge('en-US', '2026-06-08');
        const merged = mergeDailyChallengeSnapshot(
            {
                ...localized,
                title: 'Old title',
                config: {
                    ...localized.config,
                    durationSeconds: 90
                },
                leaderboard: [createChallengeEntry({
                    id: 'entry-1',
                    challengeId: localized.id,
                    sessionId: 'session-1',
                    displayName: 'Alice',
                    result: { wpm: 90, accuracy: 98 }
                })]
            },
            localized
        );

        expect(merged.title).toBe('Daily challenge');
        expect(merged.config.durationSeconds).toBe(90);
        expect(merged.leaderboard).toHaveLength(1);
    });

    test('creates normalized challenge leaderboard entries', () => {
        expect(
            createChallengeEntry({
                id: 'entry-1',
                challengeId: 'daily-2026-06-08',
                sessionId: 'session-1',
                displayName: 'Alice',
                result: { wpm: 88, accuracy: 97 }
            })
        ).toMatchObject({
            challengeId: 'daily-2026-06-08',
            sessionId: 'session-1',
            wpm: 88,
            accuracy: 97
        });
    });
});
