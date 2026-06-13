'use client';

import { ArrowRight, BarChart3, CalendarClock, Keyboard, LineChart, ShieldCheck, Sparkles, Target } from 'lucide-react';
import { formatDateTime } from '../i18n';
import { useAppNavigate } from '../application/use-app-navigate';
import { useInsightsPageStore } from '../store/app-state-selectors';

function CoachSignal({ icon: Icon, label, value, tone }) {
    return (
        <div className={`coach-signal coach-signal--${tone}`}>
            <Icon aria-hidden="true" size={18} strokeWidth={2.25} />
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}

function CoachStarterPanel({ copy, onStart, onInsights }) {
    const starterSteps = copy.coach.pathSteps.slice(0, 3);

    return (
        <section className="panel coach-starter-panel" aria-label={copy.coach.title}>
            <div className="coach-starter-panel__copy">
                <span className="coach-hero__icon" aria-hidden="true">
                    <Sparkles size={26} strokeWidth={2.2} />
                </span>
                <p className="panel-kicker">{copy.coach.kicker}</p>
                <h1>{copy.coach.title}</h1>
                <p className="lead-text">{copy.coach.body}</p>
                <div className="coach-hero__actions">
                    <button type="button" className="action-btn primary" onClick={onStart}>
                        <Keyboard aria-hidden="true" size={18} strokeWidth={2.25} />
                        {copy.coach.primaryAction}
                    </button>
                    <button type="button" className="action-btn secondary" onClick={onInsights}>
                        <LineChart aria-hidden="true" size={18} strokeWidth={2.25} />
                        {copy.coach.secondaryAction}
                    </button>
                </div>
            </div>

            <aside className="coach-starter-brief" aria-label={copy.coach.latestTitle}>
                <div className="coach-starter-brief__head">
                    <span className="coach-brief-card__glyph" aria-hidden="true">
                        <BarChart3 size={20} strokeWidth={2.3} />
                    </span>
                    <span className="panel-badge badge-stale">
                        {copy.coach.emptyBadge}
                    </span>
                </div>
                <div>
                    <p className="panel-kicker">{copy.coach.latestTitle}</p>
                    <h2>{copy.coach.emptyTitle}</h2>
                    <p>{copy.coach.emptyBody}</p>
                </div>
                <div className="coach-starter-steps" aria-label={copy.coach.pathTitle}>
                    {starterSteps.map((step, index) => (
                        <div key={step.title} className="coach-starter-step">
                            <span aria-hidden="true">{index + 1}</span>
                            <div>
                                <strong>{step.title}</strong>
                                <p>{step.body}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </aside>
        </section>
    );
}

export function CoachPage() {
    const navigate = useAppNavigate();
    const {
        copy,
        language,
        latestCoachAdvice,
        sessions,
        skillProfile,
        weeklyGoal,
        weeklySessions
    } = useInsightsPageStore();
    const latestSession = sessions[0] || null;
    const hasAdvice = Boolean(latestCoachAdvice);
    const heroTitle = latestCoachAdvice?.headline || copy.coach.emptyTitle;
    const heroBody = latestCoachAdvice?.summary || copy.coach.emptyBody;
    const nextDrill = latestCoachAdvice?.nextDrill;
    const nextDrillTitle = nextDrill?.label || copy.common.nextDrill;
    const nextDrillReason = nextDrill?.reason || copy.coach.nextDrillEmpty;
    const comparisonSummary = latestCoachAdvice?.comparison?.summary || copy.coach.noSignal;
    const latestRoundValue = latestSession
        ? `${latestSession.result.wpm} ${copy.common.wpm} / ${latestSession.result.accuracy}%`
        : copy.common.emptyValue;
    const latestRoundNote = latestSession?.result.completedAt
        ? formatDateTime(latestSession.result.completedAt, language)
        : copy.coach.noSession;
    const profileValue = skillProfile?.level?.label || copy.coach.profilePending;
    const profileBody = skillProfile?.summary || copy.coach.profileEmpty;
    const handleStartRound = () => navigate('/practice');
    const handleOpenInsights = () => navigate('/insights');

    if (!hasAdvice) {
        return (
            <div className="page-stack coach-page coach-page--starter">
                <CoachStarterPanel
                    copy={copy}
                    onInsights={handleOpenInsights}
                    onStart={handleStartRound}
                />
            </div>
        );
    }

    return (
        <div className="page-stack coach-page">
            <section className="panel coach-hero">
                <div className="coach-hero__copy">
                    <span className="coach-hero__icon" aria-hidden="true">
                        <Sparkles size={26} strokeWidth={2.2} />
                    </span>
                    <div>
                        <p className="panel-kicker">{copy.coach.kicker}</p>
                        <h1>{copy.coach.title}</h1>
                        <p className="muted-text">{copy.coach.body}</p>
                    </div>
                    <div className="coach-hero__actions">
                        <button type="button" className="action-btn primary" onClick={handleStartRound}>
                            <Keyboard aria-hidden="true" size={18} strokeWidth={2.25} />
                            {copy.coach.primaryAction}
                        </button>
                        <button type="button" className="action-btn secondary" onClick={handleOpenInsights}>
                            <LineChart aria-hidden="true" size={18} strokeWidth={2.25} />
                            {copy.coach.secondaryAction}
                        </button>
                    </div>
                </div>

                <div className="coach-brief-card" aria-label={copy.coach.latestTitle}>
                    <div className="coach-brief-card__head">
                        <span className="coach-brief-card__glyph" aria-hidden="true">
                            <BarChart3 size={20} strokeWidth={2.3} />
                        </span>
                        <span className={`panel-badge badge-${hasAdvice ? 'ready' : 'stale'}`}>
                            {hasAdvice ? copy.coach.readyBadge : copy.coach.emptyBadge}
                        </span>
                    </div>
                    <div className="coach-brief-card__rail" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                    </div>
                    <div>
                        <p className="panel-kicker">{copy.coach.latestTitle}</p>
                        <h2>{heroTitle}</h2>
                        <p>{heroBody}</p>
                    </div>
                    {latestCoachAdvice?.comparison?.summary && (
                        <span className="coach-brief-card__signal">
                            <LineChart aria-hidden="true" size={15} strokeWidth={2.25} />
                            {latestCoachAdvice.comparison.summary}
                        </span>
                    )}
                </div>
            </section>

            <section className="coach-grid" aria-label={copy.coach.signalTitle}>
                <CoachSignal icon={CalendarClock} label={copy.coach.latestRoundLabel} value={latestRoundValue} tone="round" />
                <CoachSignal icon={ShieldCheck} label={copy.coach.profileLabel} value={profileValue} tone="profile" />
                <CoachSignal icon={Target} label={copy.coach.weekGoalLabel} value={`${weeklyGoal.completed}/${weeklyGoal.target}`} tone="goal" />
            </section>

            <section className="panel coach-next-panel">
                <div className="coach-next-panel__copy">
                    <p className="panel-kicker">{copy.result.adviceTitle}</p>
                    <h2>{nextDrillTitle}</h2>
                    <p className="lead-text">{nextDrillReason}</p>
                    <div className="coach-next-panel__meta">
                        <span>{copy.coach.latestRoundLabel}: {latestRoundNote}</span>
                        <span>{copy.coach.weekSessionsLabel}: {weeklySessions}</span>
                    </div>
                </div>
                <div className="coach-next-panel__signal">
                    <span className="summary-label">{copy.result.metricsTitle}</span>
                    <strong>{comparisonSummary}</strong>
                    <p>{profileBody}</p>
                </div>
            </section>

            <section className="panel coach-pathway">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{copy.coach.pathKicker}</p>
                        <h2>{copy.coach.pathTitle}</h2>
                    </div>
                </div>
                <div className="coach-pathway__steps">
                    {copy.coach.pathSteps.map((step, index) => (
                        <div key={step.title} className="coach-pathway__step">
                            <span aria-hidden="true">{index + 1}</span>
                            <div>
                                <strong>{step.title}</strong>
                                <p>{step.body}</p>
                            </div>
                            {index < copy.coach.pathSteps.length - 1 && <ArrowRight aria-hidden="true" size={16} strokeWidth={2.25} />}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default CoachPage;
