import fs from 'node:fs';
import path from 'node:path';
import app from '../app';

const dataDir = path.join(__dirname, '../data');
const storePath = path.join(dataDir, 'server-state.json');

function createLocalAuthorization(userId: string) {
    return `Bearer typemaster-local:${encodeURIComponent(userId)}`;
}

describe('app', () => {
    beforeEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();

        if (fs.existsSync(storePath)) {
            fs.unlinkSync(storePath);
        }

        if (fs.existsSync(dataDir)) {
            fs.rmSync(dataDir, { recursive: true, force: true });
        }
    });

    test('serves an OpenAPI document', async () => {
        const response = await app.request('/api/openapi.json');
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.openapi).toBe('3.0.3');
        expect(body.paths['/api/practice-text']).toBeTruthy();
        expect(body.paths['/api/coach']).toBeTruthy();
        expect(body.paths['/api/coach-feedback']).toBeTruthy();
        expect(body.paths['/api/exports']).toBeTruthy();
        expect(body.paths['/api/sessions']).toBeTruthy();
        expect(body.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
        expect(body.paths['/api/sessions'].post.security).toEqual([{ bearerAuth: [] }]);
        expect(body.paths['/api/auth/sign-in'].post.requestBody.content['application/json'].schema.type).toBe('object');
        expect(
            body.paths['/api/challenge-attempts'].post.responses['200'].content['application/json'].schema.properties.entry
        ).toBeTruthy();
    });

    test('composes auth and session routes under canonical API paths', async () => {
        const signInResponse = await app.request('/api/auth/sign-in', {
            method: 'POST',
            body: JSON.stringify({ displayName: 'Alice' }),
            headers: { 'Content-Type': 'application/json' }
        });
        const signInBody = await signInResponse.json();

        const syncResponse = await app.request('/api/sessions', {
            method: 'POST',
            body: JSON.stringify({ session: { id: 'session-1', result: { wpm: 88 } } }),
            headers: {
                'Content-Type': 'application/json',
                Authorization: createLocalAuthorization(signInBody.user.id)
            }
        });
        const syncBody = await syncResponse.json();

        const readResponse = await app.request('/api/sessions', {
            headers: {
                Authorization: createLocalAuthorization(signInBody.user.id)
            }
        });
        const readBody = await readResponse.json();
        const coachResponse = await app.request('/api/coach-feedback?sessionId=session-1', {
            headers: {
                Authorization: createLocalAuthorization(signInBody.user.id)
            }
        });
        const coachBody = await coachResponse.json();

        expect(signInResponse.status).toBe(200);
        expect(syncResponse.status).toBe(200);
        expect(readResponse.status).toBe(200);
        expect(coachResponse.status).toBe(200);
        expect(syncBody.sessions).toHaveLength(1);
        expect(readBody.sessions[0]).toMatchObject({ id: 'session-1' });
        expect(coachBody.coachAdvices[0]).toMatchObject({
            sessionId: 'session-1',
            status: 'pending'
        });
    });

    test('exports and imports a versioned training data bundle', async () => {
        const aliceResponse = await app.request('/api/auth/sign-in', {
            method: 'POST',
            body: JSON.stringify({ displayName: 'Alice' }),
            headers: { 'Content-Type': 'application/json' }
        });
        const aliceBody = await aliceResponse.json();

        await app.request('/api/sessions', {
            method: 'POST',
            body: JSON.stringify({ session: { id: 'session-export', result: { wpm: 77 } } }),
            headers: {
                'Content-Type': 'application/json',
                Authorization: createLocalAuthorization(aliceBody.user.id)
            }
        });

        const exportResponse = await app.request('/api/exports', {
            headers: {
                Authorization: createLocalAuthorization(aliceBody.user.id)
            }
        });
        const exportBody = await exportResponse.json();

        const bobResponse = await app.request('/api/auth/sign-in', {
            method: 'POST',
            body: JSON.stringify({ displayName: 'Bob' }),
            headers: { 'Content-Type': 'application/json' }
        });
        const bobBody = await bobResponse.json();
        const importResponse = await app.request('/api/exports', {
            method: 'POST',
            body: JSON.stringify({ bundle: exportBody.bundle }),
            headers: {
                'Content-Type': 'application/json',
                Authorization: createLocalAuthorization(bobBody.user.id)
            }
        });
        const importBody = await importResponse.json();

        expect(exportResponse.status).toBe(200);
        expect(exportBody.bundle).toMatchObject({
            version: 6,
            sessions: [expect.objectContaining({ id: 'session-export' })],
            coachAdviceRecords: [expect.objectContaining({
                sessionId: 'session-export',
                status: 'pending'
            })]
        });
        expect(importResponse.status).toBe(200);
        expect(importBody.bundle.sessions[0]).toMatchObject({ id: 'session-export' });
        expect(importBody.bundle.coachAdviceRecords[0]).toMatchObject({
            sessionId: 'session-export',
            status: 'pending'
        });
    });

    test('rejects invalid API payloads with a 400 response', async () => {
        const response = await app.request('/api/auth/sign-in', {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' }
        });
        const body = await response.json();

        expect(response.status).toBe(400);
        expect(body.error).toBeTruthy();
    });

    test('composes challenge routes under canonical API paths', async () => {
        const dailyResponse = await app.request('/api/challenges/daily?language=en-US');
        const dailyBody = await dailyResponse.json();

        const leaderboardResponse = await app.request(
            `/api/leaderboards/challenge?challengeId=${dailyBody.challenge.id}`
        );
        const leaderboardBody = await leaderboardResponse.json();

        expect(dailyResponse.status).toBe(200);
        expect(dailyBody.challenge.id).toMatch(/^daily-/);
        expect(leaderboardResponse.status).toBe(200);
        expect(leaderboardBody.leaderboard).toEqual([]);
    });

    test('exposes the Inngest worker endpoint under the API path', async () => {
        vi.stubEnv('INNGEST_DEV', '1');

        const response = await app.request('/api/inngest');
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toMatchObject({
            function_count: 3,
            mode: 'dev'
        });
    });

    test('generates practice text through the product AI route', async () => {
        vi.stubEnv('AI_API_KEY', 'test-key');
        vi.stubEnv('AI_API_URL', 'https://ai.example.test/v1/chat/completions');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
            choices: [{ message: { content: 'alpha beta gamma delta' } }]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })));

        const response = await app.request('/api/practice-text', {
            method: 'POST',
            body: JSON.stringify({
                config: {
                    mode: 'words',
                    durationSeconds: 60,
                    wordCount: 4,
                    includePunctuation: false,
                    includeNumbers: false,
                    source: 'ai',
                    aiTemplate: 'daily',
                    difficulty: 'easy'
                },
                language: 'en-US'
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body).toEqual({ text: 'alpha beta gamma delta' });
    });

    test('generates coach advice through the product AI route', async () => {
        vi.stubEnv('AI_API_KEY', 'test-key');
        vi.stubEnv('AI_API_URL', 'https://ai.example.test/v1/chat/completions');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
            choices: [{
                message: {
                    content: JSON.stringify({
                        headline: 'Good round',
                        summary: 'Keep the rhythm stable.',
                        strengths: ['Rhythm'],
                        weaknesses: ['Accuracy'],
                        nextDrill: {
                            label: 'Accuracy drill',
                            reason: 'Accuracy needs care.',
                            configPatch: { source: 'ai', difficulty: 'easy' },
                            aiPrompt: 'Generate an easy accuracy drill.'
                        },
                        comparison: {
                            label: 'steady',
                            summary: 'Stable run.'
                        }
                    })
                }
            }]
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        })));

        const response = await app.request('/api/coach', {
            method: 'POST',
            body: JSON.stringify({
                session: {
                    id: 'session-1',
                    config: {
                        mode: 'words',
                        durationSeconds: 60,
                        wordCount: 12,
                        includePunctuation: false,
                        includeNumbers: false,
                        source: 'ai',
                        aiTemplate: 'daily',
                        difficulty: 'easy'
                    },
                    result: {
                        wpm: 70,
                        accuracy: 96,
                        consistency: 82
                    }
                },
                history: [],
                language: 'en-US'
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.advice).toMatchObject({
            headline: 'Good round',
            nextDrill: {
                label: 'Accuracy drill'
            },
            language: 'en-US'
        });
    });
});
