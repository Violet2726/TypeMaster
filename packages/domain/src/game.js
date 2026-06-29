/**
 * Typing Raid Endless Monsters pure gameplay model.
 *
 * The domain layer owns deterministic monster generation, input matching,
 * threat-level difficulty, extraction, scoring, result building, and
 * presentation snapshots. It has no DOM, Canvas, audio, storage, or React
 * dependency.
 */

import { commonWords } from './data/words.js';

export const RAID_THREAT_INTERVAL_SECONDS = 60;
export const RAID_EXTRACT_INTERVAL = 3;
export const RAID_GUARDIAN_INTERVAL = 5;
export const RAID_MODES = ['endless', 'daily-focus'];

export const RAID_PHASES = {
    idle: 'idle',
    playing: 'playing',
    paused: 'paused',
    gameover: 'gameover'
};

export const MONSTER_TYPES = {
    nib: {
        id: 'nib',
        label: 'Nib',
        labelZh: '啃啃',
        speedFactor: 1.36,
        scoreMultiplier: 1.05,
        color: '#64d2ff',
        wordRange: [2, 5],
        role: 'swift'
    },
    mossback: {
        id: 'mossback',
        label: 'Mossback',
        labelZh: '苔背',
        speedFactor: 0.68,
        scoreMultiplier: 1.7,
        color: '#34c759',
        wordRange: [4, 8],
        role: 'armored'
    },
    blink: {
        id: 'blink',
        label: 'Blink',
        labelZh: '闪闪',
        speedFactor: 1.08,
        scoreMultiplier: 1.25,
        color: '#bf8cff',
        wordRange: [3, 6],
        role: 'switch'
    },
    echo: {
        id: 'echo',
        label: 'Echo',
        labelZh: '回声',
        speedFactor: 0.92,
        scoreMultiplier: 1.35,
        color: '#ffd60a',
        wordRange: [4, 7],
        role: 'confuser'
    },
    glyph: {
        id: 'glyph',
        label: 'Glyph',
        labelZh: '符文',
        speedFactor: 0.88,
        scoreMultiplier: 1.5,
        color: '#ff9f0a',
        wordRange: [2, 8],
        role: 'focus'
    },
    bloom: {
        id: 'bloom',
        label: 'Bloom',
        labelZh: '芽芽',
        speedFactor: 0.58,
        scoreMultiplier: 1.8,
        color: '#7ee198',
        wordRange: [4, 7],
        role: 'support'
    },
    guardian: {
        id: 'guardian',
        label: 'Guardian Variant',
        labelZh: '守门变体',
        speedFactor: 0.34,
        scoreMultiplier: 4.4,
        color: '#ff453a',
        wordRange: [5, 11],
        role: 'elite'
    }
};

export const ENEMY_TYPES = MONSTER_TYPES;

const GAME_COPY = {
    'zh-CN': {
        title: '无尽突袭',
        subtitle: '在字符裂隙中清除怪物潮，稳定撤离或挑战更高威胁',
        start: '开始无尽突袭',
        dailyFocus: '每日聚焦',
        pause: '暂停',
        paused: '已暂停',
        resume: '继续',
        retry: '再来一局',
        quit: '返回菜单',
        extract: '撤离并结算',
        extractReady: '营门已开启，可以撤离',
        extractLocked: '下一个营门尚未开启',
        gameOver: '突袭结束',
        defeated: '生命耗尽',
        extracted: '稳定撤离',
        score: '得分',
        threat: '威胁',
        combo: '连击',
        wpm: '速度',
        accuracy: '准确率',
        lives: '生命',
        target: '目标',
        insight: '训练洞察',
        nextStep: '下一步建议',
        focusChars: '重点字符',
        threatUp: '威胁等级 {level}',
        guardianIncoming: '守门变体进入裂隙',
        miss: '未找到匹配目标',
        error: '期望 {expected}',
        shield: '护盾已破',
        ready: '按 Enter 开始，输入怪物身上的词',
        linePressure: '防线承压'
    },
    'en-US': {
        title: 'Endless Raid',
        subtitle: 'Clear monster waves in the character rift, extract safely, or push higher',
        start: 'Start Endless Raid',
        dailyFocus: 'Daily Focus',
        pause: 'Pause',
        paused: 'Paused',
        resume: 'Resume',
        retry: 'Play Again',
        quit: 'Back to Menu',
        extract: 'Extract and Save',
        extractReady: 'Camp gate is open',
        extractLocked: 'Next camp gate is not open yet',
        gameOver: 'Raid Ended',
        defeated: 'Lives depleted',
        extracted: 'Stable extraction',
        score: 'Score',
        threat: 'Threat',
        combo: 'Combo',
        wpm: 'Speed',
        accuracy: 'Accuracy',
        lives: 'Lives',
        target: 'Target',
        insight: 'Training insight',
        nextStep: 'Next step',
        focusChars: 'Focus chars',
        threatUp: 'Threat Level {level}',
        guardianIncoming: 'Guardian variant entering the rift',
        miss: 'No matching target',
        error: 'Expected {expected}',
        shield: 'Shield broken',
        ready: 'Press Enter to start, then type monster words',
        linePressure: 'Line under pressure'
    }
};

const GLYPH_WORDS = ['a1', 's2', 'd3', 'j7', 'k8', 'l9', 'api', 'ui', 'v2', 'x9', 'q4', 'z0'];
const ECHO_PAIRS = [
    ['form', 'from'],
    ['trail', 'trial'],
    ['quiet', 'quite'],
    ['there', 'three'],
    ['angle', 'angel'],
    ['react', 'trace']
];
const GUARDIAN_SEGMENTS = [
    ['steady', 'vector', 'resolve'],
    ['focus', 'rhythm', 'finish'],
    ['signal', 'guardian', 'victory'],
    ['calm', 'target', 'release']
];
const LANES = [0.12, 0.25, 0.38, 0.50, 0.62, 0.75, 0.88];
const SAFE_LINE_Y = 1.04;

