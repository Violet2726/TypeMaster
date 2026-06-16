function setTrackedNode(collectionRef, key, node) {
    if (node) {
        collectionRef.current.set(key, node);
        return;
    }

    collectionRef.current.delete(key);
}

export function TypingWordStream({
    renderedWords,
    wrapperRef,
    wordRefs,
    charRefs,
    extraRefs,
    caretStyle,
    status
}) {
    return (
        <div className="words-wrapper" ref={wrapperRef}>
            <div className={`caret ${status === 'running' ? 'active' : ''}`} style={caretStyle} />
            <div className="words">
                {renderedWords.map((word) => (
                    <div
                        key={`${word.wordIndex}-${word.word}`}
                        className={`word ${word.isCurrent ? 'current' : ''} word-${word.phase}`}
                        ref={(node) => setTrackedNode(wordRefs, word.wordIndex, node)}
                    >
                        {word.chars.map((char) => (
                            <span
                                key={`${word.wordIndex}-${char.index}`}
                                className={`letter ${char.status}`}
                                ref={(node) => setTrackedNode(charRefs, `${word.wordIndex}-${char.index}`, node)}
                            >
                                {char.char}
                            </span>
                        ))}

                        {word.extraChars.map((char) => (
                            <span
                                key={`extra-${word.wordIndex}-${char.index}`}
                                className={`letter ${char.status}`}
                                ref={(node) => setTrackedNode(extraRefs, `${word.wordIndex}-${char.index}`, node)}
                            >
                                {char.char}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
