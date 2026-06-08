import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildInsights } from '../engine';
import { formatDateTime, formatShortDate } from '../i18n';
import { usePracticeStore } from '../store/practice-store';
import { getTrainingCopy } from '../training/copy';

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
    const {
        copy,
        language,
        sessions,
        latestCoachAdvice,
        skillProfile,
        trainingPlanProgress,
        sessionStreak,
        weeklySessions,
        weeklyGoal,
        achievements
    } = usePracticeStore();
    const insights = useMemo(() => buildInsights(sessions), [sessions]);
    const trainingCopy = getTrainingCopy(language);
    const streakRisk = sessionStreak >= 3 ? trainingCopy.insights.riskLow : trainingCopy.insights.riskHigh;

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
            <section className="panel insights-header">
                <div className="insights-header__body">
                    <p className="panel-kicker">{copy.nav.insights}</p>
                    <h1>{copy.insights.title}</h1>
                    <p className="muted-text">{copy.insights.body}</p>
                </div>
                <button type="button" className="action-btn primary" onClick={() => navigate('/practice')}>
                    {copy.home.primaryCta}
                </button>
            </section>

            <section className="home-stats-strip" aria-label={copy.insights.recentTrend}>
                <div className="metric-card">
                    <span>{copy.insights.bestWpm}</span>
                    <strong>{insights.bestWpmOverall} {copy.common.wpm}</strong>
                </div>
                <div className="metric-card">
                    <span>{copy.insights.avgAccuracy}</span>
                    <strong>{Math.round(insights.avgAccuracyOverall)}%</strong>
                </div>
                <div className="metric-card">
                    <span>{copy.insights.recentAvgWpm}</span>
                    <strong>{insights.recent7.avgWpm} {copy.common.wpm}</strong>
                </div>
                <div className="metric-card">
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
                <div className="insights-hotspots">
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

            <section className="panel home-records-panel">
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

export default InsightsPage;
