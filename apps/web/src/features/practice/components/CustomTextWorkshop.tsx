import { getTrainingCopy } from '../../../training/copy';

export function CustomTextWorkshop({
    language,
    value,
    onChange,
    onApply
}) {
    const trainingCopy = getTrainingCopy(language);

    return (
        <section className="ai-custom-panel">
            <div className="ai-custom-panel__head">
                <div>
                    <p className="panel-kicker">{trainingCopy.practice.customSource}</p>
                    <strong>{trainingCopy.practice.customTitle}</strong>
                </div>
            </div>

            <p className="muted-text">{trainingCopy.practice.customBody}</p>

            <label className="field">
                <span>{trainingCopy.practice.customSource}</span>
                <textarea
                    value={value}
                    rows={8}
                    placeholder={trainingCopy.practice.customPlaceholder}
                    onChange={(event) => onChange(event.target.value)}
                />
            </label>

            <div className="workshop-actions">
                <button type="button" className="action-btn primary" onClick={onApply} disabled={!value.trim()}>
                    {trainingCopy.practice.customApply}
                </button>
            </div>
        </section>
    );
}
