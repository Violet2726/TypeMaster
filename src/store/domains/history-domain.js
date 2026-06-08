export function buildHistoryDomain({
    sessions,
    coachAdviceRecords,
    lastCompletedSession,
    latestCoachAdvice,
    latestComparison,
    getAdviceForSession,
    getCoachStatusForSession,
    getCoachIssueForSession,
    generateCoachForSession,
    launchNextDrill,
    buildLocalCoachAdvice
}) {
    return {
        sessions,
        coachAdviceRecords,
        lastCompletedSession,
        latestCoachAdvice,
        latestComparison,
        getAdviceForSession,
        getCoachStatusForSession,
        getCoachIssueForSession,
        generateCoachForSession,
        launchNextDrill,
        buildLocalCoachAdvice
    };
}
