'use client';

import { CalendarClock, Gauge, Keyboard, LineChart, ShieldCheck, Target, Trophy } from 'lucide-react';
import { formatDateTime, formatShortDate, getInlineSeparator } from '../i18n';
import { useAppNavigate } from '../application/use-app-navigate';
import { useInsightsPageModel } from '../features/insights/use-insights-page-model';
import { useInsightsPageStore } from '../store/app-state-selectors';

function HotspotList({ items, emptyText, language }) {
    if (!items.length) {
        return <p className="muted-text">{emptyText}</p>;
    }

    return (
        <div className="tag-list">
            {items.map((item) => (
                <span key={item.label} className="tag-pill">{item.label}{getInlineSeparator(language)}{item.count}</span>
            ))}
        </div>
    );
}

function formatZoneChars(chars, language) {
    return chars.map((item) => `${item.label}${getInlineSeparator(language)}${item.count}`).join(' / ');
}

function KeyboardHotspots({ copy, hotspots, language, onStartDrill }) {
    const labels = copy.insights.keyboardZoneLabels || {};
    const primary = hotspots.primaryZone;

    if (!hotspots.zones.length) {
        return <p className="muted-text">{copy.insights.keyboardEmpty}</p>;
    }

    return (
        <div className="keyboard-hotspots">
            <div className="keyboard-hotspots__primary">
                <span className="keyboard-hotspots__icon" aria-hidden="true">
                    <Keyboard size={20} strokeWidth={2.25} />
                </span>
                <div>
                    <span className="summary-label">{copy.insights.keyboardPrimary}</span>
                    <strong>{labels[primary.id] || primary.id}</strong>
                    <p>{copy.insights.keyboardTotal}: {hotspots.total}</p>
                </div>
                <button type="button" className="action-btn primary" onClick={onStartDrill}>
                    <Target aria-hidden="true" size={18} strokeWidth={2.25} />
                    {copy.insights.keyboardPracticeAction}
                </button>
            </div>
            <div className="keyboard-hotspots__list">
                {hotspots.zones.map((zone) => (
                    <div key={zone.id} className="keyboard-zone-row">
                        <div>
                            <strong>{labels[zone.id] || zone.id}</strong>
                            <span>{formatZoneChars(zone.chars, language) || copy.common.emptyValue}</span>
                        </div>
                        <span className="keyboard-zone-row__share">{zone.share}%</span>
                        <span className="keyboard-zone-row__bar" aria-hidden="true">
                            <span style={{ width: `${zone.share}%` }} />
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HistoryMetric({ icon: Icon, children }) {
    return (
        <span className="history-metric-pill">
            <Icon aria-hidden="true" size={15} strokeWidth={2.25} />
            {children}
        </span>
    );
}

function TargetedProgress({ copy, trend }) {
    if (!trend.latest) {
        return <p className="muted-text">{trend.empty}</p>;
    }

    return (
        <div className="targeted-progress">
            <div className="targeted-progress__summary">
                <div className={`targeted-progress__hero targeted-progress__hero--${trend.latest.badgeTone}`}>
                    <div className="targeted-progress__hero-head">
                        <span className="summary-label">{copy.insights.targetedLatestLabel}</span>
                        <span className={`panel-badge badge-${trend.latest.badgeTone}`}>{trend.latest.badge}</span>
                    </div>
                    <strong>{trend.latest.areaLabel}</strong>
                    <p>{trend.latest.body}</p>
                    <span>{copy.result.targetedFeedbackRemainingLabel}: {trend.latest.remaining}</span>
                </div>

                <div className="summary-stack summary-stack--compact">
                    {trend.counts.map((item) => (
                        <div key={item.id} className="metric-card">
                            <span>{item.label}</span>
                            <strong>{item.value}</strong>
                        </div>
                    ))}
                </div>
            </div>

            <div className="targeted-progress__areas">
                {trend.areas.map((area) => (
                    <div key={area.id} className="targeted-area-row">
                        <div>
                            <strong>{area.label}</strong>
                            <span>{area.note}</span>
                        </div>
                        <span className={`panel-badge badge-${area.badgeTone}`}>{area.badge}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmptyInsightsPreview({ copy, trainingCopy, onStart }) {
    const previewItems = [
        { icon: Trophy, label: copy.insights.bestWpm, value: copy.common.emptyValue, tone: 'best' },
        { icon: LineChart, label: copy.insights.recentTrend, value: copy.common.emptyValue, tone: 'trend' },
        { icon: Target, label: copy.insights.targetedTitle, value: copy.common.emptyValue, tone: 'target' },
        { icon: Keyboard, label: copy.insights.keyboardZonesTitle, value: copy.common.emptyValue, tone: 'keyboard' }
    ];

    return (
        <section className="panel empty-panel insights-empty-panel">
            <div className="insights-empty-panel__copy">
                <p className="panel-kicker">{copy.nav.insights}</p>
                <h2>{copy.insights.emptyTitle}</h2>
                <p className="muted-text">{copy.insights.emptyBody}</p>
                <button type="button" className="action-btn primary" onClick={onStart}>
                    <Keyboard aria-hidden="true" size={18} strokeWidth={2.2} />
                    {copy.insights.emptyAction}
                </button>
            </div>

            <div className="insights-empty-preview" aria-label={copy.nav.insights}>
                <div className="insights-empty-preview__header">
                    <span className="insights-empty-preview__icon" aria-hidden="true">
                        <LineChart aria-hidden="true" size={20} strokeWidth={2.2} />
                    </span>
                    <div>
                        <span className="summary-label">{trainingCopy.insights.radarTitle}</span>
                        <strong>{trainingCopy.insights.weekGoal}</strong>
                    </div>
                </div>
                <div className="insights-empty-preview__grid">
                    {previewItems.map(({ icon: Icon, label, value, tone }) => (
                        <div key={label} className={`insights-empty-preview__item insights-empty-preview__item--${tone}`}>
                            <Icon aria-hidden="true" size={17} strokeWidth={2.1} />
                            <span>{label}</span>
                            <strong>{value}</strong>
                        </div>
                    ))}
                </div>
                <div className="insights-empty-preview__rail" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </div>
            </div>
        </section>
    );
}

export function InsightsPage() {
    const navigate = useAppNavigate();
    const store = useInsightsPageStore();
    const {
        achievements,
        copy,
        handleKeyboardZoneDrill,
        insights,
        language,
        latestCoachAdvice,
        sessions,
        skillProfile,
        streakRisk,
        targetedTrend,
        trainingCopy,
        weeklyGoal,
        weeklySessions
    } = useInsightsPageModel({
        ...store,
        navigate
    });

    if (!sessions.length) {
        return <EmptyInsightsPreview copy={copy} trainingCopy={trainingCopy} onStart={() => navigate('/practice')} />;
    }

    return (
        <div className="page-stack insights-page">
            <section className="panel insights-header insights-hero">
                <div className="insights-header__body">
                    <p className="panel-kicker">{copy.nav.insights}</p>
                    <h1>{copy.insights.title}</h1>
                    <p className="muted-text">{copy.insights.body}</p>
                </div>
                <button type="button" className="action-btn primary" onClick={() => navigate('/practice')}>
                    <Keyboard aria-hidden="true" size={18} strokeWidth={2.2} />
                    {copy.home.primaryCta}
                </button>
            </section>

            <section className="home-stats-strip insights-stats-strip" aria-label={copy.insights.recentTrend}>
                <div className="metric-card insights-stat-card">
                    <span>{copy.insights.bestWpm}</span>
                    <strong>{insights.bestWpmOverall} {copy.common.wpm}</strong>
                </div>
                <div className="metric-card insights-stat-card">
                    <span>{copy.insights.avgAccuracy}</span>
                    <strong>{Math.round(insights.avgAccuracyOverall)}%</strong>
                </div>
                <div className="metric-card insights-stat-card">
                    <span>{copy.insights.recentAvgWpm}</span>
                    <strong>{insights.recent7.avgWpm} {copy.common.wpm}</strong>
                </div>
                <div className="metric-card insights-stat-card">
                    <span>{copy.common.sessions}</span>
                    <strong>{insights.totalSessions}</strong>
                </div>
            </section>

            <section className="insights-overview-grid">
                <div className="panel insights-latest-card">
                    <p className="panel-kicker">{copy.insights.latestCoach}</p>
                    <h2>{latestCoachAdvice?.headline || copy.common.none}</h2>
                    <p className="lead-text">{latestCoachAdvice?.summary || copy.insights.noCoach}</p>
                    <p className="muted-text">{latestCoachAdvice?.comparison?.summary}</p>
                </div>

                <div className="panel">
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{copy.insights.recentTrend}</p>
                            <h2>{copy.insights.sessions7}</h2>
                        </div>
                    </div>
                    <div className="mini-series">
                        {insights.daily7.map((day) => (
                            <div key={day.key} className="mini-series__row">
                                <span>{formatShortDate(day.date, language)}</span>
                                <strong>{day.count ? `${day.avgWpm} ${copy.common.wpm}` : copy.common.emptyValue}</strong>
                                <span>{day.count ? `${Math.round(day.avgAccuracy)}%` : copy.common.emptyValue}</span>
                            </div>
                        ))}
                    </div>
                    <div className="summary-stack summary-stack--compact">
                        <div className="metric-card">
                            <span>{copy.insights.sessions30}</span>
                            <strong>{insights.recent30.count}</strong>
                        </div>
                        <div className="metric-card">
                            <span>{copy.common.wpm}</span>
                            <strong>{insights.recent30.avgWpm}</strong>
                        </div>
                        <div className="metric-card">
                            <span>{copy.common.accuracy}</span>
                            <strong>{Math.round(insights.recent30.avgAccuracy)}%</strong>
                        </div>
                    </div>
                </div>
            </section>

            <section className="insights-overview-grid">
                <div className="panel insights-latest-card">
                    <p className="panel-kicker">{trainingCopy.insights.radarTitle}</p>
                    <h2>{skillProfile?.level?.label || copy.common.emptyValue}</h2>
                    <p className="lead-text">{skillProfile?.summary || trainingCopy.insights.radarBody}</p>
                    <p className="muted-text">{streakRisk}</p>
                </div>

                <div className="panel">
                    <div className="summary-stack summary-stack--compact">
                        <div className="metric-card">
                            <span>{copy.common.accuracy}</span>
                            <strong>{Math.round(skillProfile?.metrics?.avgAccuracy || 0)}%</strong>
                        </div>
                        <div className="metric-card">
                            <span>{copy.common.consistency}</span>
                            <strong>{Math.round(skillProfile?.metrics?.avgConsistency || 0)}%</strong>
                        </div>
                        <div className="metric-card">
                            <span>{copy.common.sessions}</span>
                            <strong>{weeklySessions}</strong>
                        </div>
                        <div className="metric-card">
                            <span>{trainingCopy.insights.weekGoal}</span>
                            <strong>{weeklyGoal.completed}/{weeklyGoal.target}</strong>
                        </div>
                    </div>
                </div>
            </section>

            <section className="panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{copy.insights.targetedTitle}</p>
                        <h2>{copy.insights.targetedTitle}</h2>
                    </div>
                </div>
                <p className="muted-text">{copy.insights.targetedBody}</p>
                <TargetedProgress copy={copy} trend={targetedTrend} />
            </section>

            <section className="panel insights-keyboard-panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{copy.insights.keyboardZonesTitle}</p>
                        <h2>{copy.insights.keyboardZonesTitle}</h2>
                    </div>
                </div>
                <p className="muted-text">{copy.insights.keyboardZonesBody}</p>
                <KeyboardHotspots
                    copy={copy}
                    hotspots={insights.keyboardHotspots}
                    language={language}
                    onStartDrill={handleKeyboardZoneDrill}
                />
            </section>

            <section className="panel">
                <div className="insights-hotspots">
                    <div>
                        <p className="panel-kicker">{copy.insights.topErrorChars}</p>
                        <h2>{copy.insights.topErrorChars}</h2>
                        <HotspotList items={insights.topErrorChars} emptyText={copy.insights.noErrors} language={language} />
                    </div>
                    <div>
                        <p className="panel-kicker">{copy.insights.topErrorWords}</p>
                        <h2>{copy.insights.topErrorWords}</h2>
                        <HotspotList items={insights.topErrorWords} emptyText={copy.insights.noErrors} language={language} />
                    </div>
                </div>
            </section>

            <section className="panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{trainingCopy.insights.achievementsTitle}</p>
                        <h2>{trainingCopy.insights.achievementsTitle}</h2>
                    </div>
                </div>
                <p className="muted-text">{trainingCopy.insights.achievementsBody}</p>
                <div className="tag-list">
                    {achievements.map((achievement) => (
                        <span
                            key={achievement.id}
                            className="tag-pill"
                            style={{ opacity: achievement.unlocked ? 1 : 0.45 }}
                        >
                            {achievement.title}
                        </span>
                    ))}
                </div>
            </section>

            <section className="panel home-records-panel insights-history-panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{copy.insights.recentHistory}</p>
                        <h2>{copy.insights.recentHistory}</h2>
                    </div>
                </div>

                <div className="history-table">
                    {sessions.slice(0, 10).map((session) => (
                        <div key={session.id} className="history-row">
                            <div className="history-row__meta">
                                <strong>{session.sourceTextMeta?.label || copy.common.emptyValue}</strong>
                                <p className="muted-text">{formatDateTime(session.result.completedAt, language)}</p>
                            </div>
                            <div className="history-metrics">
                                <HistoryMetric icon={Gauge}>{session.result.wpm} {copy.common.wpm}</HistoryMetric>
                                <HistoryMetric icon={ShieldCheck}>{session.result.accuracy}%</HistoryMetric>
                                <HistoryMetric icon={CalendarClock}>{session.result.consistency}%</HistoryMetric>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default InsightsPage;
