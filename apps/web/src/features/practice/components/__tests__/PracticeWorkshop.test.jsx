/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { getCopy } from '../../../../i18n';
import { getTrainingCopy } from '../../../../training/copy';
import { AIWorkshop } from '../AIWorkshop';
import { CustomTextWorkshop } from '../CustomTextWorkshop';

const baseConfig = {
    source: 'ai',
    mode: 'time',
    durationSeconds: 30,
    wordCount: 25,
    includePunctuation: false,
    includeNumbers: false,
    aiTemplate: 'daily',
    difficulty: 'medium'
};

describe('Practice workshop panels', () => {
    test('keeps AI workshop generation and template changes wired', () => {
        const copy = getCopy('en-US');
        const onConfigChange = vi.fn();
        const onGenerate = vi.fn();

        render(
            <AIWorkshop
                copy={copy}
                language="en-US"
                config={baseConfig}
                currentDraft={null}
                aiPracticeStatus="idle"
                practiceError={null}
                onConfigChange={onConfigChange}
                onGenerate={onGenerate}
                onRestoreConfig={vi.fn()}
                onUseBuiltin={vi.fn()}
            />
        );

        expect(screen.getByText(copy.common.currentText)).toBeInTheDocument();
        expect(screen.getByText(copy.practice.aiIdle)).toBeInTheDocument();

        fireEvent.change(screen.getByLabelText(copy.practice.templateLabel), {
            target: { value: 'business' }
        });
        fireEvent.click(screen.getByRole('button', { name: copy.common.generateAiText }));

        expect(onConfigChange).toHaveBeenCalledWith({ aiTemplate: 'business', source: 'ai' }, { risky: true, intent: 'config' });
        expect(onGenerate).toHaveBeenCalled();
    });

    test('keeps custom text apply disabled until text exists', () => {
        const copy = getCopy('en-US');
        const trainingCopy = getTrainingCopy('en-US');
        const onApply = vi.fn();

        const { rerender } = render(
            <CustomTextWorkshop
                language="en-US"
                value=""
                onChange={vi.fn()}
                onApply={onApply}
            />
        );

        expect(screen.getByRole('button', { name: trainingCopy.practice.customApply })).toBeDisabled();
        expect(screen.getAllByText(copy.common.aiNeedsGenerate)).toHaveLength(1);
        expect(screen.getAllByText(copy.common.status).length).toBeGreaterThan(0);
        expect(document.querySelector('.custom-text-workshop__summary')).toBeNull();

        rerender(
            <CustomTextWorkshop
                language="en-US"
                value="steady focus rhythm"
                onChange={vi.fn()}
                onApply={onApply}
            />
        );

        expect(screen.getAllByText(copy.common.aiReady)).toHaveLength(1);
        expect(document.querySelector('.custom-text-workshop__summary')).toBeNull();
        expect(screen.getByText(copy.common.wordsMode)).toBeInTheDocument();
        expect(screen.getByText(copy.common.characterStats)).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('19')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: trainingCopy.practice.customApply }));

        expect(onApply).toHaveBeenCalled();
    });
});
