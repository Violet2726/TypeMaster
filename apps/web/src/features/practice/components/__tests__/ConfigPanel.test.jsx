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
    test('summarizes primary settings until the panel is expanded', () => {
        const copy = getCopy('en-US');

        const { container } = render(
            <ConfigPanel
                copy={copy}
                language="en-US"
                config={baseConfig}
                onConfigChange={vi.fn()}
                showAdvanced={false}
                onToggleAdvanced={vi.fn()}
            />
        );

        const summary = screen.getByLabelText(copy.practice.configTitle);

        expect(summary).toHaveClass('config-summary-list');
        expect(summary).toHaveTextContent(copy.practice.sourceTitle);
        expect(summary).toHaveTextContent(copy.practice.sourceBuiltin);
        expect(summary).toHaveTextContent(copy.practice.modeTitle);
        expect(summary).toHaveTextContent(copy.common.timeMode);
        expect(summary).toHaveTextContent(copy.practice.volumeTitle);
        expect(summary).toHaveTextContent('30s');
        expect(container.querySelector('.config-settings-list--primary')).toBeNull();
        expect(container.querySelector('.config-control-group')).toBeNull();
        expect(screen.queryByRole('group', { name: copy.practice.sourceTitle })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: copy.practice.settingsToggle })).toHaveAttribute('aria-expanded', 'false');
    });

    test('marks active segmented controls as pressed', () => {
        const copy = getCopy('en-US');

        render(
            <ConfigPanel
                copy={copy}
                language="en-US"
                config={baseConfig}
                onConfigChange={vi.fn()}
                showAdvanced
                onToggleAdvanced={vi.fn()}
            />
        );

        expect(screen.getByRole('button', { name: copy.practice.sourceBuiltin })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: copy.common.timeMode })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: '30s' })).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByRole('button', { name: copy.practice.settingsHide })).toHaveAttribute('aria-expanded', 'true');
    });

    test('marks the custom compose setting panel for responsive density', () => {
        const copy = getCopy('en-US');

        const { container } = render(
            <ConfigPanel
                copy={copy}
                language="en-US"
                config={{
                    ...baseConfig,
                    source: 'custom'
                }}
                isCustomComposeMode
                onConfigChange={vi.fn()}
                showAdvanced={false}
                onToggleAdvanced={vi.fn()}
            />
        );

        const strip = container.querySelector('.config-strip');
        const sourceGroup = screen.getByRole('group', { name: copy.practice.sourceTitle });

        expect(strip).toHaveClass('config-strip--compose');
        expect(sourceGroup).toHaveClass('config-setting-row--source');
        expect(sourceGroup.querySelector('.config-setting-row__value')).toHaveTextContent('Custom bank');
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
                showAdvanced
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
                showAdvanced
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
                showAdvanced
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
        expect(within(advancedPanel).getByRole('switch', { name: copy.common.punctuation })).toBeInTheDocument();
    });

    test('renders advanced options as independent switches', () => {
        const copy = getCopy('en-US');
        const onConfigChange = vi.fn();

        render(
            <ConfigPanel
                copy={copy}
                language="en-US"
                config={{
                    ...baseConfig,
                    includePunctuation: true
                }}
                onConfigChange={onConfigChange}
                showAdvanced
                onToggleAdvanced={vi.fn()}
            />
        );

        const punctuationSwitch = screen.getByRole('switch', { name: copy.common.punctuation });
        const numbersSwitch = screen.getByRole('switch', { name: copy.common.numbers });

        expect(punctuationSwitch).toHaveAttribute('aria-checked', 'true');
        expect(punctuationSwitch).not.toHaveAttribute('aria-pressed');
        expect(numbersSwitch).toHaveAttribute('aria-checked', 'false');
        fireEvent.click(numbersSwitch);

        expect(onConfigChange).toHaveBeenCalledWith({ includeNumbers: true }, { risky: true, intent: 'config' });
    });

    test('scrolls the settings panel into view when expanding controls', () => {
        const copy = getCopy('en-US');
        const originalScrollIntoView = window.HTMLElement.prototype.scrollIntoView;
        const scrollIntoView = vi.fn();
        const requestAnimationFrame = vi
            .spyOn(window, 'requestAnimationFrame')
            .mockImplementation((callback) => {
                callback(0);
                return 1;
            });

        window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

        try {
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

            fireEvent.click(screen.getByRole('button', { name: copy.practice.settingsToggle }));

            expect(scrollIntoView).toHaveBeenCalledWith({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        } finally {
            requestAnimationFrame.mockRestore();
            if (originalScrollIntoView) {
                window.HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
            } else {
                delete window.HTMLElement.prototype.scrollIntoView;
            }
        }
    });
});
