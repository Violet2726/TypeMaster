/**
 * Arcade Rift pure gameplay model.
 *
 * The domain owns deterministic monster generation, rift-layer pacing,
 * relic choices, Guardian variants, codex progress, scoring, extraction,
 * and snapshots. It has no DOM, Canvas, audio, storage, or React dependency.
 */

import { commonWords } from './data/words.js';

export const RAID_THREAT_INTERVAL_SECONDS = 90;
export const RAID_EXTRACT_INTERVAL = 3;
export const RAID_GUARDIAN_INTERVAL = 5;
export const RAID_MODES = ['endless-rift', 'daily-mutation', 'first-breach'];

export const RAID_PHASES = {
    idle: 'idle',
    playing: 'playing',
    paused: 'paused',
    gameover: 'gameover'
};

export const GUARDIAN_VARIANTS = {
    lumenMaw: {
        id: 'lumen-maw',
        label: 'Lumen Maw',
        labelZh: '流明巨口',
        color: '#ff6b7a',
        role: 'burst',
        segments: ['flare', 'lumen', 'radiant'],
        summary: '短促爆发，召唤快速小怪。'
    },
    inkCrown: {
        id: 'ink-crown',
        label: 'Ink Crown',
        labelZh: '墨冠',
        color: '#bf8cff',
        role: 'confusion',
        segments: ['trace', 'mirror', 'rewrite'],
        summary: '制造相似词和干扰符号。'
    },
    glassWarden: {
        id: 'glass-warden',
        label: 'Glass Warden',
        labelZh: '玻璃守卫',
        color: '#64d2ff',
        role: 'shield',
        segments: ['guard', 'prism', 'shatter'],
        summary: '护盾厚重，击破阶段奖励更高。'
    }
};

export const MONSTER_TYPES = {
    nib: {
        id: 'nib',
        label: 'Nib',
        labelZh: '啃啃',
        speedFactor: 1.38,
        scoreMultiplier: 1.05,
        color: '#64d2ff',
        wordRange: [2, 5],
        role: 'swift',
        codexHint: '短词高速推进，优先清理。'
    },
    mossback: {
        id: 'mossback',
        label: 'Mossback',
        labelZh: '苔背',
        speedFactor: 0.68,
        scoreMultiplier: 1.65,
        color: '#34c759',
        wordRange: [4, 8],
        role: 'armored',
        codexHint: '双段护壳，考验稳定输入。'
    },
    blink: {
        id: 'blink',
        label: 'Blink',
        labelZh: '闪闪',
        speedFactor: 1.08,
        scoreMultiplier: 1.25,
        color: '#bf8cff',
        wordRange: [3, 6],
        role: 'switch',
        codexHint: '未输入前会换轨，锁定后保持位置。'
    },
    echo: {
        id: 'echo',
        label: 'Echo',
        labelZh: '回声',
        speedFactor: 0.92,
        scoreMultiplier: 1.35,
        color: '#ffd60a',
        wordRange: [4, 7],
        role: 'confuser',
        codexHint: '携带易混词根，容易诱发误击。'
    },
    glyph: {
        id: 'glyph',
        label: 'Glyph',
        labelZh: '符文',
        speedFactor: 0.88,
        scoreMultiplier: 1.5,
        color: '#ff9f0a',
        wordRange: [2, 8],
        role: 'symbol',
        codexHint: '数字、标点和弱字符特训。'
    },
    bloom: {
        id: 'bloom',
        label: 'Bloom',
        labelZh: '芽团',
        speedFactor: 0.58,
        scoreMultiplier: 1.8,
        color: '#7ee198',
        wordRange: [4, 7],
        role: 'support',
        codexHint: '给附近怪物护盾，尽早击杀。'
    },
    splitter: {
        id: 'splitter',
        label: 'Splitter',
        labelZh: '裂片',
        speedFactor: 1.02,
        scoreMultiplier: 1.42,
        color: '#5ac8fa',
        wordRange: [4, 7],
        role: 'swarm',
        codexHint: '击杀后分裂成字符碎片。'
    },
    scribe: {
        id: 'scribe',
        label: 'Scribe',
        labelZh: '刻写者',
        speedFactor: 0.82,
        scoreMultiplier: 1.58,
        color: '#ffb86b',
        wordRange: [5, 9],
        role: 'disrupt',
        codexHint: '会把干扰字符写进目标。'
    },
    mimic: {
        id: 'mimic',
        label: 'Mimic',
        labelZh: '拟形',
        speedFactor: 0.96,
        scoreMultiplier: 1.5,
        color: '#a6f0ff',
        wordRange: [3, 8],
        role: 'memory',
        codexHint: '复制上一只被击败怪物的词。'
    },
    anchor: {
        id: 'anchor',
        label: 'Anchor',
        labelZh: '锚兽',
        speedFactor: 0.52,
        scoreMultiplier: 2.05,
        color: '#8e8e93',
        wordRange: [6, 10],
        role: 'gate',
        codexHint: '拖慢撤离门进度，血厚但分高。'
    },
    choir: {
        id: 'choir',
        label: 'Choir',
        labelZh: '合唱群',
        speedFactor: 0.9,
        scoreMultiplier: 1.75,
        color: '#f6d365',
        wordRange: [4, 7],
        role: 'sync',
        codexHint: '同屏越多，整体推进越快。'
    },
    guardian: {
        id: 'guardian',
        label: 'Guardian Variant',
        labelZh: '守门变体',
        speedFactor: 0.32,
        scoreMultiplier: 5.2,
        color: '#ff453a',
        wordRange: [5, 11],
        role: 'elite',
        codexHint: '三阶段精英，击破后提供高额奖励。'
    }
};

export const ENEMY_TYPES = MONSTER_TYPES;

