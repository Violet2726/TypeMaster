'use client';

import { useSearchParams } from 'next/navigation';
import { ArrowRight, BarChart3, Clock3, Gauge, Hash, Keyboard, RotateCw, Sparkles, Target, Trophy } from 'lucide-react';
import { getErrorMessage } from '../i18n';
import { useAppNavigate } from '../application/use-app-navigate';
import { TrendChart } from '../features/result/components/TrendChart';
import { useResultPageModel, getCoachBadgeLabel } from '../features/result/use-result-page-model';
import { useResultPageStore } from '../store/app-state-selectors';

function DecisionActionIcon({ action }) {
    if (action === 'diagnostic') {
        return <RotateCw aria-hidden="true" size={18} strokeWidth={2.3} />;
    }

    if (action === 'leaderboard') {
        return <Trophy aria-hidden="true" size={18} strokeWidth={2.3} />;
    }

    if (action === 'insights') {
        return <BarChart3 aria-hidden="true" size={18} strokeWidth={2.3} />;
    }

    if (action === 'free' || action === 'nextDrill' || action === 'plan') {
        return <Keyboard aria-hidden="true" size={18} strokeWidth={2.3} />;
    }

    return <ArrowRight aria-hidden="true" size={18} strokeWidth={2.3} />;
}

