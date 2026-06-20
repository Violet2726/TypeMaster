import { describe, it, expect } from 'vitest';
import {
    getDifficultyFactor,
    getEnemyBaseSpeed,
    getSpawnInterval,
    getWaveTemplate,
    generateWaveEnemies,
    getDifficultyModifier,
    biasWordPool,
    calculateKillScore,
    getComboMultiplier,
    createGameState,
    transitionGameMode,
    processInput,
    updateGameState,
    startWave,
    processSpawns,
    buildGameResult,
    getGameCopy,
    getEnemyTypeConfig,
    getAllEnemyTypes,
    ENEMY_TYPES,
    WAVE_TEMPLATES
} from '../game.js';

describe('Typing Raid - difficulty curve', () => {
    it('getDifficultyFactor scales from 0 to 1', () => {
        expect(getDifficultyFactor(0)).toBe(0);
        expect(getDifficultyFactor(15)).toBe(1);
        expect(getDifficultyFactor(30)).toBe(1);
        expect(getDifficultyFactor(7)).toBeGreaterThan(0);
        expect(getDifficultyFactor(7)).toBeLessThan(1);
    });

    it('getEnemyBaseSpeed increases with wave index', () => {
        const slow = getEnemyBaseSpeed(0, 600);
        const fast = getEnemyBaseSpeed(15, 600);
        expect(fast).toBeGreaterThan(slow);
    });

    it('getSpawnInterval decreases with wave index', () => {
        const early = getSpawnInterval(0);
        const late = getSpawnInterval(15);
        expect(late).toBeLessThan(early);
    });
});

describe('Typing Raid - wave generation', () => {
    it('getWaveTemplate returns predefined templates for early waves', () => {
        const t0 = getWaveTemplate(0);
        expect(t0.normals).toBe(3);
        expect(t0.fast).toBe(0);

        const t1 = getWaveTemplate(1);
        expect(t1.fast).toBe(1);
    });

    it('getWaveTemplate generates escalating templates beyond predefined', () => {
        const t = getWaveTemplate(20);
        expect(t.fast).toBeGreaterThan(0);
        expect(t.tanks).toBeGreaterThan(0);
    });

    it('generateWaveEnemies creates correct enemy count', () => {
        const template = getWaveTemplate(0);
        const total = template.normals + template.fast + template.tanks + template.bosses;
        const enemies = generateWaveEnemies(0, ['test', 'word', 'game'], { canvasWidth: 800, canvasHeight: 600 });
        expect(enemies).toHaveLength(total);
    });

    it('generateWaveEnemies assigns words from pool', () => {
        const pool = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta'];
        const enemies = generateWaveEnemies(0, pool, { canvasWidth: 800, canvasHeight: 600 });
        enemies.forEach((e) => {
            expect(pool).toContain(e.word);
        });
    });

    it('generateWaveEnemies uses fallback pool when empty', () => {
        const enemies = generateWaveEnemies(0, [], { canvasWidth: 800, canvasHeight: 600 });
        expect(enemies.length).toBeGreaterThan(0);
        enemies.forEach((e) => {
            expect(e.word.length).toBeGreaterThan(0);
        });
    });

    it('generateWaveEnemies respects canvas dimensions for x position', () => {
        const enemies = generateWaveEnemies(0, ['test', 'word', 'game'], { canvasWidth: 400, canvasHeight: 300 });
        enemies.forEach((e) => {
            expect(e.x).toBeGreaterThanOrEqual(40);
            expect(e.x).toBeLessThanOrEqual(360);
        });
    });
});

describe('Typing Raid - enemy types', () => {
    it('ENEMY_TYPES has expected types', () => {
        expect(ENEMY_TYPES.normal).toBeDefined();
        expect(ENEMY_TYPES.fast).toBeDefined();
        expect(ENEMY_TYPES.tank).toBeDefined();
        expect(ENEMY_TYPES.boss).toBeDefined();
    });

    it('getEnemyTypeConfig returns correct config', () => {
        expect(getEnemyTypeConfig('normal').hp).toBe(1);
        expect(getEnemyTypeConfig('boss').hp).toBe(3);
        expect(getEnemyTypeConfig('unknown')).toEqual(ENEMY_TYPES.normal);
    });

    it('getAllEnemyTypes returns all type names', () => {
        const types = getAllEnemyTypes();
        expect(types).toContain('normal');
        expect(types).toContain('fast');
        expect(types).toContain('tank');
        expect(types).toContain('boss');
    });
});

