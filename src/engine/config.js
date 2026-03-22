/**
 * 练习引擎的配置常量与元数据。
 *
 * 这一层只负责回答两个问题：
 * 1. 系统默认配置是什么。
 * 2. AI 训练模板、难度模板分别有哪些。
 *
 * 之所以把这些常量单独拆出来，是为了避免“配置常量”和
 * “统计计算逻辑”继续混在同一个超大文件中。
 */

/**
 * 练习模块的默认配置。
 * React 页面、存储层和本地回退逻辑都会复用这一份默认值。
 */
export const DEFAULT_CONFIG = {
    mode: 'time',
    durationSeconds: 30,
    wordCount: 25,
    includePunctuation: false,
    includeNumbers: false,
    source: 'builtin',
    aiTemplate: 'daily',
    difficulty: 'medium'
};

/**
 * 用户设置的默认值。
 * 这些值主要决定视觉、排版和练习区域是否进入专注模式。
 */
export const DEFAULT_SETTINGS = {
    theme: 'serika-dark',
    fontScale: 'md',
    focusMode: false,
    soundEffects: false,
    language: 'zh-CN'
};

export const SUPPORTED_LANGUAGES = [
    { id: 'zh-CN', label: '简体中文' },
    { id: 'en-US', label: 'English' }
];

/**
 * AI 训练模板列表。
 * 每个模板都附带一段英文 prompt 片段，供 AI 生成文本时拼接使用。
 */
export const AI_TEMPLATES = [
    {
        id: 'daily',
        labels: {
            'zh-CN': '日常对话',
            'en-US': 'Daily conversation'
        },
        prompt: 'natural daily conversations and social interactions'
    },
    {
        id: 'business',
        labels: {
            'zh-CN': '商务英语',
            'en-US': 'Business English'
        },
        prompt: 'business communication, meetings, presentations, and emails'
    },
    {
        id: 'tech',
        labels: {
            'zh-CN': '科技写作',
            'en-US': 'Tech writing'
        },
        prompt: 'technology writing, product thinking, and engineering communication'
    },
    {
        id: 'developer',
        labels: {
            'zh-CN': '开发者常用语',
            'en-US': 'Developer workflow'
        },
        prompt: 'developer workflows, code reviews, debugging, and product delivery'
    }
];

/**
 * 训练难度配置。
 * 这里不是评分规则，而是给 AI 文本生成时的语言约束说明。
 */
export const DIFFICULTY_OPTIONS = [
    {
        id: 'easy',
        labels: {
            'zh-CN': '入门',
            'en-US': 'Easy'
        },
        prompt: 'Use short sentences, common words, and simple structure.'
    },
    {
        id: 'medium',
        labels: {
            'zh-CN': '进阶',
            'en-US': 'Medium'
        },
        prompt: 'Use mixed sentence lengths and moderately rich vocabulary.'
    },
    {
        id: 'hard',
        labels: {
            'zh-CN': '挑战',
            'en-US': 'Hard'
        },
        prompt: 'Use longer sentences, denser meaning, and more advanced vocabulary.'
    }
];

/**
 * 根据模板 id 获取完整模板对象。
 * 如果传入值不合法，则安全回退到第一个模板，避免页面空指针。
 */
export function getTemplateMeta(templateId) {
    return AI_TEMPLATES.find((item) => item.id === templateId) || AI_TEMPLATES[0];
}

/**
 * 根据难度 id 获取完整难度对象。
 * 同样采用带兜底的查询方式，降低配置污染带来的风险。
 */
export function getDifficultyMeta(difficultyId) {
    return DIFFICULTY_OPTIONS.find((item) => item.id === difficultyId) || DIFFICULTY_OPTIONS[1];
}

export function getTemplateLabel(templateId, language = 'zh-CN') {
    const template = typeof templateId === 'string' ? getTemplateMeta(templateId) : templateId;
    return template?.labels?.[language] || template?.labels?.['zh-CN'] || '';
}

export function getDifficultyLabel(difficultyId, language = 'zh-CN') {
    const difficulty = typeof difficultyId === 'string' ? getDifficultyMeta(difficultyId) : difficultyId;
    return difficulty?.labels?.[language] || difficulty?.labels?.['zh-CN'] || '';
}
