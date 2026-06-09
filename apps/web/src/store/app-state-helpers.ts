import {
    DEFAULT_CONFIG,
    getDifficultyLabel,
    getDifficultyMeta,
    getTemplateLabel,
    getTemplateMeta
} from '@typemaster/domain';
import { getInlineSeparator } from '../i18n';

export function normalizeConfig(config) {
    const next = {
        ...DEFAULT_CONFIG,
        ...config
    };

    if (next.mode === 'time') {
        next.durationSeconds = Number(next.durationSeconds || DEFAULT_CONFIG.durationSeconds);
    } else {
        next.wordCount = Number(next.wordCount || DEFAULT_CONFIG.wordCount);
    }

    return next;
}

export function getCoachStatusFromRecord(record) {
    if (!record) return 'idle';
    return record.source === 'ai' ? 'success' : 'fallback';
}

export function normalizeAiIssue(error) {
    return {
        code: error?.code || 'unknown',
        message: error?.message || 'Unknown error'
    };
}

export function shouldLogAiIssue(issue) {
    return issue?.code !== 'missing_config';
}

function getGeneratedDraftLabel(meta, language) {
    if (meta?.generatedBy === 'builtin') {
        return language === 'en-US' ? 'Built-in word bank' : '标准词库训练';
    }

    if (meta?.generatedBy === 'custom') {
        return language === 'en-US' ? 'Custom word bank' : '自定义词库';
    }

    if (meta?.generatedBy !== 'ai') {
        return meta?.label;
    }

    const templateLabel = meta.template
        ? getTemplateLabel(getTemplateMeta(meta.template), language)
        : null;
    const difficultyLabel = meta.difficulty
        ? getDifficultyLabel(getDifficultyMeta(meta.difficulty), language)
        : null;

    return templateLabel && difficultyLabel
        ? `${templateLabel}${getInlineSeparator(language)}${difficultyLabel}`
        : meta.label;
}

export function relabelDraft(draft, language) {
    if (!draft?.sourceTextMeta) return draft;

    return {
        ...draft,
        sourceTextMeta: {
            ...draft.sourceTextMeta,
            label: getGeneratedDraftLabel(draft.sourceTextMeta, language)
        }
    };
}

export function buildTrainingTaskFromState(activeSessionContext, diagnosticJourney, trainingPlan, dailyChallenge) {
    if (!activeSessionContext) {
        return null;
    }

    if (activeSessionContext.type === 'diagnostic') {
        return diagnosticJourney?.steps?.find((step) => step.id === activeSessionContext.stepId) || null;
    }

    if (activeSessionContext.type === 'plan') {
        return trainingPlan?.steps?.find((step) => step.id === activeSessionContext.stepId) || null;
    }

    if (activeSessionContext.type === 'challenge') {
        if (dailyChallenge && dailyChallenge.id === activeSessionContext.challengeId) {
            return {
                id: dailyChallenge.id,
                order: 1,
                title: dailyChallenge.title,
                summary: dailyChallenge.summary
            };
        }

        return activeSessionContext.challengeId
            ? {
                id: activeSessionContext.challengeId,
                order: 1,
                title: activeSessionContext.title || activeSessionContext.challengeId,
                summary: activeSessionContext.summary || ''
            }
            : null;
    }

    return null;
}
