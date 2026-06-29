/**
 * Typing Raid 2.0 pure gameplay model.
 *
 * The domain layer has no DOM, Canvas, audio, storage, or React dependency.
 * It owns deterministic wave generation, input processing, difficulty
 * pressure, scoring, result building, and presentation snapshots.
 */

import { commonWords } from './data/words.js';

export const RAID_TOTAL_WAVES = 5;
export const RAID_FINAL_ENCOUNTER = 6;
export const RAID_MODES = ['standard', 'daily-focus'];

export const RAID_PHASES = {
    idle: 'idle',
    playing: 'playing',
    paused: 'paused',
    complete: 'complete',
    gameover: 'gameover'
};

export const ENEMY_TYPES = {
    scout: {
        id: 'scout',
        label: 'Scout',
        labelZh: '侦察体',
        speedFactor: 1.35,
        scoreMultiplier: 1.1,
        color: '#64d2ff',
        wordRange: [2, 5]
    },
    guard: {
        id: 'guard',
        label: 'Guard',
        labelZh: '守卫体',
        speedFactor: 1,
        scoreMultiplier: 1,
        color: '#0a84ff',
        wordRange: [3, 7]
    },
    bulwark: {
        id: 'bulwark',
        label: 'Bulwark',
        labelZh: '壁垒体',
        speedFactor: 0.72,
        scoreMultiplier: 1.8,
        color: '#ff9f0a',
        wordRange: [5, 8]
    },
    signal: {
        id: 'signal',
        label: 'Signal',
        labelZh: '信号体',
        speedFactor: 0.88,
        scoreMultiplier: 1.5,
        color: '#34c759',
        wordRange: [2, 8]
    },
    boss: {
        id: 'boss',
        label: 'Guardian',
        labelZh: '守门者',
        speedFactor: 0.38,
        scoreMultiplier: 4,
        color: '#ff453a',
        wordRange: [5, 11]
    }
};

export const WAVE_TEMPLATES = [
    { scout: 2, guard: 2, bulwark: 0, signal: 0, spawnInterval: 1.35, speed: 0.030 },
    { scout: 3, guard: 3, bulwark: 0, signal: 1, spawnInterval: 1.18, speed: 0.034 },
    { scout: 3, guard: 3, bulwark: 1, signal: 1, spawnInterval: 1.05, speed: 0.039 },
    { scout: 2, guard: 3, bulwark: 2, signal: 2, spawnInterval: 1.00, speed: 0.041 },
    { scout: 4, guard: 4, bulwark: 2, signal: 2, spawnInterval: 0.86, speed: 0.047 }
];

const GAME_COPY = {
    'zh-CN': {
        title: '打字突袭',
        subtitle: '5 波短局训练，击败守门者',
        start: '开始突袭',
        dailyFocus: '每日聚焦',
        pause: '暂停',
        paused: '已暂停',
        resume: '继续',
        retry: '再来一局',
        quit: '返回菜单',
        complete: '突袭完成',
        gameOver: '突袭中止',
        score: '得分',
        wave: '波次',
        boss: '守门者',
        combo: '连击',
        wpm: '速度',
        accuracy: '准确率',
        lives: '生命',
        target: '目标',
        insight: '训练洞察',
        nextStep: '下一步建议',
        focusChars: '重点字符',
        waveClear: '第 {wave} 波清除',
        bossIncoming: '守门者进入战场',
        victory: '守门者已击败',
        miss: '未找到匹配目标',
        error: '期望 {expected}',
        ready: '按 Enter 开始，输入敌方单词'
    },
    'en-US': {
        title: 'Typing Raid',
        subtitle: 'Clear 5 quick waves and defeat the Guardian',
        start: 'Start Raid',
        dailyFocus: 'Daily Focus',
        pause: 'Pause',
        paused: 'Paused',
        resume: 'Resume',
        retry: 'Play Again',
        quit: 'Back to Menu',
        complete: 'Raid Complete',
        gameOver: 'Raid Interrupted',
        score: 'Score',
        wave: 'Wave',
        boss: 'Guardian',
        combo: 'Combo',
        wpm: 'Speed',
        accuracy: 'Accuracy',
        lives: 'Lives',
        target: 'Target',
        insight: 'Training insight',
        nextStep: 'Next step',
        focusChars: 'Focus chars',
        waveClear: 'Wave {wave} cleared',
        bossIncoming: 'Guardian entering the field',
        victory: 'Guardian defeated',
        miss: 'No matching target',
        error: 'Expected {expected}',
        ready: 'Press Enter to start, then type enemy words'
    }
};

