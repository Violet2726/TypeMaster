'use client';

import { CalendarClock, Gauge, Keyboard, ShieldCheck, Trophy } from 'lucide-react';
import { formatDateTime } from '../i18n';
import { useAppNavigate } from '../application/use-app-navigate';
import { useHomePageModel } from '../features/home/use-home-page-model';
import { useHomePageStore } from '../store/app-state-selectors';

function getHomeSessionTone(session) {
    return session.trainingMeta?.type || 'free';
}

function getHomeSessionLabel(session, trainingCopy) {
    if (session.trainingMeta?.type === 'challenge') {
        return trainingCopy.practice.challengeBadge;
    }

    if (session.trainingMeta?.type === 'plan') {
        return trainingCopy.practice.planBadge;
    }

    if (session.trainingMeta?.type === 'diagnostic') {
        return trainingCopy.practice.diagnosticBadge;
    }

    return trainingCopy.home.freePractice;
}

function HomeSessionIcon({ tone }) {
    const Icon = tone === 'challenge'
        ? Trophy
        : tone === 'plan'
            ? CalendarClock
            : tone === 'diagnostic'
                ? Gauge
                : Keyboard;

    return <Icon aria-hidden="true" size={15} strokeWidth={2.25} />;
}

function HomeRecordPill({ icon: Icon, children, tone = 'speed' }) {
    return (
        <span className={`home-record-pill home-record-pill--${tone}`}>
            <Icon aria-hidden="true" size={15} strokeWidth={2.25} />
            {children}
        </span>
    );
}

function HomeActionEmptySignal({ icon: Icon, title, value, items, tone = 'challenge' }) {
    return (
        <div className={`home-action-empty-signal home-action-empty-signal--${tone}`}>
            <div className="home-action-empty-signal__head">
                <span className="home-action-empty-signal__icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={2.25} />
                </span>
                <div>
                    <span className="summary-label">{title}</span>
                    <strong>{value}</strong>
                </div>
            </div>
            <div className="home-action-empty-signal__grid">
                {items.map((item) => (
                    <span key={item.label}>
                        <small>{item.label}</small>
                        <strong>{item.value}</strong>
                    </span>
                ))}
            </div>
        </div>
    );
}

