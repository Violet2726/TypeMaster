import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TrendChart } from '../components/TrendChart';
import {
    buildChallengeTrend,
    deriveComparison,
    getChallengePersonalBest,
    getChallengePointFocusState,
    getChallengeSessions,
    getChallengeStanding,
    getChallengeStrategyState,
    mergeChallengeLeaderboardEntries
} from '../engine';
import { getErrorMessage } from '../i18n';
import { usePracticeStore } from '../store/practice-store';
import { buildChallengeFocusModel, buildChallengeStrategyModel } from '../training/challenge-focus';
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

function fillTemplate(template, value) {
    return String(template || '').replace('{value}', value);
}

function formatSigned(value, suffix = '') {
    const safe = Number(value || 0);
    const sign = safe > 0 ? '+' : '';
    return `${sign}${safe}${suffix}`;
}

function isSameChallengeStandingModel(left, right) {
    return left?.standing?.rank === right?.standing?.rank
        && left?.standing?.total === right?.standing?.total
        && left?.standing?.beatPercent === right?.standing?.beatPercent
        && left?.bestValue === right?.bestValue
        && left?.note === right?.note;
}

function uniqueActions(actions) {
    const seen = new Set();
    return actions.filter((action) => {
        if (!action?.action || seen.has(action.action)) {
            return false;
        }

        seen.add(action.action);
        return true;
    });
}

function getChallengeDecisionTitle(trainingCopy, primaryAction) {
    if (primaryAction === 'plan') {
        return trainingCopy.result.challengePlanTitle;
    }

    if (primaryAction === 'free') {
        return trainingCopy.result.challengeFreeTitle;
    }

    return trainingCopy.result.challengePushTitle;
}

function getChallengeDecisionBody(trainingCopy, primaryAction) {
    if (primaryAction === 'plan') {
        return trainingCopy.result.challengePlanBody;
    }

    if (primaryAction === 'free') {
        return trainingCopy.result.challengeFreeBody;
    }

    return trainingCopy.result.challengePushBody;
}

function getChallengeDecisionSignal(trainingCopy, primaryAction) {
    if (primaryAction === 'plan') {
        return trainingCopy.result.challengePlanSignal;
    }

    if (primaryAction === 'free') {
        return trainingCopy.result.challengeFreeSignal;
    }

    return trainingCopy.result.challengePushSignal;
}

