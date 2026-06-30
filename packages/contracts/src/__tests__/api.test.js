import {
    CurrentUserResponseSchema,
    CoachAdviceRequestSchema,
    ImportTrainingDataRequestSchema,
    PracticeTextRequestSchema,
    SignInRequestSchema,
    createApiOpenApiDocument,
    getDefaultDailyChallengeConfigSchema
} from '../api.js';

describe('api contracts', () => {
    test('parses request and response shapes with shared zod schemas', () => {
        expect(SignInRequestSchema.parse({ displayName: 'Alice' })).toEqual({
            displayName: 'Alice'
        });

        expect(
            CurrentUserResponseSchema.parse({
                user: null
            })
        ).toEqual({
            user: null
        });

        expect(
            PracticeTextRequestSchema.parse({
                config: {
                    mode: 'words',
                    durationSeconds: 60,
                    wordCount: 12,
                    includePunctuation: false,
                    includeNumbers: false,
                    source: 'ai',
                    aiTemplate: 'daily',
                    difficulty: 'easy'
                }
            })
        ).toMatchObject({
            promptOverride: '',
            language: 'zh-CN'
        });

        expect(
            CoachAdviceRequestSchema.parse({
                session: { id: 'session-1' }
            })
        ).toMatchObject({
            history: [],
            language: 'zh-CN'
        });

        expect(
            ImportTrainingDataRequestSchema.parse({
                bundle: {
                    sessions: [{ id: 'session-1' }]
                }
            }).bundle
        ).toMatchObject({
            version: 7,
            sessions: [{ id: 'session-1' }]
        });

        expect(
            CurrentUserResponseSchema.parse({
                user: {
                    id: 'user-1',
                    displayName: 'Alice',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    lastSyncedAt: null,
                    sessions: [],
                    trainingPlan: null,
                    skillProfile: null,
                    achievements: [],
                    streakState: null,
                    userProfile: { displayName: 'Alice' },
                    challengeResults: {}
                }
            }).user.coachAdvices
        ).toEqual([]);
    });

    test('creates OpenAPI paths from shared schemas', () => {
        const document = createApiOpenApiDocument();

        expect(document.openapi).toBe('3.0.3');
        expect(document.paths['/api/auth/sign-in'].post.requestBody).toBeTruthy();
        expect(document.paths['/api/practice-text'].post.requestBody).toBeTruthy();
        expect(document.paths['/api/coach'].post.responses['200']).toBeTruthy();
        expect(document.paths['/api/coach-feedback'].get.security).toEqual([{ bearerAuth: [] }]);
        expect(document.paths['/api/exports'].get.security).toEqual([{ bearerAuth: [] }]);
        expect(document.paths['/api/exports'].post.requestBody).toBeTruthy();
        expect(document.components.securitySchemes.bearerAuth).toMatchObject({
            type: 'http',
            scheme: 'bearer'
        });
        expect(document.paths['/api/sessions'].post.security).toEqual([{ bearerAuth: [] }]);
        expect(
            document.paths['/api/challenge-attempts'].post.responses['200'].content['application/json'].schema
        ).toBeTruthy();
    });

    test('keeps the default challenge config contract in sync with runtime defaults', () => {
        expect(getDefaultDailyChallengeConfigSchema()).toMatchObject({
            source: 'builtin',
            mode: 'time',
            durationSeconds: 45
        });
    });
});
