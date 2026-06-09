import { useCallback, useMemo } from 'react';
import {
    exportTrainingData,
    hydrateAccountFromApi,
    importTrainingData,
    signInToAccount,
    signOutFromAccount
} from './account-sync-use-cases';

export function useAccountActionSet(environment) {
    const hydrateFromApiAction = useCallback((user) => (
        hydrateAccountFromApi(environment, user)
    ), [environment]);
    const signInToAccountAction = useCallback((displayName) => (
        signInToAccount(environment, displayName)
    ), [environment]);
    const signOutFromAccountAction = useCallback(() => (
        signOutFromAccount(environment)
    ), [environment]);
    const exportTrainingDataAction = useCallback(() => (
        exportTrainingData(environment)
    ), [environment]);
    const importTrainingDataAction = useCallback((rawPayload) => (
        importTrainingData(environment, rawPayload)
    ), [environment]);

    return useMemo(() => ({
        exportTrainingData: exportTrainingDataAction,
        hydrateFromApi: hydrateFromApiAction,
        importTrainingData: importTrainingDataAction,
        signInToAccount: signInToAccountAction,
        signOutFromAccount: signOutFromAccountAction
    }), [
        exportTrainingDataAction,
        hydrateFromApiAction,
        importTrainingDataAction,
        signInToAccountAction,
        signOutFromAccountAction
    ]);
}
