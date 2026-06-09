import { useCallback, useMemo, useState } from 'react';
import {
    buildChallengeTrend,
    buildInsights,
    getChallengePersonalBest,
    getChallengePointFocusState,
    getChallengeSessions,
    getChallengeStanding,
    getChallengeStrategyState,
    getLatestChallengeSession
} from '@typemaster/domain';
import { getInlineSeparator } from '../../i18n';
import { buildChallengeFocusModel, buildChallengeStrategyModel } from '../../training/challenge-focus';
import { getTrainingCopy } from '../../training/copy';
import { buildHomeDecisionModel, pickChallengeDecisionModel } from '../../training/decision-models';

function getModeLabel(copy, config) {
    if (!config) {
        return copy.common.emptyValue;
    }

    return config.mode === 'time'
        ? `${copy.common.timeMode} ${config.durationSeconds}s`
        : `${copy.common.wordsMode} ${config.wordCount}`;
}

function getSourceLabel(copy, trainingCopy, source) {
    if (source === 'ai') return copy.practice.sourceAi;
    if (source === 'custom') return trainingCopy.practice.customSource;
    return copy.practice.sourceBuiltin;
}

function getLabelSeparator(language) {
    return getInlineSeparator(language);
}

function getChallengeFacts(copy, challengeConfig) {
    if (!challengeConfig) {
        return [];
    }

    const facts = [getModeLabel(copy, challengeConfig)];

    if (challengeConfig.includeNumbers) {
        facts.push(copy.common.numbers);
    }

    if (challengeConfig.includePunctuation) {
        facts.push(copy.common.punctuation);
    }

    return facts;
}

function fillTemplate(template, value) {
    return String(template || '').replace('{value}', value);
}

function getChallengePerformanceText(copy, challengeSession, challengeStanding, challengePersonalBest, trainingCopy) {
    if (!challengeSession) {
        return trainingCopy.challenge.homeIdleNote;
    }

    if ((challengePersonalBest?.attempts || 0) <= 1) {
        return copy.result.challengeBestFirst;
    }

    if (challengePersonalBest?.isPersonalBest) {
        return copy.result.challengeBestFresh;
    }

    if (challengePersonalBest?.gapWpm > 0) {
        return fillTemplate(copy.result.challengeBestGapWpm, challengePersonalBest.gapWpm);
    }

    if (challengePersonalBest?.gapAccuracy > 0) {
        return fillTemplate(copy.result.challengeBestGapAccuracy, challengePersonalBest.gapAccuracy);
    }

    if (challengeStanding) {
        return trainingCopy.challenge.homeReadyNote;
    }

    return trainingCopy.challenge.homeIdleNote;
}

