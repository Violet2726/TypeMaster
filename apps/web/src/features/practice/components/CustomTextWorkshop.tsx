import { FileText, PencilLine } from 'lucide-react';
import { getTrainingCopy } from '../../../training/copy';

export function CustomTextWorkshop({
    language,
    value,
    onChange,
    onApply
}) {
    const trainingCopy = getTrainingCopy(language);

    return (
        <section className="ai-custom-panel ai-custom-panel--custom">
            <div className="ai-custom-panel__head">
                <span className="ai-custom-panel__icon" aria-hidden="true">
                    <PencilLine size={20} strokeWidth={2.25} />
                </span>
                <div>
                    <p className="panel-kicker">{trainingCopy.practice.customSource}</p>
                    <strong>{trainingCopy.practice.customTitle}</strong>
                </div>
            </div>

            <p className="muted-text">{trainingCopy.practice.customBody}</p>

            <label className="field workshop-field workshop-field--textarea">
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

            <div className="workshop-actions">
                <button type="button" className="action-btn primary" onClick={onApply} disabled={!value.trim()}>
                    <PencilLine aria-hidden="true" size={18} strokeWidth={2.25} />
                    {trainingCopy.practice.customApply}
                </button>
            </div>
        </section>
    );
}