const SIGNAL_WORDS = [
    'shift', 'enter', 'index', 'route', 'cache', 'token', 'debug', 'signal',
    'a1', 's2', 'd3', 'j7', 'k8', 'l9', 'api', 'ui'
];

const BOSS_SEGMENTS = [
    ['focus', 'steady', 'finish'],
    ['vector', 'rhythm', 'resolve'],
    ['guardian', 'precision', 'victory']
];

const LANES = [0.15, 0.28, 0.40, 0.52, 0.64, 0.76, 0.88];

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

function sanitizeWordPool(wordPool) {
    const pool = Array.isArray(wordPool) && wordPool.length > 0 ? wordPool : commonWords;
    return pool
        .map((word) => String(word || '').trim().toLowerCase())
        .filter((word) => /^[a-z0-9]+$/.test(word) && word.length > 1);
}

function pickWord(rng, pool, range, usedWords) {
    const [minLength, maxLength] = range;
    const candidates = pool.filter((word) => (
        !usedWords.has(word) && word.length >= minLength && word.length <= maxLength
    ));
    const safe = candidates.length > 0 ? candidates : pool;
    const word = safe[Math.floor(rng() * safe.length)] || 'type';
    usedWords.add(word);
    return word;
}

function pickFocusedWord(rng, pool, focusChars, range, usedWords) {
    const focus = new Set((focusChars || []).map((char) => String(char).toLowerCase()).filter(Boolean));
    if (focus.size === 0) {
        return pickWord(rng, pool, range, usedWords);
    }

    const candidates = pool.filter((word) => (
        !usedWords.has(word)
        && word.length >= range[0]
        && word.length <= range[1]
        && word.split('').some((char) => focus.has(char))
    ));

    if (candidates.length === 0) {
        return pickWord(rng, pool, range, usedWords);
    }

    const word = candidates[Math.floor(rng() * candidates.length)];
    usedWords.add(word);
    return word;
}

function buildEnemy({
    id,
    type,
    word,
    segments = null,
    laneIndex,
    spawnAt,
    baseSpeed,
    pressureScore,
    rng
}) {
    const config = ENEMY_TYPES[type] || ENEMY_TYPES.guard;
    const lane = LANES[laneIndex % LANES.length];
    const jitter = (rng() - 0.5) * 0.04;
    const maxHp = Array.isArray(segments) ? segments.length : type === 'bulwark' ? 2 : 1;

    return {
        id,
        type,
        word,
        segments,
        segmentIndex: 0,
        xRatio: clamp(lane + jitter, 0.08, 0.92),
        y: 0.24 + rng() * 0.04,
        speed: baseSpeed * config.speedFactor * (0.88 + rng() * 0.2) * (0.9 + pressureScore * 0.22),
        hp: maxHp,
        maxHp,
        scoreMultiplier: config.scoreMultiplier,
        typed: '',
        alive: true,
        leaked: false,
        spawnAt
    };
}

function createEmptyCounters() {
    return {
        typed: 0,
        correct: 0,
        errors: 0,
        kills: 0,
        leaked: 0
    };
}

function withModeAlias(state) {
    return { ...state, mode: state.phase };
}

export function getGameCopy(language = 'zh-CN') {
    return GAME_COPY[language] || GAME_COPY['en-US'];
}

export function getEnemyTypeConfig(type) {
    return ENEMY_TYPES[type] || ENEMY_TYPES.guard;
}

