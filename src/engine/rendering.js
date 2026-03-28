function buildPastWord(word, typedWord) {
    const chars = word.split('').map((char, charIndex) => {
        if (charIndex < typedWord.length) {
            return {
                char,
                status: typedWord[charIndex] === char ? 'correct' : 'incorrect',
                index: charIndex
            };
        }

        return {
            char,
            status: 'missed',
            index: charIndex
        };
    });

    const extraChars = typedWord.length > word.length
        ? typedWord.slice(word.length).split('').map((char, index) => ({
            char,
            status: 'extra',
            index
        }))
        : [];

    return { chars, extraChars };
}

function buildCurrentWord(word, typedWord) {
    const chars = word.split('').map((char, charIndex) => {
        if (charIndex < typedWord.length) {
            return {
                char,
                status: typedWord[charIndex] === char ? 'correct' : 'incorrect',
                index: charIndex
            };
        }

        return {
            char,
            status: 'pending-current',
            index: charIndex
        };
    });

    const extraChars = typedWord.length > word.length
        ? typedWord.slice(word.length).split('').map((char, index) => ({
            char,
            status: 'extra',
            index
        }))
        : [];

    return { chars, extraChars };
}

function buildFutureWord(word) {
    return {
        chars: word.split('').map((char, charIndex) => ({
            char,
            status: 'pending-future',
            index: charIndex
        })),
        extraChars: []
    };
}

export function buildRenderedWords(words, typedHistory, currentInput, currentWordIndex) {
    return words.map((word, wordIndex) => {
        let rendered;
        let phase = 'future';

        if (wordIndex < currentWordIndex) {
            phase = 'past';
            rendered = buildPastWord(word, typedHistory[wordIndex] || '');
        } else if (wordIndex === currentWordIndex) {
            phase = 'current';
            rendered = buildCurrentWord(word, currentInput);
        } else {
            rendered = buildFutureWord(word);
        }

        return {
            word,
            wordIndex,
            phase,
            isCurrent: wordIndex === currentWordIndex,
            chars: rendered.chars,
            extraChars: rendered.extraChars
        };
    });
}
