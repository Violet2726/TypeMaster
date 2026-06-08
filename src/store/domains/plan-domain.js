export function buildPlanDomain({
    skillProfile,
    trainingPlan,
    diagnosticJourney,
    dailyChallenge,
    activeTrainingStep,
    activeDiagnosticStep,
    currentTrainingTask,
    trainingPlanProgress,
    startDiagnosticJourney,
    startTrainingPlanStep,
    startRecommendedSession,
    refreshDailyChallenge,
    createOrRefreshTrainingPlan
}) {
    return {
        skillProfile,
        trainingPlan,
        diagnosticJourney,
        dailyChallenge,
        activeTrainingStep,
        activeDiagnosticStep,
        currentTrainingTask,
        trainingPlanProgress,
        startDiagnosticJourney,
        startTrainingPlanStep,
        startRecommendedSession,
        refreshDailyChallenge,
        createOrRefreshTrainingPlan
    };
}
