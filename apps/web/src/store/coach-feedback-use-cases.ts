import { buildFallbackCoachAdvice, generateCoachAdvice } from '@typemaster/ai';
import { normalizeCoachAdviceRecord } from '@typemaster/contracts/training-state';
import { appendCoachAdvice, getCoachAdviceBySessionId, updateSession } from '../services/storage';
import { getCoachStatusFromRecord, normalizeAiIssue, shouldLogAiIssue } from './app-state-helpers';

type GenerateCoachOptions = {
    force?: boolean,
};

function createCoachRecordId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `coach-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function saveCoachRecord(environment, sessionId, advice, source) {
    const record = normalizeCoachAdviceRecord({
        id: createCoachRecordId(),
        sessionId,
        source,
        createdAt: new Date().toISOString(),
        ...advice
    });

    const nextRecords = appendCoachAdvice(record);
    const nextSessions = updateSession(sessionId, (session) => ({
        ...session,
        coachAdviceId: record.id
    }));

    environment.setCoachAdviceRecords(nextRecords);
    environment.setSessions(nextSessions);
    return record;
}

export function getAdviceForSession(environment, sessionId) {
    if (!sessionId) return null;
    return environment.coachAdviceRecords.find((record) => record.sessionId === sessionId)
        || getCoachAdviceBySessionId(sessionId);
}

export function getCoachStatusForSession(environment, sessionId) {
    if (!sessionId) return 'idle';
    return environment.coachStatusBySessionId[sessionId]
        || getCoachStatusFromRecord(getAdviceForSession(environment, sessionId));
}

export function getCoachIssueForSession(environment, sessionId) {
    if (!sessionId) return null;
    return environment.coachIssueBySessionId[sessionId] || null;
}

export async function generateCoachForSession(environment, sessionId, options: GenerateCoachOptions = {}) {
    const { force = false } = options;
    const existing = getAdviceForSession(environment, sessionId);
    if (existing && !force && existing.source === 'ai') {
        environment.setCoachStatusBySessionId((previous) => ({
            ...previous,
            [sessionId]: 'success'
        }));
        return existing;
    }

    const session = environment.sessions.find((item) => item.id === sessionId) || environment.lastCompletedSession;
    if (!session) {
        environment.setCoachStatusBySessionId((previous) => ({
            ...previous,
            [sessionId]: 'error'
        }));
        return null;
    }

    const history = environment.sessions.filter((item) => item.id !== session.id);

    environment.setCoachStatusBySessionId((previous) => ({
        ...previous,
        [sessionId]: 'loading'
    }));
    environment.setCoachIssueBySessionId((previous) => ({
        ...previous,
        [sessionId]: null
    }));

    try {
        const advice = await generateCoachAdvice({
            session,
            history,
            language: environment.settings.language
        });

        const record = saveCoachRecord(environment, session.id, advice, 'ai');
        environment.setCoachStatusBySessionId((previous) => ({
            ...previous,
            [sessionId]: 'success'
        }));
        return record;
    } catch (error) {
        const issue = normalizeAiIssue(error);
        if (shouldLogAiIssue(issue)) {
            console.error('Failed to generate AI coach advice', error);
        }

        try {
            const fallback = buildFallbackCoachAdvice({
                session,
                history,
                language: environment.settings.language
            });
            const record = saveCoachRecord(environment, session.id, {
                ...fallback,
                fallbackReasonCode: issue.code,
                fallbackReasonMessage: issue.message
            }, 'fallback');
            environment.setCoachStatusBySessionId((previous) => ({
                ...previous,
                [sessionId]: 'fallback'
            }));
            environment.setCoachIssueBySessionId((previous) => ({
                ...previous,
                [sessionId]: issue
            }));
            return record;
        } catch (fallbackError) {
            environment.setCoachStatusBySessionId((previous) => ({
                ...previous,
                [sessionId]: 'error'
            }));
            environment.setCoachIssueBySessionId((previous) => ({
                ...previous,
                [sessionId]: issue
            }));
            throw fallbackError;
        }
    }
}

export async function launchNextDrill(configActions, adviceRecord, fallbackSession = null) {
    const nextDrill = adviceRecord?.nextDrill;
    if (!nextDrill) {
        return fallbackSession ? configActions.setAdaptiveDrillDraft(fallbackSession) : null;
    }

    try {
        return await configActions.generateAiPractice({
            promptOverride: nextDrill.aiPrompt,
            configPatch: nextDrill.configPatch
        });
    } catch (error) {
        if (!fallbackSession) {
            throw error;
        }

        return configActions.setAdaptiveDrillDraft(fallbackSession);
    }
}
