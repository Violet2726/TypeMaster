'use client';

import type { ReactNode } from 'react';
import { ArrowRight, CalendarClock, Gauge, Keyboard, ShieldCheck, Sparkles, Trophy } from 'lucide-react';
import { formatDateTime } from '../i18n';
import { useAppNavigate } from '../application/use-app-navigate';
import { useHomePageModel } from '../features/home/use-home-page-model';
import { useHomePageStore } from '../store/app-state-selectors';
import './home-page.css';

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

    return <Icon aria-hidden="true" size={15} strokeWidth={2.2} />;
}

function HomeRecordPill({ icon: Icon, children, tone = 'speed' }) {
    return (
        <span className={`home-record-pill home-record-pill--${tone}`}>
            <Icon aria-hidden="true" size={15} strokeWidth={2.2} />
            {children}
        </span>
    );
}

function HomeActionEmptySignal({ icon: Icon, title, value, items, tone = 'challenge' }) {
    return (
        <div className={`home-empty-signal home-empty-signal--${tone}`}>
            <div className="home-empty-signal__head">
                <span className="home-empty-signal__icon" aria-hidden="true">
                    <Icon size={16} strokeWidth={2.2} />
                </span>
                <div>
                    <span className="summary-label">{title}</span>
                    <strong>{value}</strong>
                </div>
            </div>
            <div className="home-empty-signal__grid">
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

function HomeHeroStat({ label, value, hint }) {
    return (
        <div className="home-hero-stat">
            <span>{label}</span>
            <strong>{value}</strong>
            {hint ? <small>{hint}</small> : null}
        </div>
    );
}

function HomeLaneCard(props: {
    badge?: { label: string; tone: string };
    body: string;
    children?: ReactNode;
    footer?: ReactNode;
    kicker: string;
    title: string;
    tone?: string;
}) {
    const {
        badge,
        body,
        children,
        footer,
        kicker,
        title,
        tone = 'default'
    } = props;

    return (
        <article className={`panel home-lane-card home-lane-card--${tone}`}>
            <div className="home-lane-card__main">
                <div className="home-lane-card__heading">
                    <p className="panel-kicker">{kicker}</p>
                    {badge ? <span className={`panel-badge badge-${badge.tone}`}>{badge.label}</span> : null}
                </div>
                <h2>{title}</h2>
                <p className="lead-text">{body}</p>
                {children}
            </div>
            {footer ? <div className="home-lane-card__footer">{footer}</div> : null}
        </article>
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
    const isStarterHome = !hasDashboardEvidence;
    const pendingLabel = trainingCopy.diagnostic.pending;
    const homeLevelLabel = skillProfile?.level?.label || pendingLabel;
    const homeStreakLabel = sessionStreak || pendingLabel;
    const homePlanLabel = trainingPlan ? `${planPercent}%` : pendingLabel;
    const homeAverageWpmLabel = hasSessions ? `${insights.recent7.avgWpm} ${copy.common.wpm}` : copy.statuses.ready;
    const homeBestAccuracyLabel = recentBestAccuracy ? `${recentBestAccuracy}%` : pendingLabel;
    const homeSessionsLabel = hasSessions ? insights.totalSessions : pendingLabel;
    const challengePrimaryAction = challengeDecisionModel?.primaryAction || challengeStrategyModel.primaryAction;
    const challengePrimaryLabel = challengeDecisionModel?.primaryLabel || challengeStrategyModel.primaryLabel;
    const heroStats = [
        {
            label: trainingCopy.home.levelLabel,
            value: homeLevelLabel,
            hint: currentWeakness
        },
        {
            label: trainingCopy.home.planLabel,
            value: homePlanLabel,
            hint: trainingPlan ? trainingCopy.home.continuePlan : pendingLabel
        },
        {
            label: trainingCopy.home.weekLabel,
            value: `${weeklyGoal.completed}/${weeklyGoal.target}`,
            hint: trainingCopy.home.weekGoalSuffix
        }
    ];
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
        <div className={`page-stack page-stack--home home-refined ${isStarterHome ? 'home-refined--starter' : 'home-refined--dashboard'}`}>
            <section className="home-hero panel">
                <div className="home-hero__copy">
                    <div className="home-hero__eyebrow">
                        <p className="hero-kicker">{trainingCopy.home.todayKicker}</p>
                        <span className={`panel-badge badge-${homeDecision.badgeTone || 'ready'}`}>{homeDecision.badge}</span>
                    </div>
                    <h1>{skillProfile ? trainingCopy.home.dashboardTitle : trainingCopy.home.diagnosticTitle}</h1>
                    <p className="hero-body">
                        {skillProfile ? trainingCopy.home.dashboardBody : trainingCopy.home.diagnosticBody}
                    </p>
                    <div className="home-hero__actions">
                        <button
                            type="button"
                            className="action-btn primary"
                            aria-label={`Primary action: ${homeDecision.primaryLabel}`}
                            onClick={() => handleDecisionAction(homeDecision.primaryAction)}
                            disabled={isLaunchingChallenge && homeDecision.primaryAction === 'challenge'}
                        >
                            <ArrowRight aria-hidden="true" size={18} strokeWidth={2.25} />
                            {homeDecision.primaryAction === 'challenge' && isLaunchingChallenge
                                ? copy.common.loading
                                : homeDecision.primaryLabel}
                        </button>
                        {homeDecision.primaryAction !== 'free' ? (
                            <button
                                type="button"
                                className="action-btn"
                                aria-label={`Secondary action: ${trainingCopy.home.freePractice}`}
                                onClick={() => handleDecisionAction('free')}
                            >
                                {trainingCopy.home.freePractice}
                            </button>
                        ) : null}
                    </div>
                    <div className="home-hero__meta">
                        <span className="home-chip home-chip--soft">{latestModeLabel}</span>
                        <span className="home-chip home-chip--soft">{homeDecision.signalLabel}</span>
                    </div>
                </div>

                <div className="home-hero__visual" aria-hidden="true">
                    <div className="home-hero__glass">
                        <div className="home-hero__glass-head">
                            <span />
                            <span />
                            <span />
                        </div>
                        <div className="home-hero__glass-grid">
                            <div className="home-hero__metric home-hero__metric--wide">
                                <span>WPM</span>
                                <strong>{hasSessions ? insights.recent7.avgWpm : copy.statuses.ready}</strong>
                                <small>{copy.home.avgWpm}</small>
                            </div>
                            <div className="home-hero__metric">
                                <span>ACC</span>
                                <strong>{recentBestAccuracy || 98}%</strong>
                                <small>{copy.home.bestAccuracy}</small>
                            </div>
                            <div className="home-hero__rail">
                                <span style={{ width: `${Math.max(24, Math.min(100, planPercent || 24))}%` }} />
                            </div>
                            <div className="home-hero__keyboard">
                                {Array.from({ length: 15 }).map((_, index) => (
                                    <span key={index} />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="home-hero__stats">
                        {heroStats.map((item) => (
                            <HomeHeroStat key={item.label} label={item.label} value={item.value} hint={item.hint} />
                        ))}
                    </div>
                </div>
            </section>

            {!isStarterHome ? (
                <section className="home-dashboard-strip" aria-label={copy.home.statsTitle}>
                    <div className="metric-card">
                        <span>{trainingCopy.home.streakLabel}</span>
                        <strong>{homeStreakLabel}</strong>
                    </div>
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
                </section>
            ) : null}

            <section className="home-lanes" aria-label={trainingCopy.home.todayFlowTitle}>
                <div className="home-section-heading">
                    <div>
                        <p className="panel-kicker">{trainingCopy.home.todayKicker}</p>
                        <h2>{trainingCopy.home.todayFlowTitle}</h2>
                    </div>
                    <p className="muted-text">{trainingCopy.home.todayFlowBody}</p>
                </div>

                <div className={`home-lanes__grid ${isStarterHome ? 'home-lanes__grid--starter' : ''}`}>
                    <HomeLaneCard
                        kicker={trainingCopy.home.todayKicker}
                        title={homeDecision.headline}
                        body={homeDecision.body}
                        tone="primary"
                        badge={{ label: homeDecision.badge, tone: homeDecision.badgeTone || 'ready' }}
                        footer={(
                            <>
                                <div className="home-lane-card__cluster">
                                    <span className="home-chip">{homeDecision.signalLabel}</span>
                                    <span className="home-chip">{currentWeakness}</span>
                                    {!isStarterHome && trainingPlan ? (
                                        <span className="home-chip">{trainingCopy.home.planLabel} {planPercent}%</span>
                                    ) : null}
                                </div>
                                <div className="home-lane-card__action">
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
                            </>
                        )}
                    >
                        <div className="home-signal-block">
                            <span className="summary-label">{homeDecision.signalLabel}</span>
                            <p>{homeDecision.signal}</p>
                        </div>
                    </HomeLaneCard>

                    <HomeLaneCard
                        kicker={trainingCopy.challenge.kicker}
                        title={store.dailyChallenge?.title || trainingCopy.challenge.title}
                        body={store.dailyChallenge?.summary || trainingCopy.challenge.body}
                        tone="challenge"
                        footer={(
                            <>
                                {hasChallengeRun ? (
                                    <div className="home-lane-card__metrics">
                                        <div className="home-mini-stat">
                                            <span>{copy.result.challengeRankLabel}</span>
                                            <strong>{challengeStanding ? `#${challengeStanding.rank}` : copy.common.emptyValue}</strong>
                                        </div>
                                        <div className="home-mini-stat">
                                            <span>{copy.result.challengeBestLabel}</span>
                                            <strong>
                                                {challengePersonalBest?.bestSession?.result?.wpm
                                                    ? `${challengePersonalBest.bestSession.result.wpm} ${copy.common.wpm}`
                                                    : copy.common.emptyValue}
                                            </strong>
                                        </div>
                                        <div className="home-mini-stat">
                                            <span>{trainingCopy.challenge.attemptsLabel}</span>
                                            <strong>{challengeSessions.length}</strong>
                                        </div>
                                        <div className="home-mini-stat">
                                            <span>{trainingCopy.challenge.leaderboard}</span>
                                            <strong>{challengeLeaderboardCount}</strong>
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
                                <div className="home-lane-card__action home-lane-card__action--split">
                                    {!challengeIsPrimaryDecision ? (
                                        <button
                                            type="button"
                                            className="action-btn primary"
                                            onClick={() => handleDecisionAction(challengePrimaryAction)}
                                            disabled={isLaunchingChallenge && challengePrimaryAction === 'challenge'}
                                        >
                                            {challengePrimaryAction === 'challenge' && isLaunchingChallenge
                                                ? copy.common.loading
                                                : challengePrimaryLabel}
                                        </button>
                                    ) : null}
                                    <button
                                        type="button"
                                        className="action-btn"
                                        onClick={() => handleDecisionAction('leaderboard')}
                                    >
                                        {trainingCopy.challenge.viewBoard}
                                    </button>
                                </div>
                            </>
                        )}
                    >
                        <div className="home-lane-card__cluster">
                            {challengeFacts.map((fact) => (
                                <span key={fact} className="home-chip">{fact}</span>
                            ))}
                            <span className="home-chip">{trainingCopy.challenge.trendFirstLabel}</span>
                        </div>
                        <p className="muted-text">{challengePerformanceText}</p>
                        <div className="home-signal-block">
                            <span className="summary-label">{trainingCopy.challenge.strategyTitle}</span>
                            <p>{challengeStrategyModel.note}</p>
                        </div>
                    </HomeLaneCard>

                    <HomeLaneCard
                        kicker={trainingCopy.home.freePracticeKicker}
                        title={trainingCopy.home.freePractice}
                        body={trainingCopy.home.freePracticeBody}
                        tone="free"
                        footer={(
                            <>
                                {hasSessions ? (
                                    <div className="home-mini-stat home-mini-stat--single">
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
                                <div className="home-lane-card__action">
                                    <button type="button" className="action-btn" onClick={() => handleDecisionAction('free')}>
                                        {trainingCopy.home.freePractice}
                                    </button>
                                </div>
                            </>
                        )}
                    >
                        <div className="home-lane-card__cluster">
                            <span className="home-chip">{latestModeLabel}</span>
                            <span className="home-chip">{hasSessions ? homeAverageWpmLabel : copy.statuses.ready}</span>
                        </div>
                    </HomeLaneCard>
                </div>
            </section>

            {hasDashboardEvidence ? (
                <>
                    <section className="home-summary-band">
                        <article className="panel home-summary-band__feature">
                            <div className="home-summary-band__title">
                                <p className="panel-kicker">{trainingCopy.insights.radarTitle}</p>
                                <h2>{skillProfile?.level?.label || homeDecision.headline}</h2>
                            </div>
                            <p className="lead-text">{skillProfile?.summary || homeDecision.body}</p>
                            <div className="home-summary-band__feature-row">
                                <span className="home-chip">{currentWeakness}</span>
                                <span className="home-chip">{trainingCopy.home.weekLabel} {weeklyGoal.completed}/{weeklyGoal.target}</span>
                                <span className="home-chip">{trainingCopy.home.streakLabel} {homeStreakLabel}</span>
                            </div>
                            {trainingPlan ? (
                                <div className="results-actions">
                                    <button type="button" className="action-btn" onClick={() => handleDecisionAction('planRoute')}>
                                        {trainingCopy.home.planLabel}
                                    </button>
                                </div>
                            ) : null}
                        </article>

                        <article className="panel home-summary-band__stats">
                            <div className="home-summary-band__title">
                                <p className="panel-kicker">{copy.home.statsTitle}</p>
                                <h2>{copy.home.recentHistoryTitle}</h2>
                            </div>
                            <div className="home-summary-band__stat-grid">
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
                        </article>
                    </section>

                    <section className="home-secondary-grid">
                        <article className="panel home-records-panel">
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
                        </article>

                        <article className="panel home-achievements-panel">
                            <div className="panel-head">
                                <div>
                                    <p className="panel-kicker">{trainingCopy.insights.achievementsTitle}</p>
                                    <h2>{trainingCopy.insights.achievementsTitle}</h2>
                                </div>
                            </div>

                            {unlockedAchievements.length ? (
                                <div className="home-achievements-panel__list">
                                    {unlockedAchievements.map((achievement) => (
                                        <span key={achievement.id} className="tag-pill home-achievement-pill">
                                            <Trophy aria-hidden="true" size={15} strokeWidth={2.2} />
                                            {achievement.title}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="home-achievements-panel__empty">
                                    <div className="home-achievements-panel__empty-icon" aria-hidden="true">
                                        <Sparkles size={18} strokeWidth={2.2} />
                                    </div>
                                    <p className="muted-text">{trainingCopy.insights.achievementsBody}</p>
                                    <button type="button" className="action-btn" onClick={() => handleDecisionAction(homeDecision.primaryAction)}>
                                        {homeDecision.primaryLabel}
                                    </button>
                                </div>
                            )}
                        </article>
                    </section>
                </>
            ) : null}
        </div>
    );
}

export default HomePage;
