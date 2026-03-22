import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TrendChart } from '../components/TrendChart';
import { deriveComparison } from '../engine';
import { getErrorMessage } from '../i18n';
import { usePracticeStore } from '../store/practice-store';

function CoachState({ copy, language, status, issue, coachRecord, onRetryAdvice, onNextDrill, nextDrillState, nextDrillError }) {
    const fallbackCode = coachRecord?.fallbackReasonCode || issue?.code || 'unknown';
    const errorCopy = getErrorMessage(language, fallbackCode);

    if ((status === 'loading' || status === 'idle') && !coachRecord) {
        return (
            <div className="feedback-card feedback-info">
                <strong>{copy.result.coachLoadingTitle}</strong>
                <p>{copy.result.coachLoadingBody}</p>
            </div>
        );
    }

    if (status === 'error' && !coachRecord) {
        return (
            <div className="feedback-card feedback-error">
                <strong>{copy.result.coachErrorTitle}</strong>
                <p>{copy.result.coachErrorBody}</p>
                <div className="inline-actions">
                    <button type="button" className="action-btn primary" onClick={onRetryAdvice}>
                        {copy.common.refreshAdvice}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {status === 'fallback' && (
                <div className="feedback-card feedback-warning">
                    <strong>{errorCopy.title}</strong>
                    <p>{copy.result.coachFallbackBody}</p>
                    <div className="inline-actions">
                        <button type="button" className="action-btn" onClick={onRetryAdvice}>
                            {copy.common.refreshAdvice}
                        </button>
                    </div>
                </div>
            )}

            <div className="summary-block">
                <strong>{coachRecord?.headline}</strong>
                <p>{coachRecord?.summary}</p>
            </div>

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

            <div className="coach-section">
                <h3>{copy.result.issuesTitle}</h3>
                <ul className="flat-list">
                    {(coachRecord?.weaknesses || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
            </div>

            <div className="coach-section">
                <h3>{copy.result.strengthsTitle}</h3>
                <ul className="flat-list">
                    {(coachRecord?.strengths || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
            </div>

            <div className="coach-section">
                <h3>{copy.result.nextTitle}</h3>
                <p>{coachRecord?.nextDrill?.reason || copy.result.nextReasonFallback}</p>
                <div className="inline-actions">
                    <button
                        type="button"
                        className="action-btn primary"
                        onClick={onNextDrill}
                        disabled={nextDrillState === 'loading'}
                    >
                        {nextDrillState === 'error' ? copy.common.nextDrillRetry : coachRecord?.nextDrill?.label || copy.common.nextDrill}
                    </button>
                </div>
            </div>
        </>
    );
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
        launchNextDrill
    } = usePracticeStore();

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

    const handleRetryAdvice = async () => {
        const record = await generateCoachForSession(session.id, { force: true });
        setCoachRecord(record);
    };

    const handleNextDrill = async () => {
        if (!coachRecord?.nextDrill) {
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
            <section className="panel result-hero">
                <div className="result-hero__stats">
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

            <section className="panel">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{copy.result.detailsTitle}</p>
                        <h2>{copy.result.summaryTitle}</h2>
                    </div>
                    <span className={`panel-badge badge-${coachStatus}`}>
                        {coachStatus === 'success'
                            ? copy.common.coachReady
                            : coachStatus === 'fallback'
                                ? copy.common.coachFallback
                                : coachStatus === 'loading' || coachStatus === 'idle'
                                    ? copy.common.coachLoading
                                    : copy.common.coachError}
                    </span>
                </div>

                <div className="results-details">
                    <div className="result-item">
                        <span className="result-item-label">{copy.common.wpm}</span>
                        <span className="result-item-value">{session.result.wpm}</span>
                    </div>
                    <div className="result-item">
                        <span className="result-item-label">Raw</span>
                        <span className="result-item-value">{session.result.rawWpm}</span>
                    </div>
                    <div className="result-item">
                        <span className="result-item-label">{copy.common.accuracy}</span>
                        <span className="result-item-value">{session.result.accuracy}%</span>
                    </div>
                    <div className="result-item">
                        <span className="result-item-label">{copy.common.consistency}</span>
                        <span className="result-item-value">{session.result.consistency}%</span>
                    </div>
                    <div className="result-item">
                        <span className="result-item-label">Chars</span>
                        <span className="result-item-value">
                            {session.result.correctChars}/{session.result.incorrectChars}/{session.result.extraChars}/{session.result.missedChars}
                        </span>
                    </div>
                    <div className="result-item">
                        <span className="result-item-label">Time</span>
                        <span className="result-item-value">{session.result.durationSeconds}s</span>
                    </div>
                </div>
            </section>

            <section className="panel coach-card">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{copy.result.coachTitle}</p>
                        <h2>{coachRecord?.headline || copy.result.coachLoadingTitle}</h2>
                    </div>
                </div>

                <CoachState
                    copy={copy}
                    language={language}
                    status={coachStatus}
                    issue={coachIssue}
                    coachRecord={coachRecord}
                    onRetryAdvice={handleRetryAdvice}
                    onNextDrill={handleNextDrill}
                    nextDrillState={nextDrillState}
                    nextDrillError={nextDrillError}
                />
            </section>

            <TrendChart
                copy={copy}
                timeline={session.timeline || { labels: [], wpm: [], raw: [], burst: [], errors: [] }}
            />

            <div className="results-actions">
                <button type="button" className="action-btn" onClick={() => navigate('/practice')}>
                    {copy.common.returnPractice}
                </button>
                <button type="button" className="action-btn" onClick={() => navigate('/insights')}>
                    {copy.common.viewInsights}
                </button>
            </div>
        </div>
    );
}