function hashSeed(seed) {
    const text = String(seed || 'typing-raid');
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
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

function normalizeMode(mode) {
    return RAID_MODES.includes(mode) ? mode : 'endless';
}

function sanitizeWordPool(wordPool) {
    const pool = Array.isArray(wordPool) && wordPool.length > 0 ? wordPool : commonWords;
    return pool
        .map((word) => String(word || '').trim().toLowerCase())
        .filter((word) => /^[a-z0-9]+$/.test(word) && word.length > 1);
}

function createEmptyCounters() {
    return {
        typed: 0,
        correct: 0,
        errors: 0,
        kills: 0,
        leaked: 0,
        eliteKills: 0,
        shieldBreaks: 0
    };
}

function withModeAlias(state) {
    return { ...state, mode: state.phase };
}

function getThreatLevel(elapsed) {
    return Math.max(1, 1 + Math.floor(Math.max(0, elapsed) / RAID_THREAT_INTERVAL_SECONDS));
}

function getThreatProgress(elapsed) {
    return (Math.max(0, elapsed) % RAID_THREAT_INTERVAL_SECONDS) / RAID_THREAT_INTERVAL_SECONDS;
}

function isExtractAvailable(threatLevel) {
    return threatLevel > 1 && threatLevel % RAID_EXTRACT_INTERVAL === 0;
}

function nextExtractThreatLevel(threatLevel) {
    return threatLevel + (RAID_EXTRACT_INTERVAL - (threatLevel % RAID_EXTRACT_INTERVAL || RAID_EXTRACT_INTERVAL));
}

export function getGameCopy(language = 'zh-CN') {
    return GAME_COPY[language] || GAME_COPY['en-US'];
}

export function getEnemyTypeConfig(type) {
    return MONSTER_TYPES[type] || MONSTER_TYPES.nib;
}

export function getAllEnemyTypes() {
    return Object.keys(MONSTER_TYPES);
}

export function calculateRaidPressure(state) {
    const typed = state.counters?.typed || 0;
    const correct = state.counters?.correct || 0;
    const elapsedMinutes = Math.max((state.elapsed || 1) / 60, 1 / 60);
    const accuracy = typed > 0 ? correct / typed : 1;
    const wpm = (correct / 5) / elapsedMinutes;
    const speedScore = clamp(wpm / 85, 0, 1);
    const lifeScore = clamp((state.lives || 0) / (state.maxLives || 5), 0, 1);
    const comboScore = clamp((state.combo || 0) / 32, 0, 1);
    const recoveryScore = clamp(1 - ((state.counters?.errors || 0) / Math.max(typed, 1)), 0, 1);

    return clamp(
        accuracy * 0.34 + speedScore * 0.24 + lifeScore * 0.18 + comboScore * 0.14 + recoveryScore * 0.1,
        0.15,
        0.98
    );
}

export function buildDifficultyProfile(threatLevel, pressureScore = 0.45) {
    const threat = Math.max(1, threatLevel);
    const ramp = Math.min(1, (threat - 1) / 10);
    const pressure = clamp(pressureScore, 0.15, 0.98);
    const baseSpeed = 0.026 + threat * 0.0026 + pressure * 0.006;
    const spawnInterval = clamp(1.42 - threat * 0.045 - pressure * 0.22, 0.54, 1.36);
    const activeCap = clamp(4 + Math.floor(threat / 2), 4, 11);

    return {
        threatLevel: threat,
        pressureScore: pressure,
        baseSpeed,
        spawnInterval,
        activeCap,
        wordBonus: threat >= 8 ? 2 : threat >= 4 ? 1 : 0,
        mix: {
            nib: 3 + Math.floor(ramp * 2),
            mossback: threat >= 2 ? 2 : 1,
            blink: threat >= 3 ? 2 : 0,
            echo: threat >= 4 ? 2 : 0,
            glyph: threat >= 5 ? 2 : 0,
            bloom: threat >= 3 ? 1 : 0
        }
    };
}

function pickWord(rng, pool, range, usedWords = new Set()) {
    const [minLength, maxLength] = range;
    const candidates = pool.filter((word) => (
        !usedWords.has(word) && word.length >= minLength && word.length <= maxLength
    ));
    const safe = candidates.length > 0 ? candidates : pool;
    const word = safe[Math.floor(rng() * safe.length)] || 'type';
    usedWords.add(word);
    return word;
}

function pickFocusedWord(rng, pool, focusChars, range, usedWords = new Set()) {
    const focus = new Set((focusChars || []).map((char) => String(char).toLowerCase()).filter(Boolean));
    if (focus.size === 0) return pickWord(rng, pool, range, usedWords);
    const candidates = pool.filter((word) => (
        !usedWords.has(word)
        && word.length >= range[0]
        && word.length <= range[1]
        && word.split('').some((char) => focus.has(char))
    ));
    if (candidates.length === 0) return pickWord(rng, pool, range, usedWords);
    const word = candidates[Math.floor(rng() * candidates.length)];
    usedWords.add(word);
    return word;
}

function pickGlyphWord(rng, focusChars) {
    const focus = (focusChars || []).map((char) => String(char).toLowerCase()).filter(Boolean);
    if (focus.length > 0) {
        return `${focus[Math.floor(rng() * focus.length)]}${Math.ceil(rng() * 9)}`;
    }
    const pool = focus.length > 0
        ? [...focus.map((char) => `${char}${Math.ceil(rng() * 9)}`), ...GLYPH_WORDS]
        : GLYPH_WORDS;
    return pool[Math.floor(rng() * pool.length)] || 'a1';
}

function pickEchoSegments(rng) {
    const pair = ECHO_PAIRS[Math.floor(rng() * ECHO_PAIRS.length)] || ECHO_PAIRS[0];
    return rng() > 0.5 ? pair : [...pair].reverse();
}

function pickGuardianSegments(rng, focusChars) {
    const template = GUARDIAN_SEGMENTS[Math.floor(rng() * GUARDIAN_SEGMENTS.length)] || GUARDIAN_SEGMENTS[0];
    const focus = (focusChars || []).map((char) => String(char).toLowerCase()).filter(Boolean);
    if (focus.length === 0) return template;
    return template.map((segment, index) => index === 1 ? `${segment}${focus[Math.floor(rng() * focus.length)]}` : segment);
}

function weightedMonsterType(rng, mix) {
    const entries = Object.entries(mix).filter(([, weight]) => weight > 0);
    const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let cursor = rng() * total;
    for (const [type, weight] of entries) {
        cursor -= weight;
        if (cursor <= 0) return type;
    }
    return entries[0]?.[0] || 'nib';
}

export function chooseNextMonsterType(state, rng = seededRandom(state.seed, `type-${state.spawnIndex}`)) {
    const threatLevel = state.threatLevel || 1;
    const spawnedGuardians = new Set(state.spawnedGuardianLevels || []);
    if (
        threatLevel >= RAID_GUARDIAN_INTERVAL
        && threatLevel % RAID_GUARDIAN_INTERVAL === 0
        && !spawnedGuardians.has(threatLevel)
    ) {
        return 'guardian';
    }

    const profile = state.difficultyProfile || buildDifficultyProfile(threatLevel, state.pressureScore);
    const mix = { ...profile.mix };
    if (state.raidMode === 'daily-focus') {
        mix.glyph = (mix.glyph || 0) + 3;
    }
    return weightedMonsterType(rng, mix);
}

export function generateRaidMonster(options = {}) {
    const seed = options.seed || 'typing-raid';
    const threatLevel = Math.max(1, options.threatLevel || 1);
    const spawnIndex = Math.max(0, options.spawnIndex || 0);
    const type = options.type || 'nib';
    const profile = options.difficultyProfile || buildDifficultyProfile(threatLevel, options.pressureScore);
    const wordPool = sanitizeWordPool(options.wordPool);
    const focusChars = options.focusChars || [];
    const rng = seededRandom(seed, `monster-${threatLevel}-${spawnIndex}-${type}`);
    const config = MONSTER_TYPES[type] || MONSTER_TYPES.nib;
    const usedWords = new Set();
    const laneIndex = Math.floor(rng() * LANES.length);
    const lane = LANES[laneIndex];
    const jitter = (rng() - 0.5) * 0.035;
    let segments = null;
    let word;

    if (type === 'guardian') {
        segments = pickGuardianSegments(rng, focusChars);
        word = segments[0];
    } else if (type === 'mossback') {
        const first = pickFocusedWord(rng, wordPool, focusChars, [config.wordRange[0], config.wordRange[1] + profile.wordBonus], usedWords);
        const second = pickWord(rng, wordPool, [3, 7 + profile.wordBonus], usedWords);
        segments = [first, second];
        word = segments[0];
    } else if (type === 'echo') {
        segments = pickEchoSegments(rng);
        word = segments[0];
    } else if (type === 'glyph') {
        word = pickGlyphWord(rng, focusChars);
    } else if (type === 'bloom') {
        word = pickWord(rng, wordPool, [4, 7 + profile.wordBonus], usedWords);
    } else {
        word = pickWord(rng, wordPool, [config.wordRange[0], config.wordRange[1] + profile.wordBonus], usedWords);
    }

    const maxHp = Array.isArray(segments) ? segments.length : 1;

    return {
        id: `monster-${threatLevel}-${spawnIndex}-${type}`,
        type,
        word,
        segments,
        segmentIndex: 0,
        xRatio: clamp(lane + jitter, 0.08, 0.92),
        laneIndex,
        y: 0.18 + rng() * 0.035,
        age: 0,
        speed: profile.baseSpeed * config.speedFactor * (0.9 + rng() * 0.18),
        hp: maxHp,
        maxHp,
        scoreMultiplier: config.scoreMultiplier,
        typed: '',
        alive: true,
        leaked: false,
        shieldBroken: false,
        elite: type === 'guardian',
        spawnedAtThreat: threatLevel
    };
}

export function createRaidState(options = {}) {
    const language = options.language || 'zh-CN';
    const raidMode = normalizeMode(options.raidMode);
    const pressureScore = clamp(options.pressureScore ?? 0.45, 0.15, 0.98);
    const threatLevel = getThreatLevel(options.elapsed || 0);

    return withModeAlias({
        phase: RAID_PHASES.idle,
        raidMode,
        language,
        seed: options.seed || `raid-${new Date().toISOString().slice(0, 10)}`,
        score: 0,
        combo: 0,
        maxCombo: 0,
        lives: 5,
        maxLives: 5,
        threatLevel,
        highestThreatLevel: threatLevel,
        pressureScore,
        difficultyProfile: buildDifficultyProfile(threatLevel, pressureScore),
        spawnTimer: 0,
        spawnIndex: 0,
        enemies: [],
        elapsed: options.elapsed || 0,
        startedAt: options.now ?? 0,
        endedAt: null,
        endReason: null,
        extractReason: null,
        currentTargetId: null,
        counters: createEmptyCounters(),
        errorCounts: {},
        focusChars: Array.isArray(options.focusChars) ? options.focusChars.slice(0, 8) : [],
        wordPool: sanitizeWordPool(options.wordPool),
        recentKeyTimes: [],
        bestStreakWindow: 0,
        spawnedGuardianLevels: [],
        lastFeedback: null,
        liveMessage: getGameCopy(language).ready,
        lastEventId: 0
    });
}

function nextEvent(state, event) {
    const id = (state.lastEventId || 0) + 1;
    return {
        state: { ...state, lastEventId: id },
        event: { id, ...event }
    };
}

function updateErrorCount(errorCounts, label) {
    if (!label) return errorCounts;
    const key = String(label).toLowerCase();
    return { ...errorCounts, [key]: (errorCounts[key] || 0) + 1 };
}

function getAccuracy(state) {
    const typed = state.counters.typed || 0;
    if (typed === 0) return 100;
    return Math.round((state.counters.correct / typed) * 100);
}

function getWpm(state) {
    const minutes = Math.max((state.elapsed || 0) / 60, 1 / 60);
    return Math.round((state.counters.correct / 5) / minutes);
}

function getActiveEnemy(state) {
    if (!state.currentTargetId) return null;
    return state.enemies.find((enemy) => enemy.alive && enemy.id === state.currentTargetId) || null;
}

function getPriorityEnemy(state) {
    return state.enemies
        .filter((enemy) => enemy.alive)
        .sort((a, b) => b.y - a.y || a.spawnedAtThreat - b.spawnedAtThreat || a.id.localeCompare(b.id))[0] || null;
}

function getMatchingEnemy(state, char) {
    return state.enemies
        .filter((enemy) => enemy.alive && enemy.word[0]?.toLowerCase() === char)
        .sort((a, b) => b.y - a.y || a.id.localeCompare(b.id))[0] || null;
}

function getEnemyExpectedChar(enemy) {
    if (!enemy) return '';
    return enemy.word[(enemy.typed || '').length] || '';
}

function isEnemyShielded(state, enemy) {
    if (!enemy || enemy.type === 'bloom' || enemy.type === 'guardian' || enemy.shieldBroken) return false;
    return state.enemies.some((item) => (
        item.alive
        && item.type === 'bloom'
        && item.id !== enemy.id
        && Math.abs(item.xRatio - enemy.xRatio) <= 0.19
        && Math.abs(item.y - enemy.y) <= 0.22
    ));
}

function scoreForMonster(enemy, combo) {
    const text = (enemy.segments || [enemy.word]).join('');
    const wordValue = text.length * 12;
    const comboMultiplier = 1 + Math.floor(combo / 8) * 0.16;
    return Math.round(wordValue * (enemy.scoreMultiplier || 1) * comboMultiplier);
}

function buildMonsterMix(enemies) {
    return enemies
        .filter((enemy) => enemy.alive)
        .reduce((mix, enemy) => ({ ...mix, [enemy.type]: (mix[enemy.type] || 0) + 1 }), {});
}

function updateThreatBoundary(state) {
    const threatLevel = getThreatLevel(state.elapsed);
    if (threatLevel === state.threatLevel) return { state, event: null };
    const pressureScore = calculateRaidPressure(state);
    const copy = getGameCopy(state.language);
    const nextState = withModeAlias({
        ...state,
        threatLevel,
        highestThreatLevel: Math.max(state.highestThreatLevel || 1, threatLevel),
        pressureScore,
        difficultyProfile: buildDifficultyProfile(threatLevel, pressureScore),
        spawnTimer: Math.min(state.spawnTimer, 0.4),
        liveMessage: threatLevel % RAID_GUARDIAN_INTERVAL === 0
            ? copy.guardianIncoming
            : copy.threatUp.replace('{level}', String(threatLevel))
    });
    const result = nextEvent(nextState, { type: 'threat_level_up', threatLevel });
    return { state: result.state, event: result.event };
}

function spawnMonster(state) {
    const rng = seededRandom(state.seed, `spawn-${state.threatLevel}-${state.spawnIndex}`);
    const type = chooseNextMonsterType(state, rng);
    const monster = generateRaidMonster({
        seed: state.seed,
        threatLevel: state.threatLevel,
        spawnIndex: state.spawnIndex,
        type,
        pressureScore: state.pressureScore,
        difficultyProfile: state.difficultyProfile,
        wordPool: state.wordPool,
        focusChars: state.focusChars
    });
    const guardianLevels = type === 'guardian'
        ? [...(state.spawnedGuardianLevels || []), state.threatLevel]
        : state.spawnedGuardianLevels;
    const nextState = withModeAlias({
        ...state,
        enemies: [...state.enemies, monster],
        spawnIndex: state.spawnIndex + 1,
        spawnedGuardianLevels: guardianLevels
    });
    const result = nextEvent(nextState, {
        type: 'monster_spawned',
        enemyId: monster.id,
        enemyType: monster.type,
        xRatio: monster.xRatio,
        y: monster.y
    });
    return { state: result.state, event: result.event };
}

function maybeMoveBlink(enemy, dt) {
    if (enemy.type !== 'blink' || enemy.typed) {
        return { enemy: { ...enemy, age: (enemy.age || 0) + dt }, moved: false };
    }

    const previousAge = enemy.age || 0;
    const nextAge = previousAge + dt;
    const previousStep = Math.floor(previousAge / 2.4);
    const nextStep = Math.floor(nextAge / 2.4);
    if (nextStep === previousStep) {
        return { enemy: { ...enemy, age: nextAge }, moved: false };
    }

    const direction = nextStep % 2 === 0 ? -1 : 1;
    const laneIndex = clamp((enemy.laneIndex || 3) + direction, 0, LANES.length - 1);
    return {
        enemy: {
            ...enemy,
            age: nextAge,
            laneIndex,
            xRatio: LANES[laneIndex]
        },
        moved: true
    };
}

function updateEnemies(state, dt) {
    const events = [];
    let leakedCount = 0;
    const leakedExpectedChars = [];
    const movedEnemies = state.enemies.map((enemy) => {
        if (!enemy.alive) return enemy;
        const blink = maybeMoveBlink(enemy, dt);
        let nextEnemy = blink.enemy;
        if (blink.moved) {
            events.push({ type: 'monster_blinked', enemyId: enemy.id, xRatio: nextEnemy.xRatio, y: nextEnemy.y });
        }
        const y = nextEnemy.y + nextEnemy.speed * dt;
        if (y > SAFE_LINE_Y) {
            leakedCount += nextEnemy.type === 'guardian' ? 2 : nextEnemy.type === 'bloom' ? 0 : 1;
            leakedExpectedChars.push(getEnemyExpectedChar(nextEnemy) || nextEnemy.word[0]);
            return { ...nextEnemy, y, alive: false, leaked: true };
        }
        return { ...nextEnemy, y };
    });

    return { movedEnemies, leakedCount, leakedExpectedChars, movementEvents: events };
}

function completeMonsterSegment(state, enemy, char) {
    const nextTyped = `${enemy.typed || ''}${char}`;
    const counters = {
        ...state.counters,
        typed: state.counters.typed + 1,
        correct: state.counters.correct + 1
    };

    if (nextTyped !== enemy.word) {
        return nextEvent(withModeAlias({
            ...state,
            counters,
            enemies: state.enemies.map((item) => (
                item.id === enemy.id ? { ...item, typed: nextTyped } : item
            )),
            lastFeedback: { kind: 'correct', enemyId: enemy.id, char, at: state.elapsed },
            liveMessage: enemy.word
        }), { type: 'char_correct', enemyId: enemy.id });
    }

    const hasNextSegment = Array.isArray(enemy.segments) && enemy.segmentIndex + 1 < enemy.segments.length;
    if (hasNextSegment) {
        const nextSegmentIndex = enemy.segmentIndex + 1;
        const nextWord = enemy.segments[nextSegmentIndex];
        const nextHp = Math.max(1, enemy.maxHp - nextSegmentIndex);
        return nextEvent(withModeAlias({
            ...state,
            counters,
            enemies: state.enemies.map((item) => (
                item.id === enemy.id
                    ? { ...item, hp: nextHp, segmentIndex: nextSegmentIndex, word: nextWord, typed: '' }
                    : item
            )),
            lastFeedback: { kind: 'segment', enemyId: enemy.id, char, at: state.elapsed },
            liveMessage: nextWord
        }), { type: enemy.type === 'guardian' ? 'guardian_phase' : 'monster_segment', enemyId: enemy.id });
    }

    if (isEnemyShielded(state, enemy)) {
        return nextEvent(withModeAlias({
            ...state,
            counters: {
                ...counters,
                shieldBreaks: counters.shieldBreaks + 1
            },
            enemies: state.enemies.map((item) => (
                item.id === enemy.id ? { ...item, typed: '', shieldBroken: true } : item
            )),
            lastFeedback: { kind: 'shield', enemyId: enemy.id, char, at: state.elapsed },
            liveMessage: getGameCopy(state.language).shield
        }), { type: 'monster_shield_broken', enemyId: enemy.id });
    }

    const score = scoreForMonster(enemy, state.combo);
    const nextCombo = state.combo + (enemy.type === 'bloom' ? 2 : 1);
    const nextState = withModeAlias({
        ...state,
        score: state.score + score,
        combo: nextCombo,
        maxCombo: Math.max(state.maxCombo, nextCombo),
        bestStreakWindow: Math.max(state.bestStreakWindow || 0, nextCombo),
        currentTargetId: null,
        counters: {
            ...counters,
            kills: counters.kills + 1,
            eliteKills: counters.eliteKills + (enemy.elite ? 1 : 0)
        },
        enemies: state.enemies.map((item) => (
            item.id === enemy.id ? { ...item, typed: nextTyped, alive: false, hp: 0 } : item
        )),
        lastFeedback: { kind: 'kill', enemyId: enemy.id, char, at: state.elapsed },
        liveMessage: `+${score}`
    });

    return nextEvent(nextState, {
        type: 'monster_defeated',
        enemyId: enemy.id,
        enemyType: enemy.type,
        score,
        xRatio: enemy.xRatio,
        y: enemy.y,
        elite: enemy.elite
    });
}

export function processRaidInput(state, inputChar) {
    if (state.phase !== RAID_PHASES.playing) {
        return { state, events: [] };
    }

    const char = String(inputChar || '').slice(0, 1).toLowerCase();
    if (!char) return { state, events: [] };

    const activeEnemy = getActiveEnemy(state);
    const target = activeEnemy || getMatchingEnemy(state, char);
    const copy = getGameCopy(state.language);

    if (!target) {
        const nextState = withModeAlias({
            ...state,
            combo: Math.max(0, state.combo - 1),
            counters: {
                ...state.counters,
                typed: state.counters.typed + 1,
                errors: state.counters.errors + 1
            },
            errorCounts: updateErrorCount(state.errorCounts, char),
            lastFeedback: { kind: 'miss', char, at: state.elapsed },
            liveMessage: copy.miss
        });
        const result = nextEvent(nextState, { type: 'char_miss', char });
        return { state: result.state, events: [result.event] };
    }

    const expected = getEnemyExpectedChar(target).toLowerCase();
    const targetState = activeEnemy ? state : { ...state, currentTargetId: target.id };

    if (char !== expected) {
        const nextState = withModeAlias({
            ...targetState,
            combo: Math.max(0, state.combo - 2),
            counters: {
                ...state.counters,
                typed: state.counters.typed + 1,
                errors: state.counters.errors + 1
            },
            errorCounts: updateErrorCount(state.errorCounts, expected || char),
            lastFeedback: { kind: 'error', enemyId: target.id, char, expected, at: state.elapsed },
            liveMessage: copy.error.replace('{expected}', expected || '?')
        });
        const result = nextEvent(nextState, { type: 'char_error', enemyId: target.id, char, expected });
        return { state: result.state, events: [result.event] };
    }

    const result = completeMonsterSegment(targetState, target, char);
    return { state: result.state, events: [result.event] };
}

export function startEndlessRaid(state, payload = {}) {
    const fresh = createRaidState({
        ...state,
        ...payload,
        raidMode: normalizeMode(payload.raidMode || state.raidMode),
        language: payload.language || state.language || 'zh-CN',
        seed: payload.seed || state.seed,
        focusChars: payload.focusChars || state.focusChars,
        wordPool: payload.wordPool || state.wordPool,
        now: 0
    });
    return withModeAlias({
        ...fresh,
        phase: RAID_PHASES.playing,
        spawnTimer: 0,
        liveMessage: getGameCopy(fresh.language).ready
    });
}

export function updateRaidState(state, deltaTime) {
    if (state.phase !== RAID_PHASES.playing) {
        return { state, events: [] };
    }

    const dt = clamp(Number(deltaTime) || 0, 0, 0.08);
    let nextState = withModeAlias({
        ...state,
        elapsed: state.elapsed + dt,
        lastFeedback: state.lastFeedback && state.elapsed - state.lastFeedback.at > 0.6
            ? null
            : state.lastFeedback
    });
    const events = [];

    const threatUpdate = updateThreatBoundary(nextState);
    nextState = threatUpdate.state;
    if (threatUpdate.event) events.push(threatUpdate.event);

    const { movedEnemies, leakedCount, leakedExpectedChars, movementEvents } = updateEnemies(nextState, dt);
    nextState = withModeAlias({ ...nextState, enemies: movedEnemies });
    movementEvents.forEach((event) => {
        const result = nextEvent(nextState, event);
        nextState = result.state;
        events.push(result.event);
    });

    if (leakedCount > 0) {
        const lives = Math.max(0, nextState.lives - leakedCount);
        let errorCounts = nextState.errorCounts;
        leakedExpectedChars.forEach((char) => {
            errorCounts = updateErrorCount(errorCounts, char);
        });
        nextState = withModeAlias({
            ...nextState,
            lives,
            combo: 0,
            currentTargetId: movedEnemies.some((enemy) => enemy.alive && enemy.id === nextState.currentTargetId)
                ? nextState.currentTargetId
                : null,
            counters: {
                ...nextState.counters,
                leaked: nextState.counters.leaked + leakedCount
            },
            errorCounts,
            lastFeedback: { kind: 'leak', at: nextState.elapsed },
            liveMessage: lives > 0 ? getGameCopy(nextState.language).linePressure : getGameCopy(nextState.language).defeated
        });
        const leaked = nextEvent(nextState, { type: 'monster_leaked', count: leakedCount });
        nextState = leaked.state;
        events.push(leaked.event);
    }

    if (nextState.lives <= 0) {
        nextState = withModeAlias({
            ...nextState,
            phase: RAID_PHASES.gameover,
            endedAt: nextState.elapsed,
            endReason: 'defeat',
            extractReason: null,
            liveMessage: getGameCopy(nextState.language).defeated
        });
        const gameover = nextEvent(nextState, { type: 'raid_ended', endReason: 'defeat' });
        return { state: gameover.state, events: [...events, gameover.event] };
    }

    const aliveCount = nextState.enemies.filter((enemy) => enemy.alive).length;
    let spawnTimer = nextState.spawnTimer - dt;
    while (spawnTimer <= 0 && aliveCount + events.filter((event) => event.type === 'monster_spawned').length < nextState.difficultyProfile.activeCap) {
        const spawned = spawnMonster({ ...nextState, spawnTimer });
        nextState = spawned.state;
        events.push(spawned.event);
        spawnTimer += nextState.difficultyProfile.spawnInterval;
    }

    nextState = withModeAlias({ ...nextState, spawnTimer });

    return { state: nextState, events };
}

export function dispatchRaidCommand(state, command, payload = {}) {
    const type = typeof command === 'string' ? command : command?.type;
    const commandPayload = typeof command === 'string' ? payload : (command || {});
    const copy = getGameCopy(state.language || commandPayload.language);

    if (type === 'start' || type === 'retry') {
        const nextState = startEndlessRaid(state, commandPayload);
        return { state: nextState, events: [{ type: type === 'retry' ? 'raid_retried' : 'raid_started' }] };
    }

    if (type === 'pause' && state.phase === RAID_PHASES.playing) {
        return {
            state: withModeAlias({ ...state, phase: RAID_PHASES.paused, liveMessage: copy.paused }),
            events: [{ type: 'raid_paused' }]
        };
    }

    if (type === 'resume' && state.phase === RAID_PHASES.paused) {
        return {
            state: withModeAlias({ ...state, phase: RAID_PHASES.playing, liveMessage: copy.ready }),
            events: [{ type: 'raid_resumed' }]
        };
    }

    if (type === 'extract' && state.phase === RAID_PHASES.playing) {
        if (!isExtractAvailable(state.threatLevel || 1)) {
            return {
                state: withModeAlias({ ...state, liveMessage: copy.extractLocked }),
                events: [{ type: 'extract_locked', nextThreatLevel: nextExtractThreatLevel(state.threatLevel || 1) }]
            };
        }

        const nextState = withModeAlias({
            ...state,
            phase: RAID_PHASES.gameover,
            endedAt: state.elapsed,
            endReason: 'extract',
            extractReason: 'camp-gate',
            liveMessage: copy.extracted
        });
        const result = nextEvent(nextState, { type: 'raid_ended', endReason: 'extract' });
        return { state: result.state, events: [result.event] };
    }

    if (type === 'quit') {
        return {
            state: createRaidState({
                ...state,
                phase: RAID_PHASES.idle,
                language: state.language,
                seed: state.seed,
                focusChars: state.focusChars,
                wordPool: state.wordPool
            }),
            events: [{ type: 'raid_quit' }]
        };
    }

    if (type === 'type-char') {
        return processRaidInput(state, commandPayload.char);
    }

    return { state, events: [] };
}

function buildRecommendation(state, result) {
    if (result.accuracy < 92) {
        return '下一局先放慢首字母选择，优先守住准确率。';
    }
    if (result.wpm < 35) {
        return '保持目标提前量，尝试在怪物进入中线前锁定。';
    }
    if (result.endReason === 'extract') {
        return '撤离节奏稳定，下次可以多挑战一个威胁等级。';
    }
    if ((state.maxCombo || 0) >= 24) {
        return '连击稳定，适合进入每日聚焦清理弱字符。';
    }
    return '保持节奏，下一局在营门开启时评估是否撤离。';
}

export function buildRaidResult(state) {
    const durationSeconds = Math.max(1, Math.round(state.endedAt || state.elapsed || 0));
    const errorEntries = Object.entries(state.errorCounts || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const weakestChars = errorEntries.map(([label]) => label);
    const accuracy = getAccuracy(state);
    const wpm = getWpm(state);
    const threatLevel = Math.max(state.highestThreatLevel || state.threatLevel || 1, getThreatLevel(state.elapsed || 0));
    const result = {
        score: state.score,
        mode: state.raidMode || 'endless',
        wpm,
        accuracy,
        maxCombo: state.maxCombo,
        threatLevel,
        durationSeconds,
        monstersDefeated: state.counters.kills,
        eliteDefeated: state.counters.eliteKills || 0,
        enemiesDefeated: state.counters.kills,
        enemiesLeaked: state.counters.leaked,
        focusChars: weakestChars,
        weakestChars,
        totalCharsTyped: state.counters.typed,
        totalCharsCorrect: state.counters.correct,
        livesRemaining: state.lives,
        endReason: state.endReason || (state.phase === RAID_PHASES.gameover ? 'defeat' : null),
        extractReason: state.extractReason || null,
        bestStreakWindow: state.bestStreakWindow || state.maxCombo || 0
    };

    return {
        ...result,
        recommendation: buildRecommendation(state, result)
    };
}

export function buildRaidSnapshot(state) {
    const result = buildRaidResult(state);
    const activeEnemy = getActiveEnemy(state);
    const priorityEnemy = activeEnemy || getPriorityEnemy(state);
    const extractAvailable = isExtractAvailable(state.threatLevel || 1);
    const activeEnemies = state.enemies.filter((enemy) => enemy.alive);

    return {
        phase: state.phase,
        hud: {
            score: state.score,
            threatLevel: state.threatLevel || 1,
            wave: state.threatLevel || 1,
            waveLabel: `威胁 ${state.threatLevel || 1}`,
            combo: state.combo,
            maxCombo: state.maxCombo,
            streakTier: Math.floor((state.combo || 0) / 10),
            lives: state.lives,
            maxLives: state.maxLives,
            accuracy: result.accuracy,
            wpm: result.wpm,
            targetWord: priorityEnemy?.word || '',
            pressureScore: state.pressureScore,
            progress: getThreatProgress(state.elapsed || 0),
            elapsedSeconds: Math.round(state.elapsed || 0),
            extractAvailable,
            nextExtractThreatLevel: nextExtractThreatLevel(state.threatLevel || 1),
            monsterMix: buildMonsterMix(activeEnemies)
        },
        arena: {
            enemies: activeEnemies.map((enemy) => ({
                id: enemy.id,
                type: enemy.type,
                word: enemy.word,
                typed: enemy.typed || '',
                xRatio: enemy.xRatio,
                y: enemy.y,
                hp: enemy.hp,
                maxHp: enemy.maxHp,
                isTarget: enemy.id === priorityEnemy?.id,
                shielded: isEnemyShielded(state, enemy),
                elite: Boolean(enemy.elite)
            })),
            feedback: state.lastFeedback
        },
        overlay: state.phase === RAID_PHASES.idle
            ? { type: 'idle' }
            : state.phase === RAID_PHASES.paused
                ? { type: 'paused' }
                : state.phase === RAID_PHASES.gameover
                    ? { type: 'result', result, isVictory: result.endReason === 'extract' }
                    : null,
        liveMessage: state.liveMessage
    };
}

// ---------------------------------------------------------------------------
// Compatibility exports for older modules/tests that still import game.js.
// New game code should use the endless Raid functions above.
// ---------------------------------------------------------------------------

export function generateRaidWave(threatLevel, options = {}) {
    const profile = buildDifficultyProfile(threatLevel, options.pressureScore ?? options.performanceScore ?? 0.45);
    const count = Math.max(3, Math.min(10, Math.round(profile.activeCap + threatLevel / 2)));
    const state = {
        ...createRaidState(options),
        threatLevel,
        difficultyProfile: profile,
        pressureScore: profile.pressureScore,
        spawnIndex: 0
    };
    const monsters = [];
    let nextState = state;
    for (let index = 0; index < count; index += 1) {
        const type = chooseNextMonsterType({ ...nextState, spawnedGuardianLevels: [threatLevel] });
        monsters.push(generateRaidMonster({
            ...options,
            type,
            threatLevel,
            spawnIndex: index,
            pressureScore: profile.pressureScore,
            difficultyProfile: profile
        }));
        nextState = { ...nextState, spawnIndex: index + 1 };
    }
    return monsters;
}

export function startRaidWave(state) {
    return startEndlessRaid(state);
}

export function getDifficultyFactor(threatLevel) {
    return clamp(threatLevel / 12, 0, 1);
}

export function getEnemyBaseSpeed(threatLevel, canvasHeight = 600) {
    return buildDifficultyProfile(Math.max(1, threatLevel)).baseSpeed * canvasHeight;
}

export function getSpawnInterval(threatLevel) {
    return Math.round(buildDifficultyProfile(Math.max(1, threatLevel)).spawnInterval * 1000);
}

export function getWaveTemplate(threatLevel) {
    return buildDifficultyProfile(Math.max(1, threatLevel));
}

export function generateWaveEnemies(waveIndex, wordPool, options = {}) {
    return generateRaidWave(waveIndex + 1, {
        seed: options.seed || 'legacy',
        wordPool,
        focusChars: options.focusChars || [],
        pressureScore: options.performanceScore ?? 0.45
    }).map((enemy) => ({
        ...enemy,
        x: enemy.xRatio * (options.canvasWidth || 800),
        y: enemy.y * (options.canvasHeight || 600),
        speed: enemy.speed * (options.canvasHeight || 600)
    }));
}

export function getDifficultyModifier(profile) {
    const modifiers = {
        foundation: 0.78,
        builder: 0.9,
        fluent: 1,
        sprint: 1.12
    };
    return modifiers[profile?.level?.id] || 1;
}

export function biasWordPool(basePool, hotspots = []) {
    if (!Array.isArray(hotspots) || hotspots.length === 0) return basePool;
    const chars = new Set(hotspots.flatMap((item) => {
        if (typeof item === 'string') return [item.toLowerCase()];
        if (Array.isArray(item?.chars)) return item.chars.map((char) => String(char).toLowerCase());
        if (item?.label) return [String(item.label).toLowerCase()];
        return [];
    }));
    return basePool.flatMap((word) => (
        String(word).split('').some((char) => chars.has(char.toLowerCase())) ? [word, word] : [word]
    ));
}

export function calculateKillScore(enemy, comboCount) {
    return scoreForMonster(enemy, comboCount);
}

export function getComboMultiplier(comboCount) {
    return 1 + Math.floor(comboCount / 8) * 0.16;
}

export function createGameState(options = {}) {
    return createRaidState(options);
}

export function transitionGameMode(state, action) {
    if (action === 'start') return dispatchRaidCommand(state, 'start').state;
    if (action === 'pause') return dispatchRaidCommand(state, 'pause').state;
    if (action === 'resume') return dispatchRaidCommand(state, 'resume').state;
    if (action === 'restart') return createRaidState();
    if (action === 'gameover') return withModeAlias({ ...state, phase: RAID_PHASES.gameover, endReason: 'defeat' });
    return state;
}

export function processInput(state, char) {
    return processRaidInput(state, char);
}

export function updateGameState(state, deltaTime) {
    return updateRaidState(state, deltaTime);
}

export function startWave(state) {
    return startEndlessRaid(state);
}

export function processSpawns(state, deltaTime) {
    return updateRaidState(state, deltaTime).state;
}

export function buildGameResult(state) {
    return buildRaidResult(state);
}

export function calculatePerformanceScore(state) {
    return calculateRaidPressure(state);
}

export function getAdaptiveModifier(performanceScore) {
    return 0.82 + clamp(performanceScore, 0, 1) * 0.36;
}

export function isBreathingWave(threatLevel) {
    return threatLevel > 1 && threatLevel % RAID_EXTRACT_INTERVAL === 0;
}

export function getAdaptiveSpawnInterval(threatLevel, performanceScore) {
    return Math.round(getSpawnInterval(threatLevel) / getAdaptiveModifier(performanceScore));
}

export function getBossPhase(hp, maxHp) {
    const ratio = maxHp > 0 ? hp / maxHp : 0;
    if (ratio > 0.66) return 1;
    if (ratio > 0.33) return 2;
    return 3;
}

export function getBossPhaseSpeedMultiplier(phase) {
    return phase === 3 ? 1.28 : phase === 2 ? 1.14 : 1;
}

export function getBossPhaseWordRange(phase) {
    return phase === 3 ? [7, 11] : phase === 2 ? [6, 9] : [5, 8];
}

export function getBossPhaseColor(phase) {
    if (phase === 3) return '#ff453a';
    if (phase === 2) return '#ff9f0a';
    return '#0a84ff';
}

export function checkBossPhaseTransition(enemy) {
    if (enemy?.type !== 'guardian') return null;
    const next = getBossPhase(enemy.hp, enemy.maxHp);
    return next > (enemy._bossPhase || 1) ? next : null;
}
