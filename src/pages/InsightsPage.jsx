import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildInsights } from '../engine';
import { formatDateTime, formatShortDate } from '../i18n';
import { usePracticeStore } from '../store/practice-store';

function HotspotList({ items, emptyText }) {
    if (!items.length) {
        return <p className="muted-text">{emptyText}</p>;
    }

    return (
        <div className="tag-list">
            {items.map((item) => (
                <span key={item.label} className="tag-pill">{item.label} · {item.count}</span>
            ))}
        </div>
    );
}

export function InsightsPage() {
    const navigate = useNavigate();
    const { copy, language, sessions, latestCoachAdvice } = usePracticeStore();
    const insights = useMemo(() => buildInsights(sessions), [sessions]);

    if (!sessions.length) {
        return (
            <section className="panel empty-panel">
                <h2>{copy.insights.emptyTitle}</h2>
                <p className="muted-text">{copy.insights.emptyBody}</p>
                <button type="button" className="action-btn primary" onClick={() => navigate('/practice')}>
                    {copy.insights.emptyAction}
                </button>
            </section>
        );
    }

    return (
        <div className="page-stack">
            <section className="panel insights-hero">
                <div>
                    <p className="panel-kicker">{copy.insights.heroKicker}</p>
                    <h1>{copy.insights.heroTitle}</h1>
                    <p className="hero-body">{copy.insights.heroBody}</p>
                </div>
                <button type="button" className="action-btn primary" onClick={() => navigate('/practice')}>
                    {copy.home.primaryCta}
                </button>
            </section>

            <section className="panel dual-grid">
                <div className="coach-highlight">
                    <p className="panel-kicker">{copy.insights.latestCoach}</p>
                    <h2>{latestCoachAdvice?.headline || copy.common.none}</h2>
                    <p className="lead-text">{latestCoachAdvice?.summary || copy.insights.noCoach}</p>
                    <p className="muted-text">{latestCoachAdvice?.comparison?.summary}</p>
                </div>

                <div className="metric-grid">
                    <div className="metric-card">
                        <span>{copy.insights.bestWpm}</span>
                        <strong>{insights.bestWpmOverall} {copy.common.wpm}</strong>
                    </div>
                    <div className="metric-card">
                        <span>{copy.insights.avgAccuracy}</span>
                        <strong>{Math.round(insights.avgAccuracyOverall)}%</strong>
                    </div>
                    <div className="metric-card">
                        <span>{copy.insights.aiShare}</span>
                        <strong>{insights.aiShareOverall}%</strong>
                    </div>
                    <div className="metric-card">
                        <span>{copy.common.sessions}</span>
                        <strong>{insights.totalSessions}</strong>
                    </div>
                </div>
            </section>

            <section className="panel dual-grid">
                <div>
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
                </div>

                <div>
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{copy.insights.recentTrend}</p>
                            <h2>{copy.insights.sessions30}</h2>
                        </div>
                    </div>
                    <div className="summary-stack">
                        <div className="metric-card">
                            <span>{copy.common.sessions}</span>
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

            <section className="panel dual-grid">
                <div>
                    <p className="panel-kicker">{copy.insights.topErrorChars}</p>
                    <h2>{copy.insights.topErrorChars}</h2>
                    <HotspotList items={insights.topErrorChars} emptyText={copy.insights.noErrors} />
                </div>
                <div>
                    <p className="panel-kicker">{copy.insights.topErrorWords}</p>
                    <h2>{copy.insights.topErrorWords}</h2>
                    <HotspotList items={insights.topErrorWords} emptyText={copy.insights.noErrors} />
                </div>
            </section>

            <section className="panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{copy.insights.recentHistory}</p>
                        <h2>{copy.insights.recentHistory}</h2>
                    </div>
                </div>

                <div className="history-table">
                    {sessions.slice(0, 10).map((session) => (
                        <div key={session.id} className="history-row">
                            <div>
                                <strong>{session.sourceTextMeta?.label || copy.common.emptyValue}</strong>
                                <p className="muted-text">{formatDateTime(session.result.completedAt, language)}</p>
                            </div>
                            <div className="history-metrics">
                                <span>{session.result.wpm} {copy.common.wpm}</span>
                                <span>{session.result.accuracy}%</span>
                                <span>{session.result.consistency}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

