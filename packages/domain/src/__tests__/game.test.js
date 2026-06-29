import { describe, it, expect } from 'vitest';
import {
    RAID_FINAL_ENCOUNTER,
    RAID_PHASES,
    RAID_TOTAL_WAVES,
    buildRaidResult,
    buildRaidSnapshot,
    calculateRaidPressure,
    createRaidState,
    dispatchRaidCommand,
    generateRaidWave,
    getGameCopy,
    processRaidInput,
    startRaidWave,
    updateRaidState
} from '../game.js';

function start(seed = 'test-seed', extra = {}) {
    const state = createRaidState({ seed, wordPool: ['go', 'cat', 'home', 'focus', 'vector', 'steady', 'index'], ...extra });
    return dispatchRaidCommand(state, 'start').state;
}

function spawnAll(state) {
    let next = state;
    for (let i = 0; i < 100; i += 1) {
        next = updateRaidState(next, 0.5).state;
        if (next.nextSpawnIndex >= next.waveQueue.length) break;
    }
    return next;
}

function typeWord(state, word) {
    let next = state;
    for (const char of word) {
        next = processRaidInput(next, char).state;
    }
    return next;
}

describe('Typing Raid 2.0 domain', () => {
    it('creates an idle raid state and starts wave one', () => {
        const idle = createRaidState({ seed: 'alpha' });
        expect(idle.phase).toBe(RAID_PHASES.idle);

        const playing = dispatchRaidCommand(idle, 'start').state;
        expect(playing.phase).toBe(RAID_PHASES.playing);
        expect(playing.wave).toBe(1);
        expect(playing.waveQueue.length).toBeGreaterThan(0);
    });

    it('generates deterministic waves for a seed', () => {
        const a = generateRaidWave(3, { seed: 'same', wordPool: ['cat', 'home', 'focus', 'vector'] });
        const b = generateRaidWave(3, { seed: 'same', wordPool: ['cat', 'home', 'focus', 'vector'] });

        expect(a.map((enemy) => enemy.word)).toEqual(b.map((enemy) => enemy.word));
        expect(a.map((enemy) => enemy.xRatio)).toEqual(b.map((enemy) => enemy.xRatio));
    });

    it('uses focus chars in the correction wave when possible', () => {
        const wave = generateRaidWave(4, {
            seed: 'focus',
            focusChars: ['z'],
            wordPool: ['zone', 'zest', 'cat', 'home', 'index']
        });

        expect(wave.some((enemy) => enemy.word.includes('z'))).toBe(true);
    });

    it('keeps the active target after a wrong key so the player can recover', () => {
        let state = start('recover');
        state = spawnAll(state);
        const target = state.enemies.find((enemy) => enemy.alive);

        state = processRaidInput(state, target.word[0]).state;
        const activeId = state.currentTargetId;
        const errored = processRaidInput(state, '#').state;

        expect(errored.currentTargetId).toBe(activeId);
        expect(errored.combo).toBe(0);
        expect(errored.counters.errors).toBe(1);

        const recovered = processRaidInput(errored, target.word[1]).state;
        expect(recovered.currentTargetId).toBe(activeId);
        expect(recovered.counters.correct).toBe(2);
    });

    it('defeats enemies, scores, and advances combo', () => {
        let state = start('kill');
        state = spawnAll(state);
        const target = state.enemies.find((enemy) => enemy.alive);

        state = typeWord(state, target.word);

        expect(state.counters.kills).toBe(1);
        expect(state.combo).toBe(1);
        expect(state.score).toBeGreaterThan(0);
        expect(state.currentTargetId).toBe(null);
    });

    it('shows the nearest live enemy as the default HUD target', () => {
        let state = start('priority-target');
        state = spawnAll(state);
        const priority = state.enemies
            .filter((enemy) => enemy.alive)
            .sort((a, b) => b.y - a.y || a.spawnAt - b.spawnAt)[0];

        const snapshot = buildRaidSnapshot(state);

        expect(snapshot.hud.targetWord).toBe(priority.word);
        expect(snapshot.arena.enemies.find((enemy) => enemy.id === priority.id).isTarget).toBe(true);
    });

    it('moves enemies and leaks non-boss enemies when they cross the bottom', () => {
        let state = start('leak');
        state = {
            ...state,
            enemies: [
                { id: 'e1', type: 'guard', word: 'cat', typed: '', xRatio: 0.5, y: 1.03, speed: 0.5, hp: 1, maxHp: 1, alive: true, leaked: false }
            ],
            waveQueue: [],
            nextSpawnIndex: 0
        };

        const result = updateRaidState(state, 0.1);

        expect(result.state.lives).toBe(4);
        expect(result.state.counters.leaked).toBe(1);
        expect(result.events.some((event) => event.type === 'enemy_leaked')).toBe(true);
    });

    it('starts the Guardian after five cleared waves', () => {
        let state = start('boss');
        state = {
            ...state,
            completedWaves: RAID_TOTAL_WAVES,
            enemies: [],
            waveQueue: [],
            nextSpawnIndex: 0
        };

        state = startRaidWave(state);

        expect(state.wave).toBe(RAID_FINAL_ENCOUNTER);
        expect(state.waveQueue[0].type).toBe('boss');
        expect(state.waveQueue[0].segments).toHaveLength(3);
    });

    it('requires all boss segments before completing the raid', () => {
        let state = createRaidState({ seed: 'boss-fight' });
        state = startRaidWave({ ...state, phase: RAID_PHASES.playing, completedWaves: RAID_TOTAL_WAVES }, RAID_FINAL_ENCOUNTER);
        state = spawnAll(state);
        const boss = state.enemies[0];

        state = typeWord(state, boss.word);
        expect(state.phase).toBe(RAID_PHASES.playing);
        expect(state.enemies[0].hp).toBe(2);

        state = typeWord(state, state.enemies[0].word);
        state = typeWord(state, state.enemies[0].word);
        state = updateRaidState(state, 0.1).state;

        expect(state.phase).toBe(RAID_PHASES.complete);
    });

    it('computes pressure from accuracy, speed, life, and combo', () => {
        const low = calculateRaidPressure({
            elapsed: 60,
            lives: 1,
            maxLives: 5,
            combo: 0,
            counters: { typed: 50, correct: 30 }
        });
        const high = calculateRaidPressure({
            elapsed: 60,
            lives: 5,
            maxLives: 5,
            combo: 20,
            counters: { typed: 120, correct: 118 }
        });

        expect(high).toBeGreaterThan(low);
        expect(low).toBeGreaterThanOrEqual(0.15);
        expect(high).toBeLessThanOrEqual(0.95);
    });

    it('builds a raid result and snapshot for persistence/UI', () => {
        const state = {
            ...start('result'),
            phase: RAID_PHASES.complete,
            score: 1200,
            maxCombo: 12,
            completedWaves: 5,
            elapsed: 180,
            endedAt: 180,
            counters: { typed: 100, correct: 95, errors: 5, kills: 20, leaked: 1 },
            errorCounts: { a: 3, s: 2 },
            perfectWaves: 2,
            lives: 4
        };

        const result = buildRaidResult(state);
        const snapshot = buildRaidSnapshot(state);

        expect(result.accuracy).toBe(95);
        expect(result.wavesCleared).toBe(5);
        expect(result.focusChars).toEqual(['a', 's']);
        expect(snapshot.overlay.type).toBe('result');
    });

    it('returns zh-CN copy by default', () => {
        expect(getGameCopy().title).toBe('打字突袭');
        expect(getGameCopy('en-US').title).toBe('Typing Raid');
    });
});
