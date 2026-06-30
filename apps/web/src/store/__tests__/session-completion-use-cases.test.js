import { describe, expect, test, vi } from 'vitest';
import {
    publishChallengeAttempt,
    recordGameSessionCompletion,
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
            type: 'mission',
            surface: 'missions',
            intent: 'focus-drill',
            stepId: 'step-1',
            title: 'Reset accuracy'
        });
        expect(session).toMatchObject({
            kind: 'mission',
            intent: 'focus-drill',
            source: 'builtin'
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

    test('records free and adaptive sessions with unified training metadata', () => {
        const environment = createPlanEnvironment({
            activeSessionContext: null,
            trainingPlan: null,
            skillProfile: {
                primaryFocus: 'accuracy'
            },
            currentDraft: {
                sourceTextMeta: {
                    source: 'builtin',
                    label: 'Adaptive accuracy drill',
                    generatedBy: 'adaptive',
                    adaptiveFocus: 'accuracy',
                    adaptiveSourceSessionId: 'session-0'
                }
            }
        });
        const session = recordSessionCompletion(environment, {
            result: {
                wpm: 64,
                rawWpm: 68,
                accuracy: 96,
                consistency: 91,
                correctChars: 100,
                incorrectChars: 2,
                extraChars: 0,
                missedChars: 0,
                durationSeconds: 45,
                errors: 2,
                topErrorChars: ['a'],
                topErrorWords: []
            },
            timeline: {
                samples: []
            }
        });

        expect(session.trainingMeta).toMatchObject({
            type: 'practice',
            surface: 'practice',
            intent: 'adaptive-drill',
            focus: 'accuracy',
            sourceSessionId: 'session-0',
            title: 'Adaptive accuracy drill'
        });
        expect(environment.setActiveSessionContext).toHaveBeenCalledWith(null);
        expect(appendSessionMock).toHaveBeenCalledWith(session);
        expect(session).toMatchObject({
            kind: 'practice',
            intent: 'adaptive-drill'
        });
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

    test('records TypeRift results through the unified session writer', () => {
        const environment = createPlanEnvironment({
            activeSessionContext: null,
            trainingPlan: null
        });

        const session = recordGameSessionCompletion(environment, {
            version: 'typerift-v1',
            mode: 'daily-anomaly',
            score: 12400,
            wpm: 78,
            accuracy: 96,
            durationSeconds: 514,
            depth: 4,
            areaIndex: 3,
            areaId: 'paper-moon',
            areaName: 'Paper Moon',
            areaNameZh: 'Paper Moon',
            maxCombo: 34,
            livesRemaining: 2,
            enemiesDefeated: 86,
            eliteDefeated: 1,
            upgradeBuild: [{ id: 'pulse-lance', nameZh: 'Pulse Lance', stack: 2 }],
            anomalyId: 'mirror-rain',
            codexProgress: { discovered: 6, total: 15 },
            enemiesLeaked: 3,
            totalCharsTyped: 420,
            totalCharsCorrect: 404,
            focusChars: ['r', 't'],
            weakestChars: ['t', '7'],
            endReason: 'extract'
        });

        expect(session.sourceTextMeta).toMatchObject({
            label: 'TypeRift: Echo Siege',
            generatedBy: 'game'
        });
        expect(session.trainingMeta).toMatchObject({
            type: 'game',
            surface: 'game',
            intent: 'daily-anomaly',
            score: 12400,
            depth: 4,
            areaIndex: 3,
            areaId: 'paper-moon',
            durationSeconds: 514,
            enemiesDefeated: 86,
            eliteDefeated: 1,
            endReason: 'extract',
            anomalyId: 'mirror-rain',
            focusChars: ['r', 't']
        });
        expect(session).toMatchObject({
            kind: 'game',
            intent: 'daily-anomaly',
            durationSeconds: 514,
            gameMeta: {
                version: 'typerift-v1',
                depth: 4,
                enemiesDefeated: 86,
                eliteDefeated: 1,
                endReason: 'extract',
                upgradeBuild: [{ id: 'pulse-lance', nameZh: 'Pulse Lance', stack: 2 }],
                anomalyId: 'mirror-rain',
                codexProgress: { discovered: 6, total: 15 }
            }
        });
        expect(session.result).toMatchObject({
            wpm: 78,
            accuracy: 96,
            durationSeconds: 514,
            topErrorChars: ['t', '7']
        });
        expect(appendSessionMock).toHaveBeenCalledTimes(1);
        expect(appendSessionMock).toHaveBeenCalledWith(session);
        expect(saveSessionMock).toHaveBeenCalledWith(session);
        expect(environment.setActiveSessionContext).toHaveBeenCalledWith(null);
    });
});
