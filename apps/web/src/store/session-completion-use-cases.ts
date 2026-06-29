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

function buildProfileFromSessions(environment, sessions) {
    return buildSkillProfile(sessions, {
        language: environment.settings?.language,
        keyboardLayout: environment.settings?.keyboardLayout
    });
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

function resolveSessionIntent(environment, completionContext) {
    const sourceMeta = environment.currentDraft?.sourceTextMeta || {};
    const generatedBy = sourceMeta.generatedBy;

    if (completionContext.type === 'diagnostic') return 'baseline-mission';
    if (completionContext.type === 'plan') return 'focus-drill';
    if (completionContext.type === 'challenge') return 'daily-mission';
    if (generatedBy === 'adaptive') return 'adaptive-drill';
    if (generatedBy === 'keyboard-zone') return 'keyboard-zone-drill';
    if (sourceMeta.adaptiveSourceSessionId) return 'recovery-drill';

    return 'free-practice';
}

function resolveSessionFocus(environment, completionContext) {
    const sourceMeta = environment.currentDraft?.sourceTextMeta || {};

    return sourceMeta.adaptiveFocus
        || sourceMeta.keyboardZone
        || environment.skillProfile?.primaryFocus
        || completionContext.type
        || 'speed';
}

function resolveSessionTrainingMeta(environment, completionContext) {
    const sourceMeta = environment.currentDraft?.sourceTextMeta || {};
    const type = completionContext.type || 'free';
    const surface = type === 'diagnostic' || type === 'plan' || type === 'challenge'
        ? 'missions'
        : 'practice';

    return {
        type: type === 'free' ? 'practice' : (type === 'raid' ? 'raid' : 'mission'),
        surface,
        intent: resolveSessionIntent(environment, completionContext),
        focus: resolveSessionFocus(environment, completionContext),
        sourceSessionId: sourceMeta.adaptiveSourceSessionId || null,
        stepId: completionContext.task?.id,
        title: completionContext.task?.title || sourceMeta.label || 'Practice'
    };
}

export function createCompletedSessionRecord(environment, { result, timeline }, completionContext = resolveSessionCompletionContext(environment)) {
    const trainingMeta = resolveSessionTrainingMeta(environment, completionContext);
    const completedAt = result?.completedAt || new Date().toISOString();
    const durationSeconds = Number(result?.durationSeconds || 0);

    return normalizeSessionRecord({
        id: createSessionId(),
        kind: trainingMeta.type === 'mission' ? 'mission' : 'practice',
        intent: trainingMeta.intent,
        startedAt: completedAt,
        completedAt,
        durationSeconds,
        focus: trainingMeta.focus,
        source: environment.currentDraft?.sourceTextMeta?.source || environment.config.source || 'builtin',
        config: environment.config,
        result: {
            ...result,
            completedAt,
            durationSeconds
        },
        timeline,
        sourceTextMeta: environment.currentDraft?.sourceTextMeta || {
            source: environment.config.source || 'builtin',
            label: 'Practice text'
        },
        coachAdviceId: null,
        trainingMeta
    });
}

export function completeSession(environment, session) {
    const nextSessions = appendSession(session);

    environment.setSessions(nextSessions);
    environment.setLastCompletedSession(session);
    environment.setSkillProfile(buildProfileFromSessions(environment, nextSessions));
    sessionGateway.saveSession(session).catch(() => {});

    return nextSessions;
}

export function recordSession(environment, session) {
    return completeSession(environment, session);
}

export function createRaidSessionRecord(result) {
    const focusChars = Array.isArray(result?.focusChars) ? result.focusChars : [];
    const weakestChars = Array.isArray(result?.weakestChars) ? result.weakestChars : focusChars;
    const durationSeconds = Number(result?.durationSeconds || 0);
    const completedAt = new Date().toISOString();
    const intent = result?.mode === 'daily-focus' ? 'daily-focus-raid' : 'endless-raid';
    const threatLevel = Number(result?.threatLevel || 1);
    const monstersDefeated = Number(result?.monstersDefeated || result?.enemiesDefeated || 0);
    const eliteDefeated = Number(result?.eliteDefeated || 0);
    const endReason = result?.endReason || null;

    return normalizeSessionRecord({
        id: `raid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        kind: 'raid',
        intent,
        startedAt: completedAt,
        completedAt,
        durationSeconds,
        focus: focusChars.length ? focusChars.join('') : 'speed',
        source: 'raid',
        gameMeta: {
            score: Number(result?.score || 0),
            threatLevel,
            durationSeconds,
            maxCombo: Number(result?.maxCombo || 0),
            monstersDefeated,
            eliteDefeated,
            endReason,
            livesRemaining: Number(result?.livesRemaining || 0),
            focusChars,
            weakestChars
        },
        config: {
            mode: 'words',
            wordCount: 0,
            durationSeconds,
            includePunctuation: false,
            includeNumbers: focusChars.some((char) => /\d/.test(String(char))),
            source: 'builtin',
            aiTemplate: 'daily',
            difficulty: 'medium'
        },
        result: {
            score: Number(result?.score || 0),
            wpm: Number(result?.wpm || 0),
            rawWpm: Number(result?.wpm || 0),
            accuracy: Number(result?.accuracy || 0),
            consistency: Math.max(0, Math.min(100, 100 - Math.max(0, Number(result?.enemiesLeaked || 0)) * 8)),
            correctChars: Number(result?.totalCharsCorrect || 0),
            incorrectChars: Math.max(0, Number(result?.totalCharsTyped || 0) - Number(result?.totalCharsCorrect || 0)),
            extraChars: 0,
            missedChars: Number(result?.enemiesLeaked || 0),
            durationSeconds,
            completedAt,
            errors: Math.max(0, Number(result?.totalCharsTyped || 0) - Number(result?.totalCharsCorrect || 0)),
            topErrorChars: weakestChars,
            topErrorWords: [],
            errorCharStats: weakestChars.map((label) => ({ label, count: 1 })),
            errorWordStats: []
        },
        sourceTextMeta: {
            source: 'builtin',
            label: 'Endless Raid',
            generatedBy: 'raid'
        },
        coachAdviceId: null,
        trainingMeta: {
            type: 'raid',
            surface: 'raid',
            intent,
            focus: focusChars.length ? focusChars.join('') : 'speed',
            sourceSessionId: null,
            title: 'Endless Raid',
            score: Number(result?.score || 0),
            threatLevel,
            durationSeconds,
            maxCombo: Number(result?.maxCombo || 0),
            monstersDefeated,
            eliteDefeated,
            endReason,
            livesRemaining: Number(result?.livesRemaining || 0),
            focusChars
        }
    });
}

export function recordRaidSessionCompletion(environment, result) {
    const session = createRaidSessionRecord(result);
    completeSession(environment, session);
    environment.setActiveSessionContext(null);
    return session;
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
        const nextProfile = buildSkillProfile(diagnosticSessions, {
            language: environment.settings.language,
            keyboardLayout: environment.settings.keyboardLayout
        });
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
    const nextSessions = completeSession(environment, session);

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
