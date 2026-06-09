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

const KEYBOARD_ZONE_FALLBACK_CHARS = {
    leftTop: ['q', 'w', 'e', 'r', 't'],
    leftHome: ['a', 's', 'd', 'f', 'g'],
    leftBottom: ['z', 'x', 'c', 'v', 'b'],
    rightTop: ['y', 'u', 'i', 'o', 'p'],
    rightHome: ['h', 'j', 'k', 'l'],
    rightBottom: ['n', 'm'],
    numberRow: ['1', '2', '3', '4', '5'],
    symbolLayer: ['.', ',', '?', ';', ':'],
    other: ['steady', 'focus']
};

const KEYBOARD_ZONE_DRILL_WORDS = {
    leftTop: ['quiet', 'write', 'tree', 'treat', 'reset', 'water', 'tower', 'true'],
    leftHome: ['ask', 'sad', 'glass', 'flag', 'fall', 'safe', 'dash', 'gas'],
    leftBottom: ['zebra', 'exact', 'civic', 'vivid', 'brave', 'basic', 'cable', 'vocal'],
    rightTop: ['input', 'union', 'option', 'upper', 'point', 'opinion', 'pilot', 'unity'],
    rightHome: ['hold', 'joke', 'kill', 'hill', 'link', 'kind', 'join', 'look'],
    rightBottom: ['moment', 'minimum', 'name', 'mean', 'moon', 'mind', 'normal', 'number'],
    numberRow: ['100', '24', '365', '808', '12', '404', '2026', '75'],
    symbolLayer: ['end.', 'pause,', 'why?', 'list;', 'note:', 'clean.', 'again,', 'ready?'],
    other: ['steady', 'focus', 'control', 'motion', 'signal', 'target', 'clear', 'finish']
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

function getKeyboardZoneLabel(zoneId, language = 'zh-CN') {
    const labels = {
        'zh-CN': {
            leftTop: '左手上排专项',
            leftHome: '左手主键位专项',
            leftBottom: '左手下排专项',
            rightTop: '右手上排专项',
            rightHome: '右手主键位专项',
            rightBottom: '右手下排专项',
            numberRow: '数字排专项',
            symbolLayer: '符号层专项',
            other: '输入稳定专项'
        },
        'en-US': {
            leftTop: 'Left top row drill',
            leftHome: 'Left home row drill',
            leftBottom: 'Left bottom row drill',
            rightTop: 'Right top row drill',
            rightHome: 'Right home row drill',
            rightBottom: 'Right bottom row drill',
            numberRow: 'Number row drill',
            symbolLayer: 'Symbol layer drill',
            other: 'Input stability drill'
        }
    };

    return (labels[language] || labels['zh-CN'])[zoneId] || labels[language]?.other || labels['zh-CN'].other;
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

function readRankedLabels(items, fallback = [], limit = 4) {
    const ranked = Array.isArray(items)
        ? items
            .map((item) => {
                if (typeof item === 'string') {
                    return normalizePracticeToken(item);
                }

                return normalizePracticeToken(item?.label || item?.value || '');
            })
            .filter(Boolean)
        : [];

    if (ranked.length) {
        return [...new Set(ranked)].slice(0, limit);
    }

    return Array.isArray(fallback)
        ? [...new Set(fallback.map(normalizePracticeToken).filter(Boolean))].slice(0, limit)
        : [];
}

function sumRankedCounts(items, targets) {
    if (!Array.isArray(items) || !Array.isArray(targets) || !targets.length) {
        return 0;
    }

    const targetSet = new Set(targets.map(normalizePracticeToken).filter(Boolean));

    return items.reduce((sum, item) => {
        const label = normalizePracticeToken(item?.label || item);
        if (!targetSet.has(label)) {
            return sum;
        }

        return sum + Number(item?.count || 0);
    }, 0);
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

function buildKeyboardZoneConfig(zone) {
    const zoneId = zone?.id || 'other';

    return {
        mode: 'words',
        durationSeconds: 30,
        wordCount: zoneId === 'numberRow' || zoneId === 'symbolLayer' ? 28 : 32,
        includePunctuation: zoneId === 'symbolLayer',
        includeNumbers: zoneId === 'numberRow',
        source: 'builtin',
        aiTemplate: 'daily',
        difficulty: 'medium'
    };
}

function buildKeyboardZoneSeedWords(zone) {
    const zoneId = zone?.id || 'other';
    const hotspotChars = Array.isArray(zone?.chars)
        ? zone.chars.map((item) => normalizePracticeToken(item?.label || item)).filter(Boolean)
        : [];
    const fallbackChars = KEYBOARD_ZONE_FALLBACK_CHARS[zoneId] || KEYBOARD_ZONE_FALLBACK_CHARS.other;
    const chars = [...new Set([...hotspotChars, ...fallbackChars])].slice(0, 8);

    if (zoneId === 'numberRow') {
        return [...chars.filter((char) => /^\d$/.test(char)), ...KEYBOARD_ZONE_DRILL_WORDS.numberRow];
    }

    if (zoneId === 'symbolLayer') {
        return [
            ...chars.filter((char) => /[^a-z0-9]/i.test(char)).map((char) => `mark${char}`),
            ...KEYBOARD_ZONE_DRILL_WORDS.symbolLayer
        ];
    }

    const charWords = chars
        .filter((char) => /^[a-z]$/.test(char))
        .flatMap((char) => [
            char.repeat(2),
            ...commonWords.filter((word) => word.includes(char)).slice(0, 3)
        ]);

    return [
        ...charWords,
        ...(KEYBOARD_ZONE_DRILL_WORDS[zoneId] || KEYBOARD_ZONE_DRILL_WORDS.other),
        ...chars
    ];
}

export function createKeyboardZoneDrillDraft(zone, options = {}) {
    const language = options.language || 'zh-CN';
    const keyboardLayout = options.keyboardLayout || 'qwerty';
    const zoneId = zone?.id || 'other';
    const config = {
        ...buildKeyboardZoneConfig(zone),
        ...(options.configOverrides || {})
    };
    const targetCount = estimateTargetWordCount(config);
    const seedWords = buildKeyboardZoneSeedWords(zone);
    const words = fillAdaptiveWords(seedWords, targetCount);

    return createDraftFromWords(words, config, {
        label: options.label || getKeyboardZoneLabel(zoneId, language),
        language,
        generatedBy: 'keyboard-zone',
        template: zoneId,
        keyboardZone: zoneId,
        keyboardLayout,
        keyboardZoneChars: Array.isArray(zone?.chars)
            ? zone.chars.slice(0, 5).map((item) => item.label).filter(Boolean)
            : [],
        keyboardZoneShare: Number(zone?.share || 0)
    });
}

export function createAdaptiveDrillDraft(session, options = {}) {
    const language = options.language || 'zh-CN';
    const focus = resolveAdaptiveDrillFocus(session);
    const config = buildAdaptiveConfig(session, focus);
    const hotspots = buildHotspotWords(session);
    const charStatItems = Array.isArray(session?.result?.errorCharStats) && session.result.errorCharStats.length
        ? session.result.errorCharStats
        : Array.isArray(session?.result?.topErrorChars)
            ? session.result.topErrorChars.map((label) => ({ label, count: 1 }))
            : [];
    const wordStatItems = Array.isArray(session?.result?.errorWordStats) && session.result.errorWordStats.length
        ? session.result.errorWordStats
        : Array.isArray(session?.result?.topErrorWords)
            ? session.result.topErrorWords.map((label) => ({ label, count: 1 }))
            : [];
    const targetChars = readRankedLabels(session?.result?.errorCharStats, session?.result?.topErrorChars, 4)
        .filter((item) => item.length === 1);
    const targetWords = readRankedLabels(session?.result?.errorWordStats, session?.result?.topErrorWords, 4)
        .filter((item) => item.length > 1);
    const adaptiveBaselineCount = sumRankedCounts(charStatItems, targetChars)
        + sumRankedCounts(wordStatItems, targetWords);
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
        adaptiveTargetChars: targetChars,
        adaptiveTargetWords: targetWords,
        adaptiveBaselineCount,
        adaptiveSourceSessionId: session?.id || null,
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
            adaptiveTargetChars: Array.isArray(meta.adaptiveTargetChars) ? meta.adaptiveTargetChars : [],
            adaptiveTargetWords: Array.isArray(meta.adaptiveTargetWords) ? meta.adaptiveTargetWords : [],
            adaptiveBaselineCount: Number(meta.adaptiveBaselineCount || 0),
            adaptiveSourceSessionId: meta.adaptiveSourceSessionId || null,
            adaptiveMetrics: meta.adaptiveMetrics || {}
        }
        : {};
    const keyboardZoneMeta = meta.generatedBy === 'keyboard-zone'
        ? {
            keyboardZone: meta.keyboardZone || meta.template || null,
            keyboardLayout: meta.keyboardLayout || null,
            keyboardZoneChars: Array.isArray(meta.keyboardZoneChars) ? meta.keyboardZoneChars : [],
            keyboardZoneShare: Number(meta.keyboardZoneShare || 0)
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
            ...adaptiveMeta,
            ...keyboardZoneMeta
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
