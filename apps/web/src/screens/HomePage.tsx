'use client';

import type { ReactNode } from 'react';
import { ArrowRight, BarChart3, CalendarClock, Gauge, Keyboard, ShieldCheck, Swords, Target, TrendingUp, Trophy } from 'lucide-react';
import { formatDateTime } from '../i18n';
import { useAppNavigate } from '../application/use-app-navigate';
import { useHomePageModel } from '../features/home/use-home-page-model';
import { useHomePageStore } from '../store/app-state-selectors';
import './home-page.css';

function getHomeSessionTone(session: any) {
    return session.trainingMeta?.type || 'free';
}

function getHomeSessionLabel(session: any, trainingCopy: any) {
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

function HomeSessionIcon({ tone }: { tone: string }) {
    const Icon = tone === 'challenge'
        ? Trophy
        : tone === 'plan'
            ? CalendarClock
            : tone === 'diagnostic'
                ? Gauge
                : Keyboard;

    return <Icon aria-hidden="true" size={16} strokeWidth={2.2} />;
}

function HomeQuickCard({ icon: Icon, kicker, label, description, tone = 'default', disabled, onClick }: { icon: any; kicker: string; label: string; description: string; tone?: string; disabled?: boolean; onClick: () => void }) {
    return (
        <button
            type="button"
            className={`home-quick-card home-quick-card--${tone}`}
            disabled={disabled}
            onClick={onClick}
        >
            <span className="home-quick-card__icon" aria-hidden="true">
                <Icon size={18} strokeWidth={2.2} />
            </span>
            <span className="home-quick-card__text">
                <p className="home-quick-card__kicker">{kicker}</p>
                <strong>{label}</strong>
                <span>{description}</span>
            </span>
        </button>
    );
}

function HomeRecentChip({ icon: Icon, children, accent = false }: { icon: any; children: ReactNode; accent?: boolean }) {
    return (
        <span className={`home-recent-chip${accent ? ' home-recent-chip--accent' : ''}`}>
            <Icon aria-hidden="true" size={13} strokeWidth={2.2} />
            {children}
        </span>
    );
}

export function HomePage() {
    const navigate = useAppNavigate();
    const store = useHomePageStore();
    const {
        challengeDecisionModel,
        challengeIsPrimaryDecision,
        challengePerformanceText,
        challengeSessions,
        challengeStrategyModel,
        copy,
        homeDecision,
        insights,
        isLaunchingChallenge,
        language,
        recentBestAccuracy,
        recentSessions,
        sessionStreak,
        skillProfile,
        trainingCopy,
        trainingPlan,
        unlockedAchievements,
        handleDecisionAction
    } = useHomePageModel({
        ...store,
        navigate
    });

    const hasSessions = insights.totalSessions > 0;
    const hasDashboardEvidence = Boolean(skillProfile || trainingPlan || hasSessions || unlockedAchievements.length);
    const isStarterHome = !hasDashboardEvidence;
    const pendingLabel = trainingCopy.diagnostic.pending;
    const homeStreakLabel = sessionStreak || pendingLabel;
    const homeAverageWpmLabel = hasSessions ? `${insights.recent7.avgWpm} ${copy.common.wpm}` : copy.statuses.ready;
    const homeBestAccuracyLabel = recentBestAccuracy ? `${recentBestAccuracy}%` : pendingLabel;
    const statusBadge = skillProfile
        ? (hasSessions ? copy.statuses.ready : copy.statuses.idle)
        : trainingCopy.home.levelLabel;
    const primaryDescription = challengeIsPrimaryDecision ? challengePerformanceText : homeDecision.body;
    const quickActions = [
        {
            key: challengeIsPrimaryDecision ? 'challenge' : 'primary',
            icon: ArrowRight,
            kicker: challengeIsPrimaryDecision ? trainingCopy.challenge.strategyTitle : trainingCopy.home.todayKicker,
            label: challengeIsPrimaryDecision
                ? (challengeDecisionModel?.primaryLabel || challengeStrategyModel.primaryLabel)
                : homeDecision.primaryLabel,
            description: primaryDescription,
            tone: 'primary',
            disabled: challengeIsPrimaryDecision
                ? isLaunchingChallenge && (challengeDecisionModel?.primaryAction || challengeStrategyModel.primaryAction) === 'challenge'
                : isLaunchingChallenge && homeDecision.primaryAction === 'challenge',
            onClick: () => handleDecisionAction(challengeIsPrimaryDecision
                ? (challengeDecisionModel?.primaryAction || challengeStrategyModel.primaryAction)
                : homeDecision.primaryAction)
        },
        {
            key: 'leaderboard',
            icon: BarChart3,
            kicker: trainingCopy.challenge.kicker,
            label: trainingCopy.challenge.viewBoard,
            description: trainingCopy.challenge.strategyTitle,
            tone: 'default',
            onClick: () => handleDecisionAction('leaderboard')
        },
        {
            key: 'free',
            icon: Keyboard,
            kicker: trainingCopy.home.freePracticeKicker,
            label: trainingCopy.home.freePractice,
            description: trainingCopy.home.freePracticeBody,
            tone: 'default',
            onClick: () => handleDecisionAction('free')
        },
        {
            key: 'game',
            icon: Swords,
            kicker: 'Game Mode',
            label: 'Typing Raid',
            description: 'Type words to destroy enemies',
            tone: 'default',
            onClick: () => navigate('/game')
        }
    ] satisfies Array<{ key: string; icon: any; kicker: string; label: string; description: string; tone?: string; disabled?: boolean; onClick: () => void }>;

    return (
        <div className={`page-stack page-stack--home home-status-page-stack ${isStarterHome ? 'home-status-page-stack--starter' : 'home-status-page-stack--dashboard'}`}>
            <section className="home-starter-hero" aria-label={copy.home.statsTitle}>
                <div className="home-starter-hero__copy">
                    <span className="home-starter-hero__status">
                        <Target aria-hidden="true" size={15} strokeWidth={2.2} />
                        {statusBadge}
                    </span>
                    <h1>{skillProfile ? trainingCopy.home.dashboardTitle : trainingCopy.home.diagnosticTitle}</h1>
                    <p className="hero-body">
                        {skillProfile ? trainingCopy.home.dashboardBody : trainingCopy.home.diagnosticBody}
                    </p>
                    <div className="home-starter-hero__actions">
                        <button
                            type="button"
                            className="action-btn primary"
                            aria-label={`Primary action: ${challengeIsPrimaryDecision ? (challengeDecisionModel?.primaryLabel || challengeStrategyModel.primaryLabel) : homeDecision.primaryLabel}`}
                            onClick={() => handleDecisionAction(challengeIsPrimaryDecision
                                ? (challengeDecisionModel?.primaryAction || challengeStrategyModel.primaryAction)
                                : homeDecision.primaryAction)}
                            disabled={challengeIsPrimaryDecision
                                ? isLaunchingChallenge && (challengeDecisionModel?.primaryAction || challengeStrategyModel.primaryAction) === 'challenge'
                                : isLaunchingChallenge && homeDecision.primaryAction === 'challenge'}
                        >
                            <ArrowRight aria-hidden="true" size={17} strokeWidth={2.25} />
                            {isLaunchingChallenge && (
                                challengeIsPrimaryDecision
                                    ? (challengeDecisionModel?.primaryAction || challengeStrategyModel.primaryAction) === 'challenge'
                                    : homeDecision.primaryAction === 'challenge'
                            )
                                ? copy.common.loading
                                : (challengeIsPrimaryDecision
                                    ? (challengeDecisionModel?.primaryLabel || challengeStrategyModel.primaryLabel)
                                    : homeDecision.primaryLabel)}
                        </button>
                    </div>
                </div>
            </section>

            {!isStarterHome ? (
                <section className="home-starter-metrics" aria-label={copy.home.statsTitle}>
                    <div className="home-starter-metric">
                        <span>{trainingCopy.home.streakLabel}</span>
                        <strong>{homeStreakLabel}</strong>
                    </div>
                    <div className="home-starter-metric">
                        <span>{copy.home.avgWpm}</span>
                        <strong>{homeAverageWpmLabel}</strong>
                    </div>
                    <div className="home-starter-metric">
                        <span>{copy.home.bestAccuracy}</span>
                        <strong>{homeBestAccuracyLabel}</strong>
                    </div>
                </section>
            ) : null}

            <section className="home-quick-cards" aria-label={trainingCopy.home.todayFlowTitle}>
                {quickActions.map((action) => (
                    <HomeQuickCard
                        key={action.key}
                        icon={action.icon}
                        kicker={action.kicker}
                        label={action.label}
                        description={action.description}
                        tone={action.tone}
                        disabled={action.disabled}
                        onClick={action.onClick}
                    />
                ))}
            </section>

            {hasDashboardEvidence && recentSessions.length ? (
                <section className="home-recent">
                    <div className="home-recent__head">
                        <p className="panel-kicker">{copy.home.statsTitle}</p>
                        <h2>{copy.home.recentHistoryTitle}</h2>
                    </div>

                    <div className="home-recent-list">
                        {recentSessions.map((session: any) => {
                            const tone = getHomeSessionTone(session);

                            return (
                                <div key={session.id} className="home-recent-item">
                                    <span className="home-recent-item__icon" aria-hidden="true">
                                        <HomeSessionIcon tone={tone} />
                                    </span>
                                    <div className="home-recent-item__body">
                                        <strong>{session.trainingMeta?.title || session.sourceTextMeta?.label || copy.common.emptyValue}</strong>
                                        <p>{getHomeSessionLabel(session, trainingCopy)} · {formatDateTime(session.result.completedAt, language)}</p>
                                    </div>
                                    <div className="home-recent-item__metrics">
                                        <HomeRecentChip icon={TrendingUp}>{session.result.wpm} {copy.common.wpm}</HomeRecentChip>
                                        <HomeRecentChip icon={ShieldCheck} accent>{session.result.accuracy}%</HomeRecentChip>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            ) : null}
        </div>
    );
}

export default HomePage;

