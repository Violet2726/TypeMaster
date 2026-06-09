import {
    ChallengeLeaderboardResponseSchema,
    DailyChallengeResponseSchema,
    SubmitChallengeResultRequestSchema,
    SubmitChallengeResultResponseSchema
} from '@typemaster/contracts/api';
import { createChallengeEntry } from '@typemaster/contracts/server-state';
import { ensureChallengeForToday, getCurrentUserRecord, readApiFallbackCache, writeApiFallbackCache, createId } from './local-cache';
import { requestJson } from './remote';

type CreateChallengeOptions = {
    language?: string,
};
type SubmitChallengeResultPayload = ReturnType<typeof SubmitChallengeResultRequestSchema.parse>;

export class ChallengeGateway {
    async createChallenge(options: CreateChallengeOptions = {}) {
        return this.getDailyChallenge(options.language || 'en-US');
    }

    async getDailyChallenge(language = 'en-US') {
        try {
            const payload = await requestJson(`/challenges/daily?language=${encodeURIComponent(language)}`, {
                responseSchema: DailyChallengeResponseSchema
            });
            return payload.challenge;
        } catch {
            const state = readApiFallbackCache();
            return ensureChallengeForToday(state, language);
        }
    }

    async submitChallengeResult({ challengeId, result, sessionId }: SubmitChallengeResultPayload) {
        try {
            const payload = await requestJson('/challenge-attempts', {
                method: 'POST',
                body: { challengeId, result, sessionId },
                requestSchema: SubmitChallengeResultRequestSchema,
                responseSchema: SubmitChallengeResultResponseSchema
            });
            return payload.entry;
        } catch {
            const state = readApiFallbackCache();
            const challenge = state.challenges[challengeId] || ensureChallengeForToday(state);
            const currentUser = getCurrentUserRecord(state);
            const entry = createChallengeEntry({
                id: createId('challenge-result'),
                challengeId,
                sessionId,
                displayName: currentUser?.displayName || 'Guest',
                userId: currentUser?.id || null,
                levelId: currentUser?.skillProfile?.level?.id || null,
                result,
                createdAt: new Date().toISOString()
            });

            challenge.leaderboard = [entry, ...(challenge.leaderboard || [])]
                .sort((left, right) => {
                    if (right.wpm !== left.wpm) {
                        return right.wpm - left.wpm;
                    }

                    return right.accuracy - left.accuracy;
                })
                .slice(0, 20);

            if (currentUser) {
                currentUser.challengeResults = {
                    ...(currentUser.challengeResults || {}),
                    [challengeId]: entry
                };
            }

            writeApiFallbackCache(state);
            return entry;
        }
    }

    async getChallengeLeaderboard(challengeId, language = 'en-US') {
        try {
            const payload = await requestJson(`/leaderboards/challenge?challengeId=${encodeURIComponent(challengeId)}`, {
                responseSchema: ChallengeLeaderboardResponseSchema
            });
            return payload.leaderboard || [];
        } catch {
            const state = readApiFallbackCache();
            const challenge = state.challenges[challengeId] || ensureChallengeForToday(state, language);
            return challenge.leaderboard || [];
        }
    }
}
