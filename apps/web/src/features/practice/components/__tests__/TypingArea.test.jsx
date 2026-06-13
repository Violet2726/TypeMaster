/** @vitest-environment jsdom */
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { getCopy } from '../../../../i18n';
import { TypingArea } from '../TypingArea';

function renderTypingArea(overrides = {}) {
    const copy = getCopy('en-US');
    const props = {
        copy,
        words: [],
        typedHistory: [],
        currentInput: '',
        currentWordIndex: 0,
        isFocused: false,
        status: 'idle',
        liveMetrics: { wpm: 0, accuracy: 100 },
        timerDisplay: '30',
        mode: 'time',
        sourceLabel: copy.practice.sourceAi,
        inputRef: createRef(),
        onInputChange: vi.fn(),
        onKeyDown: vi.fn(),
        onCompositionStart: vi.fn(),
        onCompositionEnd: vi.fn(),
        onFocus: vi.fn(),
        onBlur: vi.fn(),
        onActivate: vi.fn(),
        onReset: vi.fn(),
        isLocked: true,
        lockTitle: copy.practice.wordsLockedTitle,
        lockBody: copy.practice.wordsLockedBody,
        ...overrides
    };

    const result = render(<TypingArea {...props} />);

    return { copy, props, ...result };
}

describe('TypingArea', () => {
    test('shows a preparation panel instead of live scores while text is locked', () => {
        const { container, copy } = renderTypingArea();

        expect(screen.getByText(copy.practice.wordsLockedTitle)).toBeInTheDocument();
        expect(screen.getAllByText(copy.practice.textPendingLabel).length).toBeGreaterThan(0);
        expect(screen.getByText(copy.practice.sourceTitle)).toBeInTheDocument();
        expect(screen.getByText(copy.practice.sessionLabel)).toBeInTheDocument();
        expect(container.querySelector('.typing-empty-state__preflight')).not.toBeNull();
        expect(container.querySelector('.typing-ready-panel')).toBeNull();
        expect(screen.queryByText('100%')).not.toBeInTheDocument();
        expect(screen.queryByText('30')).not.toBeInTheDocument();
        expect(screen.queryByText(copy.common.wpm)).not.toBeInTheDocument();
        expect(screen.queryByText(copy.common.accuracy)).not.toBeInTheDocument();
    });

    test('keeps live metrics visible when text is ready', () => {
        const copy = getCopy('en-US');

        renderTypingArea({
            words: ['steady'],
            liveMetrics: { wpm: 42, accuracy: 96 },
            timerDisplay: '27',
            sourceLabel: copy.practice.sourceBuiltin,
            isLocked: false,
            lockTitle: '',
            lockBody: ''
        });

        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('96%')).toBeInTheDocument();
        expect(screen.getByText('27')).toBeInTheDocument();
        expect(screen.getByText(copy.common.wpm)).toBeInTheDocument();
        expect(screen.getByText(copy.common.accuracy)).toBeInTheDocument();
    });
});
