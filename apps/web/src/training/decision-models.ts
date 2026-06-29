import { buildResultPrescription } from '@typemaster/domain';

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

function fillTemplate(template, value) {
    return String(template || '').replace('{value}', value);
}

function getMissCount(session) {
    return Number(session?.result?.incorrectChars || 0)
        + Number(session?.result?.extraChars || 0)
        + Number(session?.result?.missedChars || 0);
}

function buildDoseValue(copy, config) {
    if (config?.mode === 'time') {
        return fillTemplate(copy.result.prescriptionTimeDose, config.durationSeconds || 60);
    }

    if (config?.mode === 'words') {
        return fillTemplate(copy.result.prescriptionWordsDose, config.wordCount || 50);
    }

    return copy.result.prescriptionDefaultDose;
}

export function buildResultPrescriptionModel({ copy, session, coachRecord }) {
    const prescription = buildResultPrescription(session);
    const primaryCause = prescription.causeSignals[0];
    const accuracy = Number(session?.result?.accuracy || 0);
    const consistency = Number(session?.result?.consistency || 0);
    const wpm = Number(session?.result?.wpm || 0);
    const rawWpm = Number(session?.result?.rawWpm || wpm);
    const rawGap = Math.max(0, rawWpm - wpm);
    const missCount = getMissCount(session);
    let focus = {
        tone: 'ready',
        value: copy.result.prescriptionSpeedFocus,
        note: copy.result.prescriptionSpeedNote
    };
    let checkpoint = {
        value: fillTemplate(copy.result.prescriptionCheckpointSpeed, wpm + 2),
        note: fillTemplate(copy.result.prescriptionCheckpointAccuracy, Math.max(96, accuracy || 96))
    };

    if (primaryCause?.id === 'accuracy') {
        focus = {
            tone: 'error',
            value: copy.result.prescriptionAccuracyFocus,
            note: fillTemplate(copy.result.prescriptionAccuracyNote, missCount || 1)
        };
        checkpoint = {
            value: fillTemplate(copy.result.prescriptionCheckpointAccuracy, Math.min(99, accuracy + 2)),
            note: fillTemplate(copy.result.prescriptionCheckpointClean, Math.max(1, missCount - 1))
        };
    } else if (primaryCause?.id === 'stability') {
        focus = {
            tone: 'stale',
            value: copy.result.prescriptionConsistencyFocus,
            note: fillTemplate(copy.result.prescriptionConsistencyNote, consistency)
        };
        checkpoint = {
            value: fillTemplate(copy.result.prescriptionCheckpointConsistency, 90),
            note: fillTemplate(copy.result.prescriptionCheckpointAccuracy, Math.max(96, accuracy || 96))
        };
    } else if (primaryCause?.id === 'correction-cost') {
        focus = {
            tone: 'stale',
            value: copy.result.prescriptionRawFocus,
            note: fillTemplate(copy.result.prescriptionRawNote, rawGap)
        };
        checkpoint = {
            value: fillTemplate(copy.result.prescriptionCheckpointClean, Math.max(1, missCount || 2)),
            note: fillTemplate(copy.result.prescriptionCheckpointAccuracy, Math.max(96, accuracy || 96))
        };
    }

    return {
        title: copy.result.prescriptionTitle,
        body: coachRecord?.nextDrill?.reason || copy.result.prescriptionBody,
        items: [
            {
                id: 'focus',
                tone: focus.tone,
                label: copy.result.prescriptionFocusLabel,
                value: focus.value,
                note: focus.note
            },
            {
                id: 'dose',
                tone: 'idle',
                label: copy.result.prescriptionDoseLabel,
                value: buildDoseValue(copy, session?.config),
                note: session?.trainingMeta?.title || session?.sourceTextMeta?.label || copy.common.currentText
            },
            {
                id: 'checkpoint',
                tone: 'ready',
                label: copy.result.prescriptionCheckpointLabel,
                value: checkpoint.value,
                note: checkpoint.note
            }
        ]
    };
}

export function pickChallengeDecisionModel(strategyModel, focusModel) {
    if (strategyModel?.shouldRecover) {
        return strategyModel;
    }

    if (focusModel?.shouldRecover) {
        return focusModel;
    }

    return strategyModel || focusModel || null;
}

export function buildChallengeDecisionSummary(trainingCopy, primaryAction) {
    if (primaryAction === 'plan') {
        return {
            headline: trainingCopy.result.challengePlanTitle,
            body: trainingCopy.result.challengePlanBody,
            signal: trainingCopy.result.challengePlanSignal,
            badgeTone: 'stale'
        };
    }

    if (primaryAction === 'free') {
        return {
            headline: trainingCopy.result.challengeFreeTitle,
            body: trainingCopy.result.challengeFreeBody,
            signal: trainingCopy.result.challengeFreeSignal,
            badgeTone: 'stale'
        };
    }

    return {
        headline: trainingCopy.result.challengePushTitle,
        body: trainingCopy.result.challengePushBody,
        signal: trainingCopy.result.challengePushSignal,
        badgeTone: 'ready'
    };
}

