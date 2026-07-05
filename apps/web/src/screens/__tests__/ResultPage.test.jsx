/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { getCopy } from '../../i18n';
import ResultPage from '../ResultPage';
import { mockRouterPush, resetMockNavigation, setMockNavigation } from '../../test/next-navigation';

const {
    mockGetChallengeLeaderboard,
    mockResetPracticeToBuiltin,
    mockStartDailyChallenge,
    mockStartDiagnosticJourney,
    mockStartTrainingPlanStep,
    mockStore
} = vi.hoisted(() => ({
    mockGetChallengeLeaderboard: vi.fn(),
    mockResetPracticeToBuiltin: vi.fn(),
    mockStartDailyChallenge: vi.fn(),
    mockStartDiagnosticJourney: vi.fn(),
    mockStartTrainingPlanStep: vi.fn(),
    mockStore: {}
}));

vi.mock('../../features/result/components/TrendChart', () => ({
    TrendChart: () => <div data-testid="trend-chart" />
}));

const challengeSession = {
    id: 'session-1',
    config: {
        source: 'builtin',
        mode: 'words',
        wordCount: 10
    },
    result: {
        wpm: 82,
        rawWpm: 88,
        accuracy: 98,
        consistency: 95,
        durationSeconds: 12,
        correctChars: 48,
        incorrectChars: 1,
        extraChars: 0,
        missedChars: 0,
        completedAt: '2026-06-08T08:00:00.000Z'
    },
    timeline: {
        labels: [],
        wpm: [],
        raw: [],
        accuracy: [],
        burst: [],
        errors: [],
        samples: [],
        pauseMoments: []
    },
    sourceTextMeta: {
        label: 'Daily challenge',
        source: 'builtin'
    },
    trainingMeta: {
        type: 'challenge',
        stepId: 'daily-test',
        title: 'Daily challenge'
    }
};

const previousChallengeSession = {
    id: 'session-previous',
    config: {
        source: 'builtin',
        mode: 'words',
        wordCount: 10
    },
    result: {
        wpm: 74,
        rawWpm: 80,
        accuracy: 98,
        consistency: 92,
        durationSeconds: 12,
        correctChars: 47,
        incorrectChars: 1,
        extraChars: 0,
        missedChars: 0,
        completedAt: '2026-06-08T07:30:00.000Z'
    },
    timeline: {
        labels: [],
        wpm: [],
        raw: [],
        accuracy: [],
        burst: [],
        errors: [],
        samples: [],
        pauseMoments: []
    },
    sourceTextMeta: {
        label: 'Daily challenge',
        source: 'builtin'
    },
    trainingMeta: {
        type: 'challenge',
        stepId: 'daily-test',
        title: 'Daily challenge'
    }
};

const adaptiveSession = {
    ...challengeSession,
    id: 'session-adaptive',
    sourceTextMeta: {
        label: 'Adaptive accuracy drill',
        source: 'builtin',
        generatedBy: 'adaptive',
        adaptiveFocus: 'accuracy',
        adaptiveHotspots: ['alpha', 'again'],
        adaptiveTargetChars: ['a'],
        adaptiveTargetWords: ['alpha'],
        adaptiveBaselineCount: 5
    },
    trainingMeta: null,
    result: {
        ...challengeSession.result,
        topErrorChars: ['a'],
        topErrorWords: ['alpha'],
        errorCharStats: [{ label: 'a', count: 1 }],
        errorWordStats: [{ label: 'alpha', count: 1 }]
    }
};

const keyboardZoneSession = {
    ...challengeSession,
    id: 'session-keyboard-zone',
    sourceTextMeta: {
        label: 'Left hand / home row reset',
        source: 'builtin',
        generatedBy: 'keyboard-zone',
        keyboardZone: 'leftHome',
        keyboardLayout: 'qwerty',
        keyboardZoneChars: ['a', 's', 'd'],
        keyboardZoneShare: 56
    },
    trainingMeta: null,
    result: {
        ...challengeSession.result,
        errorCharStats: [
            { label: 'a', count: 1 },
            { label: 's', count: 1 },
            { label: 'k', count: 1 },
            { label: '.', count: 1 }
        ]
    }
};

const baseStore = {
    copy: getCopy('en-US'),
    language: 'en-US',
    sessions: [challengeSession, previousChallengeSession],
    lastCompletedSession: challengeSession,
    getAdviceForSession: () => ({
        headline: 'Hold this pace',
        summary: 'Keep the same pressure next round.',
        nextDrill: null
    }),
    getCoachStatusForSession: () => 'success',
    getCoachIssueForSession: () => null,
    generateCoachForSession: vi.fn().mockResolvedValue(null),
    launchNextDrill: vi.fn().mockResolvedValue(null),
    activeTrainingStep: null,
    activeDiagnosticStep: null,
    trainingPlan: null,
    startDiagnosticJourney: mockStartDiagnosticJourney,
    startTrainingPlanStep: mockStartTrainingPlanStep,
    resetPracticeToBuiltin: mockResetPracticeToBuiltin,
    startDailyChallenge: mockStartDailyChallenge,
    dailyChallenge: {
        id: 'daily-test',
        leaderboard: [
            {
                id: 'entry-rival',
                sessionId: 'session-rival',
                displayName: 'Rival',
                userId: 'user-2',
                wpm: 90,
                accuracy: 99,
                createdAt: '2026-06-08T07:50:00.000Z'
            },
            {
                id: 'entry-self',
                sessionId: 'session-1',
                displayName: 'Alice',
                userId: 'user-1',
                wpm: 82,
                accuracy: 98,
                createdAt: '2026-06-08T08:00:00.000Z'
            }
        ]
    },
    challengeGateway: {
        getChallengeLeaderboard: mockGetChallengeLeaderboard
    }
};