describe('Typing Raid - difficulty adaptation', () => {
    it('getDifficultyModifier returns level-based modifier', () => {
        expect(getDifficultyModifier({ level: { id: 'foundation' } })).toBe(0.7);
        expect(getDifficultyModifier({ level: { id: 'builder' } })).toBe(0.85);
        expect(getDifficultyModifier({ level: { id: 'fluent' } })).toBe(1.0);
        expect(getDifficultyModifier({ level: { id: 'sprint' } })).toBe(1.15);
        expect(getDifficultyModifier(null)).toBe(1);
        expect(getDifficultyModifier({})).toBe(1);
    });

    it('biasWordPool doubles words containing hotspot chars', () => {
        const pool = ['apple', 'banana', 'cat', 'dog'];
        const biased = biasWordPool(pool, ['a']);
        const aCount = biased.filter((w) => w === 'apple').length;
        const dCount = biased.filter((w) => w === 'dog').length;
        expect(aCount).toBe(2);
        expect(dCount).toBe(1);
    });

    it('biasWordPool returns original pool without hotspots', () => {
        const pool = ['apple', 'banana'];
        expect(biasWordPool(pool, [])).toEqual(pool);
    });
});

describe('Typing Raid - scoring', () => {
    it('calculateKillScore uses word length and combo', () => {
        const enemy = { word: 'test', scoreMultiplier: 1 };
        expect(calculateKillScore(enemy, 0)).toBe(40);
        expect(calculateKillScore(enemy, 5)).toBe(60);
    });

    it('calculateKillScore applies type multiplier', () => {
        const normal = { word: 'test', scoreMultiplier: 1 };
        const boss = { word: 'test', scoreMultiplier: 3 };
        expect(calculateKillScore(boss, 0)).toBe(calculateKillScore(normal, 0) * 3);
    });

    it('getComboMultiplier increases every 5 combos', () => {
        expect(getComboMultiplier(0)).toBe(1);
        expect(getComboMultiplier(5)).toBe(1.5);
        expect(getComboMultiplier(10)).toBe(2);
    });
});

describe('Typing Raid - game state', () => {
    it('createGameState returns idle state', () => {
        const state = createGameState();
        expect(state.mode).toBe('idle');
        expect(state.score).toBe(0);
        expect(state.lives).toBe(5);
        expect(state.enemies).toEqual([]);
    });

    it('transitionGameMode handles start/pause/resume/restart', () => {
        let state = createGameState();
        state = transitionGameMode(state, 'start');
        expect(state.mode).toBe('playing');
        expect(state.startTime).toBeTruthy();

        state = transitionGameMode(state, 'pause');
        expect(state.mode).toBe('paused');

        state = transitionGameMode(state, 'resume');
        expect(state.mode).toBe('playing');

        state = transitionGameMode(state, 'restart');
        expect(state.mode).toBe('idle');
    });

    it('transitionGameMode ignores invalid transitions', () => {
        let state = createGameState();
        state = transitionGameMode(state, 'pause');
        expect(state.mode).toBe('idle');

        state = transitionGameMode(state, 'resume');
        expect(state.mode).toBe('idle');
    });
});

describe('Typing Raid - input processing', () => {
    function makePlayingState(enemies) {
        return {
            ...createGameState(),
            mode: 'playing',
            startTime: Date.now(),
            enemies
        };
    }

    it('processInput matches first char of enemy word', () => {
        const enemies = [
            { id: 'e1', type: 'normal', word: 'test', x: 100, y: 100, speed: 50, hp: 1, maxHp: 1, scoreMultiplier: 1, alive: true, typed: '' }
        ];
        const state = makePlayingState(enemies);
        const result = processInput(state, 't');
        expect(result.state.activeEnemyId).toBe('e1');
        expect(result.state.typedInput).toBe('t');
        expect(result.events[0].type).toBe('char_correct');
    });

    it('processInput kills enemy when word fully typed', () => {
        const enemies = [
            { id: 'e1', type: 'normal', word: 'hi', x: 100, y: 100, speed: 50, hp: 1, maxHp: 1, scoreMultiplier: 1, alive: true, typed: '' }
        ];
        let state = makePlayingState(enemies);
        const r1 = processInput(state, 'h');
        state = r1.state;
        const r2 = processInput(state, 'i');
        expect(r2.state.enemiesDefeated).toBe(1);
        expect(r2.state.score).toBeGreaterThan(0);
        expect(r2.state.combo).toBe(1);
        expect(r2.events.some((e) => e.type === 'enemy_killed')).toBe(true);
    });

    it('processInput resets combo on wrong char', () => {
        const enemies = [
            { id: 'e1', type: 'normal', word: 'test', x: 100, y: 100, speed: 50, hp: 1, maxHp: 1, scoreMultiplier: 1, alive: true, typed: '' }
        ];
        let state = makePlayingState(enemies);
        state = processInput(state, 't').state;
        state = { ...state, combo: 5 };
        const result = processInput(state, 'z');
        expect(result.state.combo).toBe(0);
        expect(result.events[0].type).toBe('char_error');
    });

    it('processInput ignores input when not playing', () => {
        const state = createGameState();
        const result = processInput(state, 'a');
        expect(result.state).toBe(state);
        expect(result.events).toEqual([]);
    });
});

