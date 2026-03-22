/**
 * 与打字结果统计相关的纯函数集合。
 *
 * 这一层专门处理：
 * - 字符级正确/错误/漏打统计
 * - WPM / raw WPM / accuracy / consistency
 * - 时间线数据点
 * - 历史对比摘要
 *
 * 所有函数都保持“输入 -> 输出”的纯逻辑形式，
 * 方便 React 页面和后续测试直接复用。
 */

/**
 * 比较某个单词的目标值与用户输入，输出字符统计结果。
 * `includeMissed` 用来区分“已结束单词”和“当前仍在输入的单词”。
 */
function buildWordStats(target, typed, includeMissed) {
    let correct = 0;
    let incorrect = 0;
    let extra = 0;
    let missed = 0;
    const errorChars = [];

    const maxLength = Math.max(target.length, typed.length);
    for (let index = 0; index < maxLength; index += 1) {
        const targetChar = target[index];
        const typedChar = typed[index];

        if (targetChar !== undefined && typedChar !== undefined) {
            if (targetChar === typedChar) {
                correct += 1;
            } else {
                incorrect += 1;
                errorChars.push(typedChar);
            }
        } else if (typedChar !== undefined) {
            extra += 1;
            errorChars.push(typedChar);
        } else if (includeMissed && targetChar !== undefined) {
            missed += 1;
        }
    }

    return { correct, incorrect, extra, missed, errorChars };
}

/**
 * 计算“真正打对的字符数”。
 * 这是标准 WPM 的核心分子来源。
 */
function countCorrectCharacters(words, typedHistory, currentInput) {
    let correctChars = 0;

    typedHistory.forEach((typed, index) => {
        const original = words[index] || '';
        for (let charIndex = 0; charIndex < Math.min(typed.length, original.length); charIndex += 1) {
            if (typed[charIndex] === original[charIndex]) {
                correctChars += 1;
            }
        }

        if (index < typedHistory.length - 1) {
            correctChars += 1;
        }
    });

    const currentWord = words[typedHistory.length] || '';
    for (let charIndex = 0; charIndex < Math.min(currentInput.length, currentWord.length); charIndex += 1) {
        if (currentInput[charIndex] === currentWord[charIndex]) {
            correctChars += 1;
        }
    }

    return correctChars;
}

/**
 * 统计用户实际敲出的字符总数。
 * raw WPM 会直接依赖这一结果。
 */
function countRawCharacters(typedHistory, currentInput) {
    let total = 0;
    typedHistory.forEach((typed, index) => {
        total += typed.length;
        if (index < typedHistory.length - 1) {
            total += 1;
        }
    });
    total += currentInput.length;
    return total;
}

/**
 * 计算字符级别的详细统计。
 * 会输出正确、错误、多余和漏打数量。
 */
export function calculateCharStats(words, typedHistory, currentInput = '', includeCurrent = true) {
    let correct = 0;
    let incorrect = 0;
    let extra = 0;
    let missed = 0;

    typedHistory.forEach((typed, index) => {
        const original = words[index] || '';
        const stats = buildWordStats(original, typed, true);
        correct += stats.correct;
        incorrect += stats.incorrect;
        extra += stats.extra;
        missed += stats.missed;
    });

    if (includeCurrent && currentInput) {
        const currentWord = words[typedHistory.length] || '';
        const stats = buildWordStats(currentWord, currentInput, false);
        correct += stats.correct;
        incorrect += stats.incorrect;
        extra += stats.extra;
    }

    return { correct, incorrect, extra, missed };
}

/**
 * 根据 WPM 历史计算稳定度。
 * 这里使用变异系数近似表达“速度波动”。
 */
export function calculateConsistency(wpmHistory) {
    if (!Array.isArray(wpmHistory) || wpmHistory.length < 2) {
        return 100;
    }

    const mean = wpmHistory.reduce((sum, value) => sum + value, 0) / wpmHistory.length;
    if (mean <= 0) {
        return 100;
    }

    const variance = wpmHistory.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / wpmHistory.length;
    const stdDeviation = Math.sqrt(variance);
    const cv = (stdDeviation / mean) * 100;
    return Math.max(0, Math.round(100 - cv));
}

/**
 * 收集错误字符和错误单词的 Top 列表。
 * 结果会同时用于本地规则诊断和 AI 教练输入。
 */
export function collectErrorBreakdown(words, typedHistory, currentInput = '', includeCurrent = true) {
    const errorCharCounts = new Map();
    const errorWordCounts = new Map();

    const registerWordErrors = (target, typed) => {
        const stats = buildWordStats(target, typed, true);
        if (stats.incorrect || stats.extra || stats.missed) {
            errorWordCounts.set(target, (errorWordCounts.get(target) || 0) + 1);
        }
        stats.errorChars.forEach((char) => {
            errorCharCounts.set(char, (errorCharCounts.get(char) || 0) + 1);
        });
    };

    typedHistory.forEach((typed, index) => {
        registerWordErrors(words[index] || '', typed);
    });

    if (includeCurrent && currentInput) {
        registerWordErrors(words[typedHistory.length] || '', currentInput);
    }

    const topErrorChars = [...errorCharCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([char]) => char);

    const topErrorWords = [...errorWordCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([word]) => word);

    return { topErrorChars, topErrorWords };
}

/**
 * 计算一轮练习的核心指标。
 * 页面上的实时统计和最终结果都会使用同一套逻辑。
 */
