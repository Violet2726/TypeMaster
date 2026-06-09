import { describe, expect, test, vi } from 'vitest';
import {
    startDailyChallenge,
    startRecommendedSession
} from '../training-flow-use-cases';

const { getDailyChallengeMock } = vi.hoisted(() => ({
    getDailyChallengeMock: vi.fn()
}));

vi.mock('../../services/api', () => ({
    challengeGateway: {
        getDailyChallenge: getDailyChallengeMock
    }
}));

function createEnvironment(overrides = {}) {
    return {
        activeSessionContext: null,
        aiPracticeStatus: 'idle',
        config: {
            source: 'builtin',
            mode: 'time',
            durationSeconds: 30,
            wordCount: 25,
            includeNumbers: false,
            includePunctuation: false,
            aiTemplate: 'daily',
            difficulty: 'medium'
        },
        currentDraft: null,
        dailyChallengeState: null,
        diagnosticJourney: null,
        settings: {
            language: 'en-US'
        },
        skillProfile: null,
        trainingPlan: null,
        setActiveSessionContext: vi.fn(),
        setAiPracticeStatus: vi.fn(),
        setConfigState: vi.fn(),
        setCurrentDraft: vi.fn(),
        setDailyChallenge: vi.fn(),
        setDiagnosticJourney: vi.fn(),
        setPracticeError: vi.fn(),
        setTrainingPlan: vi.fn(),
        ...overrides
    };
}

function createChallenge() {
    return {
        id: 'challenge-1',
        title: 'Daily challenge',
        summary: 'Shared pressure round.',
        text: 'alpha beta gamma delta',
        config: {
            source: 'builtin',
            mode: 'words',
            wordCount: 3,
            durationSeconds: 60,
            includeNumbers: false,
            includePunctuation: false,
            aiTemplate: 'daily',
            difficulty: 'medium'
        },
        leaderboard: []
    };
}

describe('training flow use cases', () => {
    beforeEach(() => {
        getDailyChallengeMock.mockReset();
    });

    test('starts a diagnostic journey when no skill profile exists', () => {
        const environment = createEnvironment();
        const nextRoute = startRecommendedSession(environment);
        const journey = environment.setDiagnosticJourney.mock.calls[0][0];
        const draft = environment.setCurrentDraft.mock.calls[0][0];

        expect(nextRoute).toBe('diagnostic');
        expect(journey).toMatchObject({
            type: 'diagnostic',
            status: 'active'
        });
        expect(environment.setConfigState).toHaveBeenCalledWith(expect.objectContaining({
            mode: 'time',
            durationSeconds: 60
        }));
        expect(draft.sourceTextMeta.label).toBe('Accuracy baseline');
        expect(environment.setActiveSessionContext).toHaveBeenCalledWith(expect.objectContaining({
            type: 'diagnostic',
            journeyId: journey.id,
            stepId: 'diagnostic-accuracy'
        }));
    });

    test('loads and starts the daily challenge as a bounded draft', async () => {
        const challenge = createChallenge();
        getDailyChallengeMock.mockResolvedValue(challenge);
        const environment = createEnvironment();

        const result = await startDailyChallenge(environment);
        const draft = environment.setCurrentDraft.mock.calls[0][0];

        expect(result).toBe(challenge);
        expect(getDailyChallengeMock).toHaveBeenCalledWith('en-US');
        expect(environment.setDailyChallenge).toHaveBeenCalledWith(challenge);
        expect(environment.setConfigState).toHaveBeenCalledWith(expect.objectContaining({
            mode: 'words',
            wordCount: 3
        }));
        expect(draft.words).toEqual(['alpha', 'beta', 'gamma']);
        expect(draft.sourceTextMeta.label).toBe('Daily challenge');
        expect(environment.setActiveSessionContext).toHaveBeenCalledWith({
            type: 'challenge',
            challengeId: 'challenge-1',
            stepId: 'challenge-1',
            title: 'Daily challenge',
            summary: 'Shared pressure round.'
        });
    });
});
