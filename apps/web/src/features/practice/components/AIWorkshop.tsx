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

    return (
        <section className="ai-custom-panel ai-custom-panel--ai">
            <div className="ai-custom-panel__head">
                <span className="ai-custom-panel__icon" aria-hidden="true">
                    <Bot size={20} strokeWidth={2.25} />
                </span>
                <div>
                    <p className="panel-kicker">{copy.practice.customTitle}</p>
                    <strong>{copy.practice.customTitle}</strong>
                </div>
                <span className={`panel-badge badge-${aiPracticeStatus}`}>
                    <Sparkles aria-hidden="true" size={14} strokeWidth={2.2} />
                    {getStatusLabel(copy, aiPracticeStatus)}
                </span>
            </div>

            <p className="muted-text">{copy.practice.customBody}</p>

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

            <div className="status-card status-card--workshop">
                <div className="status-card__row">
                    <div>
                        <p className="summary-label">{copy.common.currentText}</p>
                        <strong>{currentDraft?.sourceTextMeta?.source === 'ai' ? currentDraft.sourceTextMeta.label : copy.common.emptyValue}</strong>
                    </div>
                    <div>
                        <p className="summary-label">{copy.common.status}</p>
                        <strong>{getStatusLabel(copy, aiPracticeStatus)}</strong>
                    </div>
                </div>
                <p className="muted-text">{getStatusBody(copy, aiPracticeStatus)}</p>
            </div>

            {errorCopy && (
                <div className="feedback-card feedback-error">
                    <strong>{errorCopy.title}</strong>
                    <p>{errorCopy.description}</p>
                </div>
            )}

            <div className="workshop-actions">
                <button
                    type="button"
                    className="action-btn primary"
                    onClick={onGenerate}
                    disabled={aiPracticeStatus === 'loading'}
                >
                    <WandSparkles aria-hidden="true" size={18} strokeWidth={2.25} />
                    {aiPracticeStatus === 'stale'
                        ? copy.common.reGenerateAiText
                        : aiPracticeStatus === 'loading'
                            ? copy.common.loading
                            : copy.common.generateAiText}
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
        </section>
    );
}