export function calculateMetrics({
    words,
    typedHistory,
    currentInput = '',
    elapsedMs,
    totalKeystrokes,
    correctKeystrokes,
    wpmHistory,
    includeCurrent = true
}) {
    const safeElapsedMs = Math.max(elapsedMs, 0);
    const timeElapsedMinutes = safeElapsedMs / 1000 / 60;
    const correctChars = countCorrectCharacters(words, typedHistory, includeCurrent ? currentInput : '');
    const rawChars = countRawCharacters(typedHistory, includeCurrent ? currentInput : '');

    const wpm = timeElapsedMinutes > 0 ? Math.round((correctChars / 5) / timeElapsedMinutes) : 0;
    const rawWpm = timeElapsedMinutes > 0 ? Math.round((rawChars / 5) / timeElapsedMinutes) : 0;
    const accuracy = totalKeystrokes > 0 ? Math.round((correctKeystrokes / totalKeystrokes) * 100) : 100;
    const charStats = calculateCharStats(words, typedHistory, currentInput, includeCurrent);
    const errors = charStats.incorrect + charStats.extra;
    const errorBreakdown = collectErrorBreakdown(words, typedHistory, currentInput, includeCurrent);

    return {
        wpm,
        rawWpm,
        accuracy,
        consistency: calculateConsistency(wpmHistory),
        correctChars: charStats.correct,
        incorrectChars: charStats.incorrect,
        extraChars: charStats.extra,
        missedChars: charStats.missed,
        topErrorChars: errorBreakdown.topErrorChars,
        topErrorWords: errorBreakdown.topErrorWords,
        durationSeconds: Math.max(1, Math.round(safeElapsedMs / 1000)),
        completedAt: new Date().toISOString(),
        errors
    };
}

/**
 * 为趋势图生成新的时间点。
 * 除了记录 wpm/raw，还会顺便计算 burst 和累计错误数。
 */
export function createTimelinePoint({
    elapsedMs,
    typedHistory,
    currentInput,
    words,
    totalKeystrokes,
    correctKeystrokes,
    wpmHistory,
    lastCharCount,
    lastCheckMs
}) {
    const metrics = calculateMetrics({
        words,
        typedHistory,
        currentInput,
        elapsedMs,
        totalKeystrokes,
        correctKeystrokes,
        wpmHistory,
        includeCurrent: true
    });

    const totalChars = countRawCharacters(typedHistory, currentInput);
    const timeDiffSeconds = Math.max((elapsedMs - lastCheckMs) / 1000, 0);
    let burst = 0;
    if (timeDiffSeconds > 0) {
        const charDiff = totalChars - lastCharCount;
        if (charDiff > 0) {
            burst = Math.round((charDiff / 5) / (timeDiffSeconds / 60));
        }
    }

    return {
        point: {
            time: Math.max(0, Math.floor(elapsedMs / 1000)),
            wpm: metrics.wpm,
            raw: metrics.rawWpm,
            burst,
            errors: metrics.errors
        },
        totalChars
    };
}

/**
 * 把本次成绩与最近几次结果做轻量比较。
 * 该结果既可展示给用户，也可喂给 AI 教练。
 */
export function deriveComparison(sessions, currentSessionId, currentResult, language = 'zh-CN') {
    const baseline = sessions
        .filter((session) => session.id !== currentSessionId)
        .slice(0, 5);

    if (baseline.length === 0) {
        return {
            label: 'baseline',
            summary: language === 'en-US'
                ? 'This is your first valid sample. Future sessions will start forming a trend baseline.'
                : '这是你的第一条有效样本，后续结果会开始形成趋势比较。',
            wpmDelta: null,
            accuracyDelta: null
        };
    }

    const avgWpm = baseline.reduce((sum, session) => sum + session.result.wpm, 0) / baseline.length;
    const avgAccuracy = baseline.reduce((sum, session) => sum + session.result.accuracy, 0) / baseline.length;
    const wpmDelta = Math.round((currentResult.wpm - avgWpm) * 10) / 10;
    const accuracyDelta = Math.round((currentResult.accuracy - avgAccuracy) * 10) / 10;

    const direction = wpmDelta >= 0 && accuracyDelta >= 0
        ? 'up'
        : wpmDelta < 0 && accuracyDelta < 0
            ? 'down'
            : 'mixed';

    const signedWpm = `${wpmDelta >= 0 ? '+' : ''}${wpmDelta}`;
    const signedAccuracy = `${accuracyDelta >= 0 ? '+' : ''}${accuracyDelta}`;
    const summary = language === 'en-US'
        ? direction === 'up'
            ? `Versus the recent 5-session average, speed is ${signedWpm} and accuracy is ${signedAccuracy}%.`
            : direction === 'down'
                ? `Versus the recent 5-session average, speed is ${signedWpm} and accuracy is ${signedAccuracy}%.`
                : `Versus the recent 5-session average, speed is ${signedWpm} and accuracy is ${signedAccuracy}%.`
        : direction === 'up'
            ? `相比最近 5 次平均值，速度 ${signedWpm}，准确率 ${signedAccuracy}%。`
            : direction === 'down'
                ? `相比最近 5 次平均值，速度 ${signedWpm}，准确率 ${signedAccuracy}%。`
                : `相比最近 5 次平均值，速度 ${signedWpm}，准确率 ${signedAccuracy}%。`;

    return {
        label: direction,
        summary,
        wpmDelta,
        accuracyDelta
    };
}
