import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildInsights } from '../engine';
import { formatDateTime } from '../i18n';
import { usePracticeStore } from '../store/practice-store';
import { getTrainingCopy } from '../training/copy';

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

export function HomePage() {
    const navigate = useNavigate();
    const {
        copy,
        language,
        sessions,
        config,
        resetPracticeToBuiltin,
        skillProfile,
        trainingPlan,
        diagnosticJourney,
        trainingPlanProgress,
        sessionStreak,
        weeklySessions,
        weeklyGoal,
        achievements,
        startRecommendedSession
    } = usePracticeStore();

    const trainingCopy = getTrainingCopy(language);
    const insights = useMemo(() => buildInsights(sessions), [sessions]);
    const recentSessions = sessions.slice(0, 3);
    const recentBestAccuracy = sessions.slice(0, 7).length
        ? Math.max(...sessions.slice(0, 7).map((session) => session.result.accuracy))
        : 0;
    const latestSession = sessions[0] || null;
    const latestModeLabel = latestSession
        ? `${getSourceLabel(copy, trainingCopy, latestSession.config?.source)} 路 ${getModeLabel(copy, latestSession.config)}`
        : `${getSourceLabel(copy, trainingCopy, config.source)} 路 ${getModeLabel(copy, config)}`;
    const currentWeakness = skillProfile?.weakZones?.[0]?.label || trainingCopy.home.noWeakness;
    const planPercent = trainingPlanProgress?.percent || 0;
    const hasDiagnosticInFlight = diagnosticJourney?.status === 'active';

    const handleFreePractice = () => {
        resetPracticeToBuiltin();
        navigate('/practice');
    };

    const handlePrimaryAction = () => {
        if (!skillProfile || hasDiagnosticInFlight) {
            navigate('/diagnostic');
            return;
        }

        startRecommendedSession();
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
                <div className="hero-actions">
                    <button type="button" className="action-btn primary" onClick={handlePrimaryAction}>
                        {skillProfile
                            ? trainingCopy.home.continuePlan
                            : hasDiagnosticInFlight
                                ? trainingCopy.home.diagnosticResume
                                : trainingCopy.home.diagnosticCta}
                    </button>
                    <button type="button" className="action-btn" onClick={handleFreePractice}>
                        {trainingCopy.home.freePractice}
                    </button>
                </div>
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

            <section className="insights-overview-grid">
                <div className="panel insights-latest-card">
                    <p className="panel-kicker">{trainingCopy.home.todayKicker}</p>
                    <h2>{trainingPlan?.title || trainingCopy.home.diagnosticTitle}</h2>
                    <p className="lead-text">{trainingPlan?.summary || trainingCopy.home.diagnosticBody}</p>
                    <p className="muted-text">{currentWeakness}</p>
                    {trainingPlan && (
                        <div className="results-actions">
                            <button type="button" className="action-btn" onClick={() => navigate('/plan')}>
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

            <section className="panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{trainingCopy.insights.achievementsTitle}</p>
                        <h2>{trainingCopy.insights.achievementsTitle}</h2>
                    </div>
                </div>
                <div className="tag-list">
                    {achievements.filter((item) => item.unlocked).slice(0, 4).map((achievement) => (
                        <span key={achievement.id} className="tag-pill">{achievement.title}</span>
                    ))}
                </div>
            </section>
        </div>
    );
}

export default HomePage;
