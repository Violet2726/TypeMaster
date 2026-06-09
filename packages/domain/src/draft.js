import { commonWords } from './data/words.js';

function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

const punctuationMarks = ['.', ',', '!', '?', ';', ':'];

const ADAPTIVE_DRILL_WORDS = {
    accuracy: [
        'steady', 'clean', 'focus', 'control', 'careful', 'signal', 'target', 'motion',
        'steady', 'clean', 'focus', 'control', 'careful', 'signal', 'target', 'motion'
    ],
    rhythm: [
        'even', 'tempo', 'smooth', 'flow', 'calm', 'motion', 'steady', 'pulse',
        'even', 'tempo', 'smooth', 'flow', 'calm', 'motion', 'steady', 'pulse'
    ],
    rework: [
        'clean', 'return', 'repair', 'control', 'reduce', 'miss', 'steady', 'finish',
        'clean', 'return', 'repair', 'control', 'reduce', 'miss', 'steady', 'finish'
    ],
    speed: [
        'quick', 'light', 'clear', 'fast', 'move', 'type', 'flow', 'ready',
        'quick', 'light', 'clear', 'fast', 'move', 'type', 'flow', 'ready'
    ]
};

function getBuiltinLabel(language = 'zh-CN') {
    return language === 'en-US' ? 'Built-in word bank' : '标准词库训练';
}

function getCustomLabel(language = 'zh-CN') {
    return language === 'en-US' ? 'Custom word bank' : '自定义词库';
}

function getAdaptiveLabel(focus, language = 'zh-CN') {
    const labels = {
        'zh-CN': {
            accuracy: '自适应准确率训练',
            rhythm: '自适应节奏训练',
            rework: '自适应返工控制',
            speed: '自适应加速训练'
        },
        'en-US': {
            accuracy: 'Adaptive accuracy drill',
            rhythm: 'Adaptive rhythm drill',
            rework: 'Adaptive rework drill',
            speed: 'Adaptive speed drill'
        }
    };

    return (labels[language] || labels['zh-CN'])[focus] || labels[language]?.speed || labels['zh-CN'].speed;
}

function getMissCount(session) {
    return Number(session?.result?.incorrectChars || 0)
        + Number(session?.result?.extraChars || 0)
        + Number(session?.result?.missedChars || 0);
}

function getRawGap(session) {
    const wpm = Number(session?.result?.wpm || 0);
    const rawWpm = Number(session?.result?.rawWpm || wpm);
    return Math.max(0, rawWpm - wpm);
}

export function resolveAdaptiveDrillFocus(session) {
    const accuracy = Number(session?.result?.accuracy || 0);
    const consistency = Number(session?.result?.consistency || 0);
    const rawGap = getRawGap(session);

    if (accuracy && accuracy < 96) {
        return 'accuracy';
    }

    if (consistency && consistency < 88) {
        return 'rhythm';
    }

    if (rawGap >= 8 || getMissCount(session) >= 3) {
        return 'rework';
    }

    return 'speed';
}

function buildAdaptiveConfig(session, focus) {
    const base = session?.config || {};
    const wordCount = focus === 'speed'
        ? Math.max(30, Math.min(45, Number(base.wordCount || 35) + 5))
        : focus === 'rhythm'
            ? 32
            : 28;

    return {
        ...base,
        source: 'builtin',
        mode: 'words',
        wordCount,
        includeNumbers: focus === 'speed' ? Boolean(base.includeNumbers) : false,
        includePunctuation: focus === 'speed' ? Boolean(base.includePunctuation) : false
    };
}

function normalizePracticeToken(value) {
    return String(value || '')
        .replace(/[^a-zA-Z0-9'-]/g, '')
        .trim()
        .toLowerCase();
}

function buildHotspotWords(session) {
    const words = Array.isArray(session?.result?.topErrorWords)
        ? session.result.topErrorWords.map(normalizePracticeToken).filter(Boolean)
        : [];
    const chars = Array.isArray(session?.result?.topErrorChars)
        ? session.result.topErrorChars.map(normalizePracticeToken).filter((char) => char.length === 1)
        : [];
    const charWords = chars.flatMap((char) => commonWords.filter((word) => word.includes(char)).slice(0, 4));

    return [...new Set([...words, ...charWords])].slice(0, 12);
}

function fillAdaptiveWords(seedWords, targetCount) {
    const safeSeed = seedWords.filter(Boolean);
    const source = safeSeed.length ? safeSeed : ADAPTIVE_DRILL_WORDS.speed;
    const words = [];

    for (let index = 0; words.length < targetCount; index += 1) {
        words.push(source[index % source.length]);
    }

    return words;
}

function decorateAdaptiveWords(words, config) {
    return words.map((word, index) => {
        if (config.includeNumbers && index % 11 === 10) {
            return String(100 + (index * 7) % 900);
        }

        if (config.includePunctuation && index % 9 === 8) {
            const mark = punctuationMarks[index % punctuationMarks.length];
            return `${word}${mark}`;
        }

        return word;
    });
}

export function createAdaptiveDrillDraft(session, options = {}) {
    const language = options.language || 'zh-CN';
    const focus = resolveAdaptiveDrillFocus(session);
    const config = buildAdaptiveConfig(session, focus);
    const hotspots = buildHotspotWords(session);
    const targetCount = estimateTargetWordCount(config);
    const focusWords = ADAPTIVE_DRILL_WORDS[focus] || ADAPTIVE_DRILL_WORDS.speed;
    const seedWords = focus === 'speed'
        ? [...focusWords, ...commonWords.slice(0, 16)]
        : [...hotspots, ...focusWords, ...hotspots];

    return createDraftFromWords(decorateAdaptiveWords(fillAdaptiveWords(seedWords, targetCount), config), config, {
        label: getAdaptiveLabel(focus, language),
        language,
        generatedBy: 'adaptive',
        template: focus,
        adaptiveFocus: focus,
        adaptiveHotspots: hotspots.slice(0, 6),
        adaptiveMetrics: {
            accuracy: Number(session?.result?.accuracy || 0),
            consistency: Number(session?.result?.consistency || 0),
            missCount: getMissCount(session),
            rawGap: getRawGap(session)
        }
    });
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
    const adaptiveMeta = meta.generatedBy === 'adaptive'
        ? {
            adaptiveFocus: meta.adaptiveFocus || meta.template || null,
            adaptiveHotspots: Array.isArray(meta.adaptiveHotspots) ? meta.adaptiveHotspots : [],
            adaptiveMetrics: meta.adaptiveMetrics || {}
        }
        : {};

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
            generatedBy: meta.generatedBy || (config.source === 'ai' ? 'ai' : 'builtin'),
            ...adaptiveMeta
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
