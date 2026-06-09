import {
    authGateway,
    challengeGateway,
    planGateway,
    sessionGateway
} from '../api';
import { API_FALLBACK_CACHE_KEY } from '@typemaster/contracts';
import { readApiFallbackCache } from '../api/local-cache';
import { resetClientCacheForTests, writeClientCache } from '../storage';
import { vi } from 'vitest';

describe('api gateways and fallback cache', () => {
    const mockLocalStorage = {
        data: {},
        getItem(key) {
            return this.data[key] || null;
        },
        setItem(key, value) {
            this.data[key] = value;
        },
        removeItem(key) {
            delete this.data[key];
        },
        clear() {
            this.data = {};
        }
    };

    beforeEach(() => {
        vi.unstubAllGlobals();
        resetClientCacheForTests();
        mockLocalStorage.clear();
        if (typeof vi.unstubAllEnvs === 'function') {
            vi.unstubAllEnvs();
        }
        global.window = {
            localStorage: mockLocalStorage
        };
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        if (typeof vi.unstubAllEnvs === 'function') {
            vi.unstubAllEnvs();
        }
    });

    test('uses local API fallback contracts without network by default', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const currentUser = await authGateway.getCurrentUser();
        const challenge = await challengeGateway.getDailyChallenge('en-US');

        expect(currentUser).toBeNull();
        expect(challenge.id).toMatch(/^daily-/);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    test('auth gateway signs in and restores current user', async () => {
        const user = await authGateway.signIn({ displayName: 'Alice' });
        const restored = await authGateway.getCurrentUser();

        expect(user.displayName).toBe('Alice');
        expect(restored.displayName).toBe('Alice');
    });

    test('session and plan gateways sync to the active fallback user', async () => {
        await authGateway.signIn({ displayName: 'Alice' });

        await sessionGateway.saveSession({ id: 'session-1', result: { wpm: 88 } });
        await planGateway.saveTrainingPlan({
            id: 'plan-1',
            title: 'Starter plan',
            summary: 'Reset the clearest weakness first.',
            status: 'active',
            currentStepIndex: 0,
            steps: [
                {
                    id: 'step-1',
                    title: 'Reset accuracy',
                    summary: 'Round summary',
                    status: 'pending',
                    config: {
                        source: 'builtin',
                        mode: 'time',
                        durationSeconds: 45,
                        wordCount: 25,
                        includeNumbers: false,
                        includePunctuation: false,
                        aiTemplate: 'daily',
                        difficulty: 'medium'
                    }
                }
            ]
        });
        await planGateway.saveSkillProfile({
            id: 'skill-1',
            createdAt: '2026-06-08T00:00:00.000Z',
            level: { id: 'builder', label: 'Builder' },
            summary: 'Focus on accuracy.',
            primaryFocus: 'accuracy',
            weakZones: [{ id: 'accuracy', label: 'accuracy', score: 92 }],
            metrics: { avgAccuracy: 92, avgConsistency: 84 }
        });

        const sessions = await sessionGateway.listSessions();
        const plan = await planGateway.loadTrainingPlan();
        const profile = await planGateway.loadSkillProfile();

        expect(sessions).toHaveLength(1);
        expect(plan.id).toBe('plan-1');
        expect(profile.primaryFocus).toBe('accuracy');
    });

    test('challenge gateway returns daily challenge and leaderboard', async () => {
        await authGateway.signIn({ displayName: 'Alice' });
        const challenge = await challengeGateway.getDailyChallenge('en-US');
        const entry = await challengeGateway.submitChallengeResult({
            challengeId: challenge.id,
            sessionId: 'session-1',
            result: { wpm: 90, accuracy: 98 }
        });
        const leaderboard = await challengeGateway.getChallengeLeaderboard(challenge.id, 'en-US');

        expect(challenge.id).toMatch(/^daily-/);
        expect(entry.displayName).toBe('Alice');
        expect(entry.challengeId).toBe(challenge.id);
        expect(leaderboard[0].wpm).toBe(90);
    });

    test('uses validated remote responses when remote API is enabled', async () => {
        await authGateway.signIn({ displayName: 'Remote Alice' });
        vi.stubEnv('NEXT_PUBLIC_TYPEMASTER_REMOTE_API', '1');
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                user: {
                    id: 'user-remote',
                    displayName: 'Remote Alice',
                    createdAt: '2026-06-08T00:00:00.000Z',
                    lastSyncedAt: null,
                    sessions: [],
                    trainingPlan: null,
                    skillProfile: null,
                    achievements: [],
                    streakState: null,
                    userProfile: { displayName: 'Remote Alice' },
                    challengeResults: {}
                }
            })
        });
        vi.stubGlobal('fetch', fetchMock);

        const currentUser = await authGateway.getCurrentUser();

        expect(fetchMock).toHaveBeenCalledWith('/api/me', expect.objectContaining({
            method: 'GET',
            headers: expect.objectContaining({
                Authorization: expect.stringMatching(/^Bearer typemaster-local:/)
            })
        }));
        expect(currentUser).toEqual({
            id: 'user-remote',
            displayName: 'Remote Alice',
            createdAt: '2026-06-08T00:00:00.000Z',
            lastSyncedAt: null
        });
    });

    test('falls back to local API cache when a remote response breaks the shared contract', async () => {
        await authGateway.signIn({ displayName: 'Alice' });

        vi.stubEnv('NEXT_PUBLIC_TYPEMASTER_REMOTE_API', '1');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                user: {
                    displayName: 'Broken payload'
                }
            })
        }));

        const currentUser = await authGateway.getCurrentUser();

        expect(currentUser.displayName).toBe('Alice');
    });

    test('sign out clears current user but keeps cached account data', async () => {
        await authGateway.signIn({ displayName: 'Alice' });
        await sessionGateway.saveSession({ id: 'session-1', result: { wpm: 88 } });
        await authGateway.signOut();

        const currentUser = await authGateway.getCurrentUser();
        const sessions = await sessionGateway.listSessions();

        expect(currentUser).toBeNull();
        expect(sessions).toEqual([]);
    });

    test('normalizes corrupted local API fallback snapshots on read', () => {
        writeClientCache(API_FALLBACK_CACHE_KEY, {
            currentUserId: 'broken-user',
            users: {
                'broken-user': {
                    displayName: 'Broken'
                }
            },
            challenges: {
                'daily-broken': {
                    title: 'Broken challenge'
                }
            }
        });

        const state = readApiFallbackCache();

        expect(state.currentUserId).toBeNull();
        expect(state.users).toEqual({});
        expect(state.challenges).toEqual({});
    });
});