vi.mock('../../store/app-state-selectors', () => ({
    useResultPageStore: () => mockStore
}));

describe('ResultPage', () => {
    beforeEach(() => {
        resetMockNavigation();
        setMockNavigation({ route: '/result?session=session-1' });
        mockGetChallengeLeaderboard.mockReset();
        mockResetPracticeToBuiltin.mockReset();
        mockStartDailyChallenge.mockReset();
        mockStartDailyChallenge.mockResolvedValue({ id: 'daily-test' });
        mockStartDiagnosticJourney.mockReset();
        mockStartTrainingPlanStep.mockReset();
        Object.assign(mockStore, baseStore);
    });

    test('shows a recovery-focused empty state before the first result', () => {
        Object.assign(mockStore, {
            ...baseStore,
            sessions: [],
            lastCompletedSession: null,
            dailyChallenge: null
        });
        setMockNavigation({ route: '/result' });

        render(<ResultPage />);

        expect(screen.getByRole('heading', { name: 'No result to show yet' })).toBeInTheDocument();
        expect(screen.getByLabelText('Key metrics')).toBeInTheDocument();
        expect(screen.getByText('Next focus')).toBeInTheDocument();
        expect(screen.getByText('Try another round')).toBeInTheDocument();
        expect(screen.getByText('Accuracy')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Go practice' }));

        expect(mockRouterPush).toHaveBeenCalledWith('/practice');
    });

    test('shows challenge standing feedback for challenge sessions', async () => {
        render(<ResultPage />);

        expect(screen.getByRole('heading', { name: 'Push the board again' })).toBeInTheDocument();
        expect(screen.getByText('Today\'s challenge trend is still worth one more push.')).toBeInTheDocument();
        expect(screen.getByText('Next round brief')).toBeInTheDocument();
        expect(screen.getByText('Add controlled speed')).toBeInTheDocument();
        expect(screen.getByText('10 words')).toBeInTheDocument();
        expect(await screen.findByRole('heading', { name: 'Daily challenge standing' })).toBeInTheDocument();
        expect(screen.getByText('82 WPM / 98%')).toBeInTheDocument();
        expect(screen.getAllByText('#2/2').length).toBeGreaterThan(0);
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('Current rank')).toBeInTheDocument();
        expect(screen.getByText('Run focus')).toBeInTheDocument();
        expect(screen.getByText('This run gained speed without giving up accuracy. Keep the challenge pressure on.')).toBeInTheDocument();
        expect(screen.getByText('Vs previous: +8 WPM / 0%')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Retry challenge' }));
        await waitFor(() => expect(mockStartDailyChallenge).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/practice'));
        expect(screen.getByRole('button', { name: 'View leaderboard' })).toBeInTheDocument();
        expect(mockGetChallengeLeaderboard).not.toHaveBeenCalled();
    });

    test('uses localized duration labels in Chinese result metrics', () => {
        Object.assign(mockStore, {
            ...baseStore,
            copy: getCopy('zh-CN'),
            language: 'zh-CN',
            sessions: [challengeSession],
            lastCompletedSession: challengeSession,
            dailyChallenge: null
        });

        render(<ResultPage />);

        expect(screen.getAllByText('12 秒').length).toBeGreaterThan(0);
        expect(screen.queryByText('12s')).not.toBeInTheDocument();
    });

    test('routes risk-focused challenge results back into the active plan', async () => {
        Object.assign(mockStore, {
            ...baseStore,
            sessions: [
                {
                    ...challengeSession,
                    result: {
                        ...challengeSession.result,
                        wpm: 80,
                        accuracy: 92
                    }
                },
                previousChallengeSession
            ],
            lastCompletedSession: {
                ...challengeSession,
                result: {
                    ...challengeSession.result,
                    wpm: 80,
                    accuracy: 92
                }
            },
            activeTrainingStep: {
                id: 'starter-day-1',
                title: 'Reset accuracy'
            },
            dailyChallenge: {
                ...baseStore.dailyChallenge,
                leaderboard: [
                    {
                        id: 'entry-self',
                        sessionId: 'session-1',
                        displayName: 'Alice',
                        userId: 'user-1',
                        wpm: 80,
                        accuracy: 92,
                        createdAt: '2026-06-08T08:00:00.000Z'
                    }
                ]
            }
        });

        render(<ResultPage />);

        expect(screen.getByRole('heading', { name: 'Return to the plan now' })).toBeInTheDocument();
        expect(screen.getByText('Leaderboard pressure is starting to reduce training quality.')).toBeInTheDocument();
        expect(await screen.findByText('Speed may be coming from accuracy leakage. Slow the next run down slightly.')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Back to plan' }));

        expect(mockStartTrainingPlanStep).toHaveBeenCalledTimes(1);
        expect(mockResetPracticeToBuiltin).not.toHaveBeenCalled();
        expect(mockStartDailyChallenge).not.toHaveBeenCalled();
        expect(mockRouterPush).toHaveBeenCalledWith('/practice');
    });

    test('promotes the next planned drill as the result decision', () => {
        const planSession = {
            ...challengeSession,
            trainingMeta: {
                type: 'plan',
                stepId: 'starter-day-1',
                title: 'Reset accuracy'
            },
            sourceTextMeta: {
                label: 'Reset accuracy',
                source: 'builtin'
            }
        };

        Object.assign(mockStore, {
            ...baseStore,
            sessions: [planSession],
            lastCompletedSession: planSession,
            activeTrainingStep: {
                id: 'starter-day-2',
                title: 'Lock the rhythm',
                summary: 'Shorten the round and focus on smooth output.'
            },
            dailyChallenge: null
        });

        render(<ResultPage />);

        expect(screen.getByRole('heading', { name: 'Continue the training line' })).toBeInTheDocument();
        expect(screen.getByText('Shorten the round and focus on smooth output.')).toBeInTheDocument();
        expect(screen.getByText('Lock the rhythm')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Continue plan' }));

        expect(mockStartTrainingPlanStep).toHaveBeenCalledTimes(1);
        expect(mockStartDailyChallenge).not.toHaveBeenCalled();
        expect(mockRouterPush).toHaveBeenCalledWith('/practice');
    });

    test('shows targeted feedback for adaptive drills', () => {
        Object.assign(mockStore, {
            ...baseStore,
            sessions: [adaptiveSession, previousChallengeSession],
            lastCompletedSession: adaptiveSession,
            dailyChallenge: null
        });
        setMockNavigation({ route: '/result?session=session-adaptive' });

        render(<ResultPage />);

        expect(screen.getByRole('heading', { name: 'Targeted feedback' })).toBeInTheDocument();
        expect(screen.getByText('Still improving')).toBeInTheDocument();
        expect(screen.getByText('The targeted misses are shrinking, but a few are still shaping the round.')).toBeInTheDocument();
        expect(screen.getByText('Protect accuracy')).toBeInTheDocument();
        expect(screen.getByText('2 now / 5 before')).toBeInTheDocument();
        expect(screen.getByText('alpha / a')).toBeInTheDocument();
    });

    test('shows targeted feedback for keyboard-zone drills', () => {
        Object.assign(mockStore, {
            ...baseStore,
            sessions: [keyboardZoneSession, previousChallengeSession],
            lastCompletedSession: keyboardZoneSession,
            dailyChallenge: null
        });
        setMockNavigation({ route: '/result?session=session-keyboard-zone' });

        render(<ResultPage />);

        expect(screen.getByRole('heading', { name: 'Targeted feedback' })).toBeInTheDocument();
        expect(screen.getByText('Still improving')).toBeInTheDocument();
        expect(screen.getByText('Pressure in this zone is lower than the hotspot that triggered the drill, but it is not gone yet.')).toBeInTheDocument();
        expect(screen.getByText('Left hand / home row')).toBeInTheDocument();
        expect(screen.getByText('50% now / 56% before')).toBeInTheDocument();
        expect(screen.getByText('a / s')).toBeInTheDocument();
    });

    test('promotes reassessment when a training plan has just completed', () => {
        const completedPlanSession = {
            ...challengeSession,
            trainingMeta: {
                type: 'plan',
                stepId: 'starter-day-7',
                title: 'Review checkpoint'
            },
            sourceTextMeta: {
                label: 'Review checkpoint',
                source: 'builtin'
            }
        };

        Object.assign(mockStore, {
            ...baseStore,
            sessions: [completedPlanSession],
            lastCompletedSession: completedPlanSession,
            activeTrainingStep: null,
            trainingPlan: {
                id: 'plan-1',
                status: 'complete',
                steps: []
            },
            dailyChallenge: null
        });
        setMockNavigation({ route: '/result?session=session-1' });

        render(<ResultPage />);

        expect(screen.getByRole('heading', { name: 'Reassess for the next phase' })).toBeInTheDocument();
        expect(screen.getByText('The starter plan has done its job. Run three fresh assessment rounds and the app will build the next phase from your current state.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Start reassessment' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Start reassessment' }));

        expect(mockStartDiagnosticJourney).toHaveBeenCalledTimes(1);
        expect(mockStartTrainingPlanStep).not.toHaveBeenCalled();
        expect(mockRouterPush).toHaveBeenCalledWith('/practice');
    });
});
