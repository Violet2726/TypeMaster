import { getCopy } from '../../i18n';
import {
    buildHomeDecisionModel,
    buildResultDecisionModel,
    buildResultPrescriptionModel,
    pickChallengeDecisionModel
} from '../decision-models';
import { getTrainingCopy } from '../copy';

describe('decision-models', () => {
    const copy = getCopy('en-US');
    const trainingCopy = getTrainingCopy('en-US');

    test('prefers challenge recovery over challenge push', () => {
        const model = pickChallengeDecisionModel(
            {
                state: 'recover',
                shouldRecover: true,
                primaryAction: 'plan',
                primaryLabel: 'Back to plan'
            },
            {
                state: 'breakthrough',
                shouldRecover: false,
                primaryAction: 'challenge',
                primaryLabel: 'Retry challenge'
            }
        );

        expect(model).toMatchObject({
            primaryAction: 'plan',
            primaryLabel: 'Back to plan'
        });
    });

    test('builds a challenge-led home decision when the latest session was the daily challenge', () => {
        const model = buildHomeDecisionModel({
            copy,
            trainingCopy,
            skillProfile: {
                level: { label: 'Builder' },
                summary: 'Your next phase should focus on reinforcing accuracy.'
            },
            activeTrainingStep: {
                id: 'starter-day-1',
                title: 'Reset accuracy',
                summary: 'Use a mid-length round to bring hit rate back under control.'
            },
            activeDiagnosticStep: null,
            hasDiagnosticInFlight: false,
            latestSession: {
                trainingMeta: { type: 'challenge', stepId: 'daily-test' }
            },
            dailyChallengeId: 'daily-test',
            challengeDecisionModel: {
                primaryAction: 'challenge',
                primaryLabel: 'Retry challenge'
            },
            trainingPlan: { id: 'plan-1' }
        });

        expect(model).toMatchObject({
            context: 'challenge',
            headline: 'Push the board again',
            primaryAction: 'challenge',
            primaryLabel: 'Retry challenge'
        });
    });

    test('builds a recovery home decision when the latest challenge should route back to plan work', () => {
        const model = buildHomeDecisionModel({
            copy,
            trainingCopy,
            skillProfile: {
                level: { label: 'Builder' },
                summary: 'Your next phase should focus on reinforcing accuracy.'
            },
            activeTrainingStep: {
                id: 'starter-day-1',
                title: 'Reset accuracy',
                summary: 'Use a mid-length round to bring hit rate back under control.'
            },
            activeDiagnosticStep: null,
            hasDiagnosticInFlight: false,
            latestSession: {
                trainingMeta: { type: 'challenge', stepId: 'daily-test' }
            },
            dailyChallengeId: 'daily-test',
            challengeDecisionModel: {
                primaryAction: 'plan',
                primaryLabel: 'Back to plan'
            },
            trainingPlan: { id: 'plan-1' }
        });

        expect(model).toMatchObject({
            context: 'challenge',
            headline: 'Return to the plan now',
            primaryAction: 'plan',
            primaryLabel: 'Back to plan'
        });
    });

    test('builds a plan-led result decision for active training steps', () => {
        const model = buildResultDecisionModel({
            copy,
            trainingCopy,
            session: {
                trainingMeta: { type: 'plan' }
            },
            advice: {
                headline: 'Hold this pace',
                body: 'Keep the same pressure next round.'
            },
            coachRecord: null,
            activeTrainingStep: {
                id: 'starter-day-2',
                title: 'Lock the rhythm',
                summary: 'Shorten the round and focus on smooth output.'
            },
            activeDiagnosticStep: null,
            trainingPlan: { status: 'active' },
            isChallengeSession: false,
            challengeDecisionModel: null,
            nextDrillState: 'idle'
        });

        expect(model).toMatchObject({
            context: 'plan',
            headline: 'Continue the training line',
            signal: 'Lock the rhythm',
            primaryAction: 'plan'
        });
    });

    test('builds an accuracy-first prescription when a result leaks errors', () => {
        const model = buildResultPrescriptionModel({
            copy,
            coachRecord: null,
            session: {
                config: {
                    mode: 'words',
                    wordCount: 30
                },
                result: {
                    wpm: 64,
                    rawWpm: 75,
                    accuracy: 93,
                    consistency: 91,
                    incorrectChars: 3,
                    extraChars: 1,
                    missedChars: 2
                },
                sourceTextMeta: {
                    label: 'Built-in'
                }
            }
        });

        expect(model).toMatchObject({
            title: 'Next round brief',
            items: [
                {
                    id: 'focus',
                    tone: 'error',
                    value: 'Protect accuracy',
                    note: '6 misses to clean up'
                },
                {
                    id: 'dose',
                    value: '30 words',
                    note: 'Built-in'
                },
                {
                    id: 'checkpoint',
                    value: 'Keep accuracy at or above 95%'
                }
            ]
        });
    });
});
