import {
    API_BASE,
    CHALLENGE_SUMMARY_BY_LANGUAGE,
    CHALLENGE_TEXT_BY_LANGUAGE,
    API_FALLBACK_CACHE_KEY,
    SESSION_LIMIT,
    STORAGE_KEYS,
    createAccountRecord,
    createDailyChallenge,
    createEmptyServerState,
    getDailyChallengeId,
    getTodayDateKey
} from '../index.js';

describe('contracts', () => {
    test('creates an empty server state shape', () => {
        expect(createEmptyServerState()).toEqual({
            currentUserId: null,
            users: {},
            challenges: {}
        });
    });

    test('creates a stable account record', () => {
        const user = createAccountRecord({
            id: 'user-1',
            displayName: 'Alice',
            createdAt: '2026-06-08T00:00:00.000Z'
        });

        expect(user).toMatchObject({
            id: 'user-1',
            displayName: 'Alice',
            createdAt: '2026-06-08T00:00:00.000Z',
            sessions: [],
            trainingPlan: null,
            skillProfile: null,
            achievements: [],
            streakState: null,
            challengeResults: {}
        });
    });

    test('creates a localized daily challenge snapshot', () => {
        const challenge = createDailyChallenge({
            language: 'en-US',
            dateKey: '2026-06-08'
        });

        expect(challenge).toMatchObject({
            id: 'daily-2026-06-08',
            dateKey: '2026-06-08',
            title: 'Daily challenge',
            summary: CHALLENGE_SUMMARY_BY_LANGUAGE['en-US'],
            text: CHALLENGE_TEXT_BY_LANGUAGE['en-US']
        });
        expect(challenge.config).toMatchObject({
            source: 'builtin',
            mode: 'time',
            durationSeconds: 45
        });
    });

    test('exports stable storage and API constants', () => {
        expect(API_FALLBACK_CACHE_KEY).toBe('typemaster:v6:api-fallback-cache');
        expect(API_BASE).toBe('/api');
        expect(SESSION_LIMIT).toBe(50);
        expect(STORAGE_KEYS.settings).toBe('typemaster:v6:settings');
        expect(STORAGE_KEYS.sessions).toBe('typemaster:v6:sessions');
        expect(getTodayDateKey(new Date('2026-06-08T10:00:00.000Z'))).toBe('2026-06-08');
        expect(getDailyChallengeId('2026-06-08')).toBe('daily-2026-06-08');
    });
});
