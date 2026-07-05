/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react';
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
        expect(screen.getByRole('button', { name: copy.practice.settingsToggle })).toHaveAttribute('aria-expanded', 'false');
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

    test('uses localized duration labels in Chinese', () => {
        const copy = getCopy('zh-CN');

        render(
            <ConfigPanel
                copy={copy}
                language="zh-CN"
                config={baseConfig}
                onConfigChange={vi.fn()}
                showAdvanced={false}
                onToggleAdvanced={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: '30 秒' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.queryByRole('button', { name: '30s' })).not.toBeInTheDocument();
    });

    test('announces the advanced section when expanded', () => {
        const copy = getCopy('en-US');

        render(
            <ConfigPanel
                copy={copy}
                language="en-US"
                config={{
                    ...baseConfig,
                    includePunctuation: true
                }}
                onConfigChange={vi.fn()}
                showAdvanced
                onToggleAdvanced={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: copy.practice.settingsHide })).toHaveAttribute('aria-expanded', 'true');
        const advancedPanel = document.getElementById('practice-config-advanced');
        expect(advancedPanel).not.toBeNull();
        expect(within(advancedPanel).getByRole('button', { name: copy.common.punctuation })).toBeInTheDocument();
    });
});
