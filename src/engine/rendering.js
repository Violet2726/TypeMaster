/**
 * 与练习区渲染相关的数据映射函数。
 *
 * React 组件不直接在 JSX 里写大量状态判断，
 * 而是先把目标单词和输入历史整理成“可渲染结构”，
 * 这样 UI 层只负责展示。
 */

/**
 * 把目标单词列表转换成带输入状态的渲染模型。
 * 结果会标记每个字符是 correct / incorrect / idle，
 * 同时补出超长输入形成的 extra 字符。
 */
export function buildRenderedWords(words, typedHistory, currentInput, currentWordIndex) {
    return words.map((word, wordIndex) => {
        const typedWord = wordIndex < currentWordIndex
            ? typedHistory[wordIndex] || ''
            : wordIndex === currentWordIndex
                ? currentInput
                : '';

        const chars = word.split('').map((char, charIndex) => {
            let status = 'idle';
            if (charIndex < typedWord.length) {
                status = typedWord[charIndex] === char ? 'correct' : 'incorrect';
            }

            return { char, status, index: charIndex };
        });

        const extraChars = typedWord.length > word.length
            ? typedWord.slice(word.length).split('').map((char, index) => ({ char, index }))
            : [];

        return {
            word,
            wordIndex,
            isCurrent: wordIndex === currentWordIndex,
            chars,
            extraChars
        };
    });
}
