import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    buildAchievements,
    calculateSessionStreak,
    calculateWeeklySessions
} from '@typemaster/domain';
import { getCurrentUserQueryKey, useCurrentUserQuery, updateCurrentUserQueryData, type CurrentUserSnapshot } from '../features/account/api/use-current-user-query';
import { updateCoachAdviceQueryData, useCoachAdviceQuery } from '../features/account/api/use-coach-advice-query';
import { updateSessionsQueryData, useSessionsQuery } from '../features/account/api/use-sessions-query';
import { updateSkillProfileQueryData, useSkillProfileQuery } from '../features/account/api/use-skill-profile-query';
import { updateTrainingPlanQueryData, useTrainingPlanQuery } from '../features/account/api/use-training-plan-query';
import { useAccountConnectionStore } from '../features/account/state/account-connection-store';
import { useDailyChallengeQuery, updateDailyChallengeQueryData } from '../features/challenge/api/use-daily-challenge-query';
import { useHistoryUiStore } from '../features/history/state/history-ui-store';
import { useShellStore } from '../features/shell/state/shell-store';
import { useTrainingFlowStore } from '../features/training/state/training-flow-store';
import { usePracticeRuntimeStore } from '../features/practice/state/practice-runtime-store';

export function useAppStateEnvironment() {
    const queryClient = useQueryClient();

    const settings = useShellStore((state) => state.settings);
    const setSettingsState = useShellStore((state) => state.setSettingsState);
    const hydrateSettings = useShellStore((state) => state.hydrateSettings);
    const config = usePracticeRuntimeStore((state) => state.config);
    const currentDraft = usePracticeRuntimeStore((state) => state.currentDraft);
    const aiPracticeStatus = usePracticeRuntimeStore((state) => state.aiPracticeStatus);
    const practiceError = usePracticeRuntimeStore((state) => state.practiceError);
    const setConfigState = usePracticeRuntimeStore((state) => state.setConfigState);
    const setCurrentDraft = usePracticeRuntimeStore((state) => state.setCurrentDraft);
    const setAiPracticeStatus = usePracticeRuntimeStore((state) => state.setAiPracticeStatus);
    const setPracticeError = usePracticeRuntimeStore((state) => state.setPracticeError);
    const hydrateRuntimeState = usePracticeRuntimeStore((state) => state.hydrateRuntimeState);

    const lastCompletedSession = useHistoryUiStore((state) => state.lastCompletedSession);
    const coachStatusBySessionId = useHistoryUiStore((state) => state.coachStatusBySessionId);
    const coachIssueBySessionId = useHistoryUiStore((state) => state.coachIssueBySessionId);
    const setLastCompletedSession = useHistoryUiStore((state) => state.setLastCompletedSession);
    const setCoachStatusBySessionId = useHistoryUiStore((state) => state.setCoachStatusBySessionId);
    const setCoachIssueBySessionId = useHistoryUiStore((state) => state.setCoachIssueBySessionId);
    const hydrateHistoryUiState = useHistoryUiStore((state) => state.hydrateHistoryUiState);

    const diagnosticJourney = useTrainingFlowStore((state) => state.diagnosticJourney);
    const activeSessionContext = useTrainingFlowStore((state) => state.activeSessionContext);
    const setDiagnosticJourney = useTrainingFlowStore((state) => state.setDiagnosticJourney);
    const setActiveSessionContext = useTrainingFlowStore((state) => state.setActiveSessionContext);
    const hydrateTrainingFlowState = useTrainingFlowStore((state) => state.hydrateTrainingFlowState);

    const { data: account = null } = useCurrentUserQuery();
    const { data: coachAdviceRecords = [] } = useCoachAdviceQuery();
    const { data: sessions = [] } = useSessionsQuery();
    const { data: skillProfile = null } = useSkillProfileQuery();
    const { data: trainingPlan = null } = useTrainingPlanQuery();
    const setAccountStatus = useAccountConnectionStore((state) => state.setAccountStatus);
    const { data: challengeData = null } = useDailyChallengeQuery(settings.language);
    const dailyChallengeState = challengeData || null;

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
    const getActiveUserId = useMemo(() => (
        () => queryClient.getQueryData<CurrentUserSnapshot>(getCurrentUserQueryKey())?.id || 'local'
    ), [queryClient]);

    const setCoachAdviceRecords = useMemo(() => (
        (next) => {
            updateCoachAdviceQueryData(queryClient, getActiveUserId(), next);
        }
    ), [getActiveUserId, queryClient]);
    const setSessions = useMemo(() => (
        (next) => {
            updateSessionsQueryData(queryClient, getActiveUserId(), next);
        }
    ), [getActiveUserId, queryClient]);
    const setSkillProfile = useMemo(() => (
        (next) => {
            updateSkillProfileQueryData(queryClient, getActiveUserId(), next);
        }
    ), [getActiveUserId, queryClient]);
    const setTrainingPlan = useMemo(() => (
        (next) => {
            updateTrainingPlanQueryData(queryClient, getActiveUserId(), next);
        }
    ), [getActiveUserId, queryClient]);
    const setDailyChallenge = useMemo(() => (
        (next) => updateDailyChallengeQueryData(queryClient, settings.language, next)
    ), [queryClient, settings.language]);
    const updateCurrentUser = useMemo(() => (
        (next) => updateCurrentUserQueryData(queryClient, next)
    ), [queryClient]);

    return useMemo(() => ({
        achievements, account, activeSessionContext, aiPracticeStatus, coachAdviceRecords, coachIssueBySessionId, coachStatusBySessionId, config, currentDraft, dailyChallengeState, diagnosticJourney, hydrateHistoryUiState, hydrateRuntimeState, hydrateSettings, hydrateTrainingFlowState, lastCompletedSession, practiceError, sessionStreak, sessions, settings, skillProfile, trainingPlan, weeklyGoal, setAccountStatus, setActiveSessionContext, setAiPracticeStatus, setCoachAdviceRecords, setCoachIssueBySessionId, setCoachStatusBySessionId, setConfigState, setCurrentDraft, setDailyChallenge, setDiagnosticJourney, setLastCompletedSession, setPracticeError, setSessions, setSettingsState, setSkillProfile, setTrainingPlan, updateCurrentUser
    }), [
        achievements, account, activeSessionContext, aiPracticeStatus, coachAdviceRecords, coachIssueBySessionId, coachStatusBySessionId, config, currentDraft, dailyChallengeState, diagnosticJourney, hydrateHistoryUiState, hydrateRuntimeState, hydrateSettings, hydrateTrainingFlowState, lastCompletedSession, practiceError, sessionStreak, sessions, settings, skillProfile, trainingPlan, weeklyGoal, setAccountStatus, setActiveSessionContext, setAiPracticeStatus, setCoachAdviceRecords, setCoachIssueBySessionId, setCoachStatusBySessionId, setConfigState, setCurrentDraft, setDailyChallenge, setDiagnosticJourney, setLastCompletedSession, setPracticeError, setSessions, setSettingsState, setSkillProfile, setTrainingPlan, updateCurrentUser
    ]);
}
