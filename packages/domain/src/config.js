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

export const DEFAULT_SETTINGS = {
    theme: 'serika-dark',
    fontScale: 'md',
    focusMode: false,
    soundEffects: false,
    language: 'zh-CN',
    keyboardLayout: 'qwerty',
    customWordBankText: ''
};

export const SUPPORTED_LANGUAGES = [
    { id: 'zh-CN', label: '简体中文' },
    { id: 'en-US', label: 'English' }
];

export const SUPPORTED_KEYBOARD_LAYOUTS = [
    { id: 'qwerty', labels: { 'zh-CN': 'QWERTY', 'en-US': 'QWERTY' } },
    { id: 'colemak', labels: { 'zh-CN': 'Colemak', 'en-US': 'Colemak' } },
    { id: 'dvorak', labels: { 'zh-CN': 'Dvorak', 'en-US': 'Dvorak' } }
];

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

export function getTemplateMeta(templateId) {
    return AI_TEMPLATES.find((item) => item.id === templateId) || AI_TEMPLATES[0];
}

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

export function getKeyboardLayoutLabel(layoutId, language = 'zh-CN') {
    const layout = SUPPORTED_KEYBOARD_LAYOUTS.find((item) => item.id === layoutId) || SUPPORTED_KEYBOARD_LAYOUTS[0];
    return layout.labels?.[language] || layout.labels?.['zh-CN'] || layout.id;
}
