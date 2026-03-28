import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildInsights } from '../engine';
import { formatDateTime } from '../i18n';
import { usePracticeStore } from '../store/practice-store';

function getModeLabel(copy, config) {
    if (!config) {
        return copy.common.emptyValue;
    }

    return config.mode === 'time'
        ? `${copy.common.timeMode} ${config.durationSeconds}s`
        : `${copy.common.wordsMode} ${config.wordCount}`;
}

function getSourceLabel(copy, source) {
    return source === 'ai' ? copy.practice.sourceAi : copy.practice.sourceBuiltin;
}

export function HomePage() {
    const navigate = useNavigate();
    const { copy, language, sessions, config, resetPracticeToBuiltin } = usePracticeStore();

    const insights = useMemo(() => buildInsights(sessions), [sessions]);
    const recentSessions = sessions.slice(0, 3);
    const recentBestAccuracy = sessions.slice(0, 7).length
        ? Math.max(...sessions.slice(0, 7).map((session) => session.result.accuracy))
        : 0;
    const latestSession = sessions[0] || null;

    const latestModeLabel = latestSession
        ? `${getSourceLabel(copy, latestSession.config?.source)} · ${getModeLabel(copy, latestSession.config)}`
        : `${getSourceLabel(copy, config.source)} · ${getModeLabel(copy, config)}`;

    const handleStartPractice = () => {
        resetPracticeToBuiltin();
        navigate('/practice');
    };

    return (
        <div className="page-stack page-stack--home">
            <section className="home-launch">
                <p className="hero-kicker">{copy.home.kicker}</p>
                <h1>{copy.home.title}</h1>
                <p className="hero-body">{copy.home.body}</p>
                <div className="hero-actions">
                    <button type="button" className="action-btn primary" onClick={handleStartPractice}>
                        {copy.home.primaryCta}
                    </button>
                    <button type="button" className="action-btn" onClick={() => navigate('/practice')}>
                        {copy.home.secondaryCta}
                    </button>
                </div>
            </section>

            <section className="home-stats-strip" aria-label={copy.home.statsTitle}>
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
                                    <strong>{session.sourceTextMeta?.label || copy.common.emptyValue}</strong>
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
        </div>
    );
}
