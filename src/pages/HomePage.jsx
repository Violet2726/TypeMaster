import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildInsights } from '../engine';
import { formatDateTime } from '../i18n';
import { usePracticeStore } from '../store/practice-store';

export function HomePage() {
    const navigate = useNavigate();
    const {
        copy,
        language,
        sessions,
        latestCoachAdvice,
        config,
        updateConfig,
        resetPracticeToBuiltin
    } = usePracticeStore();

    const insights = useMemo(() => buildInsights(sessions), [sessions]);
    const recentSessions = sessions.slice(0, 4);
    const recentBestAccuracy = sessions.slice(0, 7).length
        ? Math.max(...sessions.slice(0, 7).map((session) => session.result.accuracy))
        : 0;

    const openAiPractice = () => {
        updateConfig({ source: 'ai' });
        navigate('/practice');
    };

    const openBuiltInPractice = () => {
        resetPracticeToBuiltin();
        navigate('/practice');
    };

    return (
        <div className="page-stack">
            <section className="hero-card home-hero-card">
                <div className="hero-copy">
                    <p className="hero-kicker">{copy.home.kicker}</p>
                    <h1>{copy.home.title}</h1>
                    <p className="hero-body">{copy.home.body}</p>
                    <div className="hero-actions">
                        <button type="button" className="action-btn primary" onClick={openAiPractice}>
                            {copy.home.primaryCta}
                        </button>
                        <button type="button" className="action-btn" onClick={openBuiltInPractice}>
                            {copy.home.secondaryCta}
                        </button>
                    </div>
                </div>

                <div className="hero-side-grid">
                    <div className="panel inset-card">
                        <p className="panel-kicker">{copy.home.continueTitle}</p>
                        <h2>{copy.common.continueLastSetup}</h2>
                        <p className="muted-text">{copy.home.continueBody}</p>
                        <div className="summary-stack">
                            <div>
                                <span className="summary-label">{copy.practice.sourceTitle}</span>
                                <strong>{config.source === 'ai' ? copy.practice.sourceAi : copy.practice.sourceBuiltin}</strong>
                            </div>
                            <div>
                                <span className="summary-label">{copy.practice.modeTitle}</span>
                                <strong>{config.mode === 'time' ? `${copy.common.timeMode} ${config.durationSeconds}s` : `${copy.common.wordsMode} ${config.wordCount}`}</strong>
                            </div>
                        </div>
                        <button type="button" className="action-btn" onClick={() => navigate('/practice')}>
                            {copy.common.continueLastSetup}
                        </button>
                    </div>

                    <div className="panel inset-card">
                        <p className="panel-kicker">{copy.home.latestCoachTitle}</p>
                        <h2>{latestCoachAdvice?.headline || copy.common.none}</h2>
                        <p className="muted-text">{latestCoachAdvice?.summary || copy.home.emptyCoach}</p>
                    </div>
                </div>
            </section>

            <section className="panel metrics-panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{copy.home.recentTitle}</p>
                        <h2>{copy.home.recentSessions}</h2>
                    </div>
                </div>

                <div className="metric-grid">
                    <div className="metric-card">
                        <span>{copy.common.sessions}</span>
                        <strong>{insights.recent7.count}</strong>
                    </div>
                    <div className="metric-card">
                        <span>{copy.home.avgWpm}</span>
                        <strong>{insights.recent7.avgWpm} {copy.common.wpm}</strong>
                    </div>
                    <div className="metric-card">
                        <span>{copy.home.bestAccuracy}</span>
                        <strong>{recentBestAccuracy ? `${recentBestAccuracy}%` : copy.common.emptyValue}</strong>
                    </div>
                    <div className="metric-card">
                        <span>{copy.home.practiceMix}</span>
                        <strong>{insights.recent7.aiShare}%</strong>
                    </div>
                </div>
            </section>

            <section className="panel dual-grid">
                <div>
                    <p className="panel-kicker">{copy.insights.latestCoach}</p>
                    <h2>{latestCoachAdvice?.headline || copy.common.none}</h2>
                    <p className="lead-text">{latestCoachAdvice?.summary || copy.home.emptyCoach}</p>
                </div>

                <div>
                    <p className="panel-kicker">{copy.insights.recentHistory}</p>
                    <h2>{copy.home.recentSessions}</h2>
                    <div className="session-list">
                        {recentSessions.map((session) => (
                            <div key={session.id} className="session-row">
                                <div>
                                    <strong>{session.sourceTextMeta?.label || copy.common.emptyValue}</strong>
                                    <p className="muted-text">{formatDateTime(session.result.completedAt, language)}</p>
                                </div>
                                <strong>{session.result.wpm} / {session.result.accuracy}%</strong>
                            </div>
                        ))}
                        {!recentSessions.length && <p className="muted-text">{copy.home.recentEmpty}</p>}
                    </div>
                </div>
            </section>
        </div>
    );
}
