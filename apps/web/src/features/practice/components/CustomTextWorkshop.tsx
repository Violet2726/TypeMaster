import { BadgeCheck, FileText, PencilLine } from 'lucide-react';
import { getCopy } from '../../../i18n';
import { getTrainingCopy } from '../../../training/copy';
import { PracticeWorkshopField, PracticeWorkshopSnapshot } from './PracticeWorkshopBlocks';
import { PracticeWorkshopShell } from './PracticeWorkshopShell';

function getPreviewText(value) {
    const normalizedValue = value.replace(/\s+/g, ' ').trim();

    if (!normalizedValue) {
        return '';
    }

    return normalizedValue.length > 84
        ? `${normalizedValue.slice(0, 84).trimEnd()}...`
        : normalizedValue;
}

export function CustomTextWorkshop({
    language,
    value,
    onChange,
    onApply,
    editorRef
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
    const previewText = hasText ? getPreviewText(trimmedValue) : copy.common.emptyValue;

    return (
        <PracticeWorkshopShell
            variant="custom"
            statusTone={statusVariant}
            icon={PencilLine}
            kicker={trainingCopy.practice.customSource}
            title={trainingCopy.practice.customTitle}
            description={trainingCopy.practice.customBody}
            statusCaption={copy.common.status}
            statusLabel={statusLabel}
            actions={(
                <button type="button" className="action-btn primary" onClick={onApply} disabled={!hasText}>
                    <BadgeCheck aria-hidden="true" size={18} strokeWidth={2.25} />
                    {trainingCopy.practice.customApply}
                </button>
            )}
        >
            <div className="custom-text-workshop__body practice-workshop-grid practice-workshop-grid--editor">
                <PracticeWorkshopField
                    className="practice-workshop-grid__main practice-workshop-grid__main--editor workshop-field--textarea custom-text-workshop__editor"
                    icon={FileText}
                    label={copy.common.currentText}
                >
                    <textarea
                        ref={editorRef}
                        value={value}
                        rows={8}
                        placeholder={trainingCopy.practice.customPlaceholder}
                        onChange={(event) => onChange(event.target.value)}
                    />
                </PracticeWorkshopField>

                <PracticeWorkshopSnapshot
                    className="custom-text-workshop__summary"
                    eyebrow={copy.common.currentText}
                    title={previewText}
                    metrics={[
                        {
                            label: copy.common.wordsMode,
                            value: numberFormatter.format(wordCount)
                        },
                        {
                            label: copy.common.characterStats,
                            value: numberFormatter.format(characterCount)
                        }
                    ]}
                />
            </div>
        </PracticeWorkshopShell>
    );
}
