const FOCUS_NOTE_KEYS = {
    baseline: 'trendFocusBaseline',
    breakthrough: 'trendFocusBreakthrough',
    'accuracy-risk': 'trendFocusAccuracyRisk',
    'speed-drop': 'trendFocusSpeedDrop',
    stable: 'trendFocusStable',
    mixed: 'trendFocusMixed',
    empty: 'trendFocusMixed'
};

const STRATEGY_NOTE_KEYS = {
    idle: 'strategyIdle',
    warm: 'strategyWarm',
    push: 'strategyImproving',
    improving: 'strategyImproving',
    cooling: 'strategyCooling',
    recover: 'strategyRecover',
    steady: 'strategySteady'
};

const RECOVERY_FOCUS_STATES = new Set(['accuracy-risk', 'speed-drop']);

type ChallengeActionOptions = {
    hasActiveTrainingStep?: boolean,
    hasPriorChallenge?: boolean,
    isLoading?: boolean,
    loadingLabel?: string,
    shouldRecover?: boolean,
};

export function isChallengeFocusRecoveryState(state) {
    return RECOVERY_FOCUS_STATES.has(state);
}

export function getChallengeFocusNote(trainingCopy, state) {
    const key = FOCUS_NOTE_KEYS[state] || FOCUS_NOTE_KEYS.mixed;
    return trainingCopy?.challenge?.[key] || '';
}

export function getChallengeStrategyNote(trainingCopy, state) {
    const key = STRATEGY_NOTE_KEYS[state] || STRATEGY_NOTE_KEYS.steady;
    return trainingCopy?.challenge?.[key] || '';
}

export function buildChallengeActionModel(trainingCopy, options: ChallengeActionOptions = {}) {
    const challengeCopy = trainingCopy?.challenge || {};
    const shouldRecover = Boolean(options.shouldRecover);
    const hasActiveTrainingStep = Boolean(options.hasActiveTrainingStep);
    const hasPriorChallenge = options.hasPriorChallenge !== false;
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
            : hasPriorChallenge
                ? challengeCopy.retryCta
                : challengeCopy.cta;

    return {
        shouldRecover,
        primaryAction,
        primaryLabel
    };
}

export function buildChallengeFocusModel(trainingCopy, state, options: ChallengeActionOptions = {}) {
    const actionModel = buildChallengeActionModel(trainingCopy, {
        ...options,
        shouldRecover: isChallengeFocusRecoveryState(state)
    });

    return {
        state: state || 'empty',
        note: getChallengeFocusNote(trainingCopy, state),
        ...actionModel
    };
}

export function buildChallengeStrategyModel(trainingCopy, state, options: ChallengeActionOptions = {}) {
    const actionModel = buildChallengeActionModel(trainingCopy, {
        ...options,
        shouldRecover: state === 'recover'
    });

    return {
        state: state || 'idle',
        note: getChallengeStrategyNote(trainingCopy, state),
        ...actionModel
    };
}
