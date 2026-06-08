/** @vitest-environment jsdom */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { getCopy } from '../../i18n';
import ResultPage from '../ResultPage';

const {
    mockNavigate,
    mockGetChallengeLeaderboard,
    mockResetPracticeToBuiltin,
    mockStartDailyChallenge,
    mockStartTrainingPlanStep,
    mockStore
} = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockGetChallengeLeaderboard: vi.fn(),
    mockResetPracticeToBuiltin: vi.fn(),
    mockStartDailyChallenge: vi.fn(),
    mockStartTrainingPlanStep: vi.fn(),
    mockStore: {}
}));

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [new URLSearchParams('session=session-1')]
    };
});

vi.mock('../../components/TrendChart', () => ({
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
    trainingPlan: null,
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

vi.mock('../../store/practice-store', () => ({
    usePracticeStore: () => mockStore
}));

describe('ResultPage', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mockGetChallengeLeaderboard.mockReset();
        mockResetPracticeToBuiltin.mockReset();
        mockStartDailyChallenge.mockReset();
        mockStartDailyChallenge.mockResolvedValue({ id: 'daily-test' });
        mockStartTrainingPlanStep.mockReset();
        Object.assign(mockStore, baseStore);
    });

    test('shows challenge standing feedback for challenge sessions', async () => {
        render(<ResultPage />);

        expect(await screen.findByRole('heading', { name: 'Daily challenge standing' })).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('Current rank')).toBeInTheDocument();
        expect(screen.getByText('Run focus')).toBeInTheDocument();
        expect(screen.getByText('This run gained speed without giving up accuracy. Keep the challenge pressure on.')).toBeInTheDocument();
        expect(screen.getByText('Vs previous: +8 WPM / 0%')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Retry challenge' }));
        await waitFor(() => expect(mockStartDailyChallenge).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/practice'));
        expect(screen.getByRole('button', { name: 'View leaderboard' })).toBeInTheDocument();
        expect(mockGetChallengeLeaderboard).not.toHaveBeenCalled();
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

        expect(await screen.findByText('Speed may be coming from accuracy leakage. Slow the next run down slightly.')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Back to plan' }));

        expect(mockStartTrainingPlanStep).toHaveBeenCalledTimes(1);
        expect(mockResetPracticeToBuiltin).not.toHaveBeenCalled();
        expect(mockStartDailyChallenge).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/practice');
    });
});