export const RAID_RELICS = [
    { id: 'combo-core', name: 'Combo Core', nameZh: '连击核心', rarity: 'common', summary: '连击分数 +12%。', effect: { comboScore: 0.12 } },
    { id: 'rift-spark', name: 'Rift Spark', nameZh: '裂隙火花', rarity: 'common', summary: '击杀分数 +10%。', effect: { scoreMultiplier: 0.1 } },
    { id: 'stasis-thread', name: 'Stasis Thread', nameZh: '迟滞丝线', rarity: 'common', summary: '怪物速度 -7%。', effect: { slow: 0.07 } },
    { id: 'glyph-lens', name: 'Glyph Lens', nameZh: '符文透镜', rarity: 'common', summary: '符文怪分数 +35%。', effect: { glyphBonus: 0.35 } },
    { id: 'aegis-key', name: 'Aegis Key', nameZh: '护盾键', rarity: 'common', summary: '最大生命 +1。', effect: { maxLives: 1 } },
    { id: 'clean-hit', name: 'Clean Hit', nameZh: '干净命中', rarity: 'common', summary: '准确率高于 96% 时分数 +14%。', effect: { accuracyScore: 0.14 } },
    { id: 'split-control', name: 'Split Control', nameZh: '裂片约束', rarity: 'common', summary: '裂片怪分裂数量 -1。', effect: { splitControl: 1 } },
    { id: 'door-credit', name: 'Door Credit', nameZh: '营门筹码', rarity: 'common', summary: '撤离分数 +20%。', effect: { extractScore: 0.2 } },
    { id: 'starburst', name: 'Starburst', nameZh: '星爆', rarity: 'rare', summary: '击杀时溅射附近怪物。', effect: { blast: 1 } },
    { id: 'piercing-note', name: 'Piercing Note', nameZh: '穿透音符', rarity: 'rare', summary: '每 6 次击杀额外清除一只低血怪。', effect: { pierceEvery: 6 } },
    { id: 'guardian-mark', name: 'Guardian Mark', nameZh: '守门印记', rarity: 'rare', summary: 'Guardian 阶段分数 +30%。', effect: { guardianScore: 0.3 } },
    { id: 'bloom-cutter', name: 'Bloom Cutter', nameZh: '芽团切刃', rarity: 'rare', summary: 'Bloom 护盾吸收后仍造成 40% 分数。', effect: { shieldScore: 0.4 } },
    { id: 'error-buffer', name: 'Error Buffer', nameZh: '误击缓冲', rarity: 'rare', summary: '每层可抵消一次错误断连。', effect: { errorBuffer: 1 } },
    { id: 'anchor-breaker', name: 'Anchor Breaker', nameZh: '断锚器', rarity: 'rare', summary: '锚兽生命 -1，最低为 1。', effect: { anchorBreak: 1 } },
    { id: 'mimic-seal', name: 'Mimic Seal', nameZh: '拟形封印', rarity: 'rare', summary: 'Mimic 不再复制长词。', effect: { mimicCap: 5 } },
    { id: 'choir-mute', name: 'Choir Mute', nameZh: '静默合唱', rarity: 'rare', summary: '合唱群同步加速减半。', effect: { choirMute: 1 } },
    { id: 'lumen-heart', name: 'Lumen Heart', nameZh: '流明心脏', rarity: 'epic', summary: '每次选择 relic 回复 1 生命。', effect: { healOnRelic: 1 } },
    { id: 'perfect-gate', name: 'Perfect Gate', nameZh: '完美营门', rarity: 'epic', summary: '无漏怪撤离时分数 +50%。', effect: { perfectExtract: 0.5 } },
    { id: 'rift-engine', name: 'Rift Engine', nameZh: '裂隙引擎', rarity: 'epic', summary: '威胁越高，击杀分数越高。', effect: { threatScore: 0.025 } },
    { id: 'glass-edge', name: 'Glass Edge', nameZh: '玻璃刃', rarity: 'epic', summary: 'Guardian 受击阶段额外掉落 relic。', effect: { guardianRelic: 1 } },
    { id: 'calm-meter', name: 'Calm Meter', nameZh: '静稳仪', rarity: 'epic', summary: '低生命时生成压力降低。', effect: { panicRelief: 0.18 } },
    { id: 'symbol-halo', name: 'Symbol Halo', nameZh: '符号光环', rarity: 'epic', summary: '数字与标点输入正确时连击 +1。', effect: { symbolCombo: 1 } },
    { id: 'rift-crown', name: 'Rift Crown', nameZh: '裂隙王冠', rarity: 'legendary', summary: '所有分数 +20%，怪物速度 +6%。', effect: { scoreMultiplier: 0.2, haste: 0.06 } },
    { id: 'last-stand', name: 'Last Stand', nameZh: '终线守势', rarity: 'legendary', summary: '首次生命归零时保留 1 点生命并清屏。', effect: { lastStand: 1 } }
];

export const RUN_MUTATIONS = [
    { id: 'swift-nest', name: 'Swift Nest', nameZh: '迅巢', summary: 'Nib 与 Blink 更常见，击杀分数略高。', weights: { nib: 3, blink: 3 }, scoreMultiplier: 1.08 },
    { id: 'glyph-storm', name: 'Glyph Storm', nameZh: '符文风暴', summary: 'Glyph 提前出现，数字与标点更多。', weights: { glyph: 5 }, glyphEarly: true },
    { id: 'bloom-garden', name: 'Bloom Garden', nameZh: '芽团花园', summary: 'Bloom 更常见，护盾怪分数更高。', weights: { bloom: 4 }, shieldScore: 0.22 },
    { id: 'mirror-choir', name: 'Mirror Choir', nameZh: '镜像合唱', summary: 'Echo、Mimic、Choir 更常见。', weights: { echo: 3, mimic: 3, choir: 2 } },
    { id: 'heavy-rift', name: 'Heavy Rift', nameZh: '重压裂隙', summary: 'Mossback 与 Anchor 更常见，但撤离奖励更高。', weights: { mossback: 3, anchor: 3 }, extractScore: 0.25 },
    { id: 'guardian-hour', name: 'Guardian Hour', nameZh: '守门时刻', summary: 'Guardian 分数更高，层级压力更快上升。', weights: {}, guardianScore: 0.4, pressureBonus: 0.08 }
];

const GAME_COPY = {
    'zh-CN': {
        title: 'Arcade Rift',
        subtitle: '输入怪物词，收集 relic，在发光裂隙里撑到更高层。',
        ready: '选择模式开始 Arcade Rift',
        start: '开始无尽裂隙',
        daily: '每日异变',
        firstBreach: '首次破口',
        paused: '裂隙已暂停',
        extracted: '成功撤离',
        defeated: '防线失守',
        relicReady: '选择一个 relic',
        threatUp: '裂隙层 {level}',
        guardianIncoming: 'Guardian 进入裂隙',
        extractReady: '撤离门开启',
        extractLocked: '下一道撤离门尚未开启',
        error: '期望 {expected}',
        miss: '没有匹配目标',
        shield: '护盾破裂',
        codexUnlock: '图鉴更新',
        linePressure: '安全线承压'
    },
    'en-US': {
        title: 'Arcade Rift',
        subtitle: 'Type monster words, collect relics, and survive deeper rift layers.',
        ready: 'Choose a mode to start Arcade Rift',
        start: 'Start Endless Rift',
        daily: 'Daily Mutation',
        firstBreach: 'First Breach',
        paused: 'Rift paused',
        extracted: 'Extraction complete',
        defeated: 'Line breached',
        relicReady: 'Choose a relic',
        threatUp: 'Rift Layer {level}',
        guardianIncoming: 'Guardian entering the rift',
        extractReady: 'Extraction gate open',
        extractLocked: 'Next extraction gate is still sealed',
        error: 'Expected {expected}',
        miss: 'No matching target',
        shield: 'Shield broken',
        codexUnlock: 'Codex updated',
        linePressure: 'Safe line under pressure'
    }
};

const ECHO_PAIRS = [
    ['form', 'from'],
    ['trail', 'trial'],
    ['quiet', 'quite'],
    ['there', 'three'],
    ['angle', 'angel'],
    ['react', 'trace'],
    ['ratio', 'radio']
];
const GLYPH_WORDS = ['a1', 's2', 'd3', 'j7', 'k8', 'l9', 'ui?', 'api!', 'v2', 'x9', 'q4', 'z0', 'run+', 'aim-'];
const SCRIBE_SUFFIX = ['x', 'z', '7', '?', '!'];
const LANES = [0.11, 0.24, 0.37, 0.50, 0.63, 0.76, 0.89];
const SAFE_LINE_Y = 1.04;