export function getAllEnemyTypes() {
    return Object.keys(ENEMY_TYPES);
}

export function createRaidState(options = {}) {
    const language = options.language || 'zh-CN';
    const now = options.now ?? 0;

    return withModeAlias({
        phase: RAID_PHASES.idle,
        raidMode: RAID_MODES.includes(options.raidMode) ? options.raidMode : 'standard',
        language,
        seed: options.seed || `raid-${new Date().toISOString().slice(0, 10)}`,
        wave: 0,
        completedWaves: 0,
        score: 0,
        combo: 0,
        maxCombo: 0,
        lives: 5,
        maxLives: 5,
        pressureScore: 0.45,
        enemies: [],
        waveQueue: [],
        nextSpawnIndex: 0,
        waveElapsed: 0,
        elapsed: 0,
        startedAt: now,
        endedAt: null,
        currentTargetId: null,
        counters: createEmptyCounters(),
        errorCounts: {},
        focusChars: Array.isArray(options.focusChars) ? options.focusChars.slice(0, 8) : [],
        wordPool: sanitizeWordPool(options.wordPool),
        recentKeyTimes: [],
        perfectWaves: 0,
        waveLeakBaseline: 0,
        lastFeedback: null,
        liveMessage: getGameCopy(language).ready,
        lastEventId: 0
    });
}

export function calculateRaidPressure(state) {
    const typed = state.counters?.typed || 0;
    const correct = state.counters?.correct || 0;
    const elapsedMinutes = Math.max((state.elapsed || 1) / 60, 1 / 60);
    const accuracy = typed > 0 ? correct / typed : 1;
    const wpm = (correct / 5) / elapsedMinutes;
    const speedScore = clamp(wpm / 80, 0, 1);
    const lifeScore = clamp((state.lives || 0) / (state.maxLives || 5), 0, 1);
    const comboScore = clamp((state.combo || 0) / 25, 0, 1);

    return clamp(accuracy * 0.36 + speedScore * 0.28 + lifeScore * 0.18 + comboScore * 0.18, 0.15, 0.95);
}

export function generateRaidWave(waveNumber, options = {}) {
    const seed = options.seed || 'typing-raid';
    const pressureScore = clamp(options.pressureScore ?? 0.45, 0, 1);
    const wordPool = sanitizeWordPool(options.wordPool);
    const focusChars = options.focusChars || [];
    const rng = seededRandom(seed, `wave-${waveNumber}`);
    const usedWords = new Set();

    if (waveNumber === RAID_FINAL_ENCOUNTER) {
        const phaseOffset = Math.floor(rng() * BOSS_SEGMENTS.length);
        const segments = BOSS_SEGMENTS[phaseOffset].map((segment) => {
            if (focusChars.length === 0) return segment;
            return segment + focusChars[Math.floor(rng() * focusChars.length)];
        });

        return [
            buildEnemy({
                id: `boss-${seed}-${waveNumber}`,
                type: 'boss',
                word: segments[0],
                segments,
                laneIndex: 3,
                spawnAt: 0.8,
                baseSpeed: 0.018 + pressureScore * 0.007,
                pressureScore,
                rng
            })
        ];
    }

    const template = WAVE_TEMPLATES[clamp(waveNumber - 1, 0, WAVE_TEMPLATES.length - 1)];
    const baseSpeed = template.speed;
    const interval = template.spawnInterval * (1.12 - pressureScore * 0.22);
    const enemyTypes = [];

    Object.entries(template).forEach(([key, value]) => {
        if (!ENEMY_TYPES[key]) return;
        const bonus = pressureScore > 0.72 && (key === 'scout' || key === 'guard') && waveNumber >= 3 ? 1 : 0;
        for (let i = 0; i < value + bonus; i += 1) {
            enemyTypes.push(key);
        }
    });

    return enemyTypes.map((type, index) => {
        const config = ENEMY_TYPES[type];
        let segments = null;
        let word;

        if (type === 'signal') {
            const signalPool = focusChars.length > 0
                ? [...focusChars.map((char) => `${char}${Math.ceil(rng() * 9)}`), ...SIGNAL_WORDS]
                : SIGNAL_WORDS;
            word = signalPool[Math.floor(rng() * signalPool.length)].toLowerCase();
        } else if (type === 'bulwark') {
            const first = pickFocusedWord(rng, wordPool, focusChars, config.wordRange, usedWords);
            const second = pickWord(rng, wordPool, [3, 7], usedWords);
            segments = [first, second];
            word = segments[0];
        } else if (waveNumber === 4) {
            word = pickFocusedWord(rng, wordPool, focusChars, config.wordRange, usedWords);
        } else {
            word = pickWord(rng, wordPool, config.wordRange, usedWords);
        }

        return buildEnemy({
            id: `wave-${waveNumber}-${type}-${index}`,
            type,
            word,
            segments,
            laneIndex: index + waveNumber,
            spawnAt: index * interval + rng() * 0.22,
            baseSpeed,
            pressureScore,
            rng
        });
    });
}

