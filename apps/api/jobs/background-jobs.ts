import { buildLocalCoachAdvice, buildSkillProfile } from '@typemaster/domain';
import { normalizeCoachAdviceContent } from '@typemaster/contracts/training-state';
import { cacheChallengeLeaderboard } from '../infra/leaderboard-cache';
import { AiUseCaseError, generateCoachAdvice } from '../lib/ai-use-cases';
import { getTrainingRepository } from '../repositories/training-repository';

type JobPayload = Record<string, unknown>;

function stringValue(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function languageValue(value: unknown) {
    return stringValue(value) || 'en-US';
}

function getAiFailureCode(error: unknown) {
    if (error instanceof AiUseCaseError && /Missing AI_API_KEY|Missing AI_API_URL/i.test(error.message)) {
        return 'missing_config';
    }

    return 'server_error';
}

function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'AI coach generation failed';
}

export async function generateCoachFeedbackJob(payload: JobPayload) {
    const userId = stringValue(payload.userId);
    const sessionId = stringValue(payload.sessionId);
    const language = languageValue(payload.language);

    if (!userId) {
        return {
            status: 'skipped',
            reason: 'missing-user-id'
        };
    }

    if (!sessionId) {
        return {
            status: 'skipped',
            reason: 'missing-session-id',
            userId
        };
    }

    const repository = getTrainingRepository();
    const sessions = await repository.listSessions(userId);
    const session = sessions.find((item) => item.id === sessionId);

    if (!session) {
        return {
            status: 'skipped',
            reason: 'session-not-found',
            userId,
            sessionId
        };
    }

    const history = sessions.filter((item) => item.id !== session.id);

    try {
        const { advice } = await generateCoachAdvice({
            session,
            history,
            language
        });
        const record = await repository.saveCoachAdvice(userId, {
            sessionId,
            status: 'complete',
            source: 'ai',
            ...advice,
            providerMeta: {
                source: 'ai',
                generatedAt: new Date().toISOString()
            }
        });

        return {
            status: 'generated',
            userId,
            sessionId,
            coachAdviceId: record?.id || null
        };
    } catch (error: unknown) {
        const fallback = normalizeCoachAdviceContent(buildLocalCoachAdvice({
            session,
            history,
            language
        }));
        const reasonCode = getAiFailureCode(error);
        const reasonMessage = getErrorMessage(error);
        const record = await repository.saveCoachAdvice(userId, {
            sessionId,
            status: 'complete',
            source: 'fallback',
            ...fallback,
            fallbackReasonCode: reasonCode,
            fallbackReasonMessage: reasonMessage,
            providerMeta: {
                source: 'fallback',
                fallbackReasonCode: reasonCode,
                fallbackReasonMessage: reasonMessage,
                generatedAt: new Date().toISOString()
            }
        });

        return {
            status: 'fallback',
            userId,
            sessionId,
            coachAdviceId: record?.id || null,
            reason: reasonCode
        };
    }
}

export async function recomputeSkillProfileJob(payload: JobPayload) {
    const userId = stringValue(payload.userId);
    const language = languageValue(payload.language);

    if (!userId) {
        return {
            status: 'skipped',
            reason: 'missing-user-id'
        };
    }

    const repository = getTrainingRepository();
    const sessions = await repository.listSessions(userId);
    const skillProfile = buildSkillProfile(sessions, language);

    if (!skillProfile) {
        return {
            status: 'skipped',
            reason: 'no-sessions',
            userId
        };
    }

    const previousSnapshot = await repository.loadSkillProfile(userId);
    const snapshot = await repository.saveSkillProfile(userId, {
        skillProfile,
        achievements: previousSnapshot.achievements,
        streakState: previousSnapshot.streakState
    });

    return {
        status: 'updated',
        userId,
        profileId: snapshot.skillProfile?.id || skillProfile.id
    };
}

export async function refreshChallengeLeaderboardJob(payload: JobPayload) {
    const challengeId = stringValue(payload.challengeId);

    if (!challengeId) {
        return {
            status: 'skipped',
            reason: 'missing-challenge-id'
        };
    }

    const leaderboard = await getTrainingRepository().getChallengeLeaderboard(challengeId);
    await cacheChallengeLeaderboard(challengeId, leaderboard);

    return {
        status: 'refreshed',
        challengeId,
        entries: leaderboard.length
    };
}
