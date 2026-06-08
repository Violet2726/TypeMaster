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
            badgeTone: 'ready',
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
