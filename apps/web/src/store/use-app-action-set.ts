import { useAppStateEnvironment } from './app-state-environment';
import { useAccountActionSet } from './use-account-action-set';
import { useConfigActionSet } from './use-config-action-set';
import { useHistoryActionSet } from './use-history-action-set';
import { usePlanActionSet } from './use-plan-action-set';
import { useSessionActionSet } from './use-session-action-set';

export function useAppActions() {
    const environment = useAppStateEnvironment();
    return useAppActionSet(environment);
}

export function useAppActionSet(environment) {
    const configActions = useConfigActionSet(environment);
    const planActions = usePlanActionSet(environment);
    const accountActions = useAccountActionSet(environment);
    const sessionCoreActions = useSessionActionSet(environment);
    const historyActions = useHistoryActionSet(environment, configActions);
    const sessionActions = {
        ...sessionCoreActions,
        generateAiPractice: configActions.generateAiPractice,
        resetPracticeToBuiltin: configActions.resetPracticeToBuiltin,
        restoreAiDraftConfig: configActions.restoreAiDraftConfig
    };

    return {
        accountActions,
        configActions,
        historyActions,
        planActions,
        sessionActions
    };
}
