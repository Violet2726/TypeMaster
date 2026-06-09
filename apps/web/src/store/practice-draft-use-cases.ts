import { createAdaptiveDrillDraft, createBuiltinDraft, createCustomDraft, doesDraftMatchConfig } from '@typemaster/domain';
import { generatePracticeText } from '@typemaster/ai';
import { normalizeAiIssue, normalizeConfig, shouldLogAiIssue } from './app-state-helpers';

type ApplyCustomWordBankOptions = {
    activate?: boolean,
};

type GenerateAiPracticeOptions = {
    configPatch?: Record<string, unknown>,
    promptOverride?: string,
};

type ScheduleDraftUpdate = (callback: () => void) => void;

function runImmediately(callback: () => void) {
    callback();
}

export function setBuiltinDraft(environment, nextConfig) {
    environment.setCurrentDraft(createBuiltinDraft({ ...nextConfig, source: 'builtin' }, {
        language: environment.settings.language
    }));
    environment.setPracticeError(null);
    environment.setAiPracticeStatus('idle');
}

export function setCustomDraft(environment, nextConfig, text = environment.settings.customWordBankText) {
    const nextDraft = createCustomDraft(text, { ...nextConfig, source: 'custom' }, {
        language: environment.settings.language
    });
    environment.setCurrentDraft(nextDraft);
    environment.setPracticeError(null);
    environment.setAiPracticeStatus('idle');
    return nextDraft;
}

export function setAdaptiveDrillDraft(environment, session) {
    const draft = createAdaptiveDrillDraft(session, {
        language: environment.settings.language
    });

    environment.setConfigState(draft.configSnapshot);
    environment.setCurrentDraft(draft);
    environment.setPracticeError(null);
    environment.setAiPracticeStatus('idle');
    environment.setActiveSessionContext(null);

    return draft;
}

export function applyCustomWordBank(environment, text, options: ApplyCustomWordBankOptions = {}) {
    const nextText = String(text || '');
    const nextSettings = {
        ...environment.settings,
        customWordBankText: nextText
    };
    const nextConfig = normalizeConfig({
        ...environment.config,
        source: 'custom'
    });

    environment.setSettingsState(nextSettings);
    environment.setConfigState(nextConfig);
    setCustomDraft(environment, nextConfig, nextText);

    if (options.activate !== false) {
        environment.setActiveSessionContext(null);
    }

    return nextText;
}

export function updateConfig(environment, patch, scheduleDraftUpdate: ScheduleDraftUpdate = runImmediately) {
    environment.setActiveSessionContext(null);
    let nextConfig;
    environment.setConfigState((previous) => {
        nextConfig = normalizeConfig({ ...previous, ...patch });
        return nextConfig;
    });

    if (!nextConfig) {
        return;
    }

    if ((patch.source || nextConfig.source) === 'builtin') {
        scheduleDraftUpdate(() => {
            setBuiltinDraft(environment, { ...nextConfig, source: 'builtin' });
        });
        return;
    }

    if ((patch.source || nextConfig.source) === 'custom') {
        scheduleDraftUpdate(() => {
            setCustomDraft(environment, { ...nextConfig, source: 'custom' });
        });
        return;
    }

    environment.setPracticeError(null);
    if (environment.currentDraft?.sourceTextMeta?.source === 'ai' && doesDraftMatchConfig(nextConfig, environment.currentDraft)) {
        environment.setAiPracticeStatus('ready');
        return;
    }

    environment.setAiPracticeStatus(environment.currentDraft?.sourceTextMeta?.source === 'ai' ? 'stale' : 'idle');
}

export function restoreAiDraftConfig(environment) {
    if (!environment.currentDraft?.configSnapshot || environment.currentDraft.sourceTextMeta?.source !== 'ai') {
        return;
    }

    const restored = normalizeConfig({
        ...environment.currentDraft.configSnapshot,
        source: 'ai'
    });

    environment.setConfigState(restored);
    environment.setPracticeError(null);
    environment.setAiPracticeStatus('ready');
}

export async function generateAiPractice(environment, { promptOverride = '', configPatch = {} }: GenerateAiPracticeOptions = {}) {
    const nextConfig = normalizeConfig({
        ...environment.config,
        ...configPatch,
        source: 'ai'
    });

    environment.setConfigState(nextConfig);
    environment.setAiPracticeStatus('loading');
    environment.setPracticeError(null);

    try {
        const draft = await generatePracticeText(nextConfig, promptOverride, {
            language: environment.settings.language
        });
        environment.setCurrentDraft(draft);
        environment.setAiPracticeStatus('ready');
        return draft;
    } catch (error) {
        const issue = normalizeAiIssue(error);
        if (shouldLogAiIssue(issue)) {
            console.error('Failed to generate AI practice', error);
        }
        environment.setPracticeError(issue);
        environment.setAiPracticeStatus('error');
        throw error;
    }
}

export function resetPracticeToBuiltin(environment) {
    const nextConfig = normalizeConfig({
        ...environment.config,
        source: 'builtin'
    });

    environment.setConfigState(nextConfig);
    setBuiltinDraft(environment, nextConfig);
    environment.setActiveSessionContext(null);
}
