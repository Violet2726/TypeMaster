/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { getCopy } from '../../i18n';
import ResultPage from '../ResultPage';

const { mockNavigate, mockGetChallengeLeaderboard, mockStore } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockGetChallengeLeaderboard: vi.fn(),
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

const baseStore = {
    copy: getCopy('en-US'),
    language: 'en-US',
    sessions: [challengeSession],
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
    startTrainingPlanStep: vi.fn(),
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
        Object.assign(mockStore, baseStore);
    });

    test('shows challenge standing feedback for challenge sessions', async () => {
        render(<ResultPage />);

        expect(await screen.findByRole('heading', { name: 'Daily challenge standing' })).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
        expect(screen.getByText('Current rank')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'View leaderboard' })).toBeInTheDocument();
        expect(mockGetChallengeLeaderboard).not.toHaveBeenCalled();
    });
});
