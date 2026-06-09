import { describe, expect, test, vi } from 'vitest';
import {
    publishChallengeAttempt,
    recordSessionCompletion,
    resolveSessionCompletionContext
} from '../session-completion-use-cases';

const { appendSessionMock, saveSessionMock, submitChallengeResultMock } = vi.hoisted(() => ({
    appendSessionMock: vi.fn((session) => [session]),
    saveSessionMock: vi.fn(() => Promise.resolve({ status: 'synced' })),
    submitChallengeResultMock: vi.fn(() => Promise.resolve({ id: 'entry-1' }))
}));

vi.mock('../../services/storage', () => ({
    appendSession: appendSessionMock
}));

vi.mock('../../services/api', () => ({
    sessionGateway: {
        saveSession: saveSessionMock
    },
    challengeGateway: {
        submitChallengeResult: submitChallengeResultMock
    }
}));

function createPlanEnvironment(overrides = {}) {
    const plan = {
        id: 'plan-1',
        title: 'Starter plan',
        summary: 'Plan summary',
        status: 'active',
        currentStepIndex: 0,
        steps: [
            {
                id: 'step-1',
                title: 'Reset accuracy',
                summary: 'Round summary',
                status: 'pending',
                config: {
                    source: 'builtin',
                    mode: 'words',
                    durationSeconds: 60,
                    wordCount: 10,
                    includeNumbers: false,
                    includePunctuation: false,
                    aiTemplate: 'daily',
                    difficulty: 'easy'
                }
            }
        ]
    };

    return {
        account: null,
        activeSessionContext: {
            type: 'plan',
            planId: 'plan-1',
            stepId: 'step-1'
        },
        config: plan.steps[0].config,
        currentDraft: {
            sourceTextMeta: {
                source: 'builtin',
                label: 'Built-in word bank'
            }
        },
        dailyChallengeState: null,
        diagnosticJourney: null,
        settings: {
            language: 'en-US'
        },
        skillProfile: null,
        trainingPlan: plan,
        setActiveSessionContext: vi.fn(),
        setDailyChallenge: vi.fn(),
        setDiagnosticJourney: vi.fn(),
        setLastCompletedSession: vi.fn(),
        setSessions: vi.fn(),
        setSkillProfile: vi.fn(),
        setTrainingPlan: vi.fn(),
        ...overrides
    };
}

describe('session completion use cases', () => {
    beforeEach(() => {
        appendSessionMock.mockClear();
        saveSessionMock.mockClear();
        submitChallengeResultMock.mockClear();
    });

    test('resolves the active plan step as the completion context', () => {
        const environment = createPlanEnvironment();

        expect(resolveSessionCompletionContext(environment)).toMatchObject({
            type: 'plan',
            task: {
                id: 'step-1',
                title: 'Reset accuracy'
            }
        });
    });

    test('records a completed plan session and advances the plan use case', () => {
        const environment = createPlanEnvironment();
        const session = recordSessionCompletion(environment, {
            result: {
                wpm: 72,
                rawWpm: 76,
                accuracy: 97,
                consistency: 90,
                correctChars: 120,
                incorrectChars: 2,
                extraChars: 0,
                missedChars: 1,
                durationSeconds: 60,
                errors: 3,
                topErrorChars: [],
                topErrorWords: []
            },
            timeline: {
                samples: []
            }
        });

        expect(session.trainingMeta).toMatchObject({
            type: 'plan',
            stepId: 'step-1',
            title: 'Reset accuracy'
        });
        expect(appendSessionMock).toHaveBeenCalledWith(session);
        expect(environment.setSessions).toHaveBeenCalledWith([session]);
        expect(environment.setLastCompletedSession).toHaveBeenCalledWith(session);
        expect(environment.setActiveSessionContext).toHaveBeenCalledWith(null);
        expect(environment.setTrainingPlan).toHaveBeenCalledWith(expect.objectContaining({
            status: 'complete',
            steps: [
                expect.objectContaining({
                    id: 'step-1',
                    status: 'complete',
                    completedSessionId: session.id
                })
            ]
        }));
        expect(saveSessionMock).toHaveBeenCalledWith(session);
        expect(submitChallengeResultMock).not.toHaveBeenCalled();
    });

    test('does not submit a challenge result without a resolved challenge id', () => {
        const environment = createPlanEnvironment({
            activeSessionContext: {
                type: 'challenge'
            }
        });
        const handled = publishChallengeAttempt(
            environment,
            {
                id: 'session-1',
                result: {
                    wpm: 72,
                    accuracy: 97
                }
            },
            {
                type: 'challenge',
                task: null
            }
        );

        expect(handled).toBe(true);
        expect(environment.setActiveSessionContext).toHaveBeenCalledWith(null);
        expect(environment.setDailyChallenge).not.toHaveBeenCalled();
        expect(submitChallengeResultMock).not.toHaveBeenCalled();
    });
});
