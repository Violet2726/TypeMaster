import { useCallback, useMemo } from 'react';
import { recordSessionCompletion } from './session-completion-use-cases';

export function useSessionActionSet(environment) {
    const recordCompletedSession = useCallback((payload) => (
        recordSessionCompletion(environment, payload)
    ), [environment]);

    return useMemo(() => ({
        recordCompletedSession
    }), [recordCompletedSession]);
}
