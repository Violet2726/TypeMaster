import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildChallengeTrend, buildInsights, getChallengePersonalBest, getChallengePointFocusState, getChallengeSessions, getChallengeStanding, getChallengeStrategyState, getLatestChallengeSession } from '../engine';
import { formatDateTime } from '../i18n';
import { usePracticeStore } from '../store/practice-store';
import { buildChallengeFocusModel, buildChallengeStrategyModel } from '../training/challenge-focus';
import { getTrainingCopy } from '../training/copy';
import { buildHomeDecisionModel, pickChallengeDecisionModel } from '../training/decision-models';

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

export function HomePage() {
    const navigate = useNavigate();
    const [isLaunchingChallenge, setIsLaunchingChallenge] = useState(false);
    const {
        copy,
        language,
        sessions,
        config,
        resetPracticeToBuiltin,
        skillProfile,
        trainingPlan,
        diagnosticJourney,
        activeTrainingStep,
        activeDiagnosticStep,
        trainingPlanProgress,
        sessionStreak,
        weeklyGoal,
        achievements,
        dailyChallenge,
        startDiagnosticJourney,
        startTrainingPlanStep,
        startDailyChallenge
    } = usePracticeStore();

    const trainingCopy = getTrainingCopy(language);
    const insights = useMemo(() => buildInsights(sessions), [sessions]);
    const recentSessions = sessions.slice(0, 3);
    const recentBestAccuracy = sessions.slice(0, 7).length
        ? Math.max(...sessions.slice(0, 7).map((session) => session.result.accuracy))
        : 0;
    const latestSession = sessions[0] || null;
    const latestModeLabel = latestSession
        ? `${getSourceLabel(copy, trainingCopy, latestSession.config?.source)} · ${getModeLabel(copy, latestSession.config)}`
        : `${getSourceLabel(copy, trainingCopy, config.source)} · ${getModeLabel(copy, config)}`;
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

    const handleFreePractice = () => {
        resetPracticeToBuiltin();
        navigate('/practice');
    };

    const handleStartChallenge = async () => {
        setIsLaunchingChallenge(true);

        try {
            await startDailyChallenge();
            navigate('/practice');
        } catch {
            setIsLaunchingChallenge(false);
        }
    };

    const handleDecisionAction = async (action) => {
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
    };

    return (
        <div className="page-stack page-stack--home">
            <section className="home-launch">
                <p className="hero-kicker">{trainingCopy.home.todayKicker}</p>
                <h1>{skillProfile ? trainingCopy.home.dashboardTitle : trainingCopy.home.diagnosticTitle}</h1>
                <p className="hero-body">
                    {skillProfile ? trainingCopy.home.dashboardBody : trainingCopy.home.diagnosticBody}
                </p>
            </section>

            <section className="home-stats-strip" aria-label={copy.home.statsTitle}>
                <div className="metric-card">
                    <span>{trainingCopy.home.levelLabel}</span>
                    <strong>{skillProfile?.level?.label || copy.common.emptyValue}</strong>
                </div>
                <div className="metric-card">
                    <span>{trainingCopy.home.streakLabel}</span>
                    <strong>{sessionStreak || copy.common.emptyValue}</strong>
                </div>
                <div className="metric-card">
                    <span>{trainingCopy.home.planLabel}</span>
                    <strong>{trainingPlan ? `${planPercent}%` : copy.common.emptyValue}</strong>
                </div>
                <div className="metric-card">
                    <span>{trainingCopy.home.weekLabel}</span>
                    <strong>{weeklyGoal.completed}/{weeklyGoal.target} {trainingCopy.home.weekGoalSuffix}</strong>
                </div>
            </section>

            <section className="home-action-section" aria-label={trainingCopy.home.todayFlowTitle}>
                <div className="panel-head home-action-section__head">
                    <div>
                        <p className="panel-kicker">{trainingCopy.home.todayKicker}</p>
                        <h2>{trainingCopy.home.todayFlowTitle}</h2>
                    </div>
                    <p className="muted-text home-action-section__body">{trainingCopy.home.todayFlowBody}</p>
                </div>

                <div className="home-action-grid">
                    <article className="panel home-action-card home-action-card--primary">
                        <div className="home-action-card__body">
                            <p className="panel-kicker">{trainingCopy.home.todayKicker}</p>
                            <h2>{homeDecision.headline}</h2>
                            <p className="lead-text">{homeDecision.body}</p>
                            <div className="home-action-card__meta">
                                <span className={`panel-badge badge-${homeDecision.badgeTone || 'ready'}`}>
                                    {homeDecision.badge}
                                </span>
                                {trainingPlan && <span className="home-action-chip">{trainingCopy.home.planLabel} {planPercent}%</span>}
                                <span className="home-action-chip">{currentWeakness}</span>
                            </div>
                            <div className="home-action-card__strategy">
                                <span className="summary-label">{homeDecision.signalLabel}</span>
                                <p className="lead-text">{homeDecision.signal}</p>
                            </div>
                        </div>

                        <div className="home-action-card__footer">
                            <div className="home-action-card__summary">
                                <span>{trainingCopy.home.levelLabel}</span>
                                <strong>{skillProfile?.level?.label || copy.common.emptyValue}</strong>
                            </div>
                            <button
                                type="button"
                                className="action-btn primary"
                                onClick={() => handleDecisionAction(homeDecision.primaryAction)}
                                disabled={isLaunchingChallenge && homeDecision.primaryAction === 'challenge'}
                            >
                                {homeDecision.primaryAction === 'challenge' && isLaunchingChallenge
                                    ? copy.common.loading
                                    : homeDecision.primaryLabel}
                            </button>
                        </div>
                    </article>

                    <article className="panel home-action-card home-action-card--challenge">
                        <div className="home-action-card__body">
                            <p className="panel-kicker">{trainingCopy.challenge.kicker}</p>
                            <h2>{dailyChallenge?.title || trainingCopy.challenge.title}</h2>
                            <p className="lead-text">{dailyChallenge?.summary || trainingCopy.challenge.body}</p>
                            <div className="home-action-card__meta">
                                {challengeFacts.map((fact) => (
                                    <span key={fact} className="home-action-chip">{fact}</span>
                                ))}
                            </div>
                            <p className="muted-text">{challengePerformanceText}</p>
                            <div className="home-action-card__strategy">
                                <span className="summary-label">{trainingCopy.challenge.strategyTitle}</span>
                                <p className="lead-text">{challengeStrategyModel.note}</p>
                            </div>
                        </div>

                        <div className="home-action-card__footer">
                            <div className="home-action-card__footer-meta">
                                <div className="home-action-card__summary">
                                    <span>{copy.result.challengeRankLabel}</span>
                                    <strong>{challengeStanding ? `#${challengeStanding.rank}` : copy.common.emptyValue}</strong>
                                </div>
                                <div className="home-action-card__summary">
                                    <span>{copy.result.challengeBestLabel}</span>
                                    <strong>{challengePersonalBest?.bestSession?.result?.wpm ? `${challengePersonalBest.bestSession.result.wpm} ${copy.common.wpm}` : copy.common.emptyValue}</strong>
                                </div>
                                <div className="home-action-card__summary">
                                    <span>{trainingCopy.challenge.leaderboard}</span>
                                    <strong>{challengeLeaderboardCount}</strong>
                                </div>
                                <div className="home-action-card__summary">
                                    <span>{trainingCopy.challenge.attemptsLabel}</span>
                                    <strong>{challengeSessions.length || copy.common.emptyValue}</strong>
                                </div>
                            </div>
                            <div className="results-actions home-action-card__actions">
                                {!challengeIsPrimaryDecision && (
                                    <button
                                        type="button"
                                        className="action-btn primary"
                                        onClick={() => handleDecisionAction(challengeDecisionModel?.primaryAction || challengeStrategyModel.primaryAction)}
                                        disabled={isLaunchingChallenge && (challengeDecisionModel?.primaryAction || challengeStrategyModel.primaryAction) === 'challenge'}
                                    >
                                        {(challengeDecisionModel?.primaryAction || challengeStrategyModel.primaryAction) === 'challenge' && isLaunchingChallenge
                                            ? copy.common.loading
                                            : challengeDecisionModel?.primaryLabel || challengeStrategyModel.primaryLabel}
                                    </button>
                                )}
                                <button type="button" className="action-btn" onClick={() => handleDecisionAction('leaderboard')}>
                                    {trainingCopy.challenge.viewBoard}
                                </button>
                            </div>
                        </div>
                    </article>

                    <article className="panel home-action-card home-action-card--free">
                        <div className="home-action-card__body">
                            <p className="panel-kicker">{trainingCopy.home.freePracticeKicker}</p>
                            <h2>{trainingCopy.home.freePractice}</h2>
                            <p className="lead-text">{trainingCopy.home.freePracticeBody}</p>
                            <div className="home-action-card__meta">
                                <span className="home-action-chip">{latestModeLabel}</span>
                                <span className="home-action-chip">{insights.recent7.avgWpm} {copy.common.wpm}</span>
                            </div>
                        </div>

                        <div className="home-action-card__footer">
                            <div className="home-action-card__summary">
                                <span>{copy.common.sessions}</span>
                                <strong>{insights.totalSessions || copy.common.emptyValue}</strong>
                            </div>
                            <button type="button" className="action-btn" onClick={handleFreePractice}>
                                {trainingCopy.home.freePractice}
                            </button>
                        </div>
                    </article>
                </div>
            </section>

            <section className="insights-overview-grid">
                <div className="panel insights-latest-card">
                    <p className="panel-kicker">{trainingCopy.insights.radarTitle}</p>
                    <h2>{skillProfile?.level?.label || homeDecision.headline}</h2>
                    <p className="lead-text">{skillProfile?.summary || homeDecision.body}</p>
                    <p className="muted-text">{currentWeakness}</p>
                    {trainingPlan && (
                        <div className="results-actions">
                            <button type="button" className="action-btn" onClick={() => handleDecisionAction('planRoute')}>
                                {trainingCopy.home.planLabel}
                            </button>
                        </div>
                    )}
                </div>

                <div className="panel">
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{copy.home.statsTitle}</p>
                            <h2>{copy.home.recentHistoryTitle}</h2>
                        </div>
                    </div>
                    <div className="summary-stack summary-stack--compact">
                        <div className="metric-card">
                            <span>{copy.home.avgWpm}</span>
                            <strong>{insights.recent7.avgWpm} {copy.common.wpm}</strong>
                        </div>
                        <div className="metric-card">
                            <span>{copy.home.bestAccuracy}</span>
                            <strong>{recentBestAccuracy ? `${recentBestAccuracy}%` : copy.common.emptyValue}</strong>
                        </div>
                        <div className="metric-card">
                            <span>{copy.common.sessions}</span>
                            <strong>{insights.totalSessions || copy.common.emptyValue}</strong>
                        </div>
                        <div className="metric-card">
                            <span>{copy.home.latestMode}</span>
                            <strong>{latestModeLabel}</strong>
                        </div>
                    </div>
                </div>
            </section>

            <section className="panel home-records-panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{copy.insights.recentHistory}</p>
                        <h2>{copy.home.recentHistoryTitle}</h2>
                    </div>
                </div>

                {recentSessions.length ? (
                    <div className="history-table">
                        {recentSessions.map((session) => (
                            <div key={session.id} className="history-row">
                                <div className="history-row__meta">
                                    <strong>{session.trainingMeta?.title || session.sourceTextMeta?.label || copy.common.emptyValue}</strong>
                                    <p className="muted-text">{formatDateTime(session.result.completedAt, language)}</p>
                                </div>
                                <div className="history-metrics">
                                    <span>{session.result.wpm} {copy.common.wpm}</span>
                                    <span>{session.result.accuracy}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="muted-text">{copy.home.recentEmpty}</p>
                )}
            </section>

            <section className="panel home-achievements-panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{trainingCopy.insights.achievementsTitle}</p>
                        <h2>{trainingCopy.insights.achievementsTitle}</h2>
                    </div>
                </div>
                {unlockedAchievements.length ? (
                    <div className="tag-list">
                        {unlockedAchievements.map((achievement) => (
                            <span key={achievement.id} className="tag-pill">{achievement.title}</span>
                        ))}
                    </div>
                ) : (
                    <div className="empty-panel empty-panel--compact">
                        <p className="muted-text">{trainingCopy.insights.achievementsBody}</p>
                        <button type="button" className="action-btn" onClick={() => handleDecisionAction(homeDecision.primaryAction)}>
                            {homeDecision.primaryLabel}
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}

export default HomePage;
