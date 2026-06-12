import { BadgeCheck, FileText, PencilLine, Sparkles } from 'lucide-react';
import { getCopy } from '../../../i18n';
import { getTrainingCopy } from '../../../training/copy';

export function CustomTextWorkshop({
    language,
    value,
    onChange,
    onApply
}) {
    const copy = getCopy(language);
    const trainingCopy = getTrainingCopy(language);
    const trimmedValue = value.trim();
    const hasText = Boolean(trimmedValue);
    const wordCount = hasText ? trimmedValue.split(/\s+/).filter(Boolean).length : 0;
    const characterCount = trimmedValue.length;
    const numberFormatter = new Intl.NumberFormat(language);
    const statusVariant = hasText ? 'ready' : 'idle';
    const statusLabel = hasText ? copy.common.aiReady : copy.common.aiNeedsGenerate;

    return (
        <section className={`ai-custom-panel ai-custom-panel--custom ai-custom-panel--${statusVariant} custom-text-workshop`}>
            <div className="ai-custom-panel__head">
                <span className="ai-custom-panel__icon" aria-hidden="true">
                    <PencilLine size={20} strokeWidth={2.25} />
                </span>
                <div>
                    <p className="panel-kicker">{trainingCopy.practice.customSource}</p>
                    <strong>{trainingCopy.practice.customTitle}</strong>
                    <p className="muted-text">{trainingCopy.practice.customBody}</p>
                </div>
                <div className="ai-custom-panel__command">
                    <span className={`ai-custom-panel__status-pill ai-custom-panel__status-pill--${statusVariant}`} aria-live="polite">
                        <Sparkles aria-hidden="true" size={14} strokeWidth={2.2} />
                        <small>{copy.common.status}</small>
                        <strong>{statusLabel}</strong>
                    </span>
                    <div className="workshop-actions">
                        <button type="button" className="action-btn primary" onClick={onApply} disabled={!hasText}>
                            <BadgeCheck aria-hidden="true" size={18} strokeWidth={2.25} />
                            {trainingCopy.practice.customApply}
                        </button>
                    </div>
                </div>
            </div>

            <div className="custom-text-workshop__body">
                <label className="field workshop-field workshop-field--textarea custom-text-workshop__editor">
                    <span>
                        <FileText aria-hidden="true" size={15} strokeWidth={2.25} />
                        {trainingCopy.practice.customSource}
                    </span>
                    <textarea
                        value={value}
                        rows={8}
                        placeholder={trainingCopy.practice.customPlaceholder}
                        onChange={(event) => onChange(event.target.value)}
                    />
                </label>

                <div className="ai-custom-panel__state custom-text-workshop__summary" aria-live="polite">
                    <div>
                        <p className="summary-label">{copy.common.currentText}</p>
                        <strong>{statusLabel}</strong>
                        <span>{hasText ? trainingCopy.practice.customBody : trainingCopy.practice.customPlaceholder}</span>
                    </div>
                    <div className="ai-custom-panel__state-grid custom-text-workshop__stats">
                        <span>
                            <small>{copy.common.wordsMode}</small>
                            <strong>{numberFormatter.format(wordCount)}</strong>
                        </span>
                        <span>
                            <small>{copy.common.characterStats}</small>
                            <strong>{numberFormatter.format(characterCount)}</strong>
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}
