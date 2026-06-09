import { useCallback, useMemo } from 'react';
import {
    applyTrainingTask,
    createOrRefreshTrainingPlan,
    refreshDailyChallenge,
    startDailyChallenge,
    startDiagnosticJourney,
    startRecommendedSession,
    startTrainingPlanStep
} from './training-flow-use-cases';

export function usePlanActionSet(environment) {
    const applyTrainingTaskAction = useCallback((task, context) => (
        applyTrainingTask(environment, task, context)
    ), [environment]);
    const createOrRefreshTrainingPlanAction = useCallback((profile) => (
        createOrRefreshTrainingPlan(environment, profile)
    ), [environment]);
    const refreshDailyChallengeAction = useCallback(() => (
        refreshDailyChallenge(environment)
    ), [environment]);
    const startDailyChallengeAction = useCallback(() => (
        startDailyChallenge(environment)
    ), [environment]);
    const startDiagnosticJourneyAction = useCallback(() => (
        startDiagnosticJourney(environment)
    ), [environment]);
    const startRecommendedSessionAction = useCallback(() => (
        startRecommendedSession(environment)
    ), [environment]);
    const startTrainingPlanStepAction = useCallback(() => (
        startTrainingPlanStep(environment)
    ), [environment]);

    return useMemo(() => ({
        applyTrainingTask: applyTrainingTaskAction,
        createOrRefreshTrainingPlan: createOrRefreshTrainingPlanAction,
        refreshDailyChallenge: refreshDailyChallengeAction,
        startDailyChallenge: startDailyChallengeAction,
        startDiagnosticJourney: startDiagnosticJourneyAction,
        startRecommendedSession: startRecommendedSessionAction,
        startTrainingPlanStep: startTrainingPlanStepAction
    }), [
        applyTrainingTaskAction,
        createOrRefreshTrainingPlanAction,
        refreshDailyChallengeAction,
        startDailyChallengeAction,
        startDiagnosticJourneyAction,
        startRecommendedSessionAction,
        startTrainingPlanStepAction
    ]);
}