export function buildResultDecisionModel({
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
        const challengeSummary = buildChallengeDecisionSummary(trainingCopy, primaryAction);

        return {
            context: 'challenge',
            badge: trainingCopy.result.decisionBadge,
            badgeTone: challengeSummary.badgeTone,
            headline: challengeSummary.headline,
            body: challengeSummary.body,
            signalLabel: trainingCopy.result.signalLabel,
            signal: challengeSummary.signal,
            primaryAction,
            primaryLabel: challengeDecisionModel?.primaryLabel || trainingCopy.challenge.retryCta,
            isLoading: primaryAction === 'challenge' && challengeDecisionModel?.primaryLabel === copy.common.loading,
            secondaryActions: uniqueActions([
                { action: 'leaderboard', label: copy.result.challengeViewLeaderboard },
                primaryAction !== 'free'
                    ? { action: 'free', label: trainingCopy.result.freePracticeAction }
                    : null,
                { action: 'insights', label: copy.common.viewInsights }
            ])
        };
    }

    if (session?.trainingMeta?.type === 'diagnostic' && activeDiagnosticStep) {
        return {
            context: 'diagnostic',
            badge: trainingCopy.result.decisionBadge,
            badgeTone: 'stale',
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
            context: 'plan',
            badge: trainingCopy.result.decisionBadge,
            badgeTone: 'ready',
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
            context: 'complete',
            badge: trainingCopy.result.decisionBadge,
            badgeTone: 'stale',
            headline: trainingCopy.result.reassessmentDecisionTitle,
            body: trainingCopy.result.reassessmentDecisionBody,
            signalLabel: trainingCopy.result.signalLabel,
            signal: trainingCopy.result.reassessmentSignal,
            primaryAction: 'diagnostic',
            primaryLabel: trainingCopy.result.reassessmentAction,
            isLoading: false,
            secondaryActions: uniqueActions([
                { action: 'insights', label: copy.common.viewInsights },
                { action: 'home', label: trainingCopy.result.homeAction }
            ])
        };
    }

    return {
        context: 'coach',
        badge: trainingCopy.result.decisionBadge,
        badgeTone: 'ready',
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

export function buildHomeDecisionModel({
    copy,
    trainingCopy,
    skillProfile,
    activeTrainingStep,
    activeDiagnosticStep,
    hasDiagnosticInFlight,
    latestSession,
    dailyChallengeId,
    challengeDecisionModel,
    trainingPlan
}) {
    const hasChallengeLead = latestSession?.trainingMeta?.type === 'challenge'
        && latestSession?.trainingMeta?.stepId === dailyChallengeId;

    if (!skillProfile || hasDiagnosticInFlight || activeDiagnosticStep) {
        return {
            context: 'diagnostic',
            badge: trainingCopy.result.decisionBadge,
            badgeTone: hasDiagnosticInFlight ? 'stale' : 'idle',
            headline: trainingCopy.result.diagnosticDecisionTitle,
            body: activeDiagnosticStep?.summary || trainingCopy.result.diagnosticDecisionBody,
            signalLabel: trainingCopy.result.signalLabel,
            signal: activeDiagnosticStep?.title || trainingCopy.diagnostic.title,
            primaryAction: 'diagnostic',
            primaryLabel: hasDiagnosticInFlight
                ? trainingCopy.home.diagnosticResume
                : trainingCopy.home.diagnosticCta
        };
    }

    if (hasChallengeLead && challengeDecisionModel) {
        const primaryAction = challengeDecisionModel.primaryAction || 'challenge';
        const challengeSummary = buildChallengeDecisionSummary(trainingCopy, primaryAction);

        return {
            context: 'challenge',
            badge: trainingCopy.result.decisionBadge,
            badgeTone: challengeSummary.badgeTone,
            headline: challengeSummary.headline,
            body: challengeSummary.body,
            signalLabel: trainingCopy.result.signalLabel,
            signal: challengeSummary.signal,
            primaryAction,
            primaryLabel: challengeDecisionModel.primaryLabel
        };
    }

    if (activeTrainingStep) {
        return {
            context: 'plan',
            badge: trainingCopy.result.decisionBadge,
            badgeTone: 'ready',
            headline: trainingCopy.result.planDecisionTitle,
            body: activeTrainingStep.summary || trainingCopy.result.planBody,
            signalLabel: trainingCopy.result.signalLabel,
            signal: activeTrainingStep.title,
            primaryAction: 'plan',
            primaryLabel: trainingCopy.home.continuePlan
        };
    }

    if (trainingPlan?.status === 'complete') {
        return {
            context: 'complete',
            badge: trainingCopy.result.decisionBadge,
            badgeTone: 'stale',
            headline: trainingCopy.result.reassessmentDecisionTitle,
            body: trainingCopy.result.reassessmentDecisionBody,
            signalLabel: trainingCopy.result.signalLabel,
            signal: trainingCopy.result.reassessmentSignal,
            primaryAction: 'diagnostic',
            primaryLabel: trainingCopy.result.reassessmentAction
        };
    }

    return {
        context: 'plan',
        badge: trainingCopy.result.decisionBadge,
        badgeTone: 'ready',
        headline: trainingCopy.result.planDecisionTitle,
        body: trainingPlan?.summary || trainingCopy.home.dashboardBody,
        signalLabel: trainingCopy.result.signalLabel,
        signal: skillProfile?.summary || trainingPlan?.title || trainingCopy.home.dashboardTitle,
        primaryAction: 'plan',
        primaryLabel: trainingCopy.home.continuePlan
    };
}
