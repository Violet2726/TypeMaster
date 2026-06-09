import type { z } from 'zod';
import { SubmitChallengeResultRequestSchema } from '@typemaster/contracts/api';
import { getTrainingRepository } from '../repositories/training-repository';
import {
    cacheChallengeLeaderboard,
    readCachedChallengeLeaderboard
} from '../infra/leaderboard-cache';
import { enqueueLeaderboardRefresh } from '../infra/jobs';

type SubmitChallengeAttemptPayload = z.infer<typeof SubmitChallengeResultRequestSchema> & {
    userId?: string,
};

async function resolveChallengeId(challengeId?: string) {
    if (challengeId) {
        return challengeId;
    }

    return (await getTrainingRepository().getDailyChallenge()).id;
}

export function getDailyChallengeSnapshot(language = 'en-US') {
    return getTrainingRepository().getDailyChallenge(language);
}

export async function getChallengeLeaderboard(challengeId?: string) {
    const resolvedChallengeId = await resolveChallengeId(challengeId);
    const cachedLeaderboard = await readCachedChallengeLeaderboard(resolvedChallengeId);

    if (cachedLeaderboard) {
        return cachedLeaderboard;
    }

    const leaderboard = await getTrainingRepository().getChallengeLeaderboard(resolvedChallengeId);
    await cacheChallengeLeaderboard(resolvedChallengeId, leaderboard);

    return leaderboard;
}

export async function submitChallengeAttempt({ challengeId, userId, displayName, sessionId, result }: SubmitChallengeAttemptPayload) {
    const entry = await getTrainingRepository().submitChallengeAttempt({
        challengeId,
        userId,
        displayName,
        sessionId,
        result
    });
    const leaderboard = await getTrainingRepository().getChallengeLeaderboard(challengeId);

    await Promise.all([
        cacheChallengeLeaderboard(challengeId, leaderboard),
        enqueueLeaderboardRefresh({ challengeId })
    ]);

    return entry;
}
