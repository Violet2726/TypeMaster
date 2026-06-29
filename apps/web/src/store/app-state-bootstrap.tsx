import type { ReactNode } from 'react';
import { planGateway } from '../services/api';
import { useAppStateEnvironment } from './app-state-environment';
import { useAppApiSync } from './use-app-api-sync';
import { useAppInitialState, useHydrateAppStores, usePersistAppState } from './use-app-state-persistence';
import { useAccountActionSet } from './use-account-action-set';

type AppStateBootstrapProps = {
    children: ReactNode,
};

export function AppStateBootstrap({ children }: AppStateBootstrapProps) {
    const initialState = useAppInitialState();
    const environment = useAppStateEnvironment();
    const accountActions = useAccountActionSet(environment);

    useHydrateAppStores({
        hydrateHistoryUiState: environment.hydrateHistoryUiState,
        hydrateRuntimeState: environment.hydrateRuntimeState,
        hydrateSettings: environment.hydrateSettings,
        hydrateTrainingFlowState: environment.hydrateTrainingFlowState,
        initialState
    });

    usePersistAppState({
        config: environment.config,
        setCurrentDraft: environment.setCurrentDraft,
        settings: environment.settings,
        skillProfile: environment.skillProfile,
        trainingPlan: environment.trainingPlan
    });

    useAppApiSync({
        account: environment.account,
        achievements: environment.achievements,
        hydrateFromApi: accountActions.hydrateFromApi,
        planGateway,
        sessionStreak: environment.sessionStreak,
        setAccountStatus: environment.setAccountStatus,
        skillProfile: environment.skillProfile,
        trainingPlan: environment.trainingPlan,
        weeklyGoal: environment.weeklyGoal
    });

    return children;
}
