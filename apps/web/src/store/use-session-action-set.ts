import { useCallback, useMemo } from 'react';
import { recordGameSessionCompletion, recordSessionCompletion } from './session-completion-use-cases';

export function useSessionActionSet(environment) {
    const recordCompletedSession = useCallback((payload) => (
        recordSessionCompletion(environment, payload)
    ), [environment]);

    const recordCompletedGameSession = useCallback((result) => (
        recordGameSessionCompletion(environment, result)
    ), [environment]);

    return useMemo(() => ({
        recordCompletedGameSession,
        recordCompletedSession
    }), [recordCompletedGameSession, recordCompletedSession]);
}
