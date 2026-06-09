import { useMemo } from 'react';
import {
    buildAchievements,
    calculateSessionStreak,
    calculateWeeklySessions,
    deriveComparison,
    getActiveJourneyStep,
    getActiveTrainingStep,
    getTrainingPlanProgress
} from '@typemaster/domain';
import { getCopy } from '../i18n';
import { useCoachAdviceQuery } from '../features/account/api/use-coach-advice-query';
import { useCurrentUserQuery } from '../features/account/api/use-current-user-query';
import { useSessionsQuery } from '../features/account/api/use-sessions-query';
import { useSkillProfileQuery } from '../features/account/api/use-skill-profile-query';
import { useTrainingPlanQuery } from '../features/account/api/use-training-plan-query';
import { useAccountConnectionStore } from '../features/account/state/account-connection-store';
import { useDailyChallengeQuery } from '../features/challenge/api/use-daily-challenge-query';
import { useHistoryUiStore } from '../features/history/state/history-ui-store';
import { usePracticeRuntimeStore } from '../features/practice/state/practice-runtime-store';
import { useShellStore } from '../features/shell/state/shell-store';
import { useTrainingFlowStore } from '../features/training/state/training-flow-store';
import { buildTrainingTaskFromState } from './app-state-helpers';

export function useShellSnapshot() {
    const settings = useShellStore((state) => state.settings);
    const updateSettings = useShellStore((state) => state.updateSettings);
    const copy = useMemo(() => getCopy(settings.language), [settings.language]);

    return {
        copy,
        language: settings.language,
        settings,
        updateSettings
    };
}

export function useRuntimeSnapshot() {
    const config = usePracticeRuntimeStore((state) => state.config);
    const currentDraft = usePracticeRuntimeStore((state) => state.currentDraft);
    const aiPracticeStatus = usePracticeRuntimeStore((state) => state.aiPracticeStatus);
    const practiceError = usePracticeRuntimeStore((state) => state.practiceError);

    return {
        aiPracticeStatus,
        config,
        currentDraft,
        practiceError
    };
}

export function useAppDataSnapshot() {
    const lastCompletedSession = useHistoryUiStore((state) => state.lastCompletedSession);
    const coachStatusBySessionId = useHistoryUiStore((state) => state.coachStatusBySessionId);
    const coachIssueBySessionId = useHistoryUiStore((state) => state.coachIssueBySessionId);
    const diagnosticJourney = useTrainingFlowStore((state) => state.diagnosticJourney);
    const activeSessionContext = useTrainingFlowStore((state) => state.activeSessionContext);

    return {
        activeSessionContext,
        coachIssueBySessionId,
        coachStatusBySessionId,
        diagnosticJourney,
        lastCompletedSession
    };
}

export function useAccountSnapshot() {
    const { data: account = null, isError } = useCurrentUserQuery();
    const accountStatus = useAccountConnectionStore((state) => state.accountStatus);

    return {
        account,
        accountStatus: accountStatus === 'idle' && account ? 'connected' : (isError ? 'error' : accountStatus)
    };
}

export function useAchievementSnapshot() {
    const { data: sessions = [] } = useSessionsQuery();
    const { data: skillProfile = null } = useSkillProfileQuery();

    const sessionStreak = useMemo(() => calculateSessionStreak(sessions), [sessions]);
    const weeklySessions = useMemo(() => calculateWeeklySessions(sessions), [sessions]);
    const weeklyGoal = useMemo(() => ({
        target: 3,
        completed: weeklySessions,
        percent: Math.min(100, Math.round((weeklySessions / 3) * 100))
    }), [weeklySessions]);
    const achievements = useMemo(() => buildAchievements({
        sessions,
        sessionStreak,
        weeklyGoal,
        skillProfile
    }), [sessionStreak, sessions, skillProfile, weeklyGoal]);

    return {
        achievements,
        sessionStreak,
        weeklyGoal,
        weeklySessions
    };
}

export function usePlanSnapshot() {
    const shell = useShellSnapshot();
    const {
        activeSessionContext,
        diagnosticJourney
    } = useAppDataSnapshot();
    const { data: skillProfile = null } = useSkillProfileQuery();
    const { data: trainingPlan = null } = useTrainingPlanQuery();
    const { data: dailyChallenge = null } = useDailyChallengeQuery(shell.language);

    const activeTrainingStep = useMemo(() => getActiveTrainingStep(trainingPlan), [trainingPlan]);
    const activeDiagnosticStep = useMemo(() => getActiveJourneyStep(diagnosticJourney), [diagnosticJourney]);
    const currentTrainingTask = useMemo(
        () => buildTrainingTaskFromState(activeSessionContext, diagnosticJourney, trainingPlan, dailyChallenge),
        [activeSessionContext, dailyChallenge, diagnosticJourney, trainingPlan]
    );
    const trainingPlanProgress = useMemo(() => getTrainingPlanProgress(trainingPlan), [trainingPlan]);

    return {
        activeDiagnosticStep,
        activeTrainingStep,
        currentTrainingTask,
        dailyChallenge,
        diagnosticJourney,
        skillProfile,
        trainingPlan,
        trainingPlanProgress
    };
}

export function useHistorySnapshot() {
    const { coachIssueBySessionId, coachStatusBySessionId, lastCompletedSession } = useAppDataSnapshot();
    const { data: coachAdviceRecords = [] } = useCoachAdviceQuery();
    const { data: sessions = [] } = useSessionsQuery();
    const { settings } = useShellSnapshot();
    const resolvedLastCompletedSession = lastCompletedSession || sessions[0] || null;

    const latestCoachAdvice = coachAdviceRecords[0] || null;
    const latestComparison = useMemo(
        () => resolvedLastCompletedSession
            ? deriveComparison(sessions, resolvedLastCompletedSession.id, resolvedLastCompletedSession.result, settings.language)
            : null,
        [resolvedLastCompletedSession, sessions, settings.language]
    );

    return {
        coachAdviceRecords,
        coachIssueBySessionId,
        coachStatusBySessionId,
        lastCompletedSession: resolvedLastCompletedSession,
        latestCoachAdvice,
        latestComparison,
        sessions
    };
}
