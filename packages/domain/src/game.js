/**
 * Typing Raid game pure logic.
 *
 * Pure function layer, no DOM / Canvas / React dependency.
 * Handles: wave config, enemy generation, difficulty curves, scoring, combo system.
 */

import { commonWords } from './data/words.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ENEMY_TYPES = {
    normal: { speedFactor: 1.0, hp: 1, scoreMultiplier: 1 },
    fast: { speedFactor: 1.8, hp: 1, scoreMultiplier: 1.5 },
    tank: { speedFactor: 0.6, hp: 2, scoreMultiplier: 2 },
    boss: { speedFactor: 0.45, hp: 3, scoreMultiplier: 3 }
};

export const WAVE_TEMPLATES = [
    { normals: 3, fast: 0, tanks: 0, bosses: 0 },
    { normals: 4, fast: 1, tanks: 0, bosses: 0 },
    { normals: 3, fast: 2, tanks: 0, bosses: 0 },
    { normals: 4, fast: 1, tanks: 1, bosses: 0 },
    { normals: 3, fast: 2, tanks: 1, bosses: 0 },
    { normals: 2, fast: 2, tanks: 2, bosses: 0 },
    { normals: 3, fast: 2, tanks: 1, bosses: 1 },
    { normals: 2, fast: 3, tanks: 2, bosses: 0 },
    { normals: 2, fast: 2, tanks: 2, bosses: 1 },
    { normals: 1, fast: 3, tanks: 2, bosses: 1 }
];

const GAME_COPY = {
    'zh-CN': {
        title: '打字突袭',
        subtitle: '输入单词消灭敌人',
        start: '按任意键开始',
        paused: '已暂停',
        resume: '按 Esc 继续',
        gameOver: '任务结束',
        score: '得分',
        wave: '波次',
        combo: '连击',
        wpm: '速度',
        accuracy: '准确率',
        enemiesDefeated: '消灭敌人',
        playAgain: '再来一局',
        backToHome: '返回首页',
        waveIncoming: '第 {wave} 波来袭！',
        comboBonus: '连击 x{combo}',
        perfectWave: '完美通关！'
    },
    'en-US': {
        title: 'Typing Raid',
        subtitle: 'Type words to destroy enemies',
        start: 'Press any key to start',
        paused: 'Paused',
        resume: 'Press Esc to resume',
        gameOver: 'Mission Complete',
        score: 'Score',
        wave: 'Wave',
        combo: 'Combo',
        wpm: 'Speed',
        accuracy: 'Accuracy',
        enemiesDefeated: 'Enemies defeated',
        playAgain: 'Play Again',
        backToHome: 'Back Home',
        waveIncoming: 'Wave {wave} incoming!',
        comboBonus: 'Combo x{combo}',
        perfectWave: 'Perfect wave!'
    }
};

// ---------------------------------------------------------------------------
// Difficulty curve
// ---------------------------------------------------------------------------

export function getDifficultyFactor(waveIndex) {
    return Math.min(1, waveIndex / 15);
}

export function getEnemyBaseSpeed(waveIndex, canvasHeight) {
    const factor = getDifficultyFactor(waveIndex);
    const minSpeed = canvasHeight * 0.04;
    const maxSpeed = canvasHeight * 0.12;
    return minSpeed + (maxSpeed - minSpeed) * factor;
}

export function getSpawnInterval(waveIndex) {
    const factor = getDifficultyFactor(waveIndex);
    const maxInterval = 2200;
    const minInterval = 800;
    return Math.round(maxInterval - (maxInterval - minInterval) * factor);
}

// ---------------------------------------------------------------------------
// Wave generation
// ---------------------------------------------------------------------------

