import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TrendChart } from '../components/TrendChart';
import { deriveComparison } from '../engine';
import { getErrorMessage } from '../i18n';
import { usePracticeStore } from '../store/practice-store';
import { getTrainingCopy } from '../training/copy';

function getCoachBadgeLabel(copy, status) {
    if (status === 'success') return copy.common.coachReady;
    if (status === 'fallback') return copy.common.coachFallback;
    if (status === 'loading' || status === 'idle') return copy.common.coachLoading;
    return copy.common.coachError;
}

function buildAdviceModel(copy, language, status, issue, coachRecord) {
    const fallbackCode = coachRecord?.fallbackReasonCode || issue?.code || 'unknown';
    const errorCopy = getErrorMessage(language, fallbackCode);

    if ((status === 'loading' || status === 'idle') && !coachRecord) {
        return {
            headline: copy.result.coachLoadingTitle,
            body: copy.result.coachLoadingBody,
            note: '',
            canRetry: false
        };
    }

    if (status === 'error' && !coachRecord) {
        return {
            headline: copy.result.coachErrorTitle,
            body: copy.result.coachErrorBody,
            note: errorCopy.title,
            canRetry: true
        };
    }

    return {
        headline: coachRecord?.headline || copy.result.adviceTitle,
        body: coachRecord?.nextDrill?.reason || coachRecord?.summary || copy.result.nextReasonFallback,
        note: status === 'fallback'
            ? `${errorCopy.title} · ${copy.result.coachFallbackBody}`
            : coachRecord?.summary || '',
        canRetry: status === 'fallback'
    };
}

export function ResultPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const {
        copy,
        language,
        sessions,
        lastCompletedSession,
        getAdviceForSession,
        getCoachStatusForSession,
        getCoachIssueForSession,
        generateCoachForSession,
        launchNextDrill,
        activeTrainingStep,
        trainingPlan,
        startTrainingPlanStep
    } = usePracticeStore();
    const trainingCopy = getTrainingCopy(language);

    const sessionId = searchParams.get('session');
    const session = useMemo(
        () => sessions.find((item) => item.id === sessionId) || lastCompletedSession,
        [lastCompletedSession, sessionId, sessions]
    );

    const [coachRecord, setCoachRecord] = useState(() => (session ? getAdviceForSession(session.id) : null));
    const [nextDrillState, setNextDrillState] = useState('idle');
    const [nextDrillError, setNextDrillError] = useState(null);

    const coachStatus = session ? getCoachStatusForSession(session.id) : 'idle';
    const coachIssue = session ? getCoachIssueForSession(session.id) : null;

    useEffect(() => {
        if (!session) {
            return;
        }

        const existing = getAdviceForSession(session.id);
        if (existing) {
            setCoachRecord(existing);
            return;
        }

        let active = true;
        generateCoachForSession(session.id)
            .then((record) => {
                if (active) {
                    setCoachRecord(record);
                }
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, [generateCoachForSession, getAdviceForSession, session]);

    if (!session) {
        return (
            <section className="panel empty-panel">
                <h2>{copy.result.emptyTitle}</h2>
                <p className="muted-text">{copy.result.emptyBody}</p>
                <button type="button" className="action-btn primary" onClick={() => navigate('/practice')}>
                    {copy.result.emptyAction}
                </button>
            </section>
        );
    }

    const comparison = coachRecord?.comparison || deriveComparison(sessions, session.id, session.result, language);
    const advice = buildAdviceModel(copy, language, coachStatus, coachIssue, coachRecord);

    const handleRetryAdvice = async () => {
        const record = await generateCoachForSession(session.id, { force: true });
        setCoachRecord(record);
    };

    const handleNextDrill = async () => {
        if (activeTrainingStep) {
            startTrainingPlanStep();
            navigate('/practice');
            return;
        }

        if (!coachRecord?.nextDrill) {
            navigate('/practice');
            return;
        }

        setNextDrillState('loading');
        setNextDrillError(null);

        try {
            await launchNextDrill(coachRecord);
            setNextDrillState('idle');
            navigate('/practice');
        } catch (error) {
            setNextDrillState('error');
            setNextDrillError(error);
        }
    };

    return (
        <div className="page-stack">
            <section className="panel result-summary">
                <div className="result-summary__scores">
                    <div className="result-big">
                        <span className="result-label">{copy.common.wpm}</span>
                        <span className="result-value">{session.result.wpm}</span>
                    </div>
                    <div className="result-big">
                        <span className="result-label">{copy.common.accuracy}</span>
                        <span className="result-value">{session.result.accuracy}<span className="result-unit">%</span></span>
                    </div>
                </div>

                <div className="result-copy">
                    <p className="panel-kicker">{copy.result.heroKicker}</p>
                    <h2>{comparison.summary}</h2>
                    <p className="muted-text">
                        {session.sourceTextMeta?.label || copy.common.emptyValue} · {copy.common.consistency} {session.result.consistency}%
                    </p>
                </div>
            </section>

            <section className="result-metrics-strip" aria-label={copy.result.metricsTitle}>
                <div className="result-item">
                    <span className="result-item-label">{copy.common.rawWpm}</span>
                    <span className="result-item-value">{session.result.rawWpm}</span>
                </div>
                <div className="result-item">
                    <span className="result-item-label">{copy.common.consistency}</span>
                    <span className="result-item-value">{session.result.consistency}%</span>
                </div>
                <div className="result-item">
                    <span className="result-item-label">{copy.common.duration}</span>
                    <span className="result-item-value">{session.result.durationSeconds}s</span>
                </div>
                <div className="result-item">
                    <span className="result-item-label">{copy.common.characterStats}</span>
                    <span className="result-item-value">
                        {session.result.correctChars}/{session.result.incorrectChars}/{session.result.extraChars}/{session.result.missedChars}
                    </span>
                </div>
            </section>

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
                        <strong>{getErrorMessage(language, nextDrillError?.code || 'unknown').title}</strong>
                        <p>{copy.result.nextDrillError}</p>
                    </div>
                )}

                <div className="results-actions">
                    <button
                        type="button"
                        className="action-btn primary"
                        onClick={handleNextDrill}
                        disabled={nextDrillState === 'loading'}
                    >
                        {activeTrainingStep
                            ? trainingCopy.result.continuePlan
                            : nextDrillState === 'error'
                                ? copy.common.nextDrillRetry
                                : copy.result.primaryAction}
                    </button>
                    <button type="button" className="action-btn" onClick={() => navigate('/insights')}>
                        {copy.common.viewInsights}
                    </button>
                    {(advice.canRetry || coachStatus === 'error') && (
                        <button type="button" className="action-btn" onClick={handleRetryAdvice}>
                            {copy.common.refreshAdvice}
                        </button>
                    )}
                </div>
            </section>

            <section className="panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{trainingCopy.result.planTitle}</p>
                        <h2>{trainingPlan?.status === 'complete' ? trainingCopy.result.planComplete : activeTrainingStep?.title || trainingCopy.result.continuePlan}</h2>
                    </div>
                </div>
                <p className="lead-text">
                    {trainingPlan?.status === 'complete'
                        ? trainingCopy.result.planCompleteBody
                        : activeTrainingStep?.summary || trainingCopy.result.planBody}
                </p>
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
