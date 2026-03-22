import { commonWords } from '../data/words';

/**
 * 与练习文本草稿相关的工具函数。
 *
 * 这里负责：
 * - 清洗 AI 返回文本
 * - 计算目标词数
 * - 生成内置词库草稿
 * - 把任意文本包装成统一的 draft 结构
 */

const punctuationMarks = ['.', ',', '!', '?', ';', ':'];

function getBuiltinLabel(language = 'zh-CN') {
    return language === 'en-US' ? 'Built-in word bank' : '标准词库训练';
}

/**
 * 统一清洗文本，避免换行、多空格等格式噪声影响单词切分。
 */
export function normalizeText(text) {
    return (text || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * 把字符串切分为练习使用的单词数组。
 */
export function tokenizeText(text) {
    return normalizeText(text).split(' ').filter(Boolean);
}

/**
 * Fisher-Yates 洗牌。
 * 内置词库模式会依赖它打散常用词顺序。
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
}

/**
 * 根据配置估算一轮练习需要准备的词数。
 * 时间模式按“极速情况下也不容易打空”的策略做保守放大。
 */
export function estimateTargetWordCount(config) {
    if (config.mode === 'words') {
        return config.wordCount;
    }

    return Math.max(100, Math.ceil((config.durationSeconds || 30) * 3));
}

/**
 * 基于内置词库生成一份完整单词列表。
 * 标点和数字开关会在这里直接改写最终输出。
 */
export function createBuiltinWords(config) {
    const count = estimateTargetWordCount(config);
    let generated = [];

    while (generated.length < count) {
        generated = generated.concat(shuffleArray(commonWords));
    }

    generated = generated.slice(0, count);

    if (config.includePunctuation) {
        generated = generated.map((word) => {
            if (Math.random() < 0.15) {
                const mark = punctuationMarks[Math.floor(Math.random() * punctuationMarks.length)];
                return `${word}${mark}`;
            }
            return word;
        });
    }

    if (config.includeNumbers) {
        generated = generated.map((word) => {
            if (Math.random() < 0.1) {
                return String(Math.floor(Math.random() * 1000));
            }
            return word;
        });
    }

    return generated;
}

/**
 * 把单词数组包装成统一的训练草稿结构。
 * 页面层只消费 draft，不关心它来自内置词库还是 AI。
 */
export function createDraftFromWords(words, config, meta = {}) {
    const safeWords = Array.isArray(words) ? words.filter(Boolean) : [];
    const text = safeWords.join(' ').trim();

    return {
        id: crypto.randomUUID(),
        text,
        words: safeWords,
        configSnapshot: {
            ...config
        },
        sourceTextMeta: {
            source: config.source || 'builtin',
            label: meta.label || (config.source === 'ai' ? 'AI practice text' : getBuiltinLabel(meta.language)),
            template: meta.template || null,
            difficulty: meta.difficulty || null,
            createdAt: meta.createdAt || new Date().toISOString(),
            prompt: meta.prompt || null,
            generatedBy: meta.generatedBy || (config.source === 'ai' ? 'ai' : 'builtin')
        }
    };
}

/**
 * 生成一份标准词库草稿。
 */
export function createBuiltinDraft(config, options = {}) {
    return createDraftFromWords(createBuiltinWords(config), config, {
        label: getBuiltinLabel(options.language),
        language: options.language,
        generatedBy: 'builtin'
    });
}

/**
 * 把原始文本包装成草稿。
 * 该方法主要给 AI 服务层使用。
 */
export function createDraftFromText(text, config, meta = {}) {
    return createDraftFromWords(tokenizeText(text), config, meta);
}

export function doesDraftMatchConfig(config, draft) {
    if (!draft?.configSnapshot) {
        return false;
    }

    const comparableKeys = [
        'mode',
        'durationSeconds',
        'wordCount',
        'includePunctuation',
        'includeNumbers',
        'source',
        'aiTemplate',
        'difficulty'
    ];

    return comparableKeys.every((key) => draft.configSnapshot[key] === config[key]);
}
