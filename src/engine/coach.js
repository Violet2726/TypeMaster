import { getTemplateMeta } from './config';
import { deriveComparison } from './metrics';

/**
 * 本地规则教练。
 *
 * 这个模块的意义是：
 * 即使 AI 诊断失败，结果页也必须能给出一份可执行的建议。
 * 因此这里会基于规则生成一份简化但稳定的教练输出。
 */

/**
 * 把难度向下调一级。
 * 当准确率不足时，我们优先帮用户“降难度保准确”。
 */
function downgradeDifficulty(difficulty) {
    if (difficulty === 'hard') return 'medium';
    if (difficulty === 'medium') return 'easy';
    return 'easy';
}

/**
 * 把难度向上调一级。
 * 当用户已经打得很稳时，用于生成加压训练建议。
 */
function upgradeDifficulty(difficulty) {
    if (difficulty === 'easy') return 'medium';
    if (difficulty === 'medium') return 'hard';
    return 'hard';
}

/**
 * 基于本次 session 和历史记录生成本地诊断建议。
 */
export function buildLocalCoachAdvice({ session, history }) {
    const { config, result } = session;
    const comparison = deriveComparison(history, session.id, result);

    const strengths = [];
    const weaknesses = [];
    let headline = '继续推进，基础节奏已经建立';
    let summary = `本次成绩 ${result.wpm} WPM，准确率 ${result.accuracy}%，稳定度 ${result.consistency}%。`;
    let nextDifficulty = config.difficulty;
    let nextMode = config.mode;
    let nextDuration = config.durationSeconds;
    let nextWordCount = config.wordCount;

    if (result.accuracy >= 97) {
        strengths.push('准确率足够稳定，可以把训练重心从纠错转向节奏保持。');
    } else {
        weaknesses.push('准确率偏低，说明你在追速度时出现了明显的纠错成本。');
        nextDifficulty = downgradeDifficulty(config.difficulty);
        nextMode = 'words';
        nextWordCount = 25;
    }

    if (result.consistency >= 85) {
        strengths.push('速度波动较小，说明击键节奏控制得比较稳定。');
    } else {
        weaknesses.push('节奏波动较大，建议缩短练习时长，先打稳每一段。');
        nextMode = 'time';
        nextDuration = 15;
    }

    if (comparison.wpmDelta !== null && comparison.wpmDelta > 0) {
        strengths.push('相比最近几次，你的速度处于上升区间。');
    }

    if (result.topErrorChars.length > 0) {
        weaknesses.push(`最常见错误字符集中在 ${result.topErrorChars.join(' / ')}。`);
    }

    if (weaknesses.length === 0) {
        headline = '可以加压，准备进入更高密度练习';
        nextDifficulty = upgradeDifficulty(config.difficulty);
        summary = '你这次的速度和准确率都比较健康，适合提高训练密度。';
    } else if (result.accuracy < 92) {
        headline = '先稳住准确率，再追更高速度';
    }

    const template = getTemplateMeta(config.aiTemplate);
    const nextPrompt = `Generate a concise English typing drill focused on improving accuracy and rhythm. Emphasize these weak points: ${result.topErrorChars.join(', ') || 'letter accuracy'}, ${result.topErrorWords.join(', ') || 'common word consistency'}. Keep it aligned with ${template.prompt}.`;

    return {
        headline,
        summary,
        strengths: strengths.length ? strengths : ['你已经完成了一次完整训练，可以继续扩大训练样本。'],
        weaknesses: weaknesses.length ? weaknesses : ['当前没有明显短板，可以尝试更高难度或更长时长。'],
        nextDrill: {
            label: '开始下一练',
            reason: weaknesses[0] || '继续强化当前状态',
            configPatch: {
                source: 'ai',
                aiTemplate: config.aiTemplate,
                difficulty: nextDifficulty,
                mode: nextMode,
                durationSeconds: nextDuration,
                wordCount: nextWordCount,
                includeNumbers: config.includeNumbers,
                includePunctuation: config.includePunctuation
            },
            aiPrompt: nextPrompt
        },
        comparison,
        language: 'zh-CN'
    };
}
