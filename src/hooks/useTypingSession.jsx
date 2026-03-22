/**
 * 打字练习会话 Hook。
 *
 * 它是练习页的核心状态机，负责：
 * - 练习开始 / 暂停 / 恢复 / 结束
 * - 当前输入和历史输入
 * - 计时与趋势数据
 * - 实时统计与最终结果计算
 *
 * 页面组件只负责渲染和 DOM 测量，真正的练习规则都集中在这里。
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateMetrics, createTimelinePoint } from '../engine';

export function useTypingSession({ draft, config, onComplete }) {
    const words = draft?.words || [];
    const inputRef = useRef(null);

    /**
     * 这些 ref 用来保存“不会驱动 UI 重绘，但时序上必须持久存在”的中间值。
     */
    const tabPressedRef = useRef(false);
    const lastHistorySecondRef = useRef(-1);
    const lastCharCountRef = useRef(0);
    const lastCheckMsRef = useRef(0);

    /**
     * 这些 state 才是真正驱动页面更新的练习状态。
     */
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

    /**
     * 把整轮练习完全重置到初始状态。
     * 这个方法会在切换草稿或手动重来时触发。
     */
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
        lastHistorySecondRef.current = -1;
        lastCharCountRef.current = 0;
        lastCheckMsRef.current = 0;
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    }, []);

    /**
     * 只要练习草稿发生变化，就视为进入了全新练习。
     */
    useEffect(() => {
        resetSession();
    }, [draft?.id, resetSession]);

    /**
     * 统一计算“当前有效已用时间”。
     * 会自动扣除暂停区间，避免暂停时继续消耗时长。
     */
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

    /**
     * 实时指标与最终指标共用一套算法。
     * 当前是否包含 currentInput，由调用场景决定。
     */
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

    /**
     * 结束本轮练习，并把最终结果交给外层。
     */
    const finishSession = useCallback((forcedElapsedMs = null) => {
        if (status === 'complete') {
            return null;
        }

        const finishedAt = Date.now();
        const effectiveElapsedMs = forcedElapsedMs ?? Math.max(0, finishedAt - (startedAt || finishedAt) - pausedDurationMs);
        const finalHistory = currentInput ? [...typedHistory, currentInput] : typedHistory;
        const finalTimeline = { ...timeline };

        /**
         * 如果用户在极短时间内完成练习，可能还没来得及生成趋势点。
         * 这里手动补一个最小时间点，保证结果页图表不至于完全空白。
         */
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

    /**
     * 第一次输入时启动练习。
     */
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

    /**
     * 失焦时暂停。
     */
    const pauseSession = useCallback(() => {
        if (status !== 'running') {
            return;
        }

        setPausedAt(Date.now());
        setStatus('paused');
    }, [status]);

    /**
     * 重新聚焦时恢复，并把暂停时间累加进去。
     */
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

    /**
     * 运行时定时器：
     * - 驱动计时显示
     * - 生成趋势图点位
     * - 在时间模式下判断是否到时
     */
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
                finishSession(config.durationSeconds * 1000);
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

    /**
     * 词数模式下，最后一个词完整输入后直接结束。
     */
    useEffect(() => {
        if (config.mode !== 'words' || status === 'complete') {
            return;
        }

        const currentWord = words[currentWordIndex];
        if (currentWordIndex === words.length - 1 && currentInput === currentWord && currentWord) {
            finishSession();
        }
    }, [config.mode, currentInput, currentWordIndex, finishSession, status, words]);

    /**
     * 窗口失焦时也要暂停，避免只依赖 input blur 漏掉场景。
     */
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

    /**
     * 让外层可以主动把焦点打回隐藏输入框。
     */
    const focusInput = useCallback(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    /**
     * 输入事件只负责两件事：
     * - 首次输入触发开始
     * - 记录按键准确率
     */
    const handleInputChange = useCallback((event) => {
        if (status === 'complete') {
            return;
        }

        const value = event.target.value;
        if (status === 'idle' && value.length > 0) {
            startSession();
        }

        const currentWord = words[currentWordIndex] || '';
        const nativeInputType = event.nativeEvent?.inputType;

        if (value.length > currentInput.length && nativeInputType === 'insertText') {
            const insertedIndex = value.length - 1;
            const typedChar = value[insertedIndex];
            const expectedChar = currentWord[insertedIndex];

            setTotalKeystrokes((previous) => previous + 1);
            if (typedChar === expectedChar) {
                setCorrectKeystrokes((previous) => previous + 1);
            }
        }

        setCurrentInput(value);
    }, [currentInput.length, currentWordIndex, startSession, status, words]);

    /**
     * 键盘事件控制核心打字规则。
     * 包括：
     * - 空格切词
     * - Tab + Enter 快速重开
     * - Esc 重置
     * - 空输入时 Backspace 回退上一词
     */
    const handleKeyDown = useCallback((event) => {
        if (status === 'complete') {
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
            const trimmed = currentInput.trim();
            if (!trimmed) {
                return;
            }

            const nextHistory = [...typedHistory, trimmed];
            const nextWordIndex = currentWordIndex + 1;
            setTypedHistory(nextHistory);
            setCurrentWordIndex(nextWordIndex);
            setCurrentInput('');
            if (inputRef.current) {
                inputRef.current.value = '';
            }

            if (config.mode === 'words' && nextWordIndex >= words.length) {
                finishSession();
            }
        }
    }, [
        config.mode,
        currentInput,
        currentWordIndex,
        finishSession,
        resetSession,
        status,
        typedHistory,
        words.length
    ]);

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

    /**
     * 根据模式决定计时显示语义：
     * - 时间模式：显示剩余秒数
     * - 词数模式：显示已用秒数
     */
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
        handleFocus,
        handleBlur,
        focusInput,
        resetSession
    };
}
