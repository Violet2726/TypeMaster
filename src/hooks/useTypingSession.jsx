import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateMetrics, createTimelinePoint } from '../engine';

export function useTypingSession({ draft, config, onComplete }) {
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
    const [timeline, setTimeline] = useState({
        labels: [],
        wpm: [],
        raw: [],
        burst: [],
        errors: []
    });

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
        setTimeline({
            labels: [],
            wpm: [],
            raw: [],
            burst: [],
            errors: []
        });
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

    const elapsedMs = useMemo(() => {
        if (!startedAt) {
            return 0;
        }

        const endReference = status === 'complete'
            ? completedAt || nowMs
            : status === 'paused'
                ? pausedAt || nowMs
                : nowMs;

        return Math.max(0, endReference - startedAt - pausedDurationMs);
    }, [completedAt, nowMs, pausedAt, pausedDurationMs, startedAt, status]);

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
        const finalTimeline = { ...timeline };

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
            finalTimeline.burst = [bootstrapMetrics.rawWpm];
            finalTimeline.errors = [bootstrapMetrics.incorrectChars + bootstrapMetrics.extraChars];
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
        if (!inputOverride || currentWordIndex >= words.length) {
            return null;
        }

        const nextHistory = [...typedHistory, inputOverride];
        const nextWordIndex = currentWordIndex + 1;

        setTypedHistory(nextHistory);
        setCurrentWordIndex(nextWordIndex);
        setCurrentInput('');

        if (inputRef.current) {
            inputRef.current.value = '';
        }

        return {
            nextHistory,
            nextWordIndex
        };
    }, [currentInput, currentWordIndex, typedHistory, words.length]);

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

        setPausedAt(Date.now());
        setStatus('paused');
    }, [status]);

    const resumeSession = useCallback(() => {
        if (status !== 'paused') {
            return;
        }

        const resumedAt = Date.now();
        setPausedDurationMs((previous) => previous + (resumedAt - (pausedAt || resumedAt)));
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
                    labels: [...previous.labels, point.time],
                    wpm: [...previous.wpm, point.wpm],
                    raw: [...previous.raw, point.raw],
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
            inputRef.current.focus();
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
            }
        }

        setCurrentInput(nextValue);
    }, [currentInput.length, currentWordIndex, startSession, status, words]);

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

        if (event.key === 'Backspace' && currentInput.length === 0 && currentWordIndex > 0) {
            event.preventDefault();
            const previousWord = typedHistory[typedHistory.length - 1] || '';
            setTypedHistory((previous) => previous.slice(0, -1));
            setCurrentWordIndex((previous) => Math.max(0, previous - 1));
            setCurrentInput(previousWord);
            if (inputRef.current) {
                inputRef.current.value = previousWord;
            }
            return;
        }

        if (event.key === ' ') {
            event.preventDefault();

            if (currentInput.length === 0) {
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

    const timerDisplay = config.mode === 'time'
        ? Math.max(0, Math.ceil(((config.durationSeconds * 1000) - elapsedMs) / 1000))
        : Math.max(0, Math.floor(elapsedMs / 1000));

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