export function getWaveTemplate(waveIndex) {
    if (waveIndex < WAVE_TEMPLATES.length) {
        return WAVE_TEMPLATES[waveIndex];
    }

    const overflow = waveIndex - WAVE_TEMPLATES.length;
    const base = WAVE_TEMPLATES[WAVE_TEMPLATES.length - 1];
    return {
        normals: Math.max(1, base.normals - Math.floor(overflow / 3)),
        fast: base.fast + Math.floor(overflow / 2),
        tanks: base.tanks + Math.floor(overflow / 3),
        bosses: Math.min(2, base.bosses + Math.floor(overflow / 4))
    };
}

export function generateWaveEnemies(waveIndex, wordPool, options = {}) {
    const template = getWaveTemplate(waveIndex);
    const { canvasWidth = 800, canvasHeight = 600, difficultyProfile } = options;
    const enemies = [];
    const usedWords = new Set();

    const baseSpeed = getEnemyBaseSpeed(waveIndex, canvasHeight);
    const safePool = Array.isArray(wordPool) && wordPool.length > 0 ? wordPool : commonWords;

    function pickWord(lengthRange) {
        const candidates = safePool.filter(
            (w) => !usedWords.has(w) && w.length >= lengthRange[0] && w.length <= lengthRange[1]
        );
        const pool = candidates.length > 0 ? candidates : safePool;
        const word = pool[Math.floor(Math.random() * pool.length)];
        usedWords.add(word);
        return word;
    }

    function addEnemies(type, count) {
        const typeConfig = ENEMY_TYPES[type];
        const lengthRanges = {
            normal: [2, 6],
            fast: [2, 5],
            tank: [5, 8],
            boss: [6, 12]
        };

        for (let i = 0; i < count; i += 1) {
            const word = pickWord(lengthRanges[type] || [2, 6]);
            const margin = canvasWidth * 0.1;
            const x = margin + Math.random() * (canvasWidth - margin * 2);

            enemies.push({
                id: 'wave' + waveIndex + '-' + type + '-' + i + '-' + Date.now().toString(36),
                type,
                word,
                x,
                y: -30 - Math.random() * 60,
                speed: baseSpeed * typeConfig.speedFactor * (0.9 + Math.random() * 0.2),
                hp: typeConfig.hp,
                maxHp: typeConfig.hp,
                scoreMultiplier: typeConfig.scoreMultiplier,
                alive: true,
                typed: ''
            });
        }
    }

    addEnemies('normal', template.normals);
    addEnemies('fast', template.fast);
    addEnemies('tank', template.tanks);
    addEnemies('boss', template.bosses);

    if (difficultyProfile) {
        let speedMod = getDifficultyModifier(difficultyProfile);
        
        // Dynamic KPS adaptation
        // Assuming average comfortable KPS is 4. 
        // If KPS > 4, speed up. If KPS < 4, slow down.
        // Cap the multiplier between 0.8 and 1.2 to avoid extreme changes.
        const kps = options.kps || 0;
        if (kps > 0) {
            const kpsFactor = 1 + (kps - 4) * 0.05;
            speedMod *= Math.max(0.8, Math.min(1.2, kpsFactor));
        }
        
        enemies.forEach((e) => {
            e.speed *= speedMod;
        });
    }

    return enemies;
}

// ---------------------------------------------------------------------------
// Difficulty adaptation
// ---------------------------------------------------------------------------

export function getDifficultyModifier(profile) {
    if (!profile?.level?.id) return 1;

    const modifiers = {
        foundation: 0.7,
        builder: 0.85,
        fluent: 1.0,
        sprint: 1.15
    };

    return modifiers[profile.level.id] || 1;
}