function hashSeed(seed) {
    const text = String(seed || 'arcade-rift');
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

function mulberry32(seed) {
    let t = seed >>> 0;
    return function rng() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function seededRandom(seed, salt = '') {
    return mulberry32(hashSeed(`${seed}:${salt}`));
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function pick(rng, items) {
    return items[Math.floor(rng() * items.length) % items.length];
}

function weightedPick(rng, weights) {
    const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = rng() * total;
    for (const [id, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return id;
    }
    return entries[0]?.[0] || 'nib';
}

function normalizeMode(mode) {
    return RAID_MODES.includes(mode) ? mode : 'endless-rift';
}

function sanitizeWordPool(wordPool) {
    const pool = Array.isArray(wordPool) && wordPool.length ? wordPool : commonWords;
    const clean = pool
        .map((word) => String(word || '').trim().toLowerCase())
        .filter((word) => /^[a-z0-9?!+\-]+$/.test(word) && word.length > 1);
    return clean.length ? clean : ['go', 'cat', 'home', 'focus', 'trace', 'vector', 'steady'];
}

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

export function getDailyMutation(dateKey = todayKey()) {
    const rng = seededRandom(`daily-mutation-${dateKey}`);
    return RUN_MUTATIONS[Math.floor(rng() * RUN_MUTATIONS.length) % RUN_MUTATIONS.length];
}

export function getGameCopy(language = 'zh-CN') {
    return GAME_COPY[language] || GAME_COPY['en-US'];
}

function createEmptyCounters() {
    return {
        typed: 0,
        correct: 0,
        errors: 0,
        kills: 0,
        leaked: 0,
        eliteKills: 0,
        guardianPhases: 0,
        shieldBreaks: 0,
        relicChoices: 0
    };
}

function getRiftLayer(elapsed) {
    return Math.max(1, 1 + Math.floor(Math.max(0, elapsed) / RAID_THREAT_INTERVAL_SECONDS));
}

function getLayerProgress(elapsed) {
    return (Math.max(0, elapsed) % RAID_THREAT_INTERVAL_SECONDS) / RAID_THREAT_INTERVAL_SECONDS;
}

function isExtractAvailable(layer) {
    return layer > 1 && layer % RAID_EXTRACT_INTERVAL === 0;
}

function nextExtractLayer(layer) {
    return layer + (RAID_EXTRACT_INTERVAL - (layer % RAID_EXTRACT_INTERVAL || RAID_EXTRACT_INTERVAL));
}

function getRelicStacks(relics) {
    const stacks = {};
    (relics || []).forEach((relic) => {
        stacks[relic.id] = (stacks[relic.id] || 0) + 1;
    });
    return stacks;
}

export function getRelicEffects(relics = []) {
    const effects = {};
    relics.forEach((relic) => {
        const definition = RAID_RELICS.find((item) => item.id === relic.id) || relic;
        Object.entries(definition.effect || {}).forEach(([key, value]) => {
            effects[key] = (effects[key] || 0) + Number(value || 0);
        });
    });
    return effects;
}

function serializeRelics(relics = []) {
    const stacks = getRelicStacks(relics);
    return Object.entries(stacks).map(([id, stack]) => {
        const definition = RAID_RELICS.find((item) => item.id === id);
        return {
            id,
            stack,
            name: definition?.name || id,
            nameZh: definition?.nameZh || definition?.name || id,
            rarity: definition?.rarity || 'common',
            summary: definition?.summary || ''
        };
    });
}

export function calculateRaidPressure(state) {
    const counters = state.counters || createEmptyCounters();
    const typed = Math.max(1, counters.typed || 0);
    const accuracy = (counters.correct || 0) / typed;
    const lifeRatio = (state.lives || 0) / Math.max(1, state.maxLives || 5);
    const comboScore = clamp((state.combo || 0) / 45, 0, 1);
    const timeScore = clamp((state.elapsed || 0) / 900, 0, 1);
    const mutationBonus = state.mutation?.pressureBonus || 0;
    const relicRelief = getRelicEffects(state.relics).panicRelief || 0;
    return clamp(0.18 + accuracy * 0.34 + lifeRatio * 0.15 + comboScore * 0.18 + timeScore * 0.12 + mutationBonus - (lifeRatio < 0.35 ? relicRelief : 0), 0.12, 0.98);
}

export function buildDifficultyProfile(riftLayer, pressureScore = 0.45, mutation = null, relics = []) {
    const layer = Math.max(1, riftLayer);
    const pressure = clamp(pressureScore, 0, 1);
    const effects = getRelicEffects(relics);
    const speedMultiplier = clamp(1 + (effects.haste || 0) - (effects.slow || 0), 0.62, 1.24);
    return {
        riftLayer: layer,
        threatLevel: layer,
        pressureScore: pressure,
        baseSpeed: (0.025 + layer * 0.0025 + pressure * 0.006) * speedMultiplier,
        spawnInterval: clamp(1.36 - layer * 0.04 - pressure * 0.18, 0.46, 1.32),
        activeCap: clamp(4 + Math.floor(layer / 2), 4, 13),
        wordBonus: layer >= 10 ? 3 : layer >= 6 ? 2 : layer >= 3 ? 1 : 0,
        mutationId: mutation?.id || null
    };
}

function buildMonsterWeights(stateLike) {
    const layer = stateLike.riftLayer || stateLike.threatLevel || 1;
    const mutation = stateLike.mutation || null;
    const weights = {
        nib: 4,
        mossback: layer >= 1 ? 2 : 0,
        blink: layer >= 2 ? 2 : 0,
        bloom: layer >= 2 ? 1 : 0,
        echo: layer >= 3 ? 2 : 0,
        splitter: layer >= 3 ? 2 : 0,
        glyph: layer >= 4 || mutation?.glyphEarly ? 2 : 0,
        anchor: layer >= 4 ? 1 : 0,
        scribe: layer >= 5 ? 2 : 0,
        mimic: layer >= 5 ? 1 : 0,
        choir: layer >= 6 ? 1 : 0
    };
    Object.entries(mutation?.weights || {}).forEach(([key, value]) => {
        weights[key] = (weights[key] || 0) + Number(value || 0);
    });
    return weights;
}

function chooseGuardianVariant(seed, riftLayer) {
    const variants = Object.values(GUARDIAN_VARIANTS);
    const rng = seededRandom(seed, `guardian-${riftLayer}`);
    return variants[Math.floor(rng() * variants.length) % variants.length];
}

function chooseNextMonsterType(stateLike) {
    const layer = stateLike.riftLayer || stateLike.threatLevel || 1;
    const spawnedGuardians = new Set(stateLike.spawnedGuardianLayers || stateLike.spawnedGuardianLevels || []);
    if (layer >= RAID_GUARDIAN_INTERVAL && layer % RAID_GUARDIAN_INTERVAL === 0 && !spawnedGuardians.has(layer)) {
        return 'guardian';
    }
    const rng = seededRandom(stateLike.seed, `type-${layer}-${stateLike.spawnIndex || 0}`);
    return weightedPick(rng, buildMonsterWeights(stateLike));
}

function wordInRange(word, range, bonus = 0) {
    const max = range[1] + bonus;
    return word.length >= range[0] && word.length <= max;
}

function choosePoolWord({ rng, pool, range, bonus = 0 }) {
    const candidates = pool.filter((word) => wordInRange(word, range, bonus));
    return pick(rng, candidates.length ? candidates : pool);
}

function chooseMonsterWord(options) {
    const { type, seed, spawnIndex, riftLayer, focusChars, wordPool, difficultyProfile, lastDefeatedWord, mutation } = options;
    const definition = MONSTER_TYPES[type] || MONSTER_TYPES.nib;
    const rng = seededRandom(seed, `word-${type}-${riftLayer}-${spawnIndex}`);
    const bonus = difficultyProfile?.wordBonus || 0;

    if (type === 'echo') {
        const pair = pick(rng, ECHO_PAIRS);
        return pick(rng, pair);
    }

    if (type === 'glyph') {
        const focus = Array.isArray(focusChars) && focusChars.length ? focusChars : ['a', 's', 'd', 'j', 'k', 'l'];
        const glyph = pick(rng, GLYPH_WORDS);
        return rng() > 0.45 ? glyph : `${pick(rng, focus)}${Math.floor(rng() * 10)}`;
    }

    if (type === 'scribe') {
        const base = choosePoolWord({ rng, pool: wordPool, range: definition.wordRange, bonus });
        return `${base}${pick(rng, SCRIBE_SUFFIX)}`;
    }

    if (type === 'mimic' && lastDefeatedWord) {
        const effects = getRelicEffects(options.relics || []);
        const cap = effects.mimicCap || Infinity;
        return String(lastDefeatedWord).slice(0, cap);
    }

    if (type === 'guardian') {
        const variant = options.guardianVariant || chooseGuardianVariant(seed, riftLayer);
        return variant.segments[0];
    }

    if (type === 'choir' && mutation?.id === 'mirror-choir') {
        return pick(rng, ['tone', 'sync', 'chorus', 'pulse']);
    }

    return choosePoolWord({ rng, pool: wordPool, range: definition.wordRange, bonus });
}

export function generateRaidMonster(options = {}) {
    const seed = options.seed || 'arcade-rift';
    const riftLayer = Math.max(1, options.riftLayer || options.threatLevel || 1);
    const spawnIndex = options.spawnIndex || 0;
    const wordPool = sanitizeWordPool(options.wordPool);
    const type = options.type || chooseNextMonsterType({ ...options, riftLayer });
    const definition = MONSTER_TYPES[type] || MONSTER_TYPES.nib;
    const difficultyProfile = options.difficultyProfile || buildDifficultyProfile(riftLayer, options.pressureScore || 0.45, options.mutation, options.relics);
    const rng = seededRandom(seed, `monster-${riftLayer}-${spawnIndex}-${type}`);
    const guardianVariant = type === 'guardian' ? chooseGuardianVariant(seed, riftLayer) : null;
    const word = chooseMonsterWord({
        type,
        seed,
        spawnIndex,
        riftLayer,
        focusChars: options.focusChars || [],
        wordPool,
        difficultyProfile,
        lastDefeatedWord: options.lastDefeatedWord,
        mutation: options.mutation,
        relics: options.relics,
        guardianVariant
    });
    const effects = getRelicEffects(options.relics || []);
    const baseHp = type === 'guardian'
        ? 3
        : type === 'mossback'
            ? 2
            : type === 'anchor'
                ? Math.max(1, 2 - (effects.anchorBreak || 0))
                : 1;

    return {
        id: `monster-${riftLayer}-${spawnIndex}-${type}`,
        type,
        archetype: type,
        label: definition.label,
        labelZh: definition.labelZh,
        word,
        typed: '',
        xRatio: pick(rng, LANES) + (rng() - 0.5) * 0.025,
        y: -0.1 - rng() * 0.08,
        speed: difficultyProfile.baseSpeed * definition.speedFactor,
        hp: baseHp,
        maxHp: baseHp,
        alive: true,
        leaked: false,
        elite: type === 'guardian',
        shielded: false,
        shieldBroken: false,
        splitOnDeath: type === 'splitter',
        blinkTimer: type === 'blink' ? 1.2 + rng() * 1.4 : 0,
        scribeTimer: type === 'scribe' ? 3.2 : 0,
        guardianVariant,
        phaseIndex: 0,
        spawnedAtLayer: riftLayer,
        spawnedAtThreat: riftLayer
    };
}

export function generateRelicChoices(state, count = 3) {
    const owned = getRelicStacks(state.relics);
    const rng = seededRandom(state.seed, `relic-${state.counters?.relicChoices || 0}-${state.riftLayer || 1}-${state.counters?.kills || 0}`);
    const rarityRoll = rng();
    const rarityPool = RAID_RELICS.filter((relic) => {
        if ((owned[relic.id] || 0) >= 3) return false;
        if (relic.rarity === 'legendary') return rarityRoll > 0.92;
        if (relic.rarity === 'epic') return rarityRoll > 0.68;
        if (relic.rarity === 'rare') return rarityRoll > 0.28;
        return true;
    });
    const pool = rarityPool.length >= count ? rarityPool : RAID_RELICS.filter((relic) => (owned[relic.id] || 0) < 3);
    const choices = [];
    const used = new Set();
    while (choices.length < count && used.size < pool.length) {
        const relic = pick(rng, pool);
        if (used.has(relic.id)) continue;
        used.add(relic.id);
        choices.push({
            id: relic.id,
            name: relic.name,
            nameZh: relic.nameZh,
            rarity: relic.rarity,
            summary: relic.summary,
            stack: (owned[relic.id] || 0) + 1
        });
    }
    return choices;
}

export function createRaidState(options = {}) {
    const raidMode = normalizeMode(options.raidMode);
    const language = options.language || 'zh-CN';
    const mutation = raidMode === 'daily-mutation'
        ? (options.mutation || getDailyMutation(options.dateKey))
        : null;
    const riftLayer = getRiftLayer(options.elapsed || 0);
    const pressureScore = 0.42 + (mutation?.pressureBonus || 0);
    const relics = Array.isArray(options.relics) ? options.relics : [];
    const effects = getRelicEffects(relics);
    const maxLives = raidMode === 'first-breach' ? 6 : 5 + (effects.maxLives || 0);

    return {
        phase: RAID_PHASES.idle,
        mode: RAID_PHASES.idle,
        raidMode,
        language,
        seed: options.seed || (raidMode === 'daily-mutation' ? `daily-${todayKey()}` : `rift-${todayKey()}`),
        wordPool: sanitizeWordPool(options.wordPool),
        focusChars: Array.isArray(options.focusChars) ? options.focusChars.slice(0, 6) : [],
        mutation,
        elapsed: options.elapsed || 0,
        endedAt: null,
        riftLayer,
        threatLevel: riftLayer,
        highestRiftLayer: riftLayer,
        highestThreatLevel: riftLayer,
        pressureScore,
        difficultyProfile: buildDifficultyProfile(riftLayer, pressureScore, mutation, relics),
        enemies: [],
        spawnTimer: 0.55,
        spawnIndex: 0,
        spawnedGuardianLayers: [],
        spawnedGuardianLevels: [],
        lives: maxLives,
        maxLives,
        score: 0,
        combo: 0,
        maxCombo: 0,
        streakTier: 0,
        counters: createEmptyCounters(),
        errorCounts: {},
        relics,
        relicChoices: null,
        nextRelicKill: 8,
        currentTargetId: null,
        lastDefeatedWord: '',
        lastStandUsed: false,
        guardianDefeated: [],
        codexSeen: {},
        liveMessage: getGameCopy(language).ready,
        feedback: null,
        endReason: null,
        extractReason: null
    };
}

function withModeAlias(state) {
    return { ...state, mode: state.phase };
}

function nextEvent(state, event) {
    return {
        state: withModeAlias({
            ...state,
            feedback: {
                kind: event.type,
                enemyId: event.enemyId,
                at: Math.round((state.elapsed || 0) * 1000)
            }
        }),
        event
    };
}

function startArcadeRift(state, payload = {}) {
    const raidMode = normalizeMode(payload.raidMode || state.raidMode);
    const fresh = createRaidState({
        ...state,
        ...payload,
        raidMode,
        seed: payload.seed || (
            raidMode === 'daily-mutation'
                ? `daily-${todayKey()}`
                : raidMode === 'first-breach'
                    ? `first-breach-${todayKey()}`
                    : `rift-${Date.now().toString(36)}`
        ),
        elapsed: 0,
        relics: []
    });
    return withModeAlias({
        ...fresh,
        phase: RAID_PHASES.playing,
        mode: RAID_PHASES.playing,
        liveMessage: raidMode === 'daily-mutation'
            ? `${fresh.mutation?.nameZh || '每日异变'}：${fresh.mutation?.summary || ''}`
            : getGameCopy(fresh.language).start
    });
}

function updateRiftLayerBoundary(state) {
    const riftLayer = getRiftLayer(state.elapsed);
    if (riftLayer === state.riftLayer) return { state, event: null };

    const pressureScore = calculateRaidPressure({ ...state, riftLayer });
    const copy = getGameCopy(state.language);
    const nextState = withModeAlias({
        ...state,
        riftLayer,
        threatLevel: riftLayer,
        highestRiftLayer: Math.max(state.highestRiftLayer || 1, riftLayer),
        highestThreatLevel: Math.max(state.highestThreatLevel || 1, riftLayer),
        pressureScore,
        difficultyProfile: buildDifficultyProfile(riftLayer, pressureScore, state.mutation, state.relics),
        liveMessage: riftLayer % RAID_GUARDIAN_INTERVAL === 0
            ? copy.guardianIncoming
            : copy.threatUp.replace('{level}', String(riftLayer))
    });
    return nextEvent(nextState, { type: 'rift_layer_up', riftLayer, threatLevel: riftLayer });
}

function spawnMonster(state) {
    const type = chooseNextMonsterType(state);
    const monster = generateRaidMonster({
        seed: state.seed,
        type,
        riftLayer: state.riftLayer,
        threatLevel: state.riftLayer,
        spawnIndex: state.spawnIndex,
        wordPool: state.wordPool,
        focusChars: state.focusChars,
        pressureScore: state.pressureScore,
        difficultyProfile: state.difficultyProfile,
        mutation: state.mutation,
        relics: state.relics,
        lastDefeatedWord: state.lastDefeatedWord
    });
    const spawnedGuardianLayers = type === 'guardian'
        ? [...(state.spawnedGuardianLayers || []), state.riftLayer]
        : state.spawnedGuardianLayers;

    return nextEvent({
        ...state,
        enemies: [...state.enemies, monster],
        spawnIndex: state.spawnIndex + 1,
        spawnedGuardianLayers,
        spawnedGuardianLevels: spawnedGuardianLayers,
        codexSeen: { ...state.codexSeen, [type]: true },
        liveMessage: type === 'guardian' ? getGameCopy(state.language).guardianIncoming : state.liveMessage
    }, {
        type: 'monster_spawned',
        enemyId: monster.id,
        enemyType: monster.type,
        guardianVariant: monster.guardianVariant?.id || null,
        xRatio: monster.xRatio,
        y: monster.y
    });
}

function shouldBloomShield(state, target) {
    if (!target || target.type === 'bloom' || target.shieldBroken) return false;
    return state.enemies.some((enemy) => (
        enemy.alive
        && enemy.type === 'bloom'
        && Math.abs(enemy.xRatio - target.xRatio) < 0.13
        && Math.abs(enemy.y - target.y) < 0.16
    ));
}

function scoreEnemy(state, enemy, partial = 1) {
    const definition = MONSTER_TYPES[enemy.type] || MONSTER_TYPES.nib;
    const effects = getRelicEffects(state.relics);
    const typed = Math.max(1, state.counters.typed || 1);
    const accuracy = (state.counters.correct || 0) / typed;
    const comboMultiplier = 1 + Math.min(2.5, (state.combo || 0) * 0.025) + (effects.comboScore || 0);
    const scoreMultiplier = 1
        + (effects.scoreMultiplier || 0)
        + (effects.threatScore || 0) * (state.riftLayer || 1)
        + (accuracy >= 0.96 ? (effects.accuracyScore || 0) : 0)
        + (enemy.type === 'glyph' ? (effects.glyphBonus || 0) : 0)
        + (enemy.type === 'guardian' ? ((effects.guardianScore || 0) + (state.mutation?.guardianScore || 0)) : 0)
        + (state.mutation?.scoreMultiplier ? state.mutation.scoreMultiplier - 1 : 0);
    return Math.round((40 + enemy.word.length * 14 + (state.riftLayer || 1) * 9) * definition.scoreMultiplier * comboMultiplier * scoreMultiplier * partial);
}

function maybeOpenRelicChoice(state, force = false) {
    if (state.relicChoices?.length) return state;
    if (!force && (state.counters.kills || 0) < state.nextRelicKill) return state;
    return withModeAlias({
        ...state,
        relicChoices: generateRelicChoices(state),
        liveMessage: getGameCopy(state.language).relicReady
    });
}

function pierceIfNeeded(state, events) {
    const effects = getRelicEffects(state.relics);
    if (!effects.pierceEvery) return { state, events };
    if ((state.counters.kills || 0) % effects.pierceEvery !== 0) return { state, events };
    const victim = state.enemies.find((enemy) => enemy.alive && !enemy.elite && enemy.hp <= 1);
    if (!victim) return { state, events };
    const score = scoreEnemy(state, victim, 0.55);
    const nextState = withModeAlias({
        ...state,
        enemies: state.enemies.map((enemy) => enemy.id === victim.id ? { ...enemy, alive: false, typed: enemy.word } : enemy),
        score: state.score + score,
        counters: { ...state.counters, kills: state.counters.kills + 1 }
    });
    return {
        state: nextState,
        events: [...events, { type: 'monster_defeated', enemyId: victim.id, enemyType: victim.type, score, pierce: true }]
    };
}

function spawnSplitterFragments(state, enemy) {
    const effects = getRelicEffects(state.relics);
    const chars = Array.from(new Set(enemy.word.replace(/[^a-z0-9?!+\-]/g, '').slice(0, Math.max(1, 3 - (effects.splitControl || 0))).split('')));
    return chars.map((char, index) => ({
        ...generateRaidMonster({
            seed: state.seed,
            type: 'nib',
            riftLayer: state.riftLayer,
            spawnIndex: state.spawnIndex + index + 1,
            wordPool: [char]
        }),
        id: `${enemy.id}-frag-${index}`,
        word: char,
        xRatio: clamp(enemy.xRatio + (index - 1) * 0.045, 0.08, 0.92),
        y: Math.max(0.02, enemy.y - 0.05),
        speed: enemy.speed * 1.18,
        type: 'nib',
        label: 'Shard',
        labelZh: '碎片'
    }));
}

function defeatEnemy(state, enemy) {
    let score = scoreEnemy(state, enemy);
    const effects = getRelicEffects(state.relics);
    const nextCombo = state.combo + 1 + (/[0-9?!+\-]/.test(enemy.word) ? (effects.symbolCombo || 0) : 0);
    let nextEnemies = state.enemies.map((item) => item.id === enemy.id ? { ...item, alive: false, typed: item.word } : item);
    const events = [{ type: 'monster_defeated', enemyId: enemy.id, enemyType: enemy.type, elite: enemy.elite, score }];

    if (enemy.splitOnDeath) {
        const fragments = spawnSplitterFragments(state, enemy);
        nextEnemies = [...nextEnemies, ...fragments];
        events.push({ type: 'monster_split', enemyId: enemy.id, count: fragments.length });
    }

    if (effects.blast) {
        nextEnemies = nextEnemies.map((item) => {
            if (!item.alive || item.elite || item.id === enemy.id) return item;
            if (Math.abs(item.xRatio - enemy.xRatio) > 0.09 + effects.blast * 0.02) return item;
            score += scoreEnemy(state, item, 0.35);
            events.push({ type: 'monster_defeated', enemyId: item.id, enemyType: item.type, blast: true });
            return { ...item, alive: false, typed: item.word };
        });
    }

    const guardianDefeated = enemy.type === 'guardian' && enemy.guardianVariant
        ? [...state.guardianDefeated, enemy.guardianVariant.id]
        : state.guardianDefeated;
    const counters = {
        ...state.counters,
        kills: state.counters.kills + 1,
        eliteKills: state.counters.eliteKills + (enemy.elite ? 1 : 0)
    };
    const nextState = maybeOpenRelicChoice(withModeAlias({
        ...state,
        enemies: nextEnemies,
        score: state.score + score,
        combo: nextCombo,
        maxCombo: Math.max(state.maxCombo || 0, nextCombo),
        streakTier: Math.floor(nextCombo / 25),
        counters,
        currentTargetId: null,
        lastDefeatedWord: enemy.word,
        guardianDefeated,
        codexSeen: {
            ...state.codexSeen,
            [enemy.type]: true,
            ...(enemy.guardianVariant ? { [enemy.guardianVariant.id]: true } : {})
        },
        liveMessage: enemy.elite ? 'Guardian defeated' : `${enemy.labelZh || enemy.label} cleared`
    }), Boolean(enemy.elite && effects.guardianRelic));
    return pierceIfNeeded(nextState, events);
}

function completeEnemySegment(state, enemy) {
    if (shouldBloomShield(state, enemy)) {
        const effects = getRelicEffects(state.relics);
        const score = Math.round(scoreEnemy(state, enemy) * (effects.shieldScore || state.mutation?.shieldScore || 0));
        return {
            state: withModeAlias({
                ...state,
                enemies: state.enemies.map((item) => item.id === enemy.id ? { ...item, typed: '', shieldBroken: true, shielded: false } : item),
                score: state.score + score,
                counters: { ...state.counters, shieldBreaks: state.counters.shieldBreaks + 1 },
                liveMessage: getGameCopy(state.language).shield
            }),
            events: [{ type: 'monster_shield_broken', enemyId: enemy.id, enemyType: enemy.type }]
        };
    }

    if (enemy.hp > 1) {
        const nextHp = enemy.hp - 1;
        const nextPhase = (enemy.phaseIndex || 0) + 1;
        const nextWord = enemy.type === 'guardian' && enemy.guardianVariant
            ? enemy.guardianVariant.segments[Math.min(nextPhase, enemy.guardianVariant.segments.length - 1)]
            : enemy.word;
        return {
            state: withModeAlias({
                ...state,
                enemies: state.enemies.map((item) => item.id === enemy.id
                    ? { ...item, hp: nextHp, typed: '', word: nextWord, phaseIndex: nextPhase }
                    : item),
                score: state.score + scoreEnemy(state, enemy, 0.32),
                counters: { ...state.counters, guardianPhases: state.counters.guardianPhases + (enemy.elite ? 1 : 0) },
                currentTargetId: enemy.id,
                liveMessage: enemy.elite ? `Guardian phase ${nextPhase + 1}` : 'Armor cracked'
            }),
            events: [{ type: enemy.elite ? 'guardian_phase' : 'monster_segment', enemyId: enemy.id, enemyType: enemy.type, hp: nextHp }]
        };
    }

    return defeatEnemy(state, enemy);
}

function findTargetForChar(state, char) {
    const current = state.enemies.find((enemy) => enemy.alive && enemy.id === state.currentTargetId);
    if (current) return current;
    return state.enemies.find((enemy) => enemy.alive && enemy.word[enemy.typed.length]?.toLowerCase() === char) || null;
}

export function processRaidInput(state, inputChar) {
    if (state.phase !== RAID_PHASES.playing || state.relicChoices?.length) return { state, events: [] };
    const char = String(inputChar || '').slice(-1).toLowerCase();
    if (!char) return { state, events: [] };

    const target = findTargetForChar(state, char);
    const copy = getGameCopy(state.language);
    const counters = { ...state.counters, typed: state.counters.typed + 1 };

    if (!target) {
        const errorCounts = { ...state.errorCounts, [char]: (state.errorCounts[char] || 0) + 1 };
        const effects = getRelicEffects(state.relics);
        const bufferLayer = `buffer-${state.riftLayer}`;
        const canBuffer = effects.errorBuffer && !state[bufferLayer];
        return nextEvent({
            ...state,
            counters: { ...counters, errors: counters.errors + 1 },
            errorCounts,
            combo: canBuffer ? state.combo : 0,
            [bufferLayer]: true,
            liveMessage: copy.miss
        }, { type: 'char_error', char });
    }

    const expected = target.word[target.typed.length]?.toLowerCase();
    if (char !== expected) {
        const errorCounts = { ...state.errorCounts, [expected || char]: (state.errorCounts[expected || char] || 0) + 1 };
        const effects = getRelicEffects(state.relics);
        const bufferLayer = `buffer-${state.riftLayer}`;
        const canBuffer = effects.errorBuffer && !state[bufferLayer];
        return nextEvent({
            ...state,
            counters: { ...counters, errors: counters.errors + 1 },
            errorCounts,
            combo: canBuffer ? state.combo : 0,
            currentTargetId: target.id,
            [bufferLayer]: true,
            liveMessage: copy.error.replace('{expected}', expected || '')
        }, { type: 'char_error', enemyId: target.id, expected, char });
    }

    const nextTyped = `${target.typed}${char}`;
    let nextState = withModeAlias({
        ...state,
        enemies: state.enemies.map((enemy) => enemy.id === target.id ? { ...enemy, typed: nextTyped } : enemy),
        counters: { ...counters, correct: counters.correct + 1 },
        currentTargetId: target.id,
        liveMessage: target.word.slice(nextTyped.length) || 'Hit'
    });
    const events = [{ type: 'char_correct', enemyId: target.id, char }];

    if (nextTyped.length >= target.word.length) {
        const completed = { ...target, typed: nextTyped };
        const result = completeEnemySegment(nextState, completed);
        return { state: result.state, events: [...events, ...result.events] };
    }

    return { state: nextState, events };
}

function moveEnemies(state, deltaTime) {
    const choirCount = state.enemies.filter((enemy) => enemy.alive && enemy.type === 'choir').length;
    const effects = getRelicEffects(state.relics);
    const choirBoost = choirCount > 1 ? 1 + choirCount * (effects.choirMute ? 0.025 : 0.05) : 1;

    return state.enemies.map((enemy) => {
        if (!enemy.alive) return enemy;
        let next = {
            ...enemy,
            y: enemy.y + enemy.speed * deltaTime * choirBoost
        };

        if (enemy.type === 'blink' && !enemy.typed) {
            const timer = (enemy.blinkTimer || 0) - deltaTime;
            if (timer <= 0) {
                const rng = seededRandom(state.seed, `blink-${enemy.id}-${Math.round(state.elapsed * 10)}`);
                next = {
                    ...next,
                    xRatio: pick(rng, LANES),
                    blinkTimer: 1.1 + rng() * 1.6
                };
            } else {
                next.blinkTimer = timer;
            }
        }

        return next;
    });
}

function finishRun(state, endReason, extractReason = null) {
    const effects = getRelicEffects(state.relics);
    const perfect = endReason === 'extract' && (state.counters.leaked || 0) === 0;
    const extractBonus = endReason === 'extract'
        ? Math.round(state.score * ((effects.extractScore || 0) + (state.mutation?.extractScore || 0) + (perfect ? (effects.perfectExtract || 0) : 0)))
        : 0;
    return withModeAlias({
        ...state,
        phase: RAID_PHASES.gameover,
        mode: RAID_PHASES.gameover,
        endedAt: state.elapsed,
        endReason,
        extractReason,
        score: state.score + extractBonus,
        liveMessage: endReason === 'extract' ? getGameCopy(state.language).extracted : getGameCopy(state.language).defeated
    });
}

export function updateRaidState(state, deltaTime) {
    if (state.phase !== RAID_PHASES.playing) return { state, events: [] };
    if (state.relicChoices?.length) return { state, events: [] };

    let nextState = withModeAlias({
        ...state,
        elapsed: state.elapsed + Math.max(0, deltaTime),
        enemies: moveEnemies(state, deltaTime)
    });
    const events = [];

    if (nextState.raidMode === 'first-breach' && nextState.elapsed >= 180) {
        const finished = finishRun(nextState, 'extract', 'first-breach-complete');
        return { state: finished, events: [{ type: 'raid_ended', endReason: 'extract' }] };
    }

    const layerUpdate = updateRiftLayerBoundary(nextState);
    nextState = layerUpdate.state;
    if (layerUpdate.event) events.push(layerUpdate.event);

    const leaking = nextState.enemies.filter((enemy) => enemy.alive && !enemy.leaked && enemy.y >= SAFE_LINE_Y);
    if (leaking.length) {
        let lives = nextState.lives - leaking.length;
        const effects = getRelicEffects(nextState.relics);
        let lastStandTriggered = false;
        if (lives <= 0 && effects.lastStand && !nextState.lastStandUsed) {
            lives = 1;
            lastStandTriggered = true;
        }
        const errorCounts = { ...nextState.errorCounts };
        leaking.forEach((enemy) => {
            const missed = enemy.word[enemy.typed.length] || enemy.word[0];
            errorCounts[missed] = (errorCounts[missed] || 0) + 1;
        });
        nextState = withModeAlias({
            ...nextState,
            lives,
            enemies: lastStandTriggered
                ? nextState.enemies.map((enemy) => enemy.alive ? { ...enemy, alive: false, leaked: true } : enemy)
                : nextState.enemies.map((enemy) => leaking.some((item) => item.id === enemy.id) ? { ...enemy, leaked: true, alive: false } : enemy),
            combo: 0,
            counters: { ...nextState.counters, leaked: nextState.counters.leaked + leaking.length },
            errorCounts,
            lastStandUsed: nextState.lastStandUsed || lastStandTriggered,
            liveMessage: lives > 0 ? getGameCopy(nextState.language).linePressure : getGameCopy(nextState.language).defeated
        });
        events.push({ type: 'monster_leaked', count: leaking.length });

        if (lives <= 0) {
            const finished = finishRun(nextState, 'defeat');
            return { state: finished, events: [...events, { type: 'raid_ended', endReason: 'defeat' }] };
        }
    }

    nextState = withModeAlias({
        ...nextState,
        pressureScore: calculateRaidPressure(nextState),
        difficultyProfile: buildDifficultyProfile(nextState.riftLayer, calculateRaidPressure(nextState), nextState.mutation, nextState.relics)
    });

    let spawnTimer = nextState.spawnTimer - deltaTime;
    let aliveCount = nextState.enemies.filter((enemy) => enemy.alive).length;
    while (spawnTimer <= 0 && aliveCount < nextState.difficultyProfile.activeCap) {
        const spawned = spawnMonster({ ...nextState, spawnTimer });
        nextState = spawned.state;
        events.push(spawned.event);
        aliveCount += 1;
        spawnTimer += nextState.difficultyProfile.spawnInterval * (0.86 + seededRandom(nextState.seed, `interval-${nextState.spawnIndex}`)() * 0.24);
    }

    return {
        state: withModeAlias({ ...nextState, spawnTimer }),
        events
    };
}

export function chooseRaidRelic(state, relicId) {
    if (state.phase !== RAID_PHASES.playing || !state.relicChoices?.length) return { state, events: [] };
    const choice = state.relicChoices.find((relic) => relic.id === relicId) || state.relicChoices[0];
    const definition = RAID_RELICS.find((relic) => relic.id === choice.id);
    const nextRelics = [...state.relics, definition || choice];
    const effects = getRelicEffects(nextRelics);
    const healedLives = Math.min((state.maxLives || 5) + (effects.maxLives || 0), state.lives + (effects.healOnRelic || 0));
    const maxLives = Math.max(state.maxLives || 5, 5 + (effects.maxLives || 0));
    const nextState = withModeAlias({
        ...state,
        relics: nextRelics,
        relicChoices: null,
        maxLives,
        lives: Math.min(maxLives, healedLives),
        counters: { ...state.counters, relicChoices: state.counters.relicChoices + 1 },
        nextRelicKill: state.nextRelicKill + 8 + Math.floor((state.riftLayer || 1) / 3),
        difficultyProfile: buildDifficultyProfile(state.riftLayer, state.pressureScore, state.mutation, nextRelics),
        liveMessage: `${choice.nameZh || choice.name} acquired`
    });
    return { state: nextState, events: [{ type: 'relic_chosen', relicId: choice.id, relic: choice }] };
}

export function dispatchRaidCommand(state, command, payload = {}) {
    const type = String(command || '');
    const commandPayload = payload || {};
    const copy = getGameCopy(state.language || commandPayload.language);

    if (type === 'start' || type === 'retry') {
        const nextState = startArcadeRift(state, commandPayload);
        return { state: nextState, events: [{ type: type === 'retry' ? 'raid_retried' : 'raid_started', raidMode: nextState.raidMode }] };
    }

    if (type === 'pause' && state.phase === RAID_PHASES.playing) {
        return { state: withModeAlias({ ...state, phase: RAID_PHASES.paused, liveMessage: copy.paused }), events: [{ type: 'raid_paused' }] };
    }

    if (type === 'resume' && state.phase === RAID_PHASES.paused) {
        return { state: withModeAlias({ ...state, phase: RAID_PHASES.playing, liveMessage: copy.start }), events: [{ type: 'raid_resumed' }] };
    }

    if (type === 'extract' && state.phase === RAID_PHASES.playing) {
        if (!isExtractAvailable(state.riftLayer || 1)) {
            return {
                state: withModeAlias({ ...state, liveMessage: copy.extractLocked }),
                events: [{ type: 'extract_locked', nextRiftLayer: nextExtractLayer(state.riftLayer || 1), nextThreatLevel: nextExtractLayer(state.riftLayer || 1) }]
            };
        }
        const nextState = finishRun(state, 'extract', 'rift-gate');
        return { state: nextState, events: [{ type: 'raid_ended', endReason: 'extract' }] };
    }

    if (type === 'quit') {
        return {
            state: createRaidState({
                language: state.language,
                raidMode: state.raidMode,
                wordPool: state.wordPool,
                focusChars: state.focusChars
            }),
            events: [{ type: 'raid_quit' }]
        };
    }

    if (type === 'type-char') {
        return processRaidInput(state, commandPayload.char);
    }

    if (type === 'choose-relic') {
        return chooseRaidRelic(state, commandPayload.relicId || commandPayload.index);
    }

    return { state, events: [] };
}

function weakestCharsFrom(state) {
    return Object.entries(state.errorCounts || {})
        .sort((a, b) => b[1] - a[1])
        .map(([label]) => label)
        .slice(0, 5);
}

function buildCodexProgress(state) {
    const seen = state.codexSeen || {};
    const monsters = Object.values(MONSTER_TYPES).map((monster) => ({
        id: monster.id,
        name: monster.label,
        nameZh: monster.labelZh,
        role: monster.role,
        color: monster.color,
        hint: monster.codexHint,
        discovered: Boolean(seen[monster.id]),
        defeated: (state.counters?.kills || 0) > 0 && Boolean(seen[monster.id])
    }));
    const guardians = Object.values(GUARDIAN_VARIANTS).map((guardian) => ({
        id: guardian.id,
        name: guardian.label,
        nameZh: guardian.labelZh,
        role: guardian.role,
        color: guardian.color,
        summary: guardian.summary,
        discovered: Boolean(seen[guardian.id]),
        defeated: (state.guardianDefeated || []).includes(guardian.id)
    }));
    const discovered = [...monsters, ...guardians].filter((entry) => entry.discovered).length;
    return {
        discovered,
        total: monsters.length + guardians.length,
        monsters,
        guardians
    };
}

export function buildRiftCodexFromSessions(sessions = []) {
    const base = buildCodexProgress({ codexSeen: {}, guardianDefeated: [], counters: createEmptyCounters() });
    const monsterMap = new Map(base.monsters.map((entry) => [entry.id, { ...entry }]));
    const guardianMap = new Map(base.guardians.map((entry) => [entry.id, { ...entry }]));

    (Array.isArray(sessions) ? sessions : []).forEach((session) => {
        const codex = session?.gameMeta?.codexProgress || session?.trainingMeta?.codexProgress;
        (codex?.monsters || []).forEach((entry) => {
            const current = monsterMap.get(entry.id);
            if (current) {
                monsterMap.set(entry.id, {
                    ...current,
                    discovered: current.discovered || Boolean(entry.discovered),
                    defeated: current.defeated || Boolean(entry.defeated)
                });
            }
        });
        (codex?.guardians || []).forEach((entry) => {
            const current = guardianMap.get(entry.id);
            if (current) {
                guardianMap.set(entry.id, {
                    ...current,
                    discovered: current.discovered || Boolean(entry.discovered),
                    defeated: current.defeated || Boolean(entry.defeated)
                });
            }
        });
        (session?.gameMeta?.guardianDefeated || session?.trainingMeta?.guardianDefeated || []).forEach((id) => {
            const current = guardianMap.get(id);
            if (current) guardianMap.set(id, { ...current, discovered: true, defeated: true });
        });
    });

    const monsters = [...monsterMap.values()];
    const guardians = [...guardianMap.values()];
    const discovered = [...monsters, ...guardians].filter((entry) => entry.discovered).length;
    return {
        discovered,
        total: monsters.length + guardians.length,
        monsters,
        guardians
    };
}

export function buildRaidResult(state) {
    const durationSeconds = Math.max(0, Math.round(state.endedAt ?? state.elapsed ?? 0));
    const typed = state.counters?.typed || 0;
    const correct = state.counters?.correct || 0;
    const accuracy = typed ? Math.round((correct / typed) * 100) : 100;
    const wpm = durationSeconds > 0 ? Math.round((correct / 5) / (durationSeconds / 60)) : 0;
    const riftLayer = Math.max(state.highestRiftLayer || state.riftLayer || 1, getRiftLayer(state.elapsed || 0));
    const weakestChars = weakestCharsFrom(state);
    const codexProgress = buildCodexProgress(state);

    return {
        mode: state.raidMode || 'endless-rift',
        score: Math.round(state.score || 0),
        wpm,
        accuracy,
        maxCombo: state.maxCombo || 0,
        riftLayer,
        threatLevel: riftLayer,
        durationSeconds,
        monstersDefeated: state.counters?.kills || 0,
        eliteDefeated: state.counters?.eliteKills || 0,
        guardianDefeated: state.guardianDefeated || [],
        enemiesLeaked: state.counters?.leaked || 0,
        totalCharsTyped: typed,
        totalCharsCorrect: correct,
        focusChars: state.focusChars || [],
        weakestChars,
        bestStreakWindow: state.maxCombo || 0,
        endReason: state.endReason || (state.phase === RAID_PHASES.gameover ? 'defeat' : null),
        extractReason: state.extractReason || null,
        relicBuild: serializeRelics(state.relics),
        activeRelics: serializeRelics(state.relics),
        mutationId: state.mutation?.id || null,
        mutation: state.mutation || null,
        codexProgress,
        recommendation: weakestChars.length
            ? `下局优先处理 ${weakestChars.slice(0, 3).join(' / ')}`
            : '继续推进更高裂隙层'
    };
}

function buildMonsterMix(enemies) {
    return enemies.reduce((mix, enemy) => {
        mix[enemy.type] = (mix[enemy.type] || 0) + 1;
        return mix;
    }, {});
}

export function buildRaidSnapshot(state) {
    const result = buildRaidResult(state);
    const activeEnemies = (state.enemies || []).filter((enemy) => enemy.alive && !enemy.leaked);
    const currentTarget = activeEnemies.find((enemy) => enemy.id === state.currentTargetId)
        || activeEnemies.find((enemy) => enemy.typed)
        || activeEnemies[0]
        || null;
    const extractAvailable = isExtractAvailable(state.riftLayer || 1);
    const codexProgress = buildCodexProgress(state);

    return {
        phase: state.phase,
        mode: state.mode || state.phase,
        raidMode: state.raidMode,
        hud: {
            score: Math.round(state.score || 0),
            riftLayer: state.riftLayer || 1,
            threatLevel: state.riftLayer || 1,
            wave: state.riftLayer || 1,
            waveLabel: `裂隙 ${state.riftLayer || 1}`,
            combo: state.combo || 0,
            maxCombo: state.maxCombo || 0,
            streakTier: state.streakTier || 0,
            lives: state.lives || 0,
            maxLives: state.maxLives || 5,
            accuracy: result.accuracy,
            wpm: result.wpm,
            targetWord: currentTarget?.word || '',
            targetTyped: currentTarget?.typed || '',
            progress: getLayerProgress(state.elapsed || 0),
            elapsedSeconds: Math.round(state.elapsed || 0),
            pressureScore: state.pressureScore || 0,
            extractAvailable,
            extractReady: extractAvailable,
            nextExtractThreatLevel: nextExtractLayer(state.riftLayer || 1),
            nextExtractRiftLayer: nextExtractLayer(state.riftLayer || 1),
            monsterMix: buildMonsterMix(activeEnemies),
            relicCount: state.relics?.length || 0,
            mutation: state.mutation
        },
        arena: {
            safeLineY: SAFE_LINE_Y,
            feedback: state.feedback,
            enemies: activeEnemies.map((enemy) => ({
                id: enemy.id,
                type: enemy.type,
                archetype: enemy.archetype || enemy.type,
                label: enemy.label,
                labelZh: enemy.labelZh,
                word: enemy.word,
                typed: enemy.typed,
                xRatio: enemy.xRatio,
                y: enemy.y,
                hp: enemy.hp,
                maxHp: enemy.maxHp,
                isTarget: enemy.id === currentTarget?.id,
                shielded: shouldBloomShield(state, enemy),
                elite: enemy.elite,
                guardianVariant: enemy.guardianVariant
            }))
        },
        relicChoices: state.relicChoices || [],
        activeRelics: serializeRelics(state.relics),
        mutation: state.mutation,
        codexUnlocks: codexProgress,
        codexProgress,
        dangerCurve: {
            layer: state.riftLayer || 1,
            pressure: state.pressureScore || 0,
            progress: getLayerProgress(state.elapsed || 0),
            activeEnemies: activeEnemies.length,
            activeCap: state.difficultyProfile?.activeCap || 4
        },
        overlay: state.phase === RAID_PHASES.gameover
            ? {
                type: 'result',
                result,
                isVictory: result.endReason === 'extract'
            }
            : state.phase === RAID_PHASES.idle
                ? { type: 'idle' }
                : state.relicChoices?.length
                    ? { type: 'relic-choice', choices: state.relicChoices }
                    : null,
        liveMessage: state.liveMessage || ''
    };
}
