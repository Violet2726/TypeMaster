import { challengeGateway } from '../services/api';
import { useAppActions } from './use-app-action-set';
import {
    useAccountSnapshot,
    useAchievementSnapshot,
    useHistorySnapshot,
    usePlanSnapshot,
    useRuntimeSnapshot,
    useShellSnapshot
} from './app-state-derived';

export function useAppShellStore() {
    const shell = useShellSnapshot();
    const plan = usePlanSnapshot();
    const accountState = useAccountSnapshot();
    const { accountActions } = useAppActions();

    return {
        account: accountState.account,
        accountStatus: accountState.accountStatus,
        copy: shell.copy,
        exportTrainingData: accountActions.exportTrainingData,
        importTrainingData: accountActions.importTrainingData,
        settings: shell.settings,
        signInToAccount: accountActions.signInToAccount,
        signOutFromAccount: accountActions.signOutFromAccount,
        trainingPlan: plan.trainingPlan,
        updateSettings: shell.updateSettings
    };
}

export function useHomePageStore() {
    const shell = useShellSnapshot();
    const runtime = useRuntimeSnapshot();
    const plan = usePlanSnapshot();
    const history = useHistorySnapshot();
    const achievements = useAchievementSnapshot();
    const { planActions, sessionActions } = useAppActions();

    return {
        activeDiagnosticStep: plan.activeDiagnosticStep,
        activeTrainingStep: plan.activeTrainingStep,
        achievements: achievements.achievements,
        config: runtime.config,
        copy: shell.copy,
        dailyChallenge: plan.dailyChallenge,
        diagnosticJourney: plan.diagnosticJourney,
        language: shell.language,
        resetPracticeToBuiltin: sessionActions.resetPracticeToBuiltin,
        sessionStreak: achievements.sessionStreak,
        sessions: history.sessions,
        skillProfile: plan.skillProfile,
        startDailyChallenge: planActions.startDailyChallenge,
        startDiagnosticJourney: planActions.startDiagnosticJourney,
        startTrainingPlanStep: planActions.startTrainingPlanStep,
        trainingPlan: plan.trainingPlan,
        trainingPlanProgress: plan.trainingPlanProgress,
        weeklyGoal: achievements.weeklyGoal
    };
}

export function useChallengePageStore() {
    const shell = useShellSnapshot();
    const accountState = useAccountSnapshot();
    const plan = usePlanSnapshot();
    const history = useHistorySnapshot();
    const { planActions } = useAppActions();

    return {
        account: accountState.account,
        challengeGateway,
        copy: shell.copy,
        dailyChallenge: plan.dailyChallenge,
        language: shell.language,
        refreshDailyChallenge: planActions.refreshDailyChallenge,
        sessions: history.sessions,
        skillProfile: plan.skillProfile,
        startDailyChallenge: planActions.startDailyChallenge
    };
}

export function useResultPageStore() {
    const shell = useShellSnapshot();
    const plan = usePlanSnapshot();
    const history = useHistorySnapshot();
    const { historyActions, planActions, sessionActions } = useAppActions();

    return {
        activeDiagnosticStep: plan.activeDiagnosticStep,
        activeTrainingStep: plan.activeTrainingStep,
        challengeGateway,
        copy: shell.copy,
        dailyChallenge: plan.dailyChallenge,
        generateCoachForSession: historyActions.generateCoachForSession,
        getAdviceForSession: historyActions.getAdviceForSession,
        getCoachIssueForSession: historyActions.getCoachIssueForSession,
        getCoachStatusForSession: historyActions.getCoachStatusForSession,
        language: shell.language,
        lastCompletedSession: history.lastCompletedSession,
        launchNextDrill: historyActions.launchNextDrill,
        resetPracticeToBuiltin: sessionActions.resetPracticeToBuiltin,
        sessions: history.sessions,
        startDailyChallenge: planActions.startDailyChallenge,
        startDiagnosticJourney: planActions.startDiagnosticJourney,
        startTrainingPlanStep: planActions.startTrainingPlanStep,
        trainingPlan: plan.trainingPlan
    };
}

export function useInsightsPageStore() {
    const shell = useShellSnapshot();
    const plan = usePlanSnapshot();
    const history = useHistorySnapshot();
    const achievements = useAchievementSnapshot();

    return {
        achievements: achievements.achievements,
        copy: shell.copy,
        keyboardLayout: shell.settings.keyboardLayout,
        language: shell.language,
        latestCoachAdvice: history.latestCoachAdvice,
        sessions: history.sessions,
        sessionStreak: achievements.sessionStreak,
        skillProfile: plan.skillProfile,
        weeklyGoal: achievements.weeklyGoal,
        weeklySessions: achievements.weeklySessions
    };
}

export function useDiagnosticPageStore() {
    const shell = useShellSnapshot();
    const plan = usePlanSnapshot();
    const { planActions } = useAppActions();

    return {
        diagnosticJourney: plan.diagnosticJourney,
        language: shell.language,
        skillProfile: plan.skillProfile,
        startDiagnosticJourney: planActions.startDiagnosticJourney
    };
}

export function useTrainingPlanPageStore() {
    const shell = useShellSnapshot();
    const plan = usePlanSnapshot();
    const { planActions } = useAppActions();

    return {
        language: shell.language,
        startTrainingPlanStep: planActions.startTrainingPlanStep,
        trainingPlan: plan.trainingPlan,
        trainingPlanProgress: plan.trainingPlanProgress
    };
}

export function usePracticePageStore() {
    const shell = useShellSnapshot();
    const runtime = useRuntimeSnapshot();
    const plan = usePlanSnapshot();
    const history = useHistorySnapshot();
    const { configActions, sessionActions } = useAppActions();

    return {
        aiPracticeStatus: runtime.aiPracticeStatus,
        applyCustomWordBank: configActions.applyCustomWordBank,
        config: runtime.config,
        copy: shell.copy,
        currentDraft: runtime.currentDraft,
        currentTrainingTask: plan.currentTrainingTask,
        generateAiPractice: sessionActions.generateAiPractice,
        language: shell.language,
        lastCompletedSession: history.lastCompletedSession,
        latestCoachAdvice: history.latestCoachAdvice,
        practiceError: runtime.practiceError,
        recordCompletedSession: sessionActions.recordCompletedSession,
        resetPracticeToBuiltin: sessionActions.resetPracticeToBuiltin,
        restoreAiDraftConfig: sessionActions.restoreAiDraftConfig,
        settings: shell.settings,
        updateConfig: configActions.updateConfig
    };
}
