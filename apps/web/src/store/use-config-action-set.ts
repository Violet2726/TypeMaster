import { startTransition, useCallback, useMemo } from 'react';
import {
    applyCustomWordBank,
    generateAiPractice,
    resetPracticeToBuiltin,
    restoreAiDraftConfig,
    setBuiltinDraft,
    setCustomDraft,
    updateConfig
} from './practice-draft-use-cases';

type ApplyCustomWordBankOptions = {
    activate?: boolean,
};

type GenerateAiPracticeOptions = {
    configPatch?: Record<string, unknown>,
    promptOverride?: string,
};

export function useConfigActionSet(environment) {
    const setBuiltinDraftAction = useCallback((nextConfig) => (
        setBuiltinDraft(environment, nextConfig)
    ), [environment]);
    const setCustomDraftAction = useCallback((nextConfig, text = environment.settings.customWordBankText) => (
        setCustomDraft(environment, nextConfig, text)
    ), [environment]);
    const applyCustomWordBankAction = useCallback((text, options: ApplyCustomWordBankOptions = {}) => (
        applyCustomWordBank(environment, text, options)
    ), [environment]);
    const updateConfigAction = useCallback((patch) => (
        updateConfig(environment, patch, startTransition)
    ), [environment]);
    const restoreAiDraftConfigAction = useCallback(() => (
        restoreAiDraftConfig(environment)
    ), [environment]);
    const generateAiPracticeAction = useCallback((options: GenerateAiPracticeOptions = {}) => (
        generateAiPractice(environment, options)
    ), [environment]);
    const resetPracticeToBuiltinAction = useCallback(() => (
        resetPracticeToBuiltin(environment)
    ), [environment]);

    return useMemo(() => ({
        applyCustomWordBank: applyCustomWordBankAction,
        generateAiPractice: generateAiPracticeAction,
        resetPracticeToBuiltin: resetPracticeToBuiltinAction,
        restoreAiDraftConfig: restoreAiDraftConfigAction,
        setBuiltinDraft: setBuiltinDraftAction,
        setCustomDraft: setCustomDraftAction,
        updateConfig: updateConfigAction
    }), [
        applyCustomWordBankAction,
        generateAiPracticeAction,
        resetPracticeToBuiltinAction,
        restoreAiDraftConfigAction,
        setBuiltinDraftAction,
        setCustomDraftAction,
        updateConfigAction
    ]);
}
