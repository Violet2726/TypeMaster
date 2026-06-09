'use client';

import { useAppNavigate } from '../application/use-app-navigate';
import { useChallengePageModel } from '../features/challenge/use-challenge-page-model';
import { ChallengeTrendChart } from '../features/challenge/components/ChallengeTrendChart';
import { useChallengePageStore } from '../store/app-state-selectors';

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

    return (
        <div className="page-stack">
            <section className="panel insights-header">
                <div className="insights-header__body">
                    <p className="panel-kicker">{trainingCopy.challenge.kicker}</p>
                    <h1>{dailyChallenge?.title || trainingCopy.challenge.title}</h1>
                    <p className="muted-text">{dailyChallenge?.summary || trainingCopy.challenge.body}</p>
                </div>
                <button type="button" className="action-btn primary" onClick={handleStart}>
                    {latestChallengeSession ? trainingCopy.challenge.retryCta : trainingCopy.challenge.cta}
                </button>
            </section>

            <section className="insights-overview-grid">
                <div className="panel insights-latest-card">
                    <p className="panel-kicker">{trainingCopy.challenge.statusTitle}</p>
                    <h2>{account?.displayName || 'Guest'}</h2>
                    <p className="lead-text">{latestChallengeSession ? trainingCopy.challenge.statusReady : trainingCopy.challenge.statusEmpty}</p>
                    <div className="result-metrics-strip" aria-label={trainingCopy.challenge.statusTitle}>
                        <div className="result-item">
                            <span className="result-item-label">{copy.result.challengeRankLabel}</span>
                            <span className="result-item-value">{personalStanding ? `#${personalStanding.rank}` : copy.common.emptyValue}</span>
                        </div>
                        <div className="result-item">
                            <span className="result-item-label">{copy.result.challengeEntriesLabel}</span>
                            <span className="result-item-value">{leaderboard.length}</span>
                        </div>
                        <div className="result-item">
                            <span className="result-item-label">{copy.result.challengeBeatLabel}</span>
                            <span className="result-item-value">{personalStanding ? `${personalStanding.beatPercent}%` : copy.common.emptyValue}</span>
                        </div>
                        <div className="result-item">
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
                            {copy.common.viewInsights}
                        </button>
                    </div>
                </div>

                <div className="panel insights-latest-card">
                    <p className="panel-kicker">{trainingCopy.challenge.peerTitle}</p>
                    <h2>{skillProfile?.level?.label || trainingCopy.challenge.peerTitle}</h2>
                    <p className="lead-text">{trainingCopy.challenge.peerBody}</p>
                    <div className="result-metrics-strip" aria-label={trainingCopy.challenge.peerTitle}>
                        <div className="result-item">
                            <span className="result-item-label">{copy.result.challengeRankLabel}</span>
                            <span className="result-item-value">{peerStanding ? `#${peerStanding.rank}` : copy.common.emptyValue}</span>
                        </div>
                        <div className="result-item">
                            <span className="result-item-label">{copy.result.challengeEntriesLabel}</span>
                            <span className="result-item-value">{peerLeaderboard.length}</span>
                        </div>
                    </div>
                    {peerLeaderboard.length ? (
                        <div className="history-table">
                            {peerLeaderboard.slice(0, 3).map((entry) => (
                                <div key={entry.id} className="history-row">
                                    <div className="history-row__meta">
                                        <strong>{entry.displayName}</strong>
                                        <p className="muted-text">{new Date(entry.createdAt).toLocaleString(language)}</p>
                                    </div>
                                    <div className="history-metrics">
                                        <span>{entry.wpm} WPM</span>
                                        <span>{entry.accuracy}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="muted-text">{trainingCopy.challenge.peerEmpty}</p>
                    )}
                </div>
            </section>

            <section className="panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{trainingCopy.challenge.historyTitle}</p>
                        <h2>{trainingCopy.challenge.historyTitle}</h2>
                    </div>
                </div>
                <p className="lead-text">{trainingCopy.challenge.historyBody}</p>
                <ChallengeTrendChart copy={copy} trainingCopy={trainingCopy} trend={challengeTrend} />
                <div className="result-metrics-strip" aria-label={trainingCopy.challenge.historyTitle}>
                    <div className="result-item">
                        <span className="result-item-label">{trainingCopy.challenge.attemptsLabel}</span>
                        <span className="result-item-value">{challengeSessions.length}</span>
                    </div>
                    <div className="result-item">
                        <span className="result-item-label">{trainingCopy.challenge.bestRunLabel}</span>
                        <span className="result-item-value">{personalBest?.bestSession?.result?.wpm ? `${personalBest.bestSession.result.wpm} ${copy.common.wpm}` : copy.common.emptyValue}</span>
                    </div>
                    <div className="result-item">
                        <span className="result-item-label">{trainingCopy.challenge.latestDeltaLabel}</span>
                        <span className="result-item-value">{latestGapValue}</span>
                    </div>
                </div>
                {challengeSessions.length ? (
                    <div className="history-table">
                        {challengeSessions.slice(0, 5).map((session, index) => (
                            <div key={session.id} className="history-row">
                                <div className="history-row__meta">
                                    <strong>{index === 0 ? trainingCopy.challenge.latestBadge : `${trainingCopy.challenge.attemptsLabel} #${challengeSessions.length - index}`}</strong>
                                    <p className="muted-text">{new Date(session.result.completedAt).toLocaleString(language)}</p>
                                </div>
                                <div className="history-metrics">
                                    {personalBest?.bestSession?.id === session.id && (
                                        <span className="panel-badge badge-success">{trainingCopy.challenge.bestBadge}</span>
                                    )}
                                    <span>{session.result.wpm} {copy.common.wpm}</span>
                                    <span>{session.result.accuracy}%</span>
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
                        {latestChallengeSession ? trainingCopy.challenge.retryCta : trainingCopy.challenge.cta}
                    </button>
                </div>

                {leaderboard.length ? (
                    <div className="history-table">
                        {leaderboard.map((entry) => (
                            <div key={entry.id} className="history-row">
                                <div className="history-row__meta">
                                    <strong>{entry.displayName}</strong>
                                    <p className="muted-text">{new Date(entry.createdAt).toLocaleString(language)}</p>
                                </div>
                                <div className="history-metrics">
                                    <span>{entry.wpm} WPM</span>
                                    <span>{entry.accuracy}%</span>
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