export function startRaidWave(state, waveNumber = null) {
    const nextWave = waveNumber || (state.completedWaves >= RAID_TOTAL_WAVES ? RAID_FINAL_ENCOUNTER : state.completedWaves + 1);
    const pressureScore = nextWave <= 1 ? 0.45 : calculateRaidPressure(state);
    const queue = generateRaidWave(nextWave, {
        seed: state.seed,
        pressureScore,
        wordPool: state.wordPool,
        focusChars: state.focusChars
    });
    const copy = getGameCopy(state.language);
    const message = nextWave === RAID_FINAL_ENCOUNTER
        ? copy.bossIncoming
        : copy.waveClear.replace('{wave}', String(Math.max(1, nextWave - 1)));

    return withModeAlias({
        ...state,
        phase: RAID_PHASES.playing,
        wave: nextWave,
        pressureScore,
        enemies: state.enemies.filter((enemy) => enemy.alive),
        waveQueue: queue,
        nextSpawnIndex: 0,
        waveElapsed: 0,
        waveLeakBaseline: state.counters.leaked,
        currentTargetId: null,
        liveMessage: nextWave === 1 ? copy.ready : message
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

function getActiveEnemy(state) {
    if (!state.currentTargetId) return null;
    return state.enemies.find((enemy) => enemy.alive && enemy.id === state.currentTargetId) || null;
}

function getPriorityEnemy(state) {
    return state.enemies
        .filter((enemy) => enemy.alive)
        .sort((a, b) => b.y - a.y || a.spawnAt - b.spawnAt)[0] || null;
}

function getMatchingEnemy(state, char) {
    return state.enemies
        .filter((enemy) => enemy.alive && enemy.word[0]?.toLowerCase() === char)
        .sort((a, b) => b.y - a.y || a.spawnAt - b.spawnAt)[0] || null;
}

function getEnemyExpectedChar(enemy) {
    if (!enemy) return '';
    return enemy.word[(enemy.typed || '').length] || '';
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

function scoreForEnemy(enemy, combo) {
    const wordValue = (enemy.segments || [enemy.word]).join('').length * 12;
    const comboMultiplier = 1 + Math.floor(combo / 6) * 0.18;
    return Math.round(wordValue * (enemy.scoreMultiplier || 1) * comboMultiplier);
}

function completeEnemySegment(state, enemy, char) {
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
        }), { type: enemy.type === 'boss' ? 'boss_phase' : 'enemy_segment', enemyId: enemy.id });
    }

    const score = scoreForEnemy(enemy, state.combo);
    const nextCombo = state.combo + 1;
    const nextState = withModeAlias({
        ...state,
        score: state.score + score,
        combo: nextCombo,
        maxCombo: Math.max(state.maxCombo, nextCombo),
        currentTargetId: null,
        counters: {
            ...counters,
            kills: counters.kills + 1
        },
        enemies: state.enemies.map((item) => (
            item.id === enemy.id ? { ...item, typed: nextTyped, alive: false, hp: 0 } : item
        )),
        lastFeedback: { kind: 'kill', enemyId: enemy.id, char, at: state.elapsed },
        liveMessage: `+${score}`
    });

    return nextEvent(nextState, {
        type: 'enemy_defeated',
        enemyId: enemy.id,
        score,
        xRatio: enemy.xRatio,
        y: enemy.y,
        enemyType: enemy.type
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

    const result = completeEnemySegment(targetState, target, char);
    return { state: result.state, events: [result.event] };
}

export function updateRaidState(state, deltaTime) {
    if (state.phase !== RAID_PHASES.playing) {
        return { state, events: [] };
    }

    const dt = clamp(Number(deltaTime) || 0, 0, 0.08);
    let nextState = withModeAlias({
        ...state,
        elapsed: state.elapsed + dt,
        waveElapsed: state.waveElapsed + dt,
        lastFeedback: state.lastFeedback && state.elapsed - state.lastFeedback.at > 0.6
            ? null
            : state.lastFeedback
    });
    const events = [];

    while (
        nextState.nextSpawnIndex < nextState.waveQueue.length
        && nextState.waveElapsed >= nextState.waveQueue[nextState.nextSpawnIndex].spawnAt
    ) {
        const enemy = nextState.waveQueue[nextState.nextSpawnIndex];
        nextState = withModeAlias({
            ...nextState,
            enemies: [...nextState.enemies, enemy],
            nextSpawnIndex: nextState.nextSpawnIndex + 1
        });
        const spawned = nextEvent(nextState, { type: 'enemy_spawned', enemyId: enemy.id });
        nextState = spawned.state;
        events.push(spawned.event);
    }

    let leakedCount = 0;
    const movedEnemies = nextState.enemies.map((enemy) => {
        if (!enemy.alive) return enemy;
        const y = enemy.y + enemy.speed * dt;
        if (y > 1.04 && enemy.type !== 'boss') {
            leakedCount += 1;
            return { ...enemy, y, alive: false, leaked: true };
        }
        return { ...enemy, y };
    });

    if (leakedCount > 0) {
        const lives = Math.max(0, nextState.lives - leakedCount);
        nextState = withModeAlias({
            ...nextState,
            enemies: movedEnemies,
            lives,
            combo: 0,
            currentTargetId: movedEnemies.some((enemy) => enemy.alive && enemy.id === nextState.currentTargetId)
                ? nextState.currentTargetId
                : null,
            counters: {
                ...nextState.counters,
                leaked: nextState.counters.leaked + leakedCount
            },
            lastFeedback: { kind: 'leak', at: nextState.elapsed },
            liveMessage: lives > 0 ? '阵线受压' : getGameCopy(nextState.language).gameOver
        });
        const leaked = nextEvent(nextState, { type: 'enemy_leaked', count: leakedCount });
        nextState = leaked.state;
        events.push(leaked.event);
    } else {
        nextState = withModeAlias({ ...nextState, enemies: movedEnemies });
    }

    if (nextState.lives <= 0) {
        nextState = withModeAlias({
            ...nextState,
            phase: RAID_PHASES.gameover,
            endedAt: nextState.elapsed,
            liveMessage: getGameCopy(nextState.language).gameOver
        });
        const gameover = nextEvent(nextState, { type: 'game_over' });
        return { state: gameover.state, events: [...events, gameover.event] };
    }

    const aliveEnemies = nextState.enemies.filter((enemy) => enemy.alive);
    const waveComplete = nextState.nextSpawnIndex >= nextState.waveQueue.length && aliveEnemies.length === 0;
    if (!waveComplete) {
        return { state: nextState, events };
    }

    if (nextState.wave === RAID_FINAL_ENCOUNTER) {
        nextState = withModeAlias({
            ...nextState,
            phase: RAID_PHASES.complete,
            endedAt: nextState.elapsed,
            liveMessage: getGameCopy(nextState.language).victory
        });
        const victory = nextEvent(nextState, { type: 'raid_complete' });
        return { state: victory.state, events: [...events, victory.event] };
    }

    const perfect = nextState.counters.leaked === nextState.waveLeakBaseline;
    nextState = withModeAlias({
        ...nextState,
        completedWaves: Math.max(nextState.completedWaves, nextState.wave),
        perfectWaves: nextState.perfectWaves + (perfect ? 1 : 0)
    });
    const cleared = nextEvent(nextState, { type: 'wave_complete', wave: nextState.wave, perfect });
    events.push(cleared.event);
    nextState = startRaidWave(cleared.state);

    return { state: nextState, events };
}

export function dispatchRaidCommand(state, command, payload = {}) {
    const type = typeof command === 'string' ? command : command?.type;
    const commandPayload = typeof command === 'string' ? payload : (command || {});
    const copy = getGameCopy(state.language || commandPayload.language);

    if (type === 'start') {
        const fresh = createRaidState({
            ...state,
            ...commandPayload,
            raidMode: commandPayload.raidMode || state.raidMode || 'standard',
            language: commandPayload.language || state.language || 'zh-CN',
            seed: commandPayload.seed || state.seed,
            focusChars: commandPayload.focusChars || state.focusChars,
            wordPool: commandPayload.wordPool || state.wordPool,
            now: 0
        });
        return { state: startRaidWave(fresh, 1), events: [{ type: 'raid_started' }] };
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

    if (type === 'retry') {
        const fresh = createRaidState({
            ...state,
            ...commandPayload,
            raidMode: commandPayload.raidMode || state.raidMode || 'standard',
            language: commandPayload.language || state.language || 'zh-CN',
            seed: commandPayload.seed || state.seed,
            focusChars: commandPayload.focusChars || state.focusChars,
            wordPool: commandPayload.wordPool || state.wordPool,
            now: 0
        });
        return { state: startRaidWave(fresh, 1), events: [{ type: 'raid_retried' }] };
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

export function buildRaidResult(state) {
    const durationSeconds = Math.max(1, Math.round(state.endedAt || state.elapsed || 0));
    const errorEntries = Object.entries(state.errorCounts || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const focusChars = errorEntries.map(([label]) => label);
    const accuracy = getAccuracy(state);
    const wpm = getWpm(state);
    const wavesCleared = Math.min(RAID_TOTAL_WAVES, state.completedWaves || 0);

    let recommendation = '保持节奏，下一局继续保护准确率。';
    if (accuracy < 92) {
        recommendation = '下一局先放慢首字母选择，保护准确率。';
    } else if (wpm < 35) {
        recommendation = '下一局尝试更早锁定目标，稳步提速。';
    } else if ((state.maxCombo || 0) >= 20) {
        recommendation = '连击稳定，可以挑战每日聚焦。';
    }

    return {
        score: state.score,
        mode: state.raidMode || 'standard',
        wpm,
        accuracy,
        maxCombo: state.maxCombo,
        wavesCleared,
        wave: wavesCleared,
        enemiesDefeated: state.counters.kills,
        enemiesLeaked: state.counters.leaked,
        focusChars,
        durationSeconds,
        totalCharsTyped: state.counters.typed,
        totalCharsCorrect: state.counters.correct,
        perfectWaves: state.perfectWaves,
        livesRemaining: state.lives,
        recommendation
    };
}

export function buildRaidSnapshot(state) {
    const result = buildRaidResult(state);
    const activeEnemy = getActiveEnemy(state);
    const priorityEnemy = activeEnemy || getPriorityEnemy(state);
    const waveProgress = state.wave === RAID_FINAL_ENCOUNTER
        ? 1 - ((activeEnemy?.hp || 0) / (activeEnemy?.maxHp || 1))
        : state.waveQueue.length > 0
            ? clamp((state.nextSpawnIndex + state.enemies.filter((enemy) => !enemy.alive && !enemy.leaked).length) / state.waveQueue.length, 0, 1)
            : 0;

    return {
        phase: state.phase,
        hud: {
            score: state.score,
            wave: state.wave,
            waveLabel: state.wave === RAID_FINAL_ENCOUNTER ? getGameCopy(state.language).boss : `${state.wave}/${RAID_TOTAL_WAVES}`,
            combo: state.combo,
            maxCombo: state.maxCombo,
            lives: state.lives,
            maxLives: state.maxLives,
            accuracy: result.accuracy,
            wpm: result.wpm,
            targetWord: priorityEnemy?.word || '',
            pressureScore: state.pressureScore,
            progress: waveProgress
        },
        arena: {
            enemies: state.enemies.filter((enemy) => enemy.alive).map((enemy) => ({
                id: enemy.id,
                type: enemy.type,
                word: enemy.word,
                typed: enemy.typed || '',
                xRatio: enemy.xRatio,
                y: enemy.y,
                hp: enemy.hp,
                maxHp: enemy.maxHp,
                isTarget: enemy.id === priorityEnemy?.id
            })),
            feedback: state.lastFeedback
        },
        overlay: state.phase === RAID_PHASES.idle
            ? { type: 'idle' }
            : state.phase === RAID_PHASES.paused
                ? { type: 'paused' }
                : state.phase === RAID_PHASES.complete || state.phase === RAID_PHASES.gameover
                    ? { type: 'result', result, isVictory: state.phase === RAID_PHASES.complete }
                    : null,
        liveMessage: state.liveMessage
    };
}

// ---------------------------------------------------------------------------
// Compatibility exports for older modules and tests that still import game.js.
// New game code should use createRaidState/dispatchRaidCommand/updateRaidState.
// ---------------------------------------------------------------------------

export function getDifficultyFactor(waveIndex) {
    return clamp(waveIndex / RAID_TOTAL_WAVES, 0, 1);
}

export function getEnemyBaseSpeed(waveIndex, canvasHeight = 600) {
    const template = WAVE_TEMPLATES[clamp(waveIndex, 0, WAVE_TEMPLATES.length - 1)];
    return template.speed * canvasHeight;
}

export function getSpawnInterval(waveIndex) {
    const template = WAVE_TEMPLATES[clamp(waveIndex, 0, WAVE_TEMPLATES.length - 1)];
    return Math.round(template.spawnInterval * 1000);
}

export function getWaveTemplate(waveIndex) {
    return WAVE_TEMPLATES[clamp(waveIndex, 0, WAVE_TEMPLATES.length - 1)];
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
    return scoreForEnemy(enemy, comboCount);
}

export function getComboMultiplier(comboCount) {
    return 1 + Math.floor(comboCount / 6) * 0.18;
}

export function createGameState(options = {}) {
    return createRaidState(options);
}

export function transitionGameMode(state, action) {
    if (action === 'start') return dispatchRaidCommand(state, 'start').state;
    if (action === 'pause') return dispatchRaidCommand(state, 'pause').state;
    if (action === 'resume') return dispatchRaidCommand(state, 'resume').state;
    if (action === 'restart') return createRaidState();
    if (action === 'gameover') return withModeAlias({ ...state, phase: RAID_PHASES.gameover });
    return state;
}

export function processInput(state, char) {
    return processRaidInput(state, char);
}

export function updateGameState(state, deltaTime) {
    return updateRaidState(state, deltaTime);
}

export function startWave(state, wordPool, options = {}) {
    return startRaidWave({ ...state, wordPool: sanitizeWordPool(wordPool), focusChars: options.focusChars || state.focusChars });
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

export function isBreathingWave(waveNumber) {
    return waveNumber === 4;
}

export function getAdaptiveSpawnInterval(waveIndex, performanceScore) {
    return Math.round(getSpawnInterval(waveIndex) / getAdaptiveModifier(performanceScore));
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
    if (enemy?.type !== 'boss') return null;
    const next = getBossPhase(enemy.hp, enemy.maxHp);
    return next > (enemy._bossPhase || 1) ? next : null;
}
