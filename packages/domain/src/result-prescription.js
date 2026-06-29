function numberValue(value, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
}

function getMissCount(session) {
    const result = session?.result || {};
    return numberValue(result.incorrectChars) + numberValue(result.extraChars) + numberValue(result.missedChars);
}

function getDose(session) {
    const config = session?.config || {};

    if (config.mode === 'time') {
        return {
            type: 'time',
            value: numberValue(config.durationSeconds, 60),
            unit: 'seconds'
        };
    }

    if (config.mode === 'words') {
        return {
            type: 'words',
            value: numberValue(config.wordCount, 50),
            unit: 'words'
        };
    }

    return {
        type: 'default',
        value: 1,
        unit: 'round'
    };
}

function resolveCauseSignal(session) {
    const result = session?.result || {};
    const accuracy = numberValue(result.accuracy);
    const consistency = numberValue(result.consistency);
    const wpm = numberValue(result.wpm);
    const rawWpm = numberValue(result.rawWpm, wpm);
    const rawGap = Math.max(0, rawWpm - wpm);
    const missCount = getMissCount(session);

    if (accuracy > 0 && accuracy < 96) {
        return {
            id: 'accuracy',
            severity: 'high',
            value: accuracy,
            detail: missCount
        };
    }

    if (consistency > 0 && consistency < 88) {
        return {
            id: 'stability',
            severity: 'medium',
            value: consistency,
            detail: 90 - consistency
        };
    }

    if (rawGap >= 8) {
        return {
            id: 'correction-cost',
            severity: 'medium',
            value: rawGap,
            detail: missCount
        };
    }

    return {
        id: 'speed',
        severity: 'ready',
        value: wpm,
        detail: Math.max(1, Math.round(wpm * 0.04))
    };
}

function buildNextAction(causeSignal) {
    if (causeSignal.id === 'accuracy') {
        return {
            intent: 'recovery-drill',
            focus: 'accuracy',
            label: 'accuracy-reset'
        };
    }

    if (causeSignal.id === 'stability') {
        return {
            intent: 'adaptive-drill',
            focus: 'rhythm',
            label: 'rhythm-stabilizer'
        };
    }

    if (causeSignal.id === 'correction-cost') {
        return {
            intent: 'recovery-drill',
            focus: 'rework',
            label: 'clean-input'
        };
    }

    return {
        intent: 'adaptive-drill',
        focus: 'speed',
        label: 'speed-step-up'
    };
}

export function buildResultPrescription(session, options = {}) {
    const result = session?.result || {};
    const causeSignal = resolveCauseSignal(session);
    const nextAction = buildNextAction(causeSignal);
    const focusChars = Array.isArray(result.topErrorChars)
        ? result.topErrorChars.slice(0, 5)
        : [];

    return {
        summaryMetrics: {
            wpm: numberValue(result.wpm),
            rawWpm: numberValue(result.rawWpm, result.wpm),
            accuracy: numberValue(result.accuracy),
            consistency: numberValue(result.consistency),
            durationSeconds: numberValue(result.durationSeconds)
        },
        causeSignals: [causeSignal],
        nextAction,
        trainingPrescription: {
            intent: nextAction.intent,
            focus: nextAction.focus,
            dose: getDose(session),
            sourceSessionId: session?.id || null,
            focusChars,
            title: options.title || session?.trainingMeta?.title || session?.sourceTextMeta?.label || 'Next drill'
        }
    };
}
