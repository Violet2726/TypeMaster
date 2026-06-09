import {
    advanceJourney,
    advanceTrainingPlan,
    buildSkillProfile,
    createChallengeEntryPreview,
    createStarterTrainingPlan,
    mergeChallengeLeaderboardEntries
} from '@typemaster/domain';
import { normalizeSessionRecord } from '@typemaster/contracts/training-state';
import { challengeGateway, sessionGateway } from '../services/api';
import { appendSession } from '../services/storage';
import { buildTrainingTaskFromState } from './app-state-helpers';

function createSessionId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `session-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function resolveSessionCompletionContext(environment) {
    const fallbackChallengeTask = (
        !buildTrainingTaskFromState(
            environment.activeSessionContext,
            environment.diagnosticJourney,
            environment.trainingPlan,
            environment.dailyChallengeState
        )
        && environment.dailyChallengeState
        && environment.currentDraft?.sourceTextMeta?.label === environment.dailyChallengeState.title
    )
        ? {
            id: environment.dailyChallengeState.id,
            order: 1,
            title: environment.dailyChallengeState.title,
            summary: environment.dailyChallengeState.summary
        }
        : null;
    const task = buildTrainingTaskFromState(
        environment.activeSessionContext,
        environment.diagnosticJourney,
        environment.trainingPlan,
        environment.dailyChallengeState
    ) || fallbackChallengeTask;
    const type = task
        ? (environment.activeSessionContext?.type || (fallbackChallengeTask ? 'challenge' : 'free'))
        : null;

    return {
        task,
        type
    };
}

export function createCompletedSessionRecord(environment, { result, timeline }, completionContext = resolveSessionCompletionContext(environment)) {
    return normalizeSessionRecord({
        id: createSessionId(),
        config: environment.config,
        result,
        timeline,
        sourceTextMeta: environment.currentDraft?.sourceTextMeta || {
            source: environment.config.source || 'builtin',
            label: 'Practice text'
        },
        coachAdviceId: null,
        trainingMeta: completionContext.task
            ? {
                type: completionContext.type,
                stepId: completionContext.task.id,
                title: completionContext.task.title
            }
            : null
    });
}

export function recordSession(environment, session) {
    const nextSessions = appendSession(session);

    environment.setSessions(nextSessions);
    environment.setLastCompletedSession(session);
    sessionGateway.saveSession(session).catch(() => {});

    return nextSessions;
}

export function advanceAssessment(environment, session, nextSessions) {
    if (environment.activeSessionContext?.type !== 'diagnostic' || !environment.diagnosticJourney) {
        return false;
    }

    const updatedJourney = advanceJourney(environment.diagnosticJourney, session.id);
    environment.setDiagnosticJourney(updatedJourney);
    environment.setActiveSessionContext(null);

    if (updatedJourney.status === 'complete') {
        const diagnosticSessionIds = updatedJourney.steps
            .map((step) => step.completedSessionId)
            .filter(Boolean);
        const diagnosticSessions = nextSessions.filter((item) => diagnosticSessionIds.includes(item.id));
        const nextProfile = buildSkillProfile(diagnosticSessions, environment.settings.language);
        environment.setSkillProfile(nextProfile);
        environment.setTrainingPlan(createStarterTrainingPlan(nextProfile, environment.settings.language));
    }

    return true;
}

export function advancePlan(environment, session) {
    if (environment.activeSessionContext?.type !== 'plan' || !environment.trainingPlan) {
        return false;
    }

    const updatedPlan = advanceTrainingPlan(environment.trainingPlan, session.id);
    environment.setTrainingPlan(updatedPlan);
    environment.setActiveSessionContext(null);

    return true;
}

export function publishChallengeAttempt(environment, session, completionContext) {
    if (completionContext.type !== 'challenge') {
        return false;
    }

    const challengeId = completionContext.task?.id;
    if (!challengeId) {
        environment.setActiveSessionContext(null);
        return true;
    }

    const previewEntry = createChallengeEntryPreview({
        account: environment.account,
        skillProfile: environment.skillProfile,
        sessionId: session.id,
        result: session.result
    });

    environment.setDailyChallenge((previous) => (
        previous && previous.id === challengeId
            ? {
                ...previous,
                leaderboard: mergeChallengeLeaderboardEntries(previous.leaderboard || [], previewEntry)
            }
            : previous
    ));
    challengeGateway.submitChallengeResult({
        challengeId,
        sessionId: session.id,
        result: session.result
    }).then((entry) => {
        environment.setDailyChallenge((previous) => (
            previous && previous.id === challengeId
                ? {
                    ...previous,
                    leaderboard: mergeChallengeLeaderboardEntries(previous.leaderboard || [], entry)
                }
                : previous
        ));
    }).catch(() => {});
    environment.setActiveSessionContext(null);

    return true;
}

export function recordSessionCompletion(environment, payload) {
    const completionContext = resolveSessionCompletionContext(environment);
    const session = createCompletedSessionRecord(environment, payload, completionContext);
    const nextSessions = recordSession(environment, session);

    if (advanceAssessment(environment, session, nextSessions)) {
        return session;
    }

    if (advancePlan(environment, session)) {
        return session;
    }

    if (publishChallengeAttempt(environment, session, completionContext)) {
        return session;
    }

    environment.setActiveSessionContext(null);
    return session;
}
