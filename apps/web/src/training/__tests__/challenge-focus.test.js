import {
    buildChallengeActionModel,
    buildChallengeFocusModel,
    buildChallengeStrategyModel,
    getChallengeFocusNote,
    getChallengeStrategyNote,
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

    test('maps strategy states to training copy', () => {
        expect(getChallengeStrategyNote(trainingCopy, 'idle')).toBe(trainingCopy.challenge.strategyIdle);
        expect(getChallengeStrategyNote(trainingCopy, 'warm')).toBe(trainingCopy.challenge.strategyWarm);
        expect(getChallengeStrategyNote(trainingCopy, 'push')).toBe(trainingCopy.challenge.strategyImproving);
        expect(getChallengeStrategyNote(trainingCopy, 'improving')).toBe(trainingCopy.challenge.strategyImproving);
        expect(getChallengeStrategyNote(trainingCopy, 'cooling')).toBe(trainingCopy.challenge.strategyCooling);
        expect(getChallengeStrategyNote(trainingCopy, 'recover')).toBe(trainingCopy.challenge.strategyRecover);
        expect(getChallengeStrategyNote(trainingCopy, 'unknown')).toBe(trainingCopy.challenge.strategySteady);
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

    test('builds first challenge and retry action labels', () => {
        const firstModel = buildChallengeActionModel(trainingCopy, {
            hasPriorChallenge: false
        });
        const retryModel = buildChallengeActionModel(trainingCopy, {
            hasPriorChallenge: true
        });

        expect(firstModel).toMatchObject({
            primaryAction: 'challenge',
            primaryLabel: trainingCopy.challenge.cta
        });
        expect(retryModel).toMatchObject({
            primaryAction: 'challenge',
            primaryLabel: trainingCopy.challenge.retryCta
        });
    });

    test('keeps recovery labels ahead of loading labels', () => {
        const model = buildChallengeActionModel(trainingCopy, {
            shouldRecover: true,
            hasActiveTrainingStep: true,
            isLoading: true,
            loadingLabel: 'Loading'
        });

        expect(model).toMatchObject({
            shouldRecover: true,
            primaryAction: 'plan',
            primaryLabel: trainingCopy.challenge.recoverPlanCta
        });
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

    test('builds strategy models with notes and actions', () => {
        const pushModel = buildChallengeStrategyModel(trainingCopy, 'push', {
            hasPriorChallenge: true
        });
        const recoverModel = buildChallengeStrategyModel(trainingCopy, 'recover', {
            hasActiveTrainingStep: true,
            hasPriorChallenge: true
        });

        expect(pushModel).toMatchObject({
            state: 'push',
            note: trainingCopy.challenge.strategyImproving,
            primaryAction: 'challenge',
            primaryLabel: trainingCopy.challenge.retryCta
        });
        expect(recoverModel).toMatchObject({
            state: 'recover',
            note: trainingCopy.challenge.strategyRecover,
            shouldRecover: true,
            primaryAction: 'plan',
            primaryLabel: trainingCopy.challenge.recoverPlanCta
        });
    });
});
