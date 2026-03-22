/**
 * 打字主区域组件。
 *
 * 它承担三类职责：
 * 1. 显示实时指标和当前文本。
 * 2. 管理光标位置的视觉反馈。
 * 3. 把输入事件转发给 `useTypingSession`。
 *
 * 真正的练习状态仍然由 hook 持有，这里只做展示和 DOM 测量。
 */
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildRenderedWords } from '../engine';

export function TypingArea({
    words,
    typedHistory,
    currentInput,
    currentWordIndex,
    isFocused,
    status,
    liveMetrics,
    timerDisplay,
    mode,
    sourceLabel,
    inputRef,
    onInputChange,
    onKeyDown,
    onFocus,
    onBlur,
    onActivate,
    onReset
}) {
    const wrapperRef = useRef(null);
    const wordRefs = useRef(new Map());
    const charRefs = useRef(new Map());
    const extraRefs = useRef(new Map());
    const [caretStyle, setCaretStyle] = useState({});

    /**
     * 先把状态映射成渲染模型，避免 JSX 里堆太多条件判断。
     */
    const renderedWords = useMemo(
        () => buildRenderedWords(words, typedHistory, currentInput, currentWordIndex),
        [words, typedHistory, currentInput, currentWordIndex]
    );

    /**
     * 每次当前输入或当前词变化后，重新计算光标和滚动位置。
     * 这里使用 useLayoutEffect，是为了在浏览器绘制前同步更新视觉状态。
     */
    useLayoutEffect(() => {
        const currentWordEl = wordRefs.current.get(currentWordIndex);
        const currentWord = words[currentWordIndex] || '';

        if (!wrapperRef.current || !currentWordEl || status === 'complete') {
            setCaretStyle({ opacity: 0 });
            return;
        }

        wrapperRef.current.style.transform = `translateY(-${currentWordEl.offsetTop}px)`;

        let targetEl = null;
        let useRightEdge = false;

        if (currentInput.length === 0) {
            targetEl = charRefs.current.get(`${currentWordIndex}-0`);
        } else if (currentInput.length > currentWord.length) {
            targetEl = extraRefs.current.get(`${currentWordIndex}-${currentInput.length - currentWord.length - 1}`);
            useRightEdge = true;
        } else if (currentInput.length === currentWord.length) {
            targetEl = charRefs.current.get(`${currentWordIndex}-${currentWord.length - 1}`);
            useRightEdge = true;
        } else {
            targetEl = charRefs.current.get(`${currentWordIndex}-${currentInput.length}`);
        }

        if (!targetEl) {
            setCaretStyle({ opacity: 0 });
            return;
        }

        const wrapperRect = wrapperRef.current.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();
        const fontSize = parseFloat(window.getComputedStyle(targetEl).fontSize) || 24;

        setCaretStyle({
            opacity: isFocused ? 1 : 0,
            height: `${fontSize * 1.15}px`,
            left: `${useRightEdge ? targetRect.right - wrapperRect.left : targetRect.left - wrapperRect.left}px`,
            top: `${targetRect.top - wrapperRect.top + (targetRect.height - fontSize * 1.15) / 2}px`
        });
    }, [currentInput, currentWordIndex, isFocused, renderedWords, status, words]);

    return (
        <section className="panel typing-panel">
            <div className="typing-panel__head">
                <div>
                    <p className="panel-kicker">Practice Arena</p>
                    <h2>{sourceLabel}</h2>
                </div>
                <button type="button" className="ghost-btn" onClick={onReset}>重置本轮</button>
            </div>

            <div className="live-stats">
                <div className="live-stat">
                    <span className="live-stat-value">{liveMetrics.wpm}</span>
                    <span className="live-stat-label">wpm</span>
                </div>
                <div className="live-stat">
                    <span className="live-stat-value">{liveMetrics.accuracy}</span>
                    <span className="live-stat-label">%</span>
                </div>
                <div className="live-stat">
                    <span className="live-stat-value">{timerDisplay}</span>
                    <span className="live-stat-label">{mode === 'time' ? '剩余秒' : '已用秒'}</span>
                </div>
            </div>

            <div className="words-shell" onClick={onActivate} role="presentation">
                <div className="words-container">
                    <div className="words-wrapper" ref={wrapperRef}>
                        <div className={`caret ${status === 'running' ? 'active' : ''}`} style={caretStyle} />
                        <div className="words">
                            {renderedWords.map((word) => (
                                <div
                                    key={`${word.wordIndex}-${word.word}`}
                                    className={`word ${word.isCurrent ? 'current' : ''}`}
                                    ref={(node) => {
                                        if (node) {
                                            wordRefs.current.set(word.wordIndex, node);
                                        } else {
                                            wordRefs.current.delete(word.wordIndex);
                                        }
                                    }}
                                >
                                    {word.chars.map((char) => (
                                        <span
                                            key={`${word.wordIndex}-${char.index}`}
                                            className={`letter ${char.status}`}
                                            ref={(node) => {
                                                const key = `${word.wordIndex}-${char.index}`;
                                                if (node) {
                                                    charRefs.current.set(key, node);
                                                } else {
                                                    charRefs.current.delete(key);
                                                }
                                            }}
                                        >
                                            {char.char}
                                        </span>
                                    ))}

                                    {word.extraChars.map((char) => (
                                        <span
                                            key={`extra-${word.wordIndex}-${char.index}`}
                                            className="letter extra"
                                            ref={(node) => {
                                                const key = `${word.wordIndex}-${char.index}`;
                                                if (node) {
                                                    extraRefs.current.set(key, node);
                                                } else {
                                                    extraRefs.current.delete(key);
                                                }
                                            }}
                                        >
                                            {char.char}
                                        </span>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {!isFocused && status !== 'complete' && (
                    <div className="focus-overlay">点击这里继续输入</div>
                )}
            </div>

            <input
                ref={inputRef}
                type="text"
                className="hidden-input"
                value={currentInput}
                onChange={onInputChange}
                onKeyDown={onKeyDown}
                onFocus={onFocus}
                onBlur={onBlur}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck="false"
            />
        </section>
    );
}