function buildResultDecisionModel({
    copy,
    trainingCopy,
    session,
    advice,
    coachRecord,
    activeTrainingStep,
    activeDiagnosticStep,
    trainingPlan,
    isChallengeSession,
    challengeDecisionModel,
    nextDrillState
}) {
    if (isChallengeSession) {
        const primaryAction = challengeDecisionModel?.primaryAction || 'challenge';
        const secondaryActions = uniqueActions([
            { action: 'leaderboard', label: copy.result.challengeViewLeaderboard },
            primaryAction !== 'free'
                ? { action: 'free', label: trainingCopy.result.freePracticeAction }
                : null,
            { action: 'insights', label: copy.common.viewInsights }
        ]);

        return {
            badge: trainingCopy.result.decisionBadge,
            headline: getChallengeDecisionTitle(trainingCopy, primaryAction),
            body: getChallengeDecisionBody(trainingCopy, primaryAction),
            signalLabel: trainingCopy.result.signalLabel,
            signal: getChallengeDecisionSignal(trainingCopy, primaryAction),
            primaryAction,
            primaryLabel: challengeDecisionModel?.primaryLabel || trainingCopy.challenge.retryCta,
            isLoading: primaryAction === 'challenge' && challengeDecisionModel?.primaryLabel === copy.common.loading,
            secondaryActions
        };
    }

    if (session?.trainingMeta?.type === 'diagnostic' && activeDiagnosticStep) {
        return {
            badge: trainingCopy.result.decisionBadge,
            headline: trainingCopy.result.diagnosticDecisionTitle,
            body: activeDiagnosticStep.summary || trainingCopy.result.diagnosticDecisionBody,
            signalLabel: trainingCopy.result.signalLabel,
            signal: activeDiagnosticStep.title,
            primaryAction: 'diagnostic',
            primaryLabel: trainingCopy.result.continueDiagnostic,
            isLoading: false,
            secondaryActions: uniqueActions([
                { action: 'free', label: trainingCopy.result.freePracticeAction },
                { action: 'insights', label: copy.common.viewInsights }
            ])
        };
    }

    if (activeTrainingStep) {
        return {
            badge: trainingCopy.result.decisionBadge,
            headline: trainingCopy.result.planDecisionTitle,
            body: activeTrainingStep.summary || trainingCopy.result.planBody,
            signalLabel: trainingCopy.result.signalLabel,
            signal: activeTrainingStep.title,
            primaryAction: 'plan',
            primaryLabel: trainingCopy.result.continuePlan,
            isLoading: false,
            secondaryActions: uniqueActions([
                { action: 'free', label: trainingCopy.result.freePracticeAction },
                { action: 'insights', label: copy.common.viewInsights }
            ])
        };
    }

    if (session?.trainingMeta?.type === 'plan' && trainingPlan?.status === 'complete') {
        return {
            badge: trainingCopy.result.decisionBadge,
            headline: trainingCopy.result.completeDecisionTitle,
            body: trainingCopy.result.planCompleteBody,
            signalLabel: trainingCopy.result.signalLabel,
            signal: trainingCopy.result.planComplete,
            primaryAction: 'home',
            primaryLabel: trainingCopy.result.homeAction,
            isLoading: false,
            secondaryActions: uniqueActions([
                { action: 'insights', label: copy.common.viewInsights },
                { action: 'free', label: trainingCopy.result.freePracticeAction }
            ])
        };
    }

    return {
        badge: trainingCopy.result.decisionBadge,
        headline: coachRecord?.nextDrill?.label || trainingCopy.result.coachDecisionTitle,
        body: coachRecord?.nextDrill?.reason || advice.body || trainingCopy.result.coachDecisionBody,
        signalLabel: trainingCopy.result.signalLabel,
        signal: advice.headline,
        primaryAction: 'nextDrill',
        primaryLabel: nextDrillState === 'error' ? copy.common.nextDrillRetry : copy.result.primaryAction,
        isLoading: nextDrillState === 'loading',
        secondaryActions: uniqueActions([
            { action: 'insights', label: copy.common.viewInsights }
        ])
    };
}

