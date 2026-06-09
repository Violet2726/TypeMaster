import fs from 'node:fs';
import path from 'node:path';
import {
    SessionRecordSchema,
    SkillProfileSchema,
    TrainingPlanSchema
} from '@typemaster/contracts/training-state';
import { closeDatabase } from '../infra/db/client';
import { getTrainingRepository } from '../repositories/training-repository';

const dataDir = path.join(__dirname, '../data');
const storePath = path.join(dataDir, 'server-state.json');

function resetLocalStore() {
    if (fs.existsSync(storePath)) {
        fs.unlinkSync(storePath);
    }

    if (fs.existsSync(dataDir)) {
        fs.rmSync(dataDir, { recursive: true, force: true });
    }
}

describe('training repository', () => {
    beforeEach(async () => {
        vi.unstubAllEnvs();
        vi.stubEnv('DATABASE_URL', '');
        await closeDatabase();
        resetLocalStore();
    });

    afterEach(async () => {
        await closeDatabase();
        vi.unstubAllEnvs();
    });

    test('persists account, sessions, plan, and profile through the local fallback', async () => {
        const repository = getTrainingRepository();
        const user = await repository.signInUser('Alice');
        const session = SessionRecordSchema.parse({
            id: 'session-1',
            result: { wpm: 88, accuracy: 97 }
        });
        const trainingPlan = TrainingPlanSchema.parse({
            id: 'plan-1',
            title: 'Starter plan',
            summary: 'Stabilize the clearest weakness first.',
            status: 'active',
            currentStepIndex: 0,
            steps: [{
                id: 'step-1',
                title: 'Accuracy reset',
                summary: 'One focused round.',
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
            }]
        });
        const skillProfile = SkillProfileSchema.parse({
            id: 'profile-1',
            level: { id: 'builder', label: 'Builder' },
            summary: 'Accuracy needs care.',
            metrics: { avgWpm: 88, avgAccuracy: 97 },
            weakZones: [{ id: 'accuracy', label: 'Accuracy', score: 97 }]
        });

        await repository.saveSession(user.id, session);
        await repository.saveTrainingPlan(user.id, trainingPlan);
        await repository.saveSkillProfile(user.id, {
            skillProfile,
            achievements: [{
                id: 'first-session',
                title: 'First Session',
                description: 'Finish the first complete round.',
                unlockedAt: '2026-06-09T00:00:00.000Z',
                unlocked: true
            }],
            streakState: {
                current: 1,
                weeklyGoal: {
                    target: 5,
                    completed: 1,
                    percent: 20
                }
            }
        });

        await expect(repository.getUser(user.id)).resolves.toMatchObject({
            id: user.id,
            displayName: 'Alice',
            sessions: [{ id: 'session-1' }],
            trainingPlan: { id: 'plan-1' },
            skillProfile: { id: 'profile-1' },
            achievements: [{ id: 'first-session' }],
            streakState: { current: 1 }
        });
        await expect(repository.listSessions(user.id)).resolves.toEqual([
            expect.objectContaining({ id: 'session-1' })
        ]);
        await expect(repository.loadTrainingPlan(user.id)).resolves.toMatchObject({ id: 'plan-1' });
        await expect(repository.loadSkillProfile(user.id)).resolves.toMatchObject({
            skillProfile: { id: 'profile-1' },
            achievements: [{ id: 'first-session' }],
            streakState: { current: 1 }
        });
    });

    test('maps provider identities to stable local fallback accounts', async () => {
        const repository = getTrainingRepository();
        const firstUser = await repository.getUserForIdentity({
            provider: 'clerk',
            providerUserId: 'user_clerk_123',
            displayName: 'Clerk Alice',
            email: 'alice@example.test'
        });
        const restoredUser = await repository.getUserForIdentity({
            provider: 'clerk',
            providerUserId: 'user_clerk_123',
            displayName: 'Changed Alice',
            email: 'alice-new@example.test'
        });

        expect(firstUser).toMatchObject({
            displayName: 'Clerk Alice',
            authIdentity: {
                provider: 'clerk',
                providerUserId: 'user_clerk_123'
            },
            userProfile: {
                displayName: 'Clerk Alice',
                email: 'alice@example.test'
            }
        });
        expect(restoredUser?.id).toBe(firstUser?.id);
        expect(restoredUser).toMatchObject({
            displayName: 'Changed Alice',
            userProfile: {
                displayName: 'Changed Alice',
                email: 'alice-new@example.test'
            }
        });
    });

    test('keeps daily challenge attempts behind the repository boundary', async () => {
        const repository = getTrainingRepository();
        const user = await repository.signInUser('Alice');
        const challenge = await repository.getDailyChallenge('en-US');
        const entry = await repository.submitChallengeAttempt({
            challengeId: challenge.id,
            userId: user.id,
            sessionId: 'session-1',
            result: { wpm: 91, accuracy: 98 }
        });
        const leaderboard = await repository.getChallengeLeaderboard(challenge.id);
        const updatedUser = await repository.getUser(user.id);

        expect(challenge.id).toMatch(/^daily-/);
        expect(entry).toMatchObject({
            challengeId: challenge.id,
            sessionId: 'session-1',
            wpm: 91,
            accuracy: 98
        });
        expect(leaderboard[0]).toMatchObject({ id: entry.id });
        expect(updatedUser?.challengeResults[challenge.id]).toMatchObject({ id: entry.id });
    });
});
