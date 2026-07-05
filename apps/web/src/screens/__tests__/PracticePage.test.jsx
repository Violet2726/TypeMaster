/** @vitest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react';
import { vi } from 'vitest';
import { getCopy } from '../../i18n';
import { getTrainingCopy } from '../../training/copy';
import PracticePage from '../PracticePage';
import { resetMockNavigation, setMockNavigation } from '../../test/next-navigation';

const {
    mockStore,
    mockTypingSession
} = vi.hoisted(() => ({
    mockStore: {},
    mockTypingSession: {}
}));

vi.mock('../../store/app-state-selectors', () => ({
    usePracticePageStore: () => mockStore
}));

vi.mock('../../hooks/useTypingSession', () => ({
    useTypingSession: () => mockTypingSession
}));

vi.mock('../../features/practice/components/AIWorkshop', () => ({
    AIWorkshop: () => <div data-testid="ai-workshop" />
}));

vi.mock('../../features/practice/components/ConfigPanel', () => ({
    ConfigPanel: ({ config, isCustomComposeMode, language }) => (
        <div
            data-testid="config-panel"
            data-custom-compose-mode={String(Boolean(isCustomComposeMode))}
            data-duration-seconds={String(config.durationSeconds)}
            data-language={language}
            data-mode={config.mode}
        />
    )
}));

vi.mock('../../features/practice/components/CustomTextWorkshop', () => ({
    CustomTextWorkshop: ({ editorRef, value = '', onApply }) => (
        <div data-testid="custom-workshop">
            <textarea aria-label="Custom editor" ref={editorRef} defaultValue={value} />
            <button type="button" onClick={onApply} disabled={!value.trim()}>
                Use this text
            </button>
        </div>
    )
}));

vi.mock('../../features/practice/components/TypingArea', () => ({
    TypingArea: ({
        copy,
        isLocked,
        lockedPrimaryActionDisabled,
        lockedPrimaryActionLabel,
        lockedSecondaryActionLabel,
        onLockedPrimaryAction,
        onLockedSecondaryAction,
        onReset,
        showReset,
        sourceLabel,
        status
    }) => (
        <div data-testid="typing-area" data-locked={String(isLocked)} data-show-reset={String(showReset)}>
            {sourceLabel} {status}
            {showReset && (
                <button type="button" onClick={onReset}>
                    {copy.common.resetRound}
                </button>
            )}
            {lockedPrimaryActionLabel && (
                <button type="button" onClick={onLockedPrimaryAction} disabled={lockedPrimaryActionDisabled}>
                    {lockedPrimaryActionLabel}
                </button>
            )}
            {lockedSecondaryActionLabel && (
                <button type="button" onClick={onLockedSecondaryAction}>
                    {lockedSecondaryActionLabel}
                </button>
            )}
        </div>
    )
}));

const baseSession = {
    id: 'session-1',
    config: {
        source: 'builtin',
        mode: 'words',
        wordCount: 25
    },
    result: {
        wpm: 68,
        rawWpm: 79,
        accuracy: 94,
        consistency: 91,
        durationSeconds: 30,
        correctChars: 120,
        incorrectChars: 2,
        extraChars: 1,
        missedChars: 0,
        completedAt: '2026-06-08T08:00:00.000Z'
    },
    sourceTextMeta: {
        label: 'Built-in',
        source: 'builtin'
    }
};

const baseStore = {
    aiPracticeStatus: 'idle',
    applyCustomWordBank: vi.fn(),
    config: {
        source: 'builtin',
        mode: 'words',
        wordCount: 25,
        durationSeconds: 30,
        includePunctuation: false,
        includeNumbers: false,
        aiTemplate: 'daily',
        difficulty: 'medium'
    },
    copy: getCopy('en-US'),
    currentDraft: {
        id: 'draft-1',
        words: ['steady', 'focus'],
        sourceTextMeta: {
            label: 'Built-in',
            source: 'builtin'
        }
    },
    currentTrainingTask: null,
    generateAiPractice: vi.fn().mockResolvedValue(null),
    language: 'en-US',
    lastCompletedSession: baseSession,
    latestCoachAdvice: {
        id: 'advice-1',
        sessionId: 'session-1',
        nextDrill: {
            reason: 'Clean up the misses before increasing pressure.'
        }
    },
    practiceError: null,
    recordCompletedSession: vi.fn(),
    resetPracticeToBuiltin: vi.fn(),
    restoreAiDraftConfig: vi.fn(),
    settings: {
        customWordBankText: '',
        keyboardLayout: 'qwerty',
        soundEffects: false
    },
    updateConfig: vi.fn()
};

const idleTypingSession = {
    currentInput: '',
    currentWordIndex: 0,
    focusInput: vi.fn(),
    handleBlur: vi.fn(),
    handleCompositionEnd: vi.fn(),
    handleCompositionStart: vi.fn(),
    handleFocus: vi.fn(),
    handleInputChange: vi.fn(),
    handleKeyDown: vi.fn(),
    inputRef: { current: null },
    isFocused: false,
    liveMetrics: { wpm: 0, accuracy: 100 },
    resetSession: vi.fn(),
    status: 'idle',
    timerDisplay: '30s',
    typedHistory: [],
    words: ['steady', 'focus']
};

describe('PracticePage', () => {
    const originalMatchMedia = window.matchMedia;

    function mockViewport(isMobile) {
        window.matchMedia = vi.fn().mockImplementation((query) => ({
            matches: query === '(max-width: 720px)' ? isMobile : false,
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),
            removeListener: vi.fn(),
            dispatchEvent: vi.fn()
        }));
    }

    beforeEach(() => {
        vi.useRealTimers();
        resetMockNavigation();
        setMockNavigation({ route: '/practice' });
        Object.assign(mockStore, baseStore);
        Object.assign(mockTypingSession, idleTypingSession);
        Object.values(mockTypingSession).forEach((value) => {
            if (typeof value?.mockClear === 'function') {
                value.mockClear();
            }
        });
        window.matchMedia = originalMatchMedia;
    });

    afterEach(() => {
        vi.useRealTimers();
        window.matchMedia = originalMatchMedia;
    });

    test('renders the practice context as a lightweight header', () => {
        render(<PracticePage />);

        const heading = screen.getByRole('heading', {
            level: 1,
            name: baseStore.copy.practice.pageTitle
        });
        const context = heading.closest('.practice-context');

        expect(context).not.toBeNull();
        expect(context).not.toHaveClass('panel');
        expect(context?.querySelector('.practice-context__kicker')).toHaveTextContent(baseStore.copy.practice.pageTitle);
        expect(document.querySelector('.practice-hero')).toBeNull();
    });

    test('carries the last result prescription into the next practice setup', () => {
        render(<PracticePage />);

        expect(screen.getByRole('heading', { name: 'Next round brief' })).toBeInTheDocument();
        expect(screen.getByText('Before this round')).toBeInTheDocument();
        expect(screen.getByText('Clean up the misses before increasing pressure.')).toBeInTheDocument();
        expect(screen.getByText('Protect accuracy')).toBeInTheDocument();
        expect(screen.getByText('3 misses to clean up')).toBeInTheDocument();
        expect(screen.getByText('25 words')).toBeInTheDocument();
        expect(screen.getByText('Keep accuracy at or above 96%')).toBeInTheDocument();
    });

    test('keeps the practice surface focused once typing has started', () => {
        Object.assign(mockTypingSession, {
            status: 'running',
            currentInput: 's'
        });

        render(<PracticePage />);

        expect(screen.queryByRole('heading', { name: 'Next round brief' })).not.toBeInTheDocument();
        expect(screen.getByTestId('typing-area')).toHaveTextContent('running');
    });

    test('explains why an adaptive drill was prepared before typing starts', () => {
        Object.assign(mockStore, {
            currentDraft: {
                id: 'adaptive-draft-1',
                words: ['alpha', 'steady'],
                configSnapshot: {
                    ...baseStore.config,
                    mode: 'words',
                    wordCount: 28
                },
                sourceTextMeta: {
                    label: 'Adaptive accuracy drill',
                    source: 'builtin',
                    generatedBy: 'adaptive',
                    template: 'accuracy',
                    adaptiveFocus: 'accuracy',
                    adaptiveHotspots: ['alpha', 'again'],
                    adaptiveMetrics: {
                        accuracy: 92,
                        consistency: 91,
                        missCount: 4,
                        rawGap: 9
                    }
                }
            }
        });

        render(<PracticePage />);

        expect(screen.getByLabelText('Adaptive drill')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Protect accuracy' })).toBeInTheDocument();
        expect(screen.getByText('This text repeats recent misses so the next round can clean up accuracy before adding pressure.')).toBeInTheDocument();
        expect(screen.getByText('92% Accuracy')).toBeInTheDocument();
        expect(screen.getByText('alpha / again')).toBeInTheDocument();
    });

    test('does not auto focus the typing input on mobile before the user starts', () => {
        vi.useFakeTimers();
        mockViewport(true);

        render(<PracticePage />);
        vi.advanceTimersByTime(200);

        expect(mockTypingSession.focusInput).not.toHaveBeenCalled();
    });

    test('keeps desktop auto focus for ready built-in practice text', () => {
        vi.useFakeTimers();
        mockViewport(false);

        render(<PracticePage />);
        vi.advanceTimersByTime(200);

        expect(mockTypingSession.focusInput).toHaveBeenCalledTimes(1);
    });

    test('keeps the typing surface ahead of practice controls in the workbench', () => {
        render(<PracticePage />);

        const typingArea = screen.getByTestId('typing-area');
        const configPanel = screen.getByTestId('config-panel');
        const controlsRail = screen.getByLabelText(baseStore.copy.practice.configTitle);

        expect(controlsRail).toContainElement(configPanel);
        expect(typingArea.compareDocumentPosition(configPanel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    test('keeps the default practice rail to one settings summary', () => {
        render(<PracticePage />);

        const controlsRail = screen.getByLabelText(baseStore.copy.practice.configTitle);

        expect(controlsRail).toContainElement(screen.getByTestId('config-panel'));
        expect(document.querySelector('.practice-toolbar__snapshot')).not.toBeInTheDocument();
    });

    test('does not repeat built-in readiness after the settings summary', () => {
        render(<PracticePage />);

        expect(screen.queryByText('Built-in text is ready. You can start immediately.')).not.toBeInTheDocument();
        expect(document.querySelector('.practice-toolbar__support-note')).not.toBeInTheDocument();
    });

    test('passes Chinese time settings into the practice controls', () => {
        const copy = getCopy('zh-CN');

        Object.assign(mockStore, {
            copy,
            language: 'zh-CN',
            config: {
                ...baseStore.config,
                mode: 'time',
                durationSeconds: 30
            }
        });

        render(<PracticePage />);

        expect(screen.getByTestId('config-panel')).toHaveAttribute('data-language', 'zh-CN');
        expect(screen.getByTestId('config-panel')).toHaveAttribute('data-mode', 'time');
        expect(screen.getByTestId('config-panel')).toHaveAttribute('data-duration-seconds', '30');
        expect(screen.queryByText('30s')).not.toBeInTheDocument();
    });

    test('keeps only one reset action in built-in practice mode', () => {
        render(<PracticePage />);

        expect(screen.getAllByRole('button', { name: baseStore.copy.common.resetRound })).toHaveLength(1);
    });

    test('does not duplicate the start action below the built-in typing surface', () => {
        render(<PracticePage />);

        expect(document.querySelector('.sticky-action-bar')).not.toBeInTheDocument();
        expect(screen.queryByText(baseStore.copy.practice.helperTitle)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: baseStore.copy.common.startTyping })).not.toBeInTheDocument();
    });

    test('shows the custom word bank workshop immediately when custom source is selected', () => {
        Object.assign(mockStore, {
            config: {
                ...baseStore.config,
                source: 'custom'
            },
            currentDraft: null
        });

        render(<PracticePage />);

        expect(screen.getByTestId('custom-workshop')).toBeInTheDocument();
        expect(document.querySelector('.practice-page--compose')).toBeInTheDocument();
        expect(document.querySelector('.practice-workbench--compose')).toBeInTheDocument();
        expect(screen.getByTestId('typing-area')).toHaveAttribute('data-show-reset', 'false');
        expect(screen.getByTestId('config-panel')).toHaveAttribute('data-custom-compose-mode', 'true');
        expect(screen.getByTestId('custom-workshop').compareDocumentPosition(screen.getByTestId('typing-area')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(screen.getByLabelText(baseStore.copy.practice.configTitle)).toContainElement(screen.getByTestId('typing-area'));
        expect(document.querySelector('.practice-toolbar__snapshot')).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: 'Next round brief' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: baseStore.copy.common.resetRound })).not.toBeInTheDocument();
        expect(screen.queryByText(baseStore.copy.practice.helperTitle)).not.toBeInTheDocument();
    });

    test('locks custom practice when the current draft belongs to another source', () => {
        Object.assign(mockStore, {
            config: {
                ...baseStore.config,
                source: 'custom'
            }
        });

        render(<PracticePage />);

        expect(screen.getByTestId('typing-area')).toHaveAttribute('data-locked', 'true');
        expect(screen.getByTestId('typing-area')).toHaveTextContent('Custom bank');
    });

    test('keeps the custom compose action disabled until text exists', () => {
        const trainingCopy = getTrainingCopy('en-US');

        Object.assign(mockStore, {
            config: {
                ...baseStore.config,
                source: 'custom'
            },
            currentDraft: null
        });

        render(<PracticePage />);

        expect(screen.getByRole('button', { name: trainingCopy.practice.customApply })).toBeDisabled();
        expect(screen.queryByText(baseStore.copy.practice.helperTitle)).not.toBeInTheDocument();
    });

    test('lets the locked custom typing surface focus the custom editor first', () => {
        const trainingCopy = getTrainingCopy('en-US');

        Object.assign(mockStore, {
            config: {
                ...baseStore.config,
                source: 'custom'
            },
            currentDraft: null
        });

        render(<PracticePage />);

        const focusButton = screen.getByRole('button', { name: trainingCopy.practice.customFocusEditor });
        expect(focusButton).toBeEnabled();

        fireEvent.click(focusButton);

        expect(screen.getByLabelText('Custom editor')).toHaveFocus();
    });

    test('lets the custom compose action apply a drafted custom word bank', () => {
        const trainingCopy = getTrainingCopy('en-US');
        mockStore.applyCustomWordBank.mockClear();

        Object.assign(mockStore, {
            config: {
                ...baseStore.config,
                source: 'custom'
            },
            currentDraft: null,
            settings: {
                ...baseStore.settings,
                customWordBankText: 'alpha beta'
            }
        });

        render(<PracticePage />);

        const applyButton = within(screen.getByTestId('custom-workshop')).getByRole('button', { name: trainingCopy.practice.customApply });
        expect(applyButton).toBeEnabled();

        fireEvent.click(applyButton);

        expect(mockStore.applyCustomWordBank).toHaveBeenCalledWith('alpha beta');
    });

    test('lets the locked custom typing surface apply drafted text directly', () => {
        const trainingCopy = getTrainingCopy('en-US');
        mockStore.applyCustomWordBank.mockClear();

        Object.assign(mockStore, {
            config: {
                ...baseStore.config,
                source: 'custom'
            },
            currentDraft: null,
            settings: {
                ...baseStore.settings,
                customWordBankText: 'alpha beta'
            }
        });

        render(<PracticePage />);

        fireEvent.click(screen.getAllByRole('button', { name: trainingCopy.practice.customApply })[0]);

        expect(mockStore.applyCustomWordBank).toHaveBeenCalledWith('alpha beta');
        expect(screen.getByRole('button', { name: trainingCopy.practice.customEditText })).toBeEnabled();
    });
});
