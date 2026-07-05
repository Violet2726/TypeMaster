import { BadgeCheck, FileText, PencilLine } from 'lucide-react';
import { getCopy } from '../../../i18n';
import { getTrainingCopy } from '../../../training/copy';
import { PracticeWorkshopField } from './PracticeWorkshopBlocks';
import { PracticeWorkshopShell } from './PracticeWorkshopShell';

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
        >
            <div className="custom-text-workshop__body">
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

                <div className="custom-text-workshop__footer">
                    <div className="custom-text-workshop__metrics" aria-label={copy.common.currentText}>
                        <span>
                            <small>{copy.common.wordsMode}</small>
                            <strong>{numberFormatter.format(wordCount)}</strong>
                        </span>
                        <span>
                            <small>{copy.common.characterStats}</small>
                            <strong>{numberFormatter.format(characterCount)}</strong>
                        </span>
                    </div>
                    <button type="button" className="action-btn primary" onClick={onApply} disabled={!hasText}>
                        <BadgeCheck aria-hidden="true" size={18} strokeWidth={2.25} />
                        {trainingCopy.practice.customApply}
                    </button>
                </div>
            </div>
        </PracticeWorkshopShell>
    );
}
