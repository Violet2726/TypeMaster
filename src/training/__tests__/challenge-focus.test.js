import {
    buildChallengeFocusModel,
    getChallengeFocusNote,
    isChallengeFocusRecoveryState
} from '../challenge-focus';
import { getTrainingCopy } from '../copy';

describe('challenge focus model', () => {
    const trainingCopy = getTrainingCopy('en-US');

    test('maps focus states to training copy', () => {
        expect(getChallengeFocusNote(trainingCopy, 'baseline')).toBe(trainingCopy.challenge.trendFocusBaseline);
        expect(getChallengeFocusNote(trainingCopy, 'breakthrough')).toBe(trainingCopy.challenge.trendFocusBreakthrough);
        expect(getChallengeFocusNote(trainingCopy, 'accuracy-risk')).toBe(trainingCopy.challenge.trendFocusAccuracyRisk);
        expect(getChallengeFocusNote(trainingCopy, 'speed-drop')).toBe(trainingCopy.challenge.trendFocusSpeedDrop);
        expect(getChallengeFocusNote(trainingCopy, 'stable')).toBe(trainingCopy.challenge.trendFocusStable);
        expect(getChallengeFocusNote(trainingCopy, 'unknown')).toBe(trainingCopy.challenge.trendFocusMixed);
    });

    test('identifies recovery focus states', () => {
        expect(isChallengeFocusRecoveryState('accuracy-risk')).toBe(true);
        expect(isChallengeFocusRecoveryState('speed-drop')).toBe(true);
        expect(isChallengeFocusRecoveryState('breakthrough')).toBe(false);
        expect(isChallengeFocusRecoveryState('stable')).toBe(false);
    });

    test('builds the healthy challenge action model', () => {
        const model = buildChallengeFocusModel(trainingCopy, 'breakthrough');

        expect(model).toMatchObject({
            state: 'breakthrough',
            shouldRecover: false,
            primaryAction: 'challenge',
            primaryLabel: trainingCopy.challenge.retryCta
        });
    });

    test('builds the loading challenge action model', () => {
        const model = buildChallengeFocusModel(trainingCopy, 'stable', {
            isLoading: true,
            loadingLabel: 'Loading'
        });

        expect(model.primaryAction).toBe('challenge');
        expect(model.primaryLabel).toBe('Loading');
    });

    test('builds recovery action models for plan and free practice', () => {
        const planModel = buildChallengeFocusModel(trainingCopy, 'accuracy-risk', {
            hasActiveTrainingStep: true
        });
        const freeModel = buildChallengeFocusModel(trainingCopy, 'speed-drop');

        expect(planModel).toMatchObject({
            shouldRecover: true,
            primaryAction: 'plan',
            primaryLabel: trainingCopy.challenge.recoverPlanCta
        });
        expect(freeModel).toMatchObject({
            shouldRecover: true,
            primaryAction: 'free',
            primaryLabel: trainingCopy.challenge.recoverFreeCta
        });
    });
});
