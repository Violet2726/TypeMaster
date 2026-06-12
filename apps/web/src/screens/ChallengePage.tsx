'use client';

import { BarChart3, Gauge, Medal, ShieldCheck, Trophy } from 'lucide-react';
import { useAppNavigate } from '../application/use-app-navigate';
import { useChallengePageModel } from '../features/challenge/use-challenge-page-model';
import { ChallengeTrendChart } from '../features/challenge/components/ChallengeTrendChart';
import { useChallengePageStore } from '../store/app-state-selectors';

function buildChallengeFacts(challenge, copy) {
    if (!challenge?.config) {
        return [];
    }

    const { config } = challenge;
    const volume = config.mode === 'words'
        ? `${config.wordCount} ${copy.common.wordsMode}`
        : `${config.durationSeconds}s`;

    return [
        volume,
        config.includeNumbers ? copy.common.numbers : null,
        config.includePunctuation ? copy.common.punctuation : null
    ].filter(Boolean);
}

function ChallengeMetricPill({ icon: Icon, children, tone = 'speed' }) {
    return (
        <span className={`challenge-metric-pill challenge-metric-pill--${tone}`}>
            <Icon aria-hidden="true" size={15} strokeWidth={2.25} />
            {children}
        </span>
    );
}

export function ChallengePage() {
    const navigate = useAppNavigate();
    const store = useChallengePageStore();
    const {
        account,
        challengeSessions,
        challengeTrend,
        copy,
        dailyChallenge,
        handleStart,
        language,
        latestChallengeSession,
        latestGapValue,
        leaderboard,
        peerLeaderboard,
        peerStanding,
        personalBest,
        personalNote,
        personalStanding,
        skillProfile,
        trainingCopy
    } = useChallengePageModel({
        ...store,
        navigate
    });
    const challengeFacts = buildChallengeFacts(dailyChallenge, copy);

    return (
        <div className="page-stack challenge-page">
            <section className="panel insights-header challenge-hero">
                <div className="insights-header__body">
                    <p className="panel-kicker">{trainingCopy.challenge.kicker}</p>
                    <h1>{dailyChallenge?.title || trainingCopy.challenge.title}</h1>
                    <p className="muted-text">{dailyChallenge?.summary || trainingCopy.challenge.body}</p>
                    {challengeFacts.length > 0 && (
                        <div className="challenge-hero__facts" aria-label={trainingCopy.challenge.kicker}>
                            {challengeFacts.map((fact) => (
                                <span key={fact} className="challenge-fact">{fact}</span>
                            ))}
                        </div>
                    )}
                </div>
                <button type="button" className="action-btn primary" onClick={handleStart}>
                    <Trophy aria-hidden="true" size={18} strokeWidth={2.2} />
                    {latestChallengeSession ? trainingCopy.challenge.retryCta : trainingCopy.challenge.cta}
                </button>
            </section>

            <section className="insights-overview-grid">
                <div className="panel insights-latest-card challenge-status-card">
                    <p className="panel-kicker">{trainingCopy.challenge.statusTitle}</p>
                    <h2>{account?.displayName || 'Guest'}</h2>
                    <p className="lead-text">{latestChallengeSession ? trainingCopy.challenge.statusReady : trainingCopy.challenge.statusEmpty}</p>
                    <div className="result-metrics-strip challenge-metrics-grid" aria-label={trainingCopy.challenge.statusTitle}>
                        <div className="result-item challenge-metric">
                            <span className="result-item-label">{copy.result.challengeRankLabel}</span>
                            <span className="result-item-value">{personalStanding ? `#${personalStanding.rank}` : copy.common.emptyValue}</span>
                        </div>
                        <div className="result-item challenge-metric">
                            <span className="result-item-label">{copy.result.challengeEntriesLabel}</span>
                            <span className="result-item-value">{leaderboard.length}</span>
                        </div>
                        <div className="result-item challenge-metric">
                            <span className="result-item-label">{copy.result.challengeBeatLabel}</span>
                            <span className="result-item-value">{personalStanding ? `${personalStanding.beatPercent}%` : copy.common.emptyValue}</span>
                        </div>
                        <div className="result-item challenge-metric">
                            <span className="result-item-label">{copy.result.challengeBestLabel}</span>
                            <span className="result-item-value">
                                {personalBest.isPersonalBest
                                    ? copy.result.challengeBestFresh
                                    : personalBest.gapWpm > 0
                                        ? `-${personalBest.gapWpm} ${copy.common.wpm}`
                                        : personalBest.gapAccuracy > 0
                                            ? `-${personalBest.gapAccuracy}%`
                                            : copy.common.emptyValue}
                            </span>
                        </div>
                    </div>
                    <p className="muted-text">{personalNote}</p>
                    <div className="results-actions">
                        <button type="button" className="action-btn" onClick={() => navigate('/insights')}>
                            <BarChart3 aria-hidden="true" size={17} strokeWidth={2.2} />
                            {copy.common.viewInsights}
                        </button>
                    </div>
                </div>

                <div className="panel insights-latest-card challenge-status-card">
                    <p className="panel-kicker">{trainingCopy.challenge.peerTitle}</p>
                    <h2>{skillProfile?.level?.label || trainingCopy.challenge.peerTitle}</h2>
                    <p className="lead-text">{trainingCopy.challenge.peerBody}</p>
                    <div className="result-metrics-strip challenge-metrics-grid challenge-metrics-grid--peer" aria-label={trainingCopy.challenge.peerTitle}>
                        <div className="result-item challenge-metric">
                            <span className="result-item-label">{copy.result.challengeRankLabel}</span>
                            <span className="result-item-value">{peerStanding ? `#${peerStanding.rank}` : copy.common.emptyValue}</span>
                        </div>
                        <div className="result-item challenge-metric">
                            <span className="result-item-label">{copy.result.challengeEntriesLabel}</span>
                            <span className="result-item-value">{peerLeaderboard.length}</span>
                        </div>
                    </div>
                    {peerLeaderboard.length ? (
                        <div className="history-table">
                            {peerLeaderboard.slice(0, 3).map((entry, index) => (
                                <div key={entry.id} className="history-row challenge-score-row">
                                    <div className="challenge-row-main">
                                        <span className={`challenge-rank-chip${index === 0 ? ' challenge-rank-chip--top' : ''}`}>
                                            #{index + 1}
                                        </span>
                                        <div className="history-row__meta">
                                            <strong>{entry.displayName}</strong>
                                            <p className="muted-text">{new Date(entry.createdAt).toLocaleString(language)}</p>
                                        </div>
                                    </div>
                                    <div className="history-metrics">
                                        <ChallengeMetricPill icon={Gauge}>{entry.wpm} {copy.common.wpm}</ChallengeMetricPill>
                                        <ChallengeMetricPill icon={ShieldCheck} tone="accuracy">{entry.accuracy}%</ChallengeMetricPill>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="muted-text">{trainingCopy.challenge.peerEmpty}</p>
                    )}
                </div>
            </section>

            <section className="panel challenge-replay-section">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{trainingCopy.challenge.historyTitle}</p>
                        <h2>{trainingCopy.challenge.historyTitle}</h2>
                    </div>
                </div>
                <p className="lead-text">{trainingCopy.challenge.historyBody}</p>
                <ChallengeTrendChart copy={copy} trainingCopy={trainingCopy} trend={challengeTrend} />
                <div className="result-metrics-strip challenge-metrics-grid challenge-metrics-grid--history" aria-label={trainingCopy.challenge.historyTitle}>
                    <div className="result-item challenge-metric">
                        <span className="result-item-label">{trainingCopy.challenge.attemptsLabel}</span>
                        <span className="result-item-value">{challengeSessions.length}</span>
                    </div>
                    <div className="result-item challenge-metric">
                        <span className="result-item-label">{trainingCopy.challenge.bestRunLabel}</span>
                        <span className="result-item-value">{personalBest?.bestSession?.result?.wpm ? `${personalBest.bestSession.result.wpm} ${copy.common.wpm}` : copy.common.emptyValue}</span>
                    </div>
                    <div className="result-item challenge-metric">
                        <span className="result-item-label">{trainingCopy.challenge.latestDeltaLabel}</span>
                        <span className="result-item-value">{latestGapValue}</span>
                    </div>
                </div>
                {challengeSessions.length ? (
                    <div className="history-table">
                        {challengeSessions.slice(0, 5).map((session, index) => (
                            <div key={session.id} className="history-row challenge-score-row">
                                <div className="challenge-row-main">
                                    <span className={`challenge-rank-chip${index === 0 ? ' challenge-rank-chip--latest' : ''}`}>
                                        #{challengeSessions.length - index}
                                    </span>
                                    <div className="history-row__meta">
                                        <strong>{index === 0 ? trainingCopy.challenge.latestBadge : `${trainingCopy.challenge.attemptsLabel} #${challengeSessions.length - index}`}</strong>
                                        <p className="muted-text">{new Date(session.result.completedAt).toLocaleString(language)}</p>
                                    </div>
                                </div>
                                <div className="history-metrics">
                                    {personalBest?.bestSession?.id === session.id && (
                                        <span className="panel-badge badge-success challenge-best-badge">
                                            <Trophy aria-hidden="true" size={14} strokeWidth={2.25} />
                                            {trainingCopy.challenge.bestBadge}
                                        </span>
                                    )}
                                    <ChallengeMetricPill icon={Gauge}>{session.result.wpm} {copy.common.wpm}</ChallengeMetricPill>
                                    <ChallengeMetricPill icon={ShieldCheck} tone="accuracy">{session.result.accuracy}%</ChallengeMetricPill>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="muted-text">{trainingCopy.challenge.statusEmpty}</p>
                )}
            </section>

            <section className="panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{trainingCopy.challenge.kicker}</p>
                        <h2>{trainingCopy.challenge.leaderboard}</h2>
                    </div>
                    <button type="button" className="action-btn" onClick={handleStart}>
                        <Trophy aria-hidden="true" size={17} strokeWidth={2.2} />
                        {latestChallengeSession ? trainingCopy.challenge.retryCta : trainingCopy.challenge.cta}
                    </button>
                </div>

                {leaderboard.length ? (
                    <div className="history-table">
                        {leaderboard.map((entry, index) => (
                            <div key={entry.id} className="history-row challenge-score-row">
                                <div className="challenge-row-main">
                                    <span className={`challenge-rank-chip${index === 0 ? ' challenge-rank-chip--top' : ''}`}>
                                        {index === 0 ? <Medal aria-hidden="true" size={15} strokeWidth={2.25} /> : `#${index + 1}`}
                                    </span>
                                    <div className="history-row__meta">
                                        <strong>{entry.displayName}</strong>
                                        <p className="muted-text">{new Date(entry.createdAt).toLocaleString(language)}</p>
                                    </div>
                                </div>
                                <div className="history-metrics">
                                    <ChallengeMetricPill icon={Gauge}>{entry.wpm} {copy.common.wpm}</ChallengeMetricPill>
                                    <ChallengeMetricPill icon={ShieldCheck} tone="accuracy">{entry.accuracy}%</ChallengeMetricPill>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="muted-text">{trainingCopy.challenge.empty}</p>
                )}
            </section>
        </div>
    );
}

export default ChallengePage;
