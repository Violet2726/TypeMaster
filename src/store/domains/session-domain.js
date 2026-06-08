export function buildSessionDomain({
    currentDraft,
    setCurrentDraft,
    aiPracticeStatus,
    practiceError,
    setPracticeError,
    currentTrainingTask,
    generateAiPractice,
    restoreAiDraftConfig,
    resetPracticeToBuiltin,
    completePractice,
    startDailyChallenge
}) {
    return {
        currentDraft,
        setCurrentDraft,
        aiPracticeStatus,
        practiceError,
        setPracticeError,
        currentTrainingTask,
        generateAiPractice,
        restoreAiDraftConfig,
        resetPracticeToBuiltin,
        completePractice,
        startDailyChallenge
    };
}
