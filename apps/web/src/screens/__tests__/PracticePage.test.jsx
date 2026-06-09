/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { getCopy } from '../../i18n';
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
    ConfigPanel: () => <div data-testid="config-panel" />
}));

vi.mock('../../features/practice/components/CustomTextWorkshop', () => ({
    CustomTextWorkshop: () => <div data-testid="custom-workshop" />
}));

vi.mock('../../features/practice/components/TypingArea', () => ({
    TypingArea: ({ status }) => <div data-testid="typing-area">{status}</div>
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
    beforeEach(() => {
        resetMockNavigation();
        setMockNavigation({ route: '/practice' });
        Object.assign(mockStore, baseStore);
        Object.assign(mockTypingSession, idleTypingSession);
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
});
