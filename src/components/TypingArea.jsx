import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildRenderedWords } from '../engine';

function getSessionStatusText(copy, status) {
    return copy.statuses[status] || copy.statuses.idle;
}

export function TypingArea({
    copy,
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
    onReset,
    isLocked = false,
    lockTitle,
    lockBody
}) {
    const wrapperRef = useRef(null);
    const wordRefs = useRef(new Map());
    const charRefs = useRef(new Map());
    const extraRefs = useRef(new Map());
    const [caretStyle, setCaretStyle] = useState({});

    const renderedWords = useMemo(
        () => buildRenderedWords(words, typedHistory, currentInput, currentWordIndex),
        [words, typedHistory, currentInput, currentWordIndex]
    );

    useLayoutEffect(() => {
        const currentWordEl = wordRefs.current.get(currentWordIndex);
        const currentWord = words[currentWordIndex] || '';

        if (!wrapperRef.current || !currentWordEl || status === 'complete' || isLocked || !words.length) {
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
    }, [currentInput, currentWordIndex, isFocused, isLocked, renderedWords, status, words]);

    return (
        <section className="panel typing-panel">
            <div className="typing-panel__head">
                <div>
                    <p className="panel-kicker">{copy.practice.pageTitle}</p>
                    <h2>{sourceLabel || copy.common.emptyValue}</h2>
                </div>
                <button type="button" className="ghost-btn" onClick={onReset}>{copy.common.resetRound}</button>
            </div>

            <div className="status-strip">
                <div className="feedback-card">
                    <span className="summary-label">{copy.practice.statusCard}</span>
                    <strong>{getSessionStatusText(copy, status)}</strong>
                </div>
                <div className="feedback-card">
                    <span className="summary-label">{copy.practice.textMetaTitle}</span>
                    <strong>{isLocked ? copy.statuses.stale : copy.statuses.ready}</strong>
                </div>
                <div className="feedback-card">
                    <span className="summary-label">{copy.practice.helperTitle}</span>
                    <p>{status === 'paused' ? copy.practice.pausedBody : status === 'running' ? copy.practice.runningHint : status === 'complete' ? copy.practice.completeHint : copy.practice.idleHint}</p>
                </div>
            </div>

            <div className="live-stats">
                <div className="live-stat">
                    <span className="live-stat-value">{liveMetrics.wpm}</span>
                    <span className="live-stat-label">{copy.common.wpm}</span>
                </div>
                <div className="live-stat">
                    <span className="live-stat-value">{liveMetrics.accuracy}</span>
                    <span className="live-stat-label">%</span>
                </div>
                <div className="live-stat">
                    <span className="live-stat-value">{timerDisplay}</span>
                    <span className="live-stat-label">{mode === 'time' ? copy.practice.timeRemaining : copy.practice.timeElapsed}</span>
                </div>
            </div>

            {status === 'paused' && (
                <div className="banner banner-warning">
                    <div>
                        <strong>{copy.practice.pausedTitle}</strong>
                        <p>{copy.practice.pausedBody}</p>
                    </div>
                    <button type="button" className="action-btn" onClick={onActivate}>
                        {copy.common.resumeTyping}
                    </button>
                </div>
            )}

            <div className="words-shell" onClick={onActivate} role="presentation">
                <div className="words-container">
                    {isLocked || !words.length ? (
                        <div className="typing-empty-state">
                            <strong>{lockTitle}</strong>
                            <p>{lockBody}</p>
                        </div>
                    ) : (
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
                    )}
                </div>

                {!isFocused && status !== 'complete' && !isLocked && words.length > 0 && (
                    <div className="focus-overlay">{copy.practice.focusLost}</div>
                )}
            </div>

            <label className="typing-input-wrap">
                <span className="summary-label">{copy.common.startTyping}</span>
                <input
                    ref={inputRef}
                    type="text"
                    className="typing-input"
                    value={currentInput}
                    onChange={onInputChange}
                    onKeyDown={onKeyDown}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    disabled={isLocked}
                    placeholder={copy.practice.wordsPlaceholder}
                />
            </label>
        </section>
    );
}
