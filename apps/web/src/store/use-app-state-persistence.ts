import { useEffect, useLayoutEffect, useMemo } from 'react';
import { DEFAULT_CONFIG, createBuiltinDraft } from '@typemaster/domain';
import {
    loadActiveSessionContext,
    loadDiagnosticJourney,
    loadSettings,
    saveActiveSessionContext,
    saveDiagnosticJourney,
    saveSettings,
    saveSkillProfile,
    saveTrainingPlan
} from '../services/storage';
import { normalizeConfig, relabelDraft } from './app-state-helpers';

export function useAppInitialState() {
    return useMemo(() => {
        const settings = loadSettings();
        const config = normalizeConfig(settings.lastConfig || DEFAULT_CONFIG);

        return {
            settings,
            config,
            diagnosticJourney: loadDiagnosticJourney(),
            activeSessionContext: loadActiveSessionContext()
        };
    }, []);
}

export function useHydrateAppStores({
    hydrateHistoryUiState,
    hydrateRuntimeState,
    hydrateSettings,
    hydrateTrainingFlowState,
    initialState
}) {
    useLayoutEffect(() => {
        hydrateSettings(initialState.settings);
        hydrateRuntimeState({
            config: initialState.config,
            currentDraft: createBuiltinDraft(initialState.config, { language: initialState.settings.language }),
            aiPracticeStatus: 'idle',
            practiceError: null
        });
        hydrateHistoryUiState({
            lastCompletedSession: null,
            coachStatusBySessionId: {},
            coachIssueBySessionId: {}
        });
        hydrateTrainingFlowState({
            diagnosticJourney: initialState.diagnosticJourney,
            activeSessionContext: initialState.activeSessionContext
        });
    }, [hydrateHistoryUiState, hydrateRuntimeState, hydrateSettings, hydrateTrainingFlowState, initialState]);
}

export function usePersistAppState({
    activeSessionContext,
    config,
    diagnosticJourney,
    setCurrentDraft,
    settings,
    skillProfile,
    trainingPlan
}) {
    useEffect(() => {
        saveSettings({
            ...settings,
            lastConfig: config
        });
    }, [settings, config]);

    useEffect(() => {
        saveSkillProfile(skillProfile);
    }, [skillProfile]);

    useEffect(() => {
        saveTrainingPlan(trainingPlan);
    }, [trainingPlan]);

    useEffect(() => {
        saveDiagnosticJourney(diagnosticJourney);
    }, [diagnosticJourney]);

    useEffect(() => {
        saveActiveSessionContext(activeSessionContext);
    }, [activeSessionContext]);

    useEffect(() => {
        setCurrentDraft((previous) => relabelDraft(previous, settings.language));
    }, [setCurrentDraft, settings.language]);
}