export function useHomePageModel({
    activeDiagnosticStep,
    activeTrainingStep,
    achievements,
    config,
    copy,
    dailyChallenge,
    diagnosticJourney,
    language,
    navigate,
    resetPracticeToBuiltin,
    sessionStreak,
    sessions,
    skillProfile,
    startDailyChallenge,
    startDiagnosticJourney,
    startTrainingPlanStep,
    trainingPlan,
    trainingPlanProgress,
    weeklyGoal
}) {
    const [isLaunchingChallenge, setIsLaunchingChallenge] = useState(false);
    const trainingCopy = useMemo(() => getTrainingCopy(language), [language]);
    const insights = useMemo(() => buildInsights(sessions), [sessions]);
    const recentSessions = sessions.slice(0, 3);
    const recentBestAccuracy = sessions.slice(0, 7).length
        ? Math.max(...sessions.slice(0, 7).map((session) => session.result.accuracy))
        : 0;
    const latestSession = sessions[0] || null;
    const latestLabelSeparator = getLabelSeparator(language);
    const latestModeLabel = latestSession
        ? `${getSourceLabel(copy, trainingCopy, latestSession.config?.source)}${latestLabelSeparator}${getModeLabel(copy, latestSession.config)}`
        : `${getSourceLabel(copy, trainingCopy, config.source)}${latestLabelSeparator}${getModeLabel(copy, config)}`;
    const currentWeakness = skillProfile?.weakZones?.[0]?.label || trainingCopy.home.noWeakness;
    const planPercent = trainingPlanProgress?.percent || 0;
    const hasDiagnosticInFlight = diagnosticJourney?.status === 'active';
    const challengeFacts = useMemo(
        () => getChallengeFacts(copy, dailyChallenge?.config),
        [copy, dailyChallenge?.config]
    );
    const challengeLeaderboardCount = dailyChallenge?.leaderboard?.length || 0;
    const latestChallengeSession = useMemo(
        () => getLatestChallengeSession(sessions, dailyChallenge?.id),
        [dailyChallenge?.id, sessions]
    );
    const challengeSessions = useMemo(
        () => getChallengeSessions(sessions, dailyChallenge?.id),
        [dailyChallenge?.id, sessions]
    );
    const challengeTrend = useMemo(
        () => buildChallengeTrend(challengeSessions),
        [challengeSessions]
    );
    const challengeFocusPoint = useMemo(
        () => challengeTrend?.points.find((point) => point.id === latestChallengeSession?.id) || null,
        [challengeTrend, latestChallengeSession?.id]
    );
    const challengeFocusState = useMemo(
        () => getChallengePointFocusState(challengeFocusPoint || (latestChallengeSession ? { attempt: 1 } : null)),
        [challengeFocusPoint, latestChallengeSession]
    );
    const challengeStanding = useMemo(
        () => getChallengeStanding(dailyChallenge?.leaderboard || [], latestChallengeSession?.id),
        [dailyChallenge?.leaderboard, latestChallengeSession?.id]
    );
    const challengePersonalBest = useMemo(
        () => getChallengePersonalBest(sessions, dailyChallenge?.id, latestChallengeSession?.id),
        [dailyChallenge?.id, latestChallengeSession?.id, sessions]
    );
    const challengePerformanceText = useMemo(
        () => getChallengePerformanceText(copy, latestChallengeSession, challengeStanding, challengePersonalBest, trainingCopy),
        [challengePersonalBest, challengeStanding, copy, latestChallengeSession, trainingCopy]
    );
    const challengeStrategyState = useMemo(
        () => getChallengeStrategyState(challengeTrend, challengePersonalBest),
        [challengePersonalBest, challengeTrend]
    );
    const challengeStrategyModel = useMemo(
        () => buildChallengeStrategyModel(trainingCopy, challengeStrategyState, {
            hasActiveTrainingStep: Boolean(activeTrainingStep),
            hasPriorChallenge: Boolean(latestChallengeSession),
            isLoading: isLaunchingChallenge,
            loadingLabel: copy.common.loading
        }),
        [activeTrainingStep, challengeStrategyState, copy.common.loading, isLaunchingChallenge, latestChallengeSession, trainingCopy]
    );
    const challengeFocusModel = useMemo(
        () => latestChallengeSession
            ? buildChallengeFocusModel(trainingCopy, challengeFocusState, {
                hasActiveTrainingStep: Boolean(activeTrainingStep),
                isLoading: isLaunchingChallenge,
                loadingLabel: copy.common.loading
            })
            : null,
        [activeTrainingStep, challengeFocusState, copy.common.loading, isLaunchingChallenge, latestChallengeSession, trainingCopy]
    );
    const challengeDecisionModel = useMemo(
        () => pickChallengeDecisionModel(challengeStrategyModel, challengeFocusModel),
        [challengeFocusModel, challengeStrategyModel]
    );
    const unlockedAchievements = useMemo(
        () => achievements.filter((item) => item.unlocked).slice(0, 4),
        [achievements]
    );
    const homeDecision = useMemo(
        () => buildHomeDecisionModel({
            copy,
            trainingCopy,
            skillProfile,
            activeTrainingStep,
            activeDiagnosticStep,
            hasDiagnosticInFlight,
            latestSession,
            dailyChallengeId: dailyChallenge?.id,
            challengeDecisionModel,
            trainingPlan
        }),
        [activeDiagnosticStep, activeTrainingStep, challengeDecisionModel, copy, dailyChallenge?.id, hasDiagnosticInFlight, latestSession, skillProfile, trainingCopy, trainingPlan]
    );
    const challengeIsPrimaryDecision = homeDecision.context === 'challenge';

    const handleFreePractice = useCallback(() => {
        resetPracticeToBuiltin();
        navigate('/practice');
    }, [navigate, resetPracticeToBuiltin]);

    const handleStartChallenge = useCallback(async () => {
        setIsLaunchingChallenge(true);

        try {
            await startDailyChallenge();
            navigate('/practice');
        } catch {
            setIsLaunchingChallenge(false);
        }
    }, [navigate, startDailyChallenge]);

    const handleDecisionAction = useCallback(async (action) => {
        if (action === 'diagnostic') {
            startDiagnosticJourney();
            navigate('/practice');
            return;
        }

        if (action === 'plan') {
            startTrainingPlanStep();
            navigate('/practice');
            return;
        }

        if (action === 'free') {
            handleFreePractice();
            return;
        }

        if (action === 'challenge') {
            await handleStartChallenge();
            return;
        }

        if (action === 'planRoute') {
            navigate('/plan');
            return;
        }

        if (action === 'leaderboard') {
            navigate('/challenge');
            return;
        }

        if (action === 'insights') {
            navigate('/insights');
            return;
        }

        navigate('/practice');
    }, [handleFreePractice, handleStartChallenge, navigate, startDiagnosticJourney, startTrainingPlanStep]);

    return {
        challengeDecisionModel,
        challengeFacts,
        challengeIsPrimaryDecision,
        challengeLeaderboardCount,
        challengePerformanceText,
        challengePersonalBest,
        challengeSessions,
        challengeStanding,
        challengeStrategyModel,
        copy,
        currentWeakness,
        homeDecision,
        insights,
        isLaunchingChallenge,
        language,
        latestModeLabel,
        planPercent,
        recentBestAccuracy,
        recentSessions,
        sessionStreak,
        skillProfile,
        trainingCopy,
        trainingPlan,
        unlockedAchievements,
        weeklyGoal,
        handleDecisionAction
    };
}
