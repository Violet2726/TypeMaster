import fs from 'node:fs';
import path from 'node:path';
import { closeDatabase } from '../infra/db/client';
import {
    generateCoachFeedbackJob,
    recomputeSkillProfileJob,
    refreshChallengeLeaderboardJob
} from '../jobs/background-jobs';
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

describe('background jobs', () => {
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

    test('recomputes and persists a skill profile from user sessions', async () => {
        const repository = getTrainingRepository();
        const user = await repository.signInUser('Alice');
        await repository.saveSession(user.id, {
            id: 'session-1',
            result: {
                wpm: 82,
                accuracy: 96,
                consistency: 88,
                durationSeconds: 60,
                topErrorChars: ['r'],
                topErrorWords: ['rhythm']
            }
        });

        const result = await recomputeSkillProfileJob({
            userId: user.id,
            language: 'en-US'
        });
        const snapshot = await repository.loadSkillProfile(user.id);

        expect(result).toMatchObject({
            status: 'updated',
            userId: user.id
        });
        expect(snapshot.skillProfile).toMatchObject({
            metrics: {
                avgWpm: 82,
                avgAccuracy: 96
            },
            topErrorChars: ['r'],
            topErrorWords: ['rhythm']
        });
    });

    test('refreshes a challenge leaderboard snapshot', async () => {
        const repository = getTrainingRepository();
        const challenge = await repository.getDailyChallenge('en-US');
        await repository.submitChallengeAttempt({
            challengeId: challenge.id,
            displayName: 'Alice',
            sessionId: 'session-1',
            result: {
                wpm: 91,
                accuracy: 98
            }
        });

        await expect(refreshChallengeLeaderboardJob({ challengeId: challenge.id })).resolves.toEqual({
            status: 'refreshed',
            challengeId: challenge.id,
            entries: 1
        });
    });

    test('persists fallback coach feedback when AI provider config is missing', async () => {
        const repository = getTrainingRepository();
        const user = await repository.signInUser('Alice');
        await repository.saveSession(user.id, {
            id: 'session-1',
            config: {
                mode: 'words',
                durationSeconds: 60,
                wordCount: 20,
                includePunctuation: false,
                includeNumbers: false,
                source: 'ai',
                aiTemplate: 'daily',
                difficulty: 'easy'
            },
            result: {
                wpm: 70,
                accuracy: 91,
                consistency: 72,
                topErrorChars: ['r'],
                topErrorWords: ['rhythm']
            }
        });

        const result = await generateCoachFeedbackJob({
            userId: user.id,
            sessionId: 'session-1',
            language: 'en-US'
        });
        const [record] = await repository.listCoachAdvices(user.id, 'session-1');

        expect(result).toMatchObject({
            status: 'fallback',
            reason: 'missing_config'
        });
        expect(record).toMatchObject({
            sessionId: 'session-1',
            status: 'complete',
            source: 'fallback',
            fallbackReasonCode: 'missing_config'
        });
        expect(record.headline).toBeTruthy();
    });

    test('skips jobs with missing identifiers', async () => {
        await expect(recomputeSkillProfileJob({})).resolves.toEqual({
            status: 'skipped',
            reason: 'missing-user-id'
        });
        await expect(refreshChallengeLeaderboardJob({})).resolves.toEqual({
            status: 'skipped',
            reason: 'missing-challenge-id'
        });
        await expect(generateCoachFeedbackJob({})).resolves.toEqual({
            status: 'skipped',
            reason: 'missing-user-id'
        });
    });
});