describe('Typing Raid - physics update', () => {
    it('updateGameState moves enemies down', () => {
        const enemies = [
            { id: 'e1', type: 'normal', word: 'test', x: 100, y: 50, speed: 100, hp: 1, maxHp: 1, scoreMultiplier: 1, alive: true, typed: '' }
        ];
        const state = { ...createGameState(), mode: 'playing', enemies, waveQueue: [], nextSpawnIndex: 0 };
        const result = updateGameState(state, 1, 600);
        expect(result.state.enemies[0].y).toBe(150);
    });

    it('updateGameState kills enemies that reach bottom', () => {
        const enemies = [
            { id: 'e1', type: 'normal', word: 'test', x: 100, y: 590, speed: 100, hp: 1, maxHp: 1, scoreMultiplier: 1, alive: true, typed: '' }
        ];
        const state = { ...createGameState(), mode: 'playing', enemies, waveQueue: [], nextSpawnIndex: 0 };
        const result = updateGameState(state, 1, 600);
        expect(result.state.lives).toBe(4);
        expect(result.state.enemiesLeaked).toBe(1);
        expect(result.events.some((e) => e.type === 'enemy_leaked')).toBe(true);
    });

    it('updateGameState triggers gameover when lives reach 0', () => {
        const enemies = [
            { id: 'e1', type: 'normal', word: 'test', x: 100, y: 590, speed: 100, hp: 1, maxHp: 1, scoreMultiplier: 1, alive: true, typed: '' }
        ];
        const state = { ...createGameState(), mode: 'playing', lives: 1, enemies, waveQueue: [], nextSpawnIndex: 0 };
        const result = updateGameState(state, 1, 600);
        expect(result.state.mode).toBe('gameover');
        expect(result.events.some((e) => e.type === 'game_over')).toBe(true);
    });

    it('updateGameState does nothing when not playing', () => {
        const state = createGameState();
        const result = updateGameState(state, 1, 600);
        expect(result.state).toBe(state);
    });
});

describe('Typing Raid - wave management', () => {
    it('startWave creates enemies and advances wave counter', () => {
        let state = createGameState();
        state = transitionGameMode(state, 'start');
        state = startWave(state, ['test', 'word', 'game'], { canvasWidth: 800, canvasHeight: 600 });
        expect(state.wave).toBe(1);
        expect(state.waveQueue.length).toBeGreaterThan(0);
    });

    it('processSpawns adds enemies over time', () => {
        let state = createGameState();
        state = transitionGameMode(state, 'start');
        state = startWave(state, ['test', 'word', 'game'], { canvasWidth: 800, canvasHeight: 600 });
        const initialCount = state.enemies.length;
        state = processSpawns(state, 3);
        expect(state.enemies.length).toBeGreaterThanOrEqual(initialCount);
    });
});

describe('Typing Raid - game result', () => {
    it('buildGameResult computes stats correctly', () => {
        const state = {
            ...createGameState(),
            mode: 'gameover',
            score: 500,
            wave: 3,
            maxCombo: 10,
            enemiesDefeated: 15,
            enemiesLeaked: 2,
            enemiesTotal: 20,
            totalCharsTyped: 100,
            totalCharsCorrect: 90,
            startTime: Date.now() - 60000,
            endTime: Date.now(),
            perfectWaves: 1,
            lives: 3
        };
        const result = buildGameResult(state);
        expect(result.score).toBe(500);
        expect(result.accuracy).toBe(90);
        expect(result.wpm).toBeGreaterThan(0);
        expect(result.durationSeconds).toBe(60);
    });
});

describe('Typing Raid - i18n', () => {
    it('getGameCopy returns zh-CN by default', () => {
        const copy = getGameCopy();
        expect(copy.title).toBe('打字突袭');
    });

    it('getGameCopy returns en-US', () => {
        const copy = getGameCopy('en-US');
        expect(copy.title).toBe('Typing Raid');
    });

    it('getGameCopy falls back to en-US for unknown locale', () => {
        const copy = getGameCopy('fr-FR');
        expect(copy.title).toBe('Typing Raid');
    });
});
