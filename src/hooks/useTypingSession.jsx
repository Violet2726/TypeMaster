import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateMetrics, createTimelinePoint, createEmptyTimeline, computeElapsedMs, commitWord, handleBackspace, calculatePauseSecond, shouldAddPauseMoment, computePausedDuration, computeTimerDisplay } from '../engine';
import { playTypingSound } from '../services/sound';

export function useTypingSession({ draft, config, soundEffects = false, onComplete }) {
    const words = draft?.words || [];
    const inputRef = useRef(null);

    const tabPressedRef = useRef(false);
    const isComposingRef = useRef(false);
    const lastHistorySecondRef = useRef(-1);
    const lastCharCountRef = useRef(0);
    const lastCheckMsRef = useRef(0);

    const [typedHistory, setTypedHistory] = useState([]);
    const [currentInput, setCurrentInput] = useState('');
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [totalKeystrokes, setTotalKeystrokes] = useState(0);
    const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
    const [status, setStatus] = useState('idle');
    const [isFocused, setIsFocused] = useState(false);
    const [startedAt, setStartedAt] = useState(null);
    const [completedAt, setCompletedAt] = useState(null);
    const [pausedAt, setPausedAt] = useState(null);
    const [pausedDurationMs, setPausedDurationMs] = useState(0);
    const [nowMs, setNowMs] = useState(Date.now());
    const [timeline, setTimeline] = useState(createEmptyTimeline);

    const resetSession = useCallback(() => {
        setTypedHistory([]);
        setCurrentInput('');
        setCurrentWordIndex(0);
        setTotalKeystrokes(0);
        setCorrectKeystrokes(0);
        setStatus('idle');
        setIsFocused(false);
        setStartedAt(null);
        setCompletedAt(null);
        setPausedAt(null);
        setPausedDurationMs(0);
        setNowMs(Date.now());
        setTimeline(createEmptyTimeline());
        tabPressedRef.current = false;
        isComposingRef.current = false;
        lastHistorySecondRef.current = -1;
        lastCharCountRef.current = 0;
        lastCheckMsRef.current = 0;
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    }, []);

    useEffect(() => {
        resetSession();
    }, [draft?.id, resetSession]);

    const elapsedMs = useMemo(() => computeElapsedMs(startedAt, completedAt, pausedAt, pausedDurationMs, status, nowMs), [completedAt, nowMs, pausedAt, pausedDurationMs, startedAt, status]);

    const liveMetrics = useMemo(() => calculateMetrics({
        words,
        typedHistory,
        currentInput,
        elapsedMs,
        totalKeystrokes,
        correctKeystrokes,
        wpmHistory: timeline.wpm,
        includeCurrent: status !== 'complete'
    }), [
        words,
        typedHistory,
        currentInput,
        elapsedMs,
        totalKeystrokes,
        correctKeystrokes,
        timeline.wpm,
        status
    ]);

    const finishSession = useCallback((options = {}) => {
        const { forcedElapsedMs = null, finalHistoryOverride = null } = options;

        if (status === 'complete') {
            return null;
        }

        const finishedAt = Date.now();
        const effectiveElapsedMs = forcedElapsedMs ?? Math.max(0, finishedAt - (startedAt || finishedAt) - pausedDurationMs);
        const finalHistory = Array.isArray(finalHistoryOverride)
            ? finalHistoryOverride
            : currentInput
                ? [...typedHistory, currentInput]
                : typedHistory;
        const finalTimeline = {
            samples: [...(timeline.samples || [])],
            labels: [...(timeline.labels || [])],
            wpm: [...(timeline.wpm || [])],
            raw: [...(timeline.raw || [])],
            accuracy: [...(timeline.accuracy || [])],
            burst: [...(timeline.burst || [])],
            errors: [...(timeline.errors || [])],
            pauseMoments: [...(timeline.pauseMoments || [])]
        };

        if (finalTimeline.labels.length === 0) {
            const bootstrapMetrics = calculateMetrics({
                words,
                typedHistory: finalHistory,
                currentInput: '',
                elapsedMs: effectiveElapsedMs,
                totalKeystrokes,
                correctKeystrokes,
                wpmHistory: [],
                includeCurrent: false
            });

            finalTimeline.labels = [Math.max(0, Math.floor(effectiveElapsedMs / 1000))];
            finalTimeline.wpm = [bootstrapMetrics.wpm];
            finalTimeline.raw = [bootstrapMetrics.rawWpm];
            finalTimeline.accuracy = [bootstrapMetrics.accuracy];
            finalTimeline.burst = [bootstrapMetrics.rawWpm];
            finalTimeline.errors = [bootstrapMetrics.incorrectChars + bootstrapMetrics.extraChars];
            finalTimeline.samples = [{
                time: finalTimeline.labels[0],
                wpm: bootstrapMetrics.wpm,
                raw: bootstrapMetrics.rawWpm,
                accuracy: bootstrapMetrics.accuracy,
                burst: bootstrapMetrics.rawWpm,
                errors: bootstrapMetrics.incorrectChars + bootstrapMetrics.extraChars
            }];
        }

        const finalResult = calculateMetrics({
            words,
            typedHistory: finalHistory,
            currentInput: '',
            elapsedMs: effectiveElapsedMs,
            totalKeystrokes,
            correctKeystrokes,
            wpmHistory: finalTimeline.wpm,
            includeCurrent: false
        });

        setTypedHistory(finalHistory);
        setCurrentInput('');
        setCurrentWordIndex(Math.min(finalHistory.length, words.length));
        setStatus('complete');
        setCompletedAt(finishedAt);
        setNowMs(finishedAt);

        const payload = {
            result: finalResult,
            timeline: finalTimeline
        };

        onComplete(payload);
        return payload;
    }, [
        correctKeystrokes,
        currentInput,
        onComplete,
        pausedDurationMs,
        startedAt,
        status,
        timeline,
        totalKeystrokes,
        typedHistory,
        words
    ]);

    const commitCurrentWord = useCallback((inputOverride = currentInput) => {
        const result = commitWord(inputOverride, currentWordIndex, words, typedHistory);
        if (!result) {
            return null;
        }

        setTypedHistory(result.nextHistory);
        setCurrentWordIndex(result.nextWordIndex);
        setCurrentInput('');

        if (inputRef.current) {
            inputRef.current.value = '';
        }

        if (soundEffects) {
            playTypingSound('confirm');
        }

        return result;
    }, [currentInput, currentWordIndex, soundEffects, typedHistory, words]);

    const startSession = useCallback(() => {
        if (status !== 'idle') {
            return;
        }

        const started = Date.now();
        setStartedAt(started);
        setNowMs(started);
        setStatus('running');
        setCompletedAt(null);
        lastHistorySecondRef.current = -1;
        lastCharCountRef.current = 0;
        lastCheckMsRef.current = 0;
    }, [status]);

    const pauseSession = useCallback(() => {
        if (status !== 'running') {
            return;
        }

        const pauseTime = Date.now();
        const pauseSecond = calculatePauseSecond(startedAt, pauseTime, pausedDurationMs);
        setTimeline((previous) => ({
            ...previous,
            pauseMoments: shouldAddPauseMoment(previous.pauseMoments, pauseSecond)
                ? [...previous.pauseMoments, pauseSecond]
                : previous.pauseMoments
        }));
        setPausedAt(pauseTime);
        setStatus('paused');
    }, [pausedDurationMs, startedAt, status]);

    const resumeSession = useCallback(() => {
        if (status !== 'paused') {
            return;
        }

        const resumedAt = Date.now();
        setPausedDurationMs((previous) => computePausedDuration(previous, pausedAt, resumedAt));
        setPausedAt(null);
        setStatus('running');
        setNowMs(resumedAt);
    }, [pausedAt, status]);

    useEffect(() => {
        if (status !== 'running' || !startedAt) {
            return undefined;
        }

        const interval = window.setInterval(() => {
            const currentNow = Date.now();
            const nextElapsedMs = currentNow - startedAt - pausedDurationMs;
            setNowMs(currentNow);

            const nextSecond = Math.floor(nextElapsedMs / 1000);
            if (nextSecond > lastHistorySecondRef.current) {
                const { point, totalChars } = createTimelinePoint({
                    elapsedMs: nextElapsedMs,
                    typedHistory,
                    currentInput,
                    words,
                    totalKeystrokes,
                    correctKeystrokes,
                    wpmHistory: timeline.wpm,
                    lastCharCount: lastCharCountRef.current,
                    lastCheckMs: lastCheckMsRef.current
                });

                setTimeline((previous) => ({
                    samples: [...previous.samples, point],
                    labels: [...previous.labels, point.time],
                    wpm: [...previous.wpm, point.wpm],
                    raw: [...previous.raw, point.raw],
                    accuracy: [...previous.accuracy, point.accuracy],
                    burst: [...previous.burst, point.burst],
                    errors: [...previous.errors, point.errors]
                }));

                lastHistorySecondRef.current = nextSecond;
                lastCharCountRef.current = totalChars;
                lastCheckMsRef.current = nextElapsedMs;
            }

            if (config.mode === 'time' && nextElapsedMs >= (config.durationSeconds * 1000)) {
                finishSession({ forcedElapsedMs: config.durationSeconds * 1000 });
            }
        }, 200);

        return () => {
            window.clearInterval(interval);
        };
    }, [
        config.durationSeconds,
        config.mode,
        correctKeystrokes,
        currentInput,
        finishSession,
        pausedDurationMs,
        startedAt,
        status,
        timeline.wpm,
        totalKeystrokes,
        typedHistory,
        words
    ]);

    useEffect(() => {
        if (config.mode !== 'words' || status === 'complete') {
            return;
        }

        const currentWord = words[currentWordIndex];
        if (currentWordIndex === words.length - 1 && currentInput === currentWord && currentWord) {
            finishSession();
        }
    }, [config.mode, currentInput, currentWordIndex, finishSession, status, words]);

    useEffect(() => {
        const handleWindowBlur = () => {
            setIsFocused(false);
            pauseSession();
        };

        window.addEventListener('blur', handleWindowBlur);
        return () => {
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [pauseSession]);

    const focusInput = useCallback(() => {
        if (inputRef.current) {
            try {
                inputRef.current.focus({ preventScroll: true });
            } catch {
                inputRef.current.focus();
            }
        }
    }, []);

    const applyInputValue = useCallback((nextValue) => {
        if (status === 'complete') {
            return;
        }

        if (status === 'idle' && nextValue.length > 0) {
            startSession();
        }

        if (nextValue.length > currentInput.length) {
            const addedChars = nextValue.slice(currentInput.length);
            const currentWord = words[currentWordIndex] || '';

            if (addedChars.length > 0) {
                let correctDelta = 0;

                addedChars.split('').forEach((char, index) => {
                    const expectedChar = currentWord[currentInput.length + index];
                    if (char === expectedChar) {
                        correctDelta += 1;
                    }
                });

                setTotalKeystrokes((previous) => previous + addedChars.length);
                if (correctDelta > 0) {
                    setCorrectKeystrokes((previous) => previous + correctDelta);
                }

                if (soundEffects) {
                    playTypingSound(correctDelta === addedChars.length ? 'key' : 'error');
                }
            }
        }

        setCurrentInput(nextValue);
    }, [currentInput.length, currentWordIndex, soundEffects, startSession, status, words]);

    const handleInputChange = useCallback((event) => {
        if (event.nativeEvent?.isComposing || isComposingRef.current) {
            return;
        }

        applyInputValue(event.target.value);
    }, [applyInputValue]);

    const handleKeyDown = useCallback((event) => {
        if (status === 'complete' || event.nativeEvent?.isComposing || isComposingRef.current) {
            return;
        }

        if (event.key === 'Tab') {
            event.preventDefault();
            tabPressedRef.current = true;
            window.setTimeout(() => {
                tabPressedRef.current = false;
            }, 500);
            return;
        }

        if (event.key === 'Enter' && tabPressedRef.current) {
            event.preventDefault();
            resetSession();
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            resetSession();
            return;
        }

        if (event.key === 'Backspace' && currentInput.length === 0) {
            event.preventDefault();
            const backspaceResult = handleBackspace(currentWordIndex, typedHistory);
            if (backspaceResult) {
                setTypedHistory(backspaceResult.newHistory);
                setCurrentWordIndex(backspaceResult.newWordIndex);
                setCurrentInput(backspaceResult.restoredInput);
                if (inputRef.current) {
                    inputRef.current.value = backspaceResult.restoredInput;
                }
                if (soundEffects) {
                    playTypingSound('backspace');
                }
            }
            return;
        }

        if (event.key === ' ') {
            event.preventDefault();

            if (currentInput.length === 0) {
                return;
            }

            const currentWord = words[currentWordIndex] || '';
            if (
                config.mode === 'words'
                && currentWordIndex === words.length - 1
                && currentInput === currentWord
            ) {
                return;
            }

            const committed = commitCurrentWord(currentInput);
            if (!committed) {
                return;
            }

            if (config.mode === 'words' && committed.nextWordIndex >= words.length) {
                finishSession({ finalHistoryOverride: committed.nextHistory });
            }
        }
    }, [
        commitCurrentWord,
        config.mode,
        currentInput,
        currentWordIndex,
        finishSession,
        resetSession,
        soundEffects,
        status,
        typedHistory
    ]);

    const handleCompositionStart = useCallback(() => {
        isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback((event) => {
        isComposingRef.current = false;
        applyInputValue(event.currentTarget.value);
    }, [applyInputValue]);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        if (status === 'paused') {
            resumeSession();
        }
    }, [resumeSession, status]);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        pauseSession();
    }, [pauseSession]);

    const timerDisplay = computeTimerDisplay(config, elapsedMs);

    return {
        inputRef,
        words,
        typedHistory,
        currentInput,
        currentWordIndex,
        isFocused,
        status,
        timerDisplay,
        elapsedMs,
        timeline,
        liveMetrics,
        handleInputChange,
        handleKeyDown,
        handleCompositionStart,
        handleCompositionEnd,
        handleFocus,
        handleBlur,
        focusInput,
        resetSession
    };
}
