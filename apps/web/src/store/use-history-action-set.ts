import { useCallback, useMemo } from 'react';
import {
    generateCoachForSession,
    getAdviceForSession,
    getCoachIssueForSession,
    getCoachStatusForSession,
    launchNextDrill,
    saveCoachRecord
} from './coach-feedback-use-cases';

type GenerateCoachOptions = {
    force?: boolean,
};

export function useHistoryActionSet(environment, configActions) {
    const saveCoachRecordAction = useCallback((sessionId, advice, source) => (
        saveCoachRecord(environment, sessionId, advice, source)
    ), [environment]);
    const getAdviceForSessionAction = useCallback((sessionId) => (
        getAdviceForSession(environment, sessionId)
    ), [environment]);
    const getCoachStatusForSessionAction = useCallback((sessionId) => (
        getCoachStatusForSession(environment, sessionId)
    ), [environment]);
    const getCoachIssueForSessionAction = useCallback((sessionId) => (
        getCoachIssueForSession(environment, sessionId)
    ), [environment]);
    const generateCoachForSessionAction = useCallback((sessionId, options: GenerateCoachOptions = {}) => (
        generateCoachForSession(environment, sessionId, options)
    ), [environment]);
    const launchNextDrillAction = useCallback((adviceRecord, fallbackSession = null) => (
        launchNextDrill(configActions, adviceRecord, fallbackSession)
    ), [configActions]);

    return useMemo(() => ({
        generateCoachForSession: generateCoachForSessionAction,
        getAdviceForSession: getAdviceForSessionAction,
        getCoachIssueForSession: getCoachIssueForSessionAction,
        getCoachStatusForSession: getCoachStatusForSessionAction,
        launchNextDrill: launchNextDrillAction,
        saveCoachRecord: saveCoachRecordAction
    }), [
        generateCoachForSessionAction,
        getAdviceForSessionAction,
        getCoachIssueForSessionAction,
        getCoachStatusForSessionAction,
        launchNextDrillAction,
        saveCoachRecordAction
    ]);
}
