import {
    authGateway,
    challengeGateway,
    planSyncGateway,
    sessionSyncGateway
} from '../cloud-contracts';

describe('cloud-contracts', () => {
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
        mockLocalStorage.clear();
        global.window = {
            localStorage: mockLocalStorage
        };
    });

    test('auth gateway signs in and restores current user', async () => {
        const user = await authGateway.signIn({ displayName: 'Alice' });
        const restored = await authGateway.getCurrentUser();

        expect(user.displayName).toBe('Alice');
        expect(restored.displayName).toBe('Alice');
    });

    test('session and plan gateways sync to the active cloud user', async () => {
        await authGateway.signIn({ displayName: 'Alice' });

        await sessionSyncGateway.syncSession({ id: 'session-1', result: { wpm: 88 } });
        await planSyncGateway.syncTrainingPlan({ id: 'plan-1', status: 'active' });
        await planSyncGateway.syncSkillProfile({ id: 'skill-1', primaryFocus: 'accuracy' });

        const sessions = await sessionSyncGateway.pullSessions();
        const plan = await planSyncGateway.pullTrainingPlan();
        const profile = await planSyncGateway.pullSkillProfile();

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
        expect(leaderboard[0].wpm).toBe(90);
    });

    test('sign out clears current user but keeps cloud data', async () => {
        await authGateway.signIn({ displayName: 'Alice' });
        await sessionSyncGateway.syncSession({ id: 'session-1', result: { wpm: 88 } });
        await authGateway.signOut();

        const currentUser = await authGateway.getCurrentUser();
        const sessions = await sessionSyncGateway.pullSessions();

        expect(currentUser).toBeNull();
        expect(sessions).toEqual([]);
    });
});
