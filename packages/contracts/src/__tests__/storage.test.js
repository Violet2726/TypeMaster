import {
    createTrainingDataBundle,
    parseStoredCoachAdviceRecords,
    parseStoredSessions,
    parseTrainingDataBundle
} from '../storage.js';

describe('storage contracts', () => {
    test('parses stored session lists', () => {
        expect(parseStoredSessions([{ id: 'session-1', result: { wpm: 88 } }])).toEqual([
            {
                id: 'session-1',
                result: {
                    accuracy: 0,
                    consistency: 0,
                    correctChars: 0,
                    durationSeconds: 0,
                    errors: 0,
                    extraChars: 0,
                    incorrectChars: 0,
                    missedChars: 0,
                    rawWpm: 0,
                    wpm: 88,
                    topErrorChars: [],
                    topErrorWords: []
                }
            }
        ]);
    });

    test('parses coach advice records with required session ids', () => {
        expect(parseStoredCoachAdviceRecords([{ sessionId: 'session-1', source: 'ai' }])).toEqual([
            {
                sessionId: 'session-1',
                status: 'complete',
                source: 'ai',
                strengths: [],
                weaknesses: [],
                providerMeta: {}
            }
        ]);
    });

    test('creates and parses a normalized training data bundle', () => {
        const bundle = createTrainingDataBundle({
            settings: { language: 'en-US' },
            sessions: [{ id: 'session-1' }]
        });

        expect(parseTrainingDataBundle(bundle)).toMatchObject({
            version: 1,
            settings: { language: 'en-US' },
            sessions: [{ id: 'session-1' }],
            coachAdviceRecords: [],
            skillProfile: null
        });
    });
});
