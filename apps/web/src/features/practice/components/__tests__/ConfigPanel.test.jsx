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
    test('organizes primary settings as named control groups', () => {
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

        const sourceGroup = screen.getByRole('group', { name: copy.practice.sourceTitle });
        const modeGroup = screen.getByRole('group', { name: copy.practice.modeTitle });
        const volumeGroup = screen.getByRole('group', { name: copy.practice.volumeTitle });

        expect(sourceGroup).toHaveClass('config-control-group', 'config-control-group--source');
        expect(modeGroup).toHaveClass('config-control-group', 'config-control-group--mode');
        expect(volumeGroup).toHaveClass('config-control-group', 'config-control-group--volume');
        expect(within(sourceGroup).getAllByRole('button')).toHaveLength(3);
        expect(within(modeGroup).getAllByRole('button')).toHaveLength(2);
        expect(within(volumeGroup).getAllByRole('button')).toHaveLength(4);
    });

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

    test('keeps custom training volumes selected in the compact option set', () => {
        const copy = getCopy('en-US');

        render(
            <ConfigPanel
                copy={copy}
                language="en-US"
                config={{
                    ...baseConfig,
                    mode: 'words',
                    wordCount: 28
                }}
                onConfigChange={vi.fn()}
                showAdvanced={false}
                onToggleAdvanced={vi.fn()}
            />
        );

        const volumeGroup = screen.getByRole('group', { name: copy.practice.volumeTitle });

        expect(screen.getByRole('button', { name: '28' })).toHaveAttribute('aria-pressed', 'true');
        expect(within(volumeGroup).getAllByRole('button')).toHaveLength(4);
        expect(within(volumeGroup).queryByRole('button', { name: '25' })).not.toBeInTheDocument();
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
