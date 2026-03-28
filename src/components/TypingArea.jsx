import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildRenderedWords } from '../engine';

function getSessionStatusText(copy, status) {
    return copy.statuses[status] || copy.statuses.idle;
}

function getBadgeStatus(status) {
    if (status === 'running') return 'loading';
    if (status === 'paused') return 'stale';
    if (status === 'complete') return 'success';
    return 'idle';
}

function getHintText(copy, status) {
    if (status === 'paused') return copy.practice.pausedBody;
    if (status === 'running') return copy.practice.runningHint;
    if (status === 'complete') return copy.practice.completeHint;
    return copy.practice.idleHint;
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
    onCompositionStart,
    onCompositionEnd,
    onFocus,
    onBlur,
    onActivate,
    onReset,
    isLocked = false,
    lockTitle,
    lockBody
}) {
    const shellRef = useRef(null);
    const wrapperRef = useRef(null);
    const wordRefs = useRef(new Map());
    const charRefs = useRef(new Map());
    const extraRefs = useRef(new Map());
    const [caretStyle, setCaretStyle] = useState({});
    const [layoutVersion, setLayoutVersion] = useState(0);

    const renderedWords = useMemo(
        () => buildRenderedWords(words, typedHistory, currentInput, currentWordIndex),
        [words, typedHistory, currentInput, currentWordIndex]
    );

    useEffect(() => {
        let frameId = 0;

        const requestLayoutSync = () => {
            window.cancelAnimationFrame(frameId);
            frameId = window.requestAnimationFrame(() => {
                setLayoutVersion((value) => value + 1);
            });
        };

        const viewport = window.visualViewport;
        window.addEventListener('resize', requestLayoutSync);
        window.addEventListener('orientationchange', requestLayoutSync);
        viewport?.addEventListener('resize', requestLayoutSync);
        viewport?.addEventListener('scroll', requestLayoutSync);

        return () => {
            window.cancelAnimationFrame(frameId);
            window.removeEventListener('resize', requestLayoutSync);
            window.removeEventListener('orientationchange', requestLayoutSync);
            viewport?.removeEventListener('resize', requestLayoutSync);
            viewport?.removeEventListener('scroll', requestLayoutSync);
        };
    }, []);

    useEffect(() => {
        if (!isFocused || isLocked || !words.length || !shellRef.current) {
            return undefined;
        }

        const isMobileViewport = window.matchMedia('(max-width: 720px)').matches;
        if (!isMobileViewport) {
            return undefined;
        }

        const timer = window.setTimeout(() => {
            shellRef.current?.scrollIntoView({
                block: 'center',
                inline: 'nearest',
                behavior: 'smooth'
            });
        }, 40);

        return () => {
            window.clearTimeout(timer);
        };
    }, [isFocused, isLocked, words.length]);

    useLayoutEffect(() => {
        const currentWordEl = wordRefs.current.get(currentWordIndex);
        const currentWord = words[currentWordIndex] || '';
        const viewportEl = wrapperRef.current?.parentElement;

        if (!wrapperRef.current || !currentWordEl || status === 'complete' || isLocked || !words.length) {
            if (wrapperRef.current) {
                wrapperRef.current.style.transform = 'translateY(0px)';
            }
            wordRefs.current.forEach((node) => {
                if (node) {
                    delete node.dataset.lineState;
                }
            });
            setCaretStyle({ opacity: 0 });
            return;
        }

        const viewportHeight = viewportEl?.clientHeight || 0;
        const lineHeight = currentWordEl.offsetHeight || 0;
        const desiredOffset = Math.max(viewportHeight * 0.32, lineHeight * 0.95);
        const maxTranslate = Math.max(wrapperRef.current.scrollHeight - viewportHeight, 0);
        const translateY = Math.min(Math.max(currentWordEl.offsetTop - desiredOffset, 0), maxTranslate);

        wrapperRef.current.style.transform = `translateY(-${translateY}px)`;

        wordRefs.current.forEach((node) => {
            if (!node) {
                return;
            }

            const offsetDelta = node.offsetTop - currentWordEl.offsetTop;
            if (Math.abs(offsetDelta) < lineHeight * 0.45) {
                node.dataset.lineState = 'current';
                return;
            }

            if (offsetDelta < 0) {
                node.dataset.lineState = Math.abs(offsetDelta) <= lineHeight * 1.35 ? 'previous' : 'past';
                return;
            }

            node.dataset.lineState = offsetDelta <= lineHeight * 1.35 ? 'next' : 'future';
        });

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
        const caretHeight = fontSize * 1.12;
        const caretWidth = Math.max(fontSize * 0.075, 2.5);
        const nextLeft = useRightEdge ? targetRect.right - wrapperRect.left : targetRect.left - wrapperRect.left;
        const nextTop = targetRect.top - wrapperRect.top + (targetRect.height - caretHeight) / 2;

        setCaretStyle({
            opacity: isFocused ? 1 : 0,
            width: `${caretWidth}px`,
            height: `${caretHeight}px`,
            left: `${Math.max(0, nextLeft - caretWidth / 2)}px`,
            top: `${Math.max(0, nextTop)}px`
        });
    }, [currentInput, currentWordIndex, isFocused, isLocked, layoutVersion, renderedWords, status, words]);

    return (
        <section className="panel typing-stage">
            <div className="typing-stage__head">
                <div className="typing-stage__source">
                    <span className="summary-label">{copy.common.currentText}</span>
                    <strong>{sourceLabel || copy.common.emptyValue}</strong>
                </div>

                <div className="typing-stage__status">
                    <span className={`panel-badge badge-${getBadgeStatus(status)}`}>
                        {copy.practice.sessionLabel}: {getSessionStatusText(copy, status)}
                    </span>
                    <span className={`panel-badge badge-${isLocked ? 'stale' : 'ready'}`}>
                        {isLocked ? copy.practice.textPendingLabel : copy.practice.textReadyLabel}
                    </span>
                </div>

                <button type="button" className="ghost-btn ghost-btn--small" onClick={onReset}>{copy.common.resetRound}</button>
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

            <div
                ref={shellRef}
                className={`words-shell ${isFocused ? 'is-focused' : ''} ${status === 'paused' ? 'is-paused' : ''} ${isLocked ? 'is-locked' : ''}`}
                onClick={onActivate}
                onPointerDown={onActivate}
                role="presentation"
            >
                {!isLocked && words.length > 0 && (
                    <input
                        ref={inputRef}
                        type="text"
                        className="typing-capture-input"
                        value={currentInput}
                        onChange={onInputChange}
                        onKeyDown={onKeyDown}
                        onCompositionStart={onCompositionStart}
                        onCompositionEnd={onCompositionEnd}
                        onFocus={onFocus}
                        onBlur={onBlur}
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        inputMode="text"
                        enterKeyHint="done"
                        lang="en"
                        aria-label={copy.common.startTyping}
                    />
                )}
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
                                        className={`word ${word.isCurrent ? 'current' : ''} word-${word.phase}`}
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
                                                className={`letter ${char.status}`}
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

            <div className="typing-stage__footer">
                <p className="muted-text typing-stage__hint">{getHintText(copy, status)}</p>
                <div className="live-stats">
                    <div className="live-stat">
                        <span className="live-stat-value">{liveMetrics.wpm}</span>
                        <span className="live-stat-label">{copy.common.wpm}</span>
                    </div>
                    <div className="live-stat">
                        <span className="live-stat-value">{liveMetrics.accuracy}%</span>
                        <span className="live-stat-label">{copy.common.accuracy}</span>
                    </div>
                    <div className="live-stat">
                        <span className="live-stat-value">{timerDisplay}</span>
                        <span className="live-stat-label">{mode === 'time' ? copy.practice.timeRemaining : copy.practice.timeElapsed}</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
