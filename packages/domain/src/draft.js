import { commonWords } from './data/words';

function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

const punctuationMarks = ['.', ',', '!', '?', ';', ':'];

function getBuiltinLabel(language = 'zh-CN') {
    return language === 'en-US' ? 'Built-in word bank' : '标准词库训练';
}

function getCustomLabel(language = 'zh-CN') {
    return language === 'en-US' ? 'Custom word bank' : '自定义词库';
}

export function normalizeText(text) {
    return (text || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function tokenizeText(text) {
    return normalizeText(text).split(' ').filter(Boolean);
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
}

export function estimateTargetWordCount(config) {
    if (config.mode === 'words') {
        return config.wordCount;
    }

    return Math.max(100, Math.ceil((config.durationSeconds || 30) * 3));
}

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

export function createDraftFromWords(words, config, meta = {}) {
    const safeWords = Array.isArray(words) ? words.filter(Boolean) : [];
    const text = safeWords.join(' ').trim();

    return {
        id: generateId(),
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

export function createBuiltinDraft(config, options = {}) {
    return createDraftFromWords(createBuiltinWords(config), config, {
        label: getBuiltinLabel(options.language),
        language: options.language,
        generatedBy: 'builtin'
    });
}

export function createDraftFromText(text, config, meta = {}) {
    return createDraftFromWords(tokenizeText(text), config, meta);
}

export function createCustomDraft(text, config, options = {}) {
    return createDraftFromText(text, { ...config, source: 'custom' }, {
        label: getCustomLabel(options.language),
        language: options.language,
        generatedBy: 'custom'
    });
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
