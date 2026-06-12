import { Bot, CircleCheck, FileText, RefreshCw, Sparkles, WandSparkles } from 'lucide-react';
import { AI_TEMPLATES, DIFFICULTY_OPTIONS, getDifficultyLabel, getTemplateLabel } from '@typemaster/domain';
import { getErrorMessage } from '../../../i18n';

function getStatusLabel(copy, status) {
    if (status === 'loading') return copy.common.aiGenerating;
    if (status === 'ready') return copy.common.aiReady;
    if (status === 'stale') return copy.common.aiStale;
    if (status === 'error') return copy.common.aiFailed;
    return copy.common.aiNeedsGenerate;
}

function getStatusBody(copy, status) {
    if (status === 'loading') return copy.practice.aiLoading;
    if (status === 'ready') return copy.practice.aiReady;
    if (status === 'stale') return copy.practice.aiStale;
    if (status === 'error') return copy.practice.aiError;
    return copy.practice.aiIdle;
}

export function AIWorkshop({
    copy,
    language,
    config,
    currentDraft,
    aiPracticeStatus,
    practiceError,
    onConfigChange,
    onGenerate,
    onRestoreConfig,
    onUseBuiltin
}) {
    const errorCopy = practiceError ? getErrorMessage(language, practiceError.code) : null;
    const selectedTemplate = AI_TEMPLATES.find((template) => template.id === config.aiTemplate);
    const selectedDifficulty = DIFFICULTY_OPTIONS.find((difficulty) => difficulty.id === config.difficulty);
    const statusLabel = getStatusLabel(copy, aiPracticeStatus);
    const aiDraftName = currentDraft?.sourceTextMeta?.source === 'ai' ? currentDraft.sourceTextMeta.label : '';
    const hasNamedAiDraft = Boolean(aiDraftName)
        && aiDraftName !== copy.common.emptyValue
        && aiPracticeStatus !== 'idle'
        && aiPracticeStatus !== 'error';
    const draftLabel = hasNamedAiDraft ? aiDraftName : statusLabel;
    const headline = hasNamedAiDraft ? draftLabel : copy.common.generateAiText;
    const statusBody = getStatusBody(copy, aiPracticeStatus);
    const templateLabel = selectedTemplate ? getTemplateLabel(selectedTemplate, language) : copy.common.emptyValue;
    const difficultyLabel = selectedDifficulty ? getDifficultyLabel(selectedDifficulty, language) : copy.common.emptyValue;
    const primaryActionLabel = aiPracticeStatus === 'stale'
        ? copy.common.reGenerateAiText
        : aiPracticeStatus === 'loading'
            ? copy.common.loading
            : copy.common.generateAiText;

    return (
        <section className={`ai-custom-panel ai-custom-panel--ai ai-custom-panel--${aiPracticeStatus}`}>
            <div className="ai-custom-panel__head">
                <span className="ai-custom-panel__icon" aria-hidden="true">
                    <Bot size={20} strokeWidth={2.25} />
                </span>
                <div>
                    <p className="panel-kicker">{copy.practice.customTitle}</p>
                    <strong>{headline}</strong>
                    <p className="muted-text">{statusBody}</p>
                </div>
                <div className="ai-custom-panel__command">
                    <span className={`ai-custom-panel__status-pill ai-custom-panel__status-pill--${aiPracticeStatus}`} aria-live="polite">
                        <Sparkles aria-hidden="true" size={14} strokeWidth={2.2} />
                        <small>{copy.common.status}</small>
                        <strong>{statusLabel}</strong>
                    </span>
                    <div className="workshop-actions">
                        <button
                            type="button"
                            className="action-btn primary"
                            onClick={onGenerate}
                            disabled={aiPracticeStatus === 'loading'}
                        >
                            <WandSparkles aria-hidden="true" size={18} strokeWidth={2.25} />
                            {primaryActionLabel}
                        </button>
                        {aiPracticeStatus === 'stale' && (
                            <button type="button" className="action-btn" onClick={onRestoreConfig}>
                                <RefreshCw aria-hidden="true" size={18} strokeWidth={2.25} />
                                {copy.common.restoreLastConfig}
                            </button>
                        )}
                        {aiPracticeStatus === 'error' && (
                            <button type="button" className="action-btn" onClick={onUseBuiltin}>
                                <FileText aria-hidden="true" size={18} strokeWidth={2.25} />
                                {copy.common.useBuiltIn}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="ai-custom-panel__body">
                <div className="ai-custom-panel__spec">
                    <div className="workshop-grid">
                        <label className="field workshop-field">
                            <span>
                                <WandSparkles aria-hidden="true" size={15} strokeWidth={2.25} />
                                {copy.practice.templateLabel}
                            </span>
                            <select value={config.aiTemplate} onChange={(event) => onConfigChange({ aiTemplate: event.target.value, source: 'ai' }, { risky: true, intent: 'config' })}>
                                {AI_TEMPLATES.map((template) => (
                                    <option key={template.id} value={template.id}>{getTemplateLabel(template, language)}</option>
                                ))}
                            </select>
                        </label>

                        <label className="field workshop-field">
                            <span>
                                <CircleCheck aria-hidden="true" size={15} strokeWidth={2.25} />
                                {copy.practice.difficultyLabel}
                            </span>
                            <select value={config.difficulty} onChange={(event) => onConfigChange({ difficulty: event.target.value, source: 'ai' }, { risky: true, intent: 'config' })}>
                                {DIFFICULTY_OPTIONS.map((difficulty) => (
                                    <option key={difficulty.id} value={difficulty.id}>{getDifficultyLabel(difficulty, language)}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                <div className="ai-custom-panel__state" aria-live="polite">
                    <div>
                        <p className="summary-label">{copy.common.currentText}</p>
                        <strong>{draftLabel}</strong>
                        <span>{copy.practice.customBody}</span>
                    </div>
                    <div className="ai-custom-panel__state-grid">
                        <span>
                            <small>{copy.practice.templateLabel}</small>
                            <strong>{templateLabel}</strong>
                        </span>
                        <span>
                            <small>{copy.practice.difficultyLabel}</small>
                            <strong>{difficultyLabel}</strong>
                        </span>
                    </div>
                </div>
            </div>

            {errorCopy && (
                <div className="feedback-card feedback-error">
                    <strong>{errorCopy.title}</strong>
                    <p>{errorCopy.description}</p>
                </div>
            )}
        </section>
    );
}