export function biasWordPool(basePool, hotspots = []) {
    if (!Array.isArray(hotspots) || hotspots.length === 0) {
        return basePool;
    }

    const hotspotChars = new Set(
        hotspots.flatMap((h) => {
            if (typeof h === 'string') return [h.toLowerCase()];
            if (h?.label) return [h.label.toLowerCase()];
            if (Array.isArray(h?.chars)) return h.chars.map((c) => (typeof c === 'string' ? c : c.label || '').toLowerCase());
            return [];
        }).filter((c) => c.length === 1)
    );

    if (hotspotChars.size === 0) return basePool;

    const biased = [];
    const normal = [];

    basePool.forEach((word) => {
        const chars = word.toLowerCase().split('');
        const hasHotspot = chars.some((c) => hotspotChars.has(c));
        if (hasHotspot) {
            biased.push(word, word);
        } else {
            normal.push(word);
        }
    });

    return [...biased, ...normal];
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export function calculateKillScore(enemy, comboCount) {
    const baseScore = enemy.word.length * 10;
    const typeBonus = enemy.scoreMultiplier;
    const comboMultiplier = 1 + Math.floor(comboCount / 5) * 0.5;

    return Math.round(baseScore * typeBonus * comboMultiplier);
}

export function getComboMultiplier(comboCount) {
    return 1 + Math.floor(comboCount / 5) * 0.5;
}

// ---------------------------------------------------------------------------
// Game state management
// ---------------------------------------------------------------------------

export function createGameState(options = {}) {
    return {
        mode: 'idle',
        score: 0,
        wave: 0,
        combo: 0,
        kps: 0,
        keyTimestamps: [],
        maxCombo: 0,
        enemiesTotal: 0,
        enemiesDefeated: 0,
        enemiesLeaked: 0,
        lives: 5,
        maxLives: 5,
        enemies: [],
        activeEnemyId: null,
        typedInput: '',
        totalCharsTyped: 0,
        totalCharsCorrect: 0,
        startTime: null,
        endTime: null,
        waveStartTime: null,
        spawnTimer: 0,
        nextSpawnIndex: 0,
        waveQueue: [],
        perfectWaves: 0,
        ...options
    };
}

export function transitionGameMode(state, action) {
    switch (action) {
        case 'start':
            return { ...state, mode: 'playing', startTime: Date.now() };
        case 'pause':
            return state.mode === 'playing' ? { ...state, mode: 'paused' } : state;
        case 'resume':
            return state.mode === 'paused' ? { ...state, mode: 'playing' } : state;
        case 'gameover':
            return { ...state, mode: 'gameover', endTime: Date.now() };
        case 'restart':
            return createGameState();
        default:
            return state;
    }
}

// ---------------------------------------------------------------------------
// Input processing
// ---------------------------------------------------------------------------

export function processInput(state, char) {
    if (state.mode !== 'playing') return { state, events: [] };
    
    const now = Date.now();
    const timestamps = [...(state.keyTimestamps || []), now].filter(t => now - t < 2000);
    const kps = timestamps.length / 2;

    const events = [];
    const aliveEnemies = state.enemies.filter((e) => e.alive);

    if (!state.activeEnemyId) {
        const match = aliveEnemies.find((e) => e.word[0] === char);
        if (match) {
            const newTyped = char;
            const isComplete = newTyped === match.word;

            const updatedEnemy = { ...match, typed: newTyped, lastCorrectTime: Date.now() };
            events.push({ type: 'char_correct', enemyId: match.id });

            if (isComplete) {
                const score = calculateKillScore(match, state.combo);
                events.push({ type: 'enemy_killed', enemyId: match.id, score });
                
                if (state.combo + 1 === 20) {
                    events.push({ type: 'achievement_unlocked', achievementId: 'combo-20' });
                }

                return {
                    state: {
                        ...state,
                        activeEnemyId: null,
                        typedInput: '',
                        score: state.score + score,
                        combo: state.combo + 1,
                        maxCombo: Math.max(state.maxCombo, state.combo + 1),
                        enemiesDefeated: state.enemiesDefeated + 1,
                        totalCharsTyped: state.totalCharsTyped + 1,
                        totalCharsCorrect: state.totalCharsCorrect + 1,
                        enemies: state.enemies.map((e) =>
                            e.id === match.id ? { ...e, alive: false, typed: newTyped } : e
                        )
                    },
                    events
                };
            }

            return {
                state: {
                    ...state,
                    activeEnemyId: match.id,
                    typedInput: newTyped,
                    totalCharsTyped: state.totalCharsTyped + 1,
                    totalCharsCorrect: state.totalCharsCorrect + 1,
                    enemies: state.enemies.map((e) =>
                        e.id === match.id ? { ...e, typed: newTyped } : e
                    )
                },
                events
            };
        }

        const matches = aliveEnemies.filter((e) => e.word[0] === char);
        events.push({ type: 'char_miss', matches: matches.map(e => e.id) });
        return {
            state: {
                ...state,
                combo: 0,
                totalCharsTyped: state.totalCharsTyped + 1
            },
            events
        };
    }

    const active = aliveEnemies.find((e) => e.id === state.activeEnemyId);
    if (!active) {
        return { state: { ...state, activeEnemyId: null, typedInput: '' }, events };
    }

    const nextIndex = state.typedInput.length;
    const expected = active.word[nextIndex];

    if (char === expected) {
        const newTyped = state.typedInput + char;
        const isComplete = newTyped === active.word;

        const updatedEnemy = { ...active, typed: newTyped, lastCorrectTime: Date.now() };
        events.push({ type: 'char_correct', enemyId: active.id });

        if (isComplete) {
            const score = calculateKillScore(active, state.combo);
            events.push({ type: 'enemy_killed', enemyId: active.id, score });

            return {
                state: {
                    ...state,
                    activeEnemyId: null,
                    typedInput: '',
                    score: state.score + score,
                    combo: state.combo + 1,
                    maxCombo: Math.max(state.maxCombo, state.combo + 1),
                    enemiesDefeated: state.enemiesDefeated + 1,
                    totalCharsTyped: state.totalCharsTyped + 1,
                    totalCharsCorrect: state.totalCharsCorrect + 1,
                    enemies: state.enemies.map((e) =>
                        e.id === active.id ? { ...e, alive: false, typed: newTyped } : e
                    )
                },
                events
            };
        }

        return {
            state: {
                ...state,
                typedInput: newTyped,
                totalCharsTyped: state.totalCharsTyped + 1,
                totalCharsCorrect: state.totalCharsCorrect + 1,
                enemies: state.enemies.map((e) =>
                    e.id === active.id ? { ...e, typed: newTyped } : e
                )
            },
            events
        };
    }

    events.push({ type: 'char_error', enemyId: active.id });
    return {
        state: {
            ...state,
            combo: 0,
            totalCharsTyped: state.totalCharsTyped + 1,
            kps,
            keyTimestamps: timestamps
        },
        events
    };
}

// ---------------------------------------------------------------------------
// Physics update
// ---------------------------------------------------------------------------

export function updateGameState(state, deltaTime, canvasHeight) {
    if (state.mode !== 'playing') return { state, events: [] };

    const events = [];
    let newLives = state.lives;
    let newLeaked = state.enemiesLeaked;
    let newCombo = state.combo;

    const updatedEnemies = state.enemies.map((enemy) => {
        if (!enemy.alive) return enemy;

        const newY = enemy.y + enemy.speed * deltaTime;

        if (newY > canvasHeight + 20) {
            newLeaked += 1;
            newLives -= 1;
            newCombo = 0;
            events.push({ type: 'enemy_leaked', enemyId: enemy.id });
            return { ...enemy, y: newY, alive: false };
        }

        return { ...enemy, y: newY };
    });

    let activeEnemyId = state.activeEnemyId;
    let typedInput = state.typedInput;
    if (activeEnemyId) {
        const active = updatedEnemies.find((e) => e.id === activeEnemyId);
        if (!active || !active.alive) {
            activeEnemyId = null;
            typedInput = '';
        }
    }

    const aliveEnemies = updatedEnemies.filter((e) => e.alive);
    const waveComplete = aliveEnemies.length === 0 && state.nextSpawnIndex >= state.waveQueue.length;

    if (waveComplete && state.waveQueue.length > 0) {
        const perfect = newLeaked === (state._waveStartLeaked || 0);
        events.push({ type: 'wave_complete', wave: state.wave, perfect });
        
        // Generate preview for next wave
        const nextWaveIndex = state.wave;
        const nextWaveEnemies = generateWaveEnemies(nextWaveIndex, commonWords, {});
        const preview = nextWaveEnemies.reduce((acc, e) => {
            acc[e.type] = (acc[e.type] || 0) + 1;
            return acc;
        }, {});
        state.wavePreview = preview;
    }

    const isGameOver = newLives <= 0;
    if (isGameOver) {
        events.push({ type: 'game_over' });
    }

    return {
        state: {
            ...state,
            enemies: updatedEnemies,
            lives: Math.max(0, newLives),
            enemiesLeaked: newLeaked,
            combo: newCombo,
            activeEnemyId,
            typedInput,
            mode: isGameOver ? 'gameover' : state.mode,
            endTime: isGameOver ? Date.now() : state.endTime
        },
        events
    };
}

// ---------------------------------------------------------------------------
// Wave queue management
// ---------------------------------------------------------------------------

export function startWave(state, wordPool, options = {}) {
    const waveIndex = state.wave;
    const enemies = generateWaveEnemies(waveIndex, wordPool, { ...options, kps: state.kps });

    return {
        ...state,
        wave: waveIndex + 1,
        waveStartTime: Date.now(),
        waveQueue: enemies,
        nextSpawnIndex: 0,
        spawnTimer: 0,
        enemiesTotal: state.enemiesTotal + enemies.length,
        _waveStartLeaked: state.enemiesLeaked
    };
}

export function processSpawns(state, deltaTime) {
    if (state.mode !== 'playing') return state;
    if (state.nextSpawnIndex >= state.waveQueue.length) return state;

    const interval = getSpawnInterval(state.wave - 1) / 1000;
    let timer = state.spawnTimer + deltaTime;
    let spawnIndex = state.nextSpawnIndex;
    const newEnemies = [...state.enemies];

    while (timer >= interval && spawnIndex < state.waveQueue.length) {
        const enemy = { ...state.waveQueue[spawnIndex], spawnTime: Date.now() };
        newEnemies.push(enemy);
        spawnIndex += 1;
        timer -= interval;
    }

    return {
        ...state,
        enemies: newEnemies,
        nextSpawnIndex: spawnIndex,
        spawnTimer: timer
    };
}

// ---------------------------------------------------------------------------
// Game result statistics
// ---------------------------------------------------------------------------

export function buildGameResult(state) {
    const duration = (state.endTime || Date.now()) - (state.startTime || Date.now());
    const durationSeconds = Math.max(1, duration / 1000);
    const totalChars = state.totalCharsTyped;
    const correctChars = state.totalCharsCorrect;
    const accuracy = totalChars > 0 ? Math.round((correctChars / totalChars) * 100) : 0;
    const wpm = Math.round((correctChars / 5) / (durationSeconds / 60));

    return {
        score: state.score,
        wave: state.wave,
        maxCombo: state.maxCombo,
        enemiesDefeated: state.enemiesDefeated,
        enemiesLeaked: state.enemiesLeaked,
        enemiesTotal: state.enemiesTotal,
        accuracy,
        wpm,
        durationSeconds: Math.round(durationSeconds),
        totalCharsTyped: totalChars,
        totalCharsCorrect: correctChars,
        perfectWaves: state.perfectWaves,
        livesRemaining: state.lives
    };
}

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

export function getGameCopy(language = 'zh-CN') {
    return GAME_COPY[language] || GAME_COPY['en-US'];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getEnemyTypeConfig(type) {
    return ENEMY_TYPES[type] || ENEMY_TYPES.normal;
}

export function getAllEnemyTypes() {
    return Object.keys(ENEMY_TYPES);
}
