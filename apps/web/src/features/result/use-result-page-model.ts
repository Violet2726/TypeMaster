import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    buildChallengeTrend,
    deriveComparison,
    getChallengePersonalBest,
    getChallengePointFocusState,
    getChallengeSessions,
    getChallengeStanding,
    getChallengeStrategyState,
    mergeChallengeLeaderboardEntries
} from '@typemaster/domain';
import { normalizeCoachAdviceComparison } from '@typemaster/contracts/training-state';
import { getErrorMessage } from '../../i18n';
import { buildChallengeFocusModel, buildChallengeStrategyModel } from '../../training/challenge-focus';
import { getTrainingCopy } from '../../training/copy';
import { buildResultDecisionModel, pickChallengeDecisionModel } from '../../training/decision-models';

function getCoachBadgeLabel(copy, status) {
    if (status === 'success') return copy.common.coachReady;
    if (status === 'fallback') return copy.common.coachFallback;
    if (status === 'loading' || status === 'idle') return copy.common.coachLoading;
    return copy.common.coachError;
}

function buildAdviceModel(copy, language, status, issue, coachRecord) {
    const fallbackCode = coachRecord?.fallbackReasonCode || issue?.code || 'unknown';
    const errorCopy = getErrorMessage(language, fallbackCode);
    const separator = language === 'en-US' ? ' \u00b7 ' : ' / ';

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
            ? `${errorCopy.title}${separator}${copy.result.coachFallbackBody}`
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

function createPreviewChallengeEntry(session) {
    return {
        id: `preview-${session?.id || 'session'}`,
        sessionId: session?.id || null,
        displayName: 'You',
        userId: null,
        levelId: null,
        wpm: Number(session?.result?.wpm || 0),
        accuracy: Number(session?.result?.accuracy || 0),
        createdAt: session?.result?.completedAt || new Date().toISOString()
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

export function useResultPageModel({
    activeDiagnosticStep,
    activeTrainingStep,
    challengeGateway,
    copy,
    dailyChallenge,
    generateCoachForSession,
    getAdviceForSession,
    getCoachIssueForSession,
    getCoachStatusForSession,
    language,
    lastCompletedSession,
    launchNextDrill,
    navigate,
    resetPracticeToBuiltin,
    sessionId,
    sessions,
    startDailyChallenge,
    startDiagnosticJourney,
    startTrainingPlanStep,
    trainingPlan
}) {
    const trainingCopy = useMemo(() => getTrainingCopy(language), [language]);
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
    const challengeDecisionModel = useMemo(
        () => isChallengeSession
            ? pickChallengeDecisionModel(challengeStrategyModel, challengeFocusModel)
            : null,
        [challengeFocusModel, challengeStrategyModel, isChallengeSession]
    );
    const challengeFocusNote = challengeFocusModel?.note || '';
    const challengeFocusDelta = challengeFocusPoint && challengeFocusPoint.attempt > 1
        ? `${trainingCopy.challenge.trendPrevDeltaLabel}: ${formatSigned(challengeFocusPoint.deltaWpm, ` ${copy.common.wpm}`)} / ${formatSigned(challengeFocusPoint.deltaAccuracy, '%')}`
        : '';
    const previewChallengeStanding = useMemo(
        () => (
            session && challengeId
                ? buildChallengeStandingModel(
                    copy,
                    sessions,
                    session,
                    mergeChallengeLeaderboardEntries(
                        dailyChallenge?.id === challengeId ? (dailyChallenge.leaderboard || []) : [],
                        createPreviewChallengeEntry(session)
                    )
                )
                : null
        ),
        [challengeId, copy, dailyChallenge?.id, dailyChallenge?.leaderboard, session, sessions]
    );

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
            isChallengeSession && session ? createPreviewChallengeEntry(session) : null
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
    }, [challengeId, copy, dailyChallenge, language, session, sessions]);

    const comparison = session
        ? normalizeCoachAdviceComparison(
            coachRecord?.comparison || deriveComparison(sessions, session.id, session.result, language)
        )
        : null;
    const advice = buildAdviceModel(copy, language, coachStatus, coachIssue, coachRecord);
    const resultDecision = session
        ? buildResultDecisionModel({
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
        })
        : null;

    const handleRetryAdvice = useCallback(async () => {
        if (!session) {
            return;
        }

        const record = await generateCoachForSession(session.id, { force: true });
        setCoachRecord(record);
    }, [generateCoachForSession, session]);

    const handleNextDrill = useCallback(async () => {
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
    }, [activeTrainingStep, coachRecord, launchNextDrill, navigate, startTrainingPlanStep]);

    const handleDecisionAction = useCallback(async (action) => {
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
    }, [handleNextDrill, navigate, resetPracticeToBuiltin, startDailyChallenge, startDiagnosticJourney, startTrainingPlanStep]);

    return {
        advice,
        challengeFocusDelta,
        challengeFocusNote,
        challengeFocusState,
        previewChallengeStanding,
        challengeState,
        challengeStanding,
        coachRecord,
        coachStatus,
        comparison,
        copy,
        handleDecisionAction,
        handleRetryAdvice,
        isChallengeSession,
        nextDrillError,
        nextDrillState,
        resultDecision,
        session,
        trainingCopy
    };
}

export { getCoachBadgeLabel };
