/** @vitest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { getCopy } from '../../../../i18n';
import { ConfigPanel } from '../ConfigPanel';

const baseConfig = {
    source: 'builtin',
    mode: 'time',
    durationSeconds: 30,
    wordCount: 25,
    includePunctuation: false,
    includeNumbers: false
};

describe('ConfigPanel', () => {
    test('marks active segmented controls as pressed', () => {
        const copy = getCopy('en-US');

        render(
            <ConfigPanel
                copy={copy}
                language="en-US"
                config={baseConfig}
                onConfigChange={vi.fn()}
                showAdvanced={false}
                onToggleAdvanced={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: copy.practice.sourceBuiltin })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: copy.common.timeMode })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: '30s' })).toHaveAttribute('aria-pressed', 'true');
    });

    test('keeps configuration changes wired through segmented controls', () => {
        const copy = getCopy('en-US');
        const onConfigChange = vi.fn();

        render(
            <ConfigPanel
                copy={copy}
                language="en-US"
                config={baseConfig}
                onConfigChange={onConfigChange}
                showAdvanced={false}
                onToggleAdvanced={vi.fn()}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: copy.common.wordsMode }));

        expect(onConfigChange).toHaveBeenCalledWith({ mode: 'words' }, { risky: true, intent: 'config' });
    });
});
