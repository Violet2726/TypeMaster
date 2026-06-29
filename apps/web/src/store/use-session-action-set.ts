import { useCallback, useMemo } from 'react';
import { recordRaidSessionCompletion, recordSessionCompletion } from './session-completion-use-cases';

export function useSessionActionSet(environment) {
    const recordCompletedSession = useCallback((payload) => (
        recordSessionCompletion(environment, payload)
    ), [environment]);

    const recordCompletedRaidSession = useCallback((result) => (
        recordRaidSessionCompletion(environment, result)
    ), [environment]);

    return useMemo(() => ({
        recordCompletedRaidSession,
        recordCompletedSession
    }), [recordCompletedRaidSession, recordCompletedSession]);
}
