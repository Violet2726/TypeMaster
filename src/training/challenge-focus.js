const FOCUS_NOTE_KEYS = {
    baseline: 'trendFocusBaseline',
    breakthrough: 'trendFocusBreakthrough',
    'accuracy-risk': 'trendFocusAccuracyRisk',
    'speed-drop': 'trendFocusSpeedDrop',
    stable: 'trendFocusStable',
    mixed: 'trendFocusMixed',
    empty: 'trendFocusMixed'
};

const RECOVERY_FOCUS_STATES = new Set(['accuracy-risk', 'speed-drop']);

export function isChallengeFocusRecoveryState(state) {
    return RECOVERY_FOCUS_STATES.has(state);
}

export function getChallengeFocusNote(trainingCopy, state) {
    const key = FOCUS_NOTE_KEYS[state] || FOCUS_NOTE_KEYS.mixed;
    return trainingCopy?.challenge?.[key] || '';
}

export function buildChallengeFocusModel(trainingCopy, state, options = {}) {
    const challengeCopy = trainingCopy?.challenge || {};
    const shouldRecover = isChallengeFocusRecoveryState(state);
    const hasActiveTrainingStep = Boolean(options.hasActiveTrainingStep);
    const isLoading = Boolean(options.isLoading);
    const loadingLabel = options.loadingLabel || '';
    const primaryAction = shouldRecover
        ? hasActiveTrainingStep ? 'plan' : 'free'
        : 'challenge';
    const primaryLabel = shouldRecover
        ? hasActiveTrainingStep
            ? challengeCopy.recoverPlanCta
            : challengeCopy.recoverFreeCta
        : isLoading
            ? loadingLabel
            : challengeCopy.retryCta;

    return {
        state: state || 'empty',
        note: getChallengeFocusNote(trainingCopy, state),
        shouldRecover,
        primaryAction,
        primaryLabel
    };
}
