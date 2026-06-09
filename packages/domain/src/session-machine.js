export function createEmptyTimeline() {
    return {
        samples: [],
        labels: [],
        wpm: [],
        raw: [],
        accuracy: [],
        burst: [],
        errors: [],
        pauseMoments: []
    };
}

export function computeNextWordState(currentInput, currentWordIndex, words, typedHistory) {
    if (!currentInput || currentWordIndex >= words.length) {
        return null;
    }
    return {
        nextHistory: [...typedHistory, currentInput],
        nextWordIndex: currentWordIndex + 1
    };
}

export function computeElapsedMs(startedAt, completedAt, pausedAt, pausedDurationMs, status, nowMs) {
    if (!startedAt) return 0;

    const endReference = status === 'complete'
        ? (completedAt || nowMs)
        : status === 'paused'
            ? (pausedAt || nowMs)
            : nowMs;

    return Math.max(0, endReference - startedAt - pausedDurationMs);
}

export function isSessionComplete(config, currentWordIndex, words, elapsedMs) {
    if (!config || !words) {
        return false;
    }

    if (config.mode === 'time') {
        const durationMs = (config.durationSeconds || 60) * 1000;
        return elapsedMs >= durationMs;
    }

    return currentWordIndex >= words.length;
}

export function commitWord(currentInput, currentWordIndex, words, typedHistory) {
    if (!currentInput || currentWordIndex >= words.length) {
        return null;
    }

    const nextHistory = [...typedHistory, currentInput];
    const nextWordIndex = currentWordIndex + 1;

    return {
        nextHistory,
        nextWordIndex
    };
}

export function handleBackspace(currentWordIndex, typedHistory) {
    if (currentWordIndex <= 0 || typedHistory.length === 0) {
        return null;
    }

    const previousWord = typedHistory[typedHistory.length - 1] || '';
    const newHistory = typedHistory.slice(0, -1);
    const newWordIndex = Math.max(0, currentWordIndex - 1);

    return {
        newHistory,
        newWordIndex,
        restoredInput: previousWord
    };
}

export function calculatePauseSecond(startedAt, pausedAt, pausedDurationMs) {
    const pauseTime = pausedAt || Date.now();
    const referenceStartedAt = startedAt !== null && startedAt !== undefined ? startedAt : pauseTime;
    return Math.max(0, Math.floor((pauseTime - referenceStartedAt - pausedDurationMs) / 1000));
}

export function shouldAddPauseMoment(existingPauseMoments, newPauseSecond) {
    return !existingPauseMoments.includes(newPauseSecond);
}

export function computePausedDuration(currentPausedDurationMs, pausedAt, resumedAt) {
    const actualPausedAt = pausedAt || resumedAt;
    return currentPausedDurationMs + (resumedAt - actualPausedAt);
}

export function computeTimerDisplay(config, elapsedMs) {
    if (!config) {
        return 0;
    }

    if (config.mode === 'time') {
        const totalDurationMs = (config.durationSeconds || 60) * 1000;
        return Math.max(0, Math.ceil((totalDurationMs - elapsedMs) / 1000));
    }

    return Math.max(0, Math.floor(elapsedMs / 1000));
}

export function validateTransition(currentStatus, nextStatus) {
    const validTransitions = {
        idle: ['running'],
        running: ['paused', 'complete'],
        paused: ['running'],
        complete: ['idle']
    };

    const allowed = validTransitions[currentStatus] || [];
    return allowed.includes(nextStatus);
}

export function calculateCorrectKeystrokes(currentInput, previousCorrect, currentWord, addedChars) {
    if (!addedChars || !currentWord) {
        return previousCorrect;
    }

    let correctDelta = 0;
    addedChars.split('').forEach((char, index) => {
        const expectedChar = currentWord[currentInput.length - addedChars.length + index];
        if (char === expectedChar) {
            correctDelta += 1;
        }
    });

    return previousCorrect + correctDelta;
}