function buildChallengeStandingModel(copy, sessions, session, leaderboard) {
    const challengeId = session?.trainingMeta?.stepId;
    const standing = getChallengeStanding(leaderboard, session?.id);
    const personalBest = getChallengePersonalBest(sessions, challengeId, session?.id);

    if (!standing) {
        return {
            standing: null,
            personalBest,
            bestValue: personalBest.attempts > 0
                ? personalBest.isPersonalBest
                    ? copy.result.challengeBestFresh
                    : personalBest.gapWpm > 0
                        ? fillTemplate(copy.result.challengeBestGapWpm, personalBest.gapWpm)
                        : fillTemplate(copy.result.challengeBestGapAccuracy, personalBest.gapAccuracy)
                : copy.common.emptyValue
        };
    }

    let note = copy.result.challengeStandingBody;

    if (personalBest.attempts <= 1) {
        note = copy.result.challengeBestFirst;
    } else if (personalBest.isPersonalBest) {
        note = copy.result.challengeBestFresh;
    } else if (personalBest.gapWpm > 0) {
        note = fillTemplate(copy.result.challengeBestGapWpm, personalBest.gapWpm);
    } else if (personalBest.gapAccuracy > 0) {
        note = fillTemplate(copy.result.challengeBestGapAccuracy, personalBest.gapAccuracy);
    }

    return {
        standing,
        personalBest,
        bestValue: personalBest.isPersonalBest
            ? copy.result.challengeBestFresh
            : personalBest.gapWpm > 0
                ? `-${personalBest.gapWpm} ${copy.common.wpm}`
                : personalBest.gapAccuracy > 0
                    ? `-${personalBest.gapAccuracy}%`
                    : copy.common.emptyValue,
        note
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
        activeDiagnosticStep,
        trainingPlan,
        startDiagnosticJourney,
        startTrainingPlanStep,
        resetPracticeToBuiltin,
        startDailyChallenge,
        dailyChallenge,
        challengeGateway
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
    const [challengeState, setChallengeState] = useState('idle');
    const [challengeStanding, setChallengeStanding] = useState(null);
    const [challengeActionState, setChallengeActionState] = useState('idle');
    const getAdviceForSessionRef = useRef(getAdviceForSession);
    const generateCoachForSessionRef = useRef(generateCoachForSession);
    const challengeGatewayRef = useRef(challengeGateway);

    const coachStatus = session ? getCoachStatusForSession(session.id) : 'idle';
    const coachIssue = session ? getCoachIssueForSession(session.id) : null;
    const isChallengeSession = session?.trainingMeta?.type === 'challenge';
    const challengeId = isChallengeSession ? session?.trainingMeta?.stepId : null;
    const challengeTrend = useMemo(
        () => challengeId ? buildChallengeTrend(getChallengeSessions(sessions, challengeId)) : null,
        [challengeId, sessions]
    );
    const challengePersonalBest = useMemo(
        () => challengeId ? getChallengePersonalBest(sessions, challengeId, session?.id) : null,
        [challengeId, session?.id, sessions]
    );
    const challengeFocusPoint = useMemo(
        () => challengeTrend?.points.find((point) => point.id === session?.id) || null,
        [challengeTrend, session?.id]
    );
    const challengeFocusState = useMemo(
        () => getChallengePointFocusState(challengeFocusPoint || (isChallengeSession ? { attempt: 1 } : null)),
        [challengeFocusPoint, isChallengeSession]
    );
    const challengeFocusModel = useMemo(
        () => isChallengeSession
            ? buildChallengeFocusModel(trainingCopy, challengeFocusState, {
                hasActiveTrainingStep: Boolean(activeTrainingStep),
                isLoading: challengeActionState === 'loading',
                loadingLabel: copy.common.loading
            })
            : null,
        [activeTrainingStep, challengeActionState, challengeFocusState, copy.common.loading, isChallengeSession, trainingCopy]
    );
    const challengeStrategyState = useMemo(
        () => isChallengeSession ? getChallengeStrategyState(challengeTrend, challengePersonalBest) : 'idle',
        [challengePersonalBest, challengeTrend, isChallengeSession]
    );
    const challengeStrategyModel = useMemo(
        () => isChallengeSession
            ? buildChallengeStrategyModel(trainingCopy, challengeStrategyState, {
                hasActiveTrainingStep: Boolean(activeTrainingStep),
                isLoading: challengeActionState === 'loading',
                loadingLabel: copy.common.loading
            })
            : null,
        [activeTrainingStep, challengeActionState, challengeStrategyState, copy.common.loading, isChallengeSession, trainingCopy]
    );
    const challengeDecisionModel = useMemo(() => {
        if (!isChallengeSession) {
            return null;
        }

        if (challengeStrategyModel?.shouldRecover) {
            return challengeStrategyModel;
        }

        if (challengeFocusModel?.shouldRecover) {
            return challengeFocusModel;
        }

        return challengeStrategyModel || challengeFocusModel;
    }, [challengeFocusModel, challengeStrategyModel, isChallengeSession]);
    const challengeFocusNote = challengeFocusModel?.note || '';
    const challengeFocusDelta = challengeFocusPoint && challengeFocusPoint.attempt > 1
        ? `${trainingCopy.challenge.trendPrevDeltaLabel}: ${formatSigned(challengeFocusPoint.deltaWpm, ` ${copy.common.wpm}`)} / ${formatSigned(challengeFocusPoint.deltaAccuracy, '%')}`
        : '';

    useEffect(() => {
        getAdviceForSessionRef.current = getAdviceForSession;
        generateCoachForSessionRef.current = generateCoachForSession;
        challengeGatewayRef.current = challengeGateway;
    }, [challengeGateway, generateCoachForSession, getAdviceForSession]);

    useEffect(() => {
        if (!session) {
            return;
        }

        const existing = getAdviceForSessionRef.current(session.id);
        if (existing) {
            setCoachRecord(existing);
            return;
        }

        let active = true;
        generateCoachForSessionRef.current(session.id)
            .then((record) => {
                if (active) {
                    setCoachRecord(record);
                }
            })
            .catch(() => {});

        return () => {
            active = false;
        };
    }, [session?.id]);

    useEffect(() => {
        if (!session || !challengeId) {
            setChallengeState('idle');
            setChallengeStanding(null);
            return undefined;
        }

        let active = true;
        let retryTimer = 0;

        const applyStanding = (leaderboard) => {
            if (!active) {
                return false;
            }

            const model = buildChallengeStandingModel(copy, sessions, session, leaderboard);
            setChallengeStanding((previous) => (
                isSameChallengeStandingModel(previous, model) ? previous : model
            ));

            if (model.standing) {
                setChallengeState('success');
                return true;
            }

            return false;
        };

        const mergedSeed = mergeChallengeLeaderboardEntries(
            dailyChallenge?.id === challengeId ? (dailyChallenge.leaderboard || []) : [],
            null
        );

        if (applyStanding(mergedSeed)) {
            return undefined;
        }

        setChallengeState('loading');

        const load = async (attempt = 0) => {
            try {
                const leaderboard = await challengeGatewayRef.current.getChallengeLeaderboard(challengeId, language);
                if (applyStanding(leaderboard)) {
                    return;
                }

                if (attempt === 0) {
                    retryTimer = window.setTimeout(() => {
                        load(1).catch(() => {});
                    }, 240);
                    return;
                }

                if (active) {
                    setChallengeState('pending');
                }
            } catch {
                if (active) {
                    setChallengeState('error');
                }
            }
        };

        load().catch(() => {
            if (active) {
                setChallengeState('error');
            }
        });

        return () => {
            active = false;
            window.clearTimeout(retryTimer);
        };
    }, [challengeId, dailyChallenge, language, session, sessions]);

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
    const resultDecision = buildResultDecisionModel({
        copy,
        trainingCopy,
        session,
        advice,
        coachRecord,
        activeTrainingStep,
        activeDiagnosticStep,
        trainingPlan,
        isChallengeSession,
        challengeDecisionModel,
        nextDrillState
    });

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

    const handleDecisionAction = async (action) => {
        if (action === 'plan') {
            startTrainingPlanStep();
            navigate('/practice');
            return;
        }

        if (action === 'diagnostic') {
            startDiagnosticJourney();
            navigate('/practice');
            return;
        }

        if (action === 'free') {
            resetPracticeToBuiltin();
            navigate('/practice');
            return;
        }

        if (action === 'nextDrill') {
            await handleNextDrill();
            return;
        }

        if (action === 'leaderboard') {
            navigate('/challenge');
            return;
        }

        if (action === 'insights') {
            navigate('/insights');
            return;
        }

        if (action === 'home') {
            navigate('/');
            return;
        }

        setChallengeActionState('loading');

        try {
            await startDailyChallenge();
            navigate('/practice');
        } catch {
            setChallengeActionState('idle');
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

            <section className="panel result-decision-panel" aria-labelledby="result-decision-title">
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{trainingCopy.result.planTitle}</p>
                        <h2 id="result-decision-title">{resultDecision.headline}</h2>
                    </div>
                    <span className="panel-badge badge-ready">{resultDecision.badge}</span>
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
                        {resultDecision.isLoading ? copy.common.loading : resultDecision.primaryLabel}
                    </button>
                    {resultDecision.secondaryActions.map((action) => (
                        <button
                            key={action.action}
                            type="button"
                            className="action-btn"
                            onClick={() => handleDecisionAction(action.action)}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            </section>

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

                    {challengeState === 'success' && challengeStanding?.standing && (
                        <>
                            <div className="result-metrics-strip" aria-label={copy.result.challengeStandingTitle}>
                                <div className="result-item">
                                    <span className="result-item-label">{copy.result.challengeRankLabel}</span>
                                    <span className="result-item-value">#{challengeStanding.standing.rank}</span>
                                </div>
                                <div className="result-item">
                                    <span className="result-item-label">{copy.result.challengeEntriesLabel}</span>
                                    <span className="result-item-value">{challengeStanding.standing.total}</span>
                                </div>
                                <div className="result-item">
                                    <span className="result-item-label">{copy.result.challengeBeatLabel}</span>
                                    <span className="result-item-value">{challengeStanding.standing.beatPercent}%</span>
                                </div>
                                <div className="result-item">
                                    <span className="result-item-label">{copy.result.challengeBestLabel}</span>
                                    <span className="result-item-value">{challengeStanding.bestValue}</span>
                                </div>
                            </div>
                            <p className="lead-text">{challengeStanding.note}</p>
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
                        <strong>{getErrorMessage(language, nextDrillError?.code || 'unknown').title}</strong>
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