export function ResultPage() {
    const searchParams = useSearchParams();
    const navigate = useAppNavigate();
    const store = useResultPageStore();
    const summarySeparator = store.language === 'en-US' ? ' \u00b7 ' : ' / ';
    const {
        advice,
        challengeFocusDelta,
        challengeFocusNote,
        challengeFocusState,
        previewChallengeStanding,
        challengeState,
        challengeStanding,
        coachStatus,
        comparison,
        copy,
        handleDecisionAction,
        handleRetryAdvice,
        isChallengeSession,
        nextDrillError,
        nextDrillState,
        resultDecision,
        resultPrescription,
        session,
        targetedFeedback,
        trainingCopy
    } = useResultPageModel({
        ...store,
        navigate,
        sessionId: searchParams.get('session')
    });

    if (!session) {
        return (
            <section className="panel empty-panel result-empty-panel">
                <div className="result-empty-panel__icon" aria-hidden="true">
                    <Sparkles size={26} strokeWidth={2.2} />
                </div>
                <div>
                    <p className="panel-kicker">{copy.result.heroKicker}</p>
                    <h2>{copy.result.emptyTitle}</h2>
                    <p className="muted-text">{copy.result.emptyBody}</p>
                </div>
                <button type="button" className="action-btn primary" onClick={() => navigate('/practice')}>
                    <Keyboard aria-hidden="true" size={18} strokeWidth={2.3} />
                    {copy.result.emptyAction}
                </button>
            </section>
        );
    }

    const visibleChallengeStanding = challengeStanding?.standing
        ? challengeStanding
        : previewChallengeStanding || null;

    return (
        <div className="page-stack result-page">
            <section className="panel result-completion-stage" aria-labelledby="result-summary-title">
                <div className="result-summary result-summary-hero result-completion-stage__summary">
                    <div className="result-summary__scores">
                        <div className="result-big result-score-card result-score-card--speed">
                            <span className="result-label">{copy.common.wpm}</span>
                            <span className="result-value">{session.result.wpm}</span>
                        </div>
                        <div className="result-big result-score-card result-score-card--accuracy">
                            <span className="result-label">{copy.common.accuracy}</span>
                            <span className="result-value">{session.result.accuracy}<span className="result-unit">%</span></span>
                        </div>
                    </div>

                    <div className="result-copy">
                        <p className="panel-kicker">{copy.result.heroKicker}</p>
                        <h2 id="result-summary-title">{comparison.summary}</h2>
                        <p className="muted-text">
                            {session.sourceTextMeta?.label || copy.common.emptyValue}{summarySeparator}{copy.common.consistency} {session.result.consistency}%
                        </p>
                        <div className="result-summary__chips" aria-label={copy.result.metricsTitle}>
                            <span>{copy.common.duration} {session.result.durationSeconds}s</span>
                            <span>{copy.common.rawWpm} {session.result.rawWpm}</span>
                            <span>{copy.common.characterStats} {session.result.correctChars}/{session.result.incorrectChars}</span>
                        </div>
                    </div>
                </div>

                <div className="result-decision-panel result-completion-stage__decision" aria-labelledby="result-decision-title">
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{trainingCopy.result.planTitle}</p>
                            <h2 id="result-decision-title">{resultDecision.headline}</h2>
                        </div>
                        <span className={`panel-badge badge-${resultDecision.badgeTone || 'ready'}`}>
                            <Sparkles aria-hidden="true" size={14} strokeWidth={2.2} />
                            {resultDecision.badge}
                        </span>
                    </div>

                    <div className="result-decision-panel__body">
                        <p className="lead-text">{resultDecision.body}</p>
                        <div className="result-decision-signal">
                            <span className="summary-label">{resultDecision.signalLabel}</span>
                            <strong>{resultDecision.signal}</strong>
                        </div>
                    </div>

                    <div className="results-actions">
                        <button
                            type="button"
                            className="action-btn primary"
                            onClick={() => handleDecisionAction(resultDecision.primaryAction)}
                            disabled={resultDecision.isLoading}
                        >
                            <DecisionActionIcon action={resultDecision.primaryAction} />
                            {resultDecision.isLoading ? copy.common.loading : resultDecision.primaryLabel}
                        </button>
                        {resultDecision.secondaryActions.map((action) => (
                            <button
                                key={action.action}
                                type="button"
                                className="action-btn"
                                onClick={() => handleDecisionAction(action.action)}
                            >
                                <DecisionActionIcon action={action.action} />
                                {action.label}
                            </button>
                        ))}
                    </div>

                    {resultPrescription && (
                        <div className="result-prescription" aria-label={resultPrescription.title}>
                            <div className="result-prescription__head">
                                <strong>{resultPrescription.title}</strong>
                                <span>{resultPrescription.body}</span>
                            </div>
                            <div className="result-prescription__grid">
                                {resultPrescription.items.map((item) => (
                                    <div key={item.id} className={`result-prescription__item result-prescription__item--${item.tone}`}>
                                        <span className="summary-label">{item.label}</span>
                                        <strong>{item.value}</strong>
                                        <p>{item.note}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="result-metrics-strip result-kpi-strip result-completion-stage__metrics" aria-label={copy.result.metricsTitle}>
                    <div className="result-item result-kpi-item">
                        <Gauge aria-hidden="true" size={18} strokeWidth={2.2} />
                        <span className="result-item-label">{copy.common.rawWpm}</span>
                        <span className="result-item-value">{session.result.rawWpm}</span>
                    </div>
                    <div className="result-item result-kpi-item">
                        <Target aria-hidden="true" size={18} strokeWidth={2.2} />
                        <span className="result-item-label">{copy.common.consistency}</span>
                        <span className="result-item-value">{session.result.consistency}%</span>
                    </div>
                    <div className="result-item result-kpi-item">
                        <Clock3 aria-hidden="true" size={18} strokeWidth={2.2} />
                        <span className="result-item-label">{copy.common.duration}</span>
                        <span className="result-item-value">{session.result.durationSeconds}s</span>
                    </div>
                    <div className="result-item result-kpi-item">
                        <Hash aria-hidden="true" size={18} strokeWidth={2.2} />
                        <span className="result-item-label">{copy.common.characterStats}</span>
                        <span className="result-item-value">
                            {session.result.correctChars}/{session.result.incorrectChars}/{session.result.extraChars}/{session.result.missedChars}
                        </span>
                    </div>
                </div>
            </section>

            {targetedFeedback && (
                <section className={`panel result-target-feedback result-target-feedback--${targetedFeedback.badgeTone}`}>
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{session.sourceTextMeta?.label || copy.result.heroKicker}</p>
                            <h2>{targetedFeedback.title}</h2>
                        </div>
                        <span className={`panel-badge badge-${targetedFeedback.badgeTone}`}>{targetedFeedback.badge}</span>
                    </div>

                    <p className="lead-text">{targetedFeedback.body}</p>
                    <div className="result-target-feedback__chips" aria-label={targetedFeedback.title}>
                        {targetedFeedback.chips.map((chip) => (
                            <div key={chip.label} className="adaptive-drill-chip">
                                <span>{chip.label}</span>
                                <strong>{chip.value}</strong>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {isChallengeSession && (
                <section className="panel result-advice-panel">
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{session.trainingMeta?.title || trainingCopy.challenge.kicker}</p>
                            <h2>{copy.result.challengeStandingTitle}</h2>
                        </div>
                        <span className={`panel-badge badge-${challengeState === 'success' ? 'ready' : challengeState === 'error' ? 'error' : 'loading'}`}>
                            {challengeState === 'success' && challengeStanding?.standing
                                ? `#${challengeStanding.standing.rank}/${challengeStanding.standing.total}`
                                : trainingCopy.challenge.leaderboard}
                        </span>
                    </div>

                    <div className={`feedback-card feedback-info result-challenge-focus result-challenge-focus--${challengeFocusState}`}>
                        <strong>{trainingCopy.challenge.trendFocusTitle}</strong>
                        <p>{challengeFocusNote}</p>
                        {challengeFocusDelta && <p className="muted-text">{challengeFocusDelta}</p>}
                    </div>

                    {challengeState === 'loading' && (
                        <div className="feedback-card feedback-info">
                            <strong>{copy.result.challengeStandingSyncTitle}</strong>
                            <p>{copy.result.challengeStandingBody}</p>
                        </div>
                    )}

                    {challengeState === 'pending' && (
                        <div className="feedback-card feedback-info">
                            <strong>{copy.result.challengeStandingSyncTitle}</strong>
                            <p>{copy.result.challengeStandingSyncBody}</p>
                        </div>
                    )}

                    {challengeState === 'error' && (
                        <div className="feedback-card feedback-error">
                            <strong>{copy.result.challengeStandingErrorTitle}</strong>
                            <p>{copy.result.challengeStandingErrorBody}</p>
                        </div>
                    )}

                    {visibleChallengeStanding && (
                        <>
                            <div className="result-metrics-strip" aria-label={copy.result.challengeStandingTitle}>
                                <div className="result-item">
                                    <span className="result-item-label">{copy.result.challengeRankLabel}</span>
                                    <span className="result-item-value">
                                        {visibleChallengeStanding?.standing
                                            ? `#${visibleChallengeStanding.standing.rank}`
                                            : copy.common.emptyValue}
                                    </span>
                                </div>
                                <div className="result-item">
                                    <span className="result-item-label">{copy.result.challengeEntriesLabel}</span>
                                    <span className="result-item-value">
                                        {visibleChallengeStanding?.standing
                                            ? visibleChallengeStanding.standing.total
                                            : copy.common.emptyValue}
                                    </span>
                                </div>
                                <div className="result-item">
                                    <span className="result-item-label">{copy.result.challengeBeatLabel}</span>
                                    <span className="result-item-value">
                                        {visibleChallengeStanding?.standing
                                            ? `${visibleChallengeStanding.standing.beatPercent}%`
                                            : copy.common.emptyValue}
                                    </span>
                                </div>
                                <div className="result-item">
                                    <span className="result-item-label">{copy.result.challengeBestLabel}</span>
                                    <span className="result-item-value">{visibleChallengeStanding.bestValue || copy.common.emptyValue}</span>
                                </div>
                            </div>
                            <p className="lead-text">{visibleChallengeStanding.note || copy.result.challengeStandingBody}</p>
                        </>
                    )}
                </section>
            )}

            <section className="panel result-advice-panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{copy.result.adviceTitle}</p>
                        <h2>{advice.headline}</h2>
                    </div>
                    <span className={`panel-badge badge-${coachStatus}`}>{getCoachBadgeLabel(copy, coachStatus)}</span>
                </div>

                <p className="lead-text">{advice.body}</p>
                {advice.note && <p className="muted-text">{advice.note}</p>}

                {nextDrillState === 'loading' && (
                    <div className="feedback-card feedback-info">
                        <strong>{copy.common.loading}</strong>
                        <p>{copy.result.nextDrillLoading}</p>
                    </div>
                )}

                {nextDrillState === 'error' && (
                    <div className="feedback-card feedback-error">
                        <strong>{getErrorMessage(store.language, nextDrillError?.code || 'unknown').title}</strong>
                        <p>{copy.result.nextDrillError}</p>
                    </div>
                )}

                {(advice.canRetry || coachStatus === 'error') && (
                    <div className="results-actions">
                        <button type="button" className="action-btn" onClick={handleRetryAdvice}>
                            {copy.common.refreshAdvice}
                        </button>
                    </div>
                )}
            </section>

            {session.timeline?.wpm?.length ? (
                <TrendChart
                    copy={copy}
                    timeline={session.timeline || { samples: [], labels: [], wpm: [], raw: [], accuracy: [], burst: [], errors: [], pauseMoments: [] }}
                />
            ) : null}
        </div>
    );
}

export default ResultPage;