export function HomePage() {
    const navigate = useAppNavigate();
    const store = useHomePageStore();
    const {
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
    } = useHomePageModel({
        ...store,
        navigate
    });
    const hasSessions = insights.totalSessions > 0;
    const hasChallengeRun = challengeSessions.length > 0;
    const hasDashboardEvidence = Boolean(skillProfile || trainingPlan || hasSessions || unlockedAchievements.length);
    const pendingLabel = trainingCopy.diagnostic.pending;
    const homeLevelLabel = skillProfile?.level?.label || pendingLabel;
    const homeStreakLabel = sessionStreak || pendingLabel;
    const homePlanLabel = trainingPlan ? `${planPercent}%` : pendingLabel;
    const homeAverageWpmLabel = hasSessions ? `${insights.recent7.avgWpm} ${copy.common.wpm}` : copy.statuses.ready;
    const homeBestAccuracyLabel = recentBestAccuracy ? `${recentBestAccuracy}%` : pendingLabel;
    const homeSessionsLabel = hasSessions ? insights.totalSessions : pendingLabel;
    const challengeEmptyItems = [
        { label: copy.result.challengeRankLabel, value: trainingCopy.challenge.leaderboard },
        { label: copy.result.challengeBestLabel, value: trainingCopy.challenge.trendFirstLabel },
        { label: trainingCopy.challenge.attemptsLabel, value: trainingCopy.challenge.cta }
    ];
    const freeReadyItems = [
        { label: copy.home.latestMode, value: latestModeLabel },
        { label: copy.common.sessions, value: pendingLabel }
    ];

    return (
        <div className="page-stack page-stack--home">
            <section className="home-launch">
                <div className="home-launch__copy">
                    <p className="hero-kicker">{trainingCopy.home.todayKicker}</p>
                    <h1>{skillProfile ? trainingCopy.home.dashboardTitle : trainingCopy.home.diagnosticTitle}</h1>
                    <p className="hero-body">
                        {skillProfile ? trainingCopy.home.dashboardBody : trainingCopy.home.diagnosticBody}
                    </p>
                    <div className="home-launch__actions">
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
                        {homeDecision.primaryAction !== 'free' && (
                            <button type="button" className="action-btn" onClick={() => handleDecisionAction('free')}>
                                {trainingCopy.home.freePractice}
                            </button>
                        )}
                    </div>
                </div>
                <div className="home-product-visual" aria-hidden="true">
                    <div className="home-product-visual__window">
                        <div className="home-product-visual__chrome">
                            <span />
                            <span />
                            <span />
                        </div>
                        <div className="home-product-visual__screen">
                            <div className="home-product-visual__metrics">
                                <span>WPM</span>
                                <strong>{insights.recent7.avgWpm || 82}</strong>
                            </div>
                            <div className="home-product-visual__metrics">
                                <span>ACC</span>
                                <strong>{recentBestAccuracy || 98}%</strong>
                            </div>
                            <div className="home-product-visual__rail">
                                <span />
                            </div>
                            <div className="home-product-visual__copy">
                                <span />
                                <span />
                                <span />
                            </div>
                        </div>
                    </div>
                    <div className="home-product-visual__keyboard">
                        {Array.from({ length: 18 }).map((_, index) => (
                            <span key={index} />
                        ))}
                    </div>
                </div>
            </section>

            <section className="home-stats-strip" aria-label={copy.home.statsTitle}>
                <div className="metric-card">
                    <span>{trainingCopy.home.levelLabel}</span>
                    <strong>{homeLevelLabel}</strong>
                </div>
                <div className="metric-card">
                    <span>{trainingCopy.home.streakLabel}</span>
                    <strong>{homeStreakLabel}</strong>
                </div>
                <div className="metric-card">
                    <span>{trainingCopy.home.planLabel}</span>
                    <strong>{homePlanLabel}</strong>
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
                                <strong>{homeLevelLabel}</strong>
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
                            <h2>{store.dailyChallenge?.title || trainingCopy.challenge.title}</h2>
                            <p className="lead-text">{store.dailyChallenge?.summary || trainingCopy.challenge.body}</p>
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
                            {hasChallengeRun ? (
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
                                        <strong>{challengeSessions.length}</strong>
                                    </div>
                                </div>
                            ) : (
                                <HomeActionEmptySignal
                                    icon={Trophy}
                                    title={trainingCopy.challenge.statusTitle}
                                    value={trainingCopy.challenge.trendFirstLabel}
                                    items={challengeEmptyItems}
                                />
                            )}
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
                                <span className="home-action-chip">{homeAverageWpmLabel}</span>
                            </div>
                        </div>

                        <div className="home-action-card__footer">
                            {hasSessions ? (
                                <div className="home-action-card__summary">
                                    <span>{copy.common.sessions}</span>
                                    <strong>{homeSessionsLabel}</strong>
                                </div>
                            ) : (
                                <HomeActionEmptySignal
                                    icon={Keyboard}
                                    title={trainingCopy.home.freePracticeKicker}
                                    value={copy.statuses.ready}
                                    items={freeReadyItems}
                                    tone="free"
                                />
                            )}
                            <button type="button" className="action-btn" onClick={() => handleDecisionAction('free')}>
                                {trainingCopy.home.freePractice}
                            </button>
                        </div>
                    </article>
                </div>
            </section>

            {hasDashboardEvidence && (
                <>
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
                            <strong>{homeAverageWpmLabel}</strong>
                        </div>
                        <div className="metric-card">
                            <span>{copy.home.bestAccuracy}</span>
                            <strong>{homeBestAccuracyLabel}</strong>
                        </div>
                        <div className="metric-card">
                            <span>{copy.common.sessions}</span>
                            <strong>{homeSessionsLabel}</strong>
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
                        {recentSessions.map((session) => {
                            const tone = getHomeSessionTone(session);

                            return (
                                <div key={session.id} className={`history-row home-record-row home-record-row--${tone}`}>
                                    <div className="home-record-row__main">
                                        <span className={`home-record-type home-record-type--${tone}`}>
                                            <HomeSessionIcon tone={tone} />
                                            {getHomeSessionLabel(session, trainingCopy)}
                                        </span>
                                        <div className="history-row__meta">
                                            <strong>{session.trainingMeta?.title || session.sourceTextMeta?.label || copy.common.emptyValue}</strong>
                                            <p className="muted-text">{formatDateTime(session.result.completedAt, language)}</p>
                                        </div>
                                    </div>
                                    <div className="history-metrics">
                                        <HomeRecordPill icon={Gauge}>{session.result.wpm} {copy.common.wpm}</HomeRecordPill>
                                        <HomeRecordPill icon={ShieldCheck} tone="accuracy">{session.result.accuracy}%</HomeRecordPill>
                                    </div>
                                </div>
                            );
                        })}
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
                            <span key={achievement.id} className="tag-pill home-achievement-pill">
                                <Trophy aria-hidden="true" size={15} strokeWidth={2.25} />
                                {achievement.title}
                            </span>
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
                </>
            )}
        </div>
    );
}

export default HomePage;
