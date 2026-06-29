import { describe, it, expect } from 'vitest';
import {
    RAID_PHASES,
    buildRaidResult,
    buildRaidSnapshot,
    calculateRaidPressure,
    createRaidState,
    dispatchRaidCommand,
    generateRaidMonster,
    generateRaidWave,
    getGameCopy,
    processRaidInput,
    updateRaidState
} from '../game.js';

const WORD_POOL = ['go', 'cat', 'home', 'focus', 'vector', 'steady', 'index', 'trace', 'form', 'from', 'quiet'];

function start(seed = 'test-seed', extra = {}) {
    const state = createRaidState({ seed, wordPool: WORD_POOL, ...extra });
    return dispatchRaidCommand(state, 'start').state;
}

function tick(state, seconds) {
    let next = state;
    const steps = Math.max(1, Math.ceil(seconds / 0.05));
    for (let index = 0; index < steps; index += 1) {
        next = updateRaidState(next, seconds / steps).state;
    }
    return next;
}

function spawnOne(state) {
    let next = state;
    for (let index = 0; index < 20; index += 1) {
        next = updateRaidState(next, 0.08).state;
        if (next.enemies.some((enemy) => enemy.alive)) return next;
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

describe('Typing Raid Endless Monsters domain', () => {
    it('creates an idle endless raid state and starts the monster loop', () => {
        const idle = createRaidState({ seed: 'alpha' });
        expect(idle.phase).toBe(RAID_PHASES.idle);
        expect(idle.raidMode).toBe('endless');

        const playing = dispatchRaidCommand(idle, 'start').state;
        expect(playing.phase).toBe(RAID_PHASES.playing);
        expect(playing.threatLevel).toBe(1);
        expect(playing.difficultyProfile.spawnInterval).toBeGreaterThan(0);
    });

    it('generates deterministic endless monsters for the same seed and threat', () => {
        const a = generateRaidWave(4, { seed: 'same', wordPool: WORD_POOL, focusChars: ['z'] });
        const b = generateRaidWave(4, { seed: 'same', wordPool: WORD_POOL, focusChars: ['z'] });

        expect(a.map((enemy) => enemy.type)).toEqual(b.map((enemy) => enemy.type));
        expect(a.map((enemy) => enemy.word)).toEqual(b.map((enemy) => enemy.word));
        expect(a.map((enemy) => enemy.xRatio)).toEqual(b.map((enemy) => enemy.xRatio));
    });

    it('uses focus characters for Glyph monsters', () => {
        const monster = generateRaidMonster({
            seed: 'glyph-focus',
            type: 'glyph',
            threatLevel: 5,
            spawnIndex: 0,
            focusChars: ['z'],
            wordPool: WORD_POOL
        });

        expect(monster.type).toBe('glyph');
        expect(monster.word.includes('z') || /\d/.test(monster.word)).toBe(true);
    });

    it('raises threat level only at the minute boundary', () => {
        let state = start('threat');
        state = { ...state, elapsed: 59.98, threatLevel: 1 };

        const result = updateRaidState(state, 0.08);

        expect(result.state.threatLevel).toBe(2);
        expect(result.events.some((event) => event.type === 'threat_level_up')).toBe(true);
    });

    it('keeps the active target after a wrong key so the player can recover', () => {
        let state = spawnOne(start('recover'));
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

    it('defeats monsters, scores, and advances combo', () => {
        let state = spawnOne(start('kill'));
        const target = state.enemies.find((enemy) => enemy.alive);

        state = typeWord(state, target.word);

        expect(state.counters.kills).toBe(1);
        expect(state.combo).toBeGreaterThanOrEqual(1);
        expect(state.score).toBeGreaterThan(0);
        expect(state.currentTargetId).toBe(null);
    });

    it('requires both Mossback segments before defeat', () => {
        const monster = generateRaidMonster({
            seed: 'moss',
            type: 'mossback',
            threatLevel: 3,
            spawnIndex: 0,
            wordPool: WORD_POOL
        });
        let state = {
            ...start('moss'),
            enemies: [monster],
            spawnTimer: 999
        };

        state = typeWord(state, monster.word);
        expect(state.enemies[0].alive).toBe(true);
        expect(state.enemies[0].hp).toBe(1);

        state = typeWord(state, state.enemies[0].word);
        expect(state.counters.kills).toBe(1);
    });

    it('moves Blink monsters between lanes before they are typed', () => {
        const monster = generateRaidMonster({
            seed: 'blink',
            type: 'blink',
            threatLevel: 3,
            spawnIndex: 0,
            wordPool: WORD_POOL
        });
        const state = {
            ...start('blink'),
            enemies: [monster],
            spawnTimer: 999
        };

        const moved = tick(state, 2.5);

        expect(moved.enemies[0].xRatio).not.toBe(monster.xRatio);
    });

    it('lets Bloom shielding absorb the first clear of a nearby monster', () => {
        const bloom = {
            ...generateRaidMonster({ seed: 'bloom', type: 'bloom', threatLevel: 3, spawnIndex: 0, wordPool: WORD_POOL }),
            xRatio: 0.5,
            y: 0.4,
            word: 'home'
        };
        const nib = {
            ...generateRaidMonster({ seed: 'nib', type: 'nib', threatLevel: 3, spawnIndex: 1, wordPool: WORD_POOL }),
            xRatio: 0.54,
            y: 0.42,
            word: 'go'
        };
        let state = {
            ...start('shield'),
            enemies: [bloom, nib],
            spawnTimer: 999
        };

        state = typeWord(state, 'go');
        expect(state.enemies.find((enemy) => enemy.id === nib.id).alive).toBe(true);
        expect(state.enemies.find((enemy) => enemy.id === nib.id).shieldBroken).toBe(true);
        expect(state.counters.shieldBreaks).toBe(1);

        state = typeWord(state, 'go');
        expect(state.counters.kills).toBe(1);
    });

    it('allows extraction only on camp-gate threat levels', () => {
        const locked = dispatchRaidCommand(start('extract-locked'), 'extract');
        expect(locked.state.phase).toBe(RAID_PHASES.playing);
        expect(locked.events[0].type).toBe('extract_locked');

        const ready = {
            ...start('extract-ready'),
            threatLevel: 3,
            highestThreatLevel: 3,
            elapsed: 130
        };
        const extracted = dispatchRaidCommand(ready, 'extract');

        expect(extracted.state.phase).toBe(RAID_PHASES.gameover);
        expect(extracted.state.endReason).toBe('extract');
    });

    it('ends the raid when lives are depleted by leaked monsters', () => {
        const state = {
            ...start('defeat'),
            lives: 1,
            enemies: [
                { id: 'e1', type: 'nib', word: 'cat', typed: '', xRatio: 0.5, y: 1.03, speed: 0.5, hp: 1, maxHp: 1, alive: true, leaked: false }
            ],
            spawnTimer: 999
        };

        const result = updateRaidState(state, 0.1);

        expect(result.state.phase).toBe(RAID_PHASES.gameover);
        expect(result.state.endReason).toBe('defeat');
        expect(result.events.some((event) => event.type === 'raid_ended')).toBe(true);
    });

    it('builds endless result and snapshot data for persistence/UI', () => {
        const state = {
            ...start('result'),
            phase: RAID_PHASES.gameover,
            endReason: 'extract',
            extractReason: 'camp-gate',
            score: 1200,
            maxCombo: 12,
            bestStreakWindow: 12,
            threatLevel: 3,
            highestThreatLevel: 4,
            elapsed: 180,
            endedAt: 180,
            counters: { typed: 100, correct: 95, errors: 5, kills: 20, leaked: 1, eliteKills: 1, shieldBreaks: 0 },
            errorCounts: { a: 3, s: 2 },
            lives: 4
        };

        const result = buildRaidResult(state);
        const snapshot = buildRaidSnapshot(state);

        expect(result.accuracy).toBe(95);
        expect(result.threatLevel).toBe(4);
        expect(result.monstersDefeated).toBe(20);
        expect(result.endReason).toBe('extract');
        expect(result.weakestChars).toEqual(['a', 's']);
        expect(snapshot.overlay.type).toBe('result');
        expect(snapshot.overlay.isVictory).toBe(true);
    });

    it('returns clean zh-CN copy by default', () => {
        expect(getGameCopy().title).toBe('无尽突袭');
        expect(getGameCopy('en-US').title).toBe('Endless Raid');
    });

    it('computes pressure from accuracy, speed, life, recovery, and combo', () => {
        const low = calculateRaidPressure({
            elapsed: 60,
            lives: 1,
            maxLives: 5,
            combo: 0,
            counters: { typed: 50, correct: 30, errors: 20 }
        });
        const high = calculateRaidPressure({
            elapsed: 60,
            lives: 5,
            maxLives: 5,
            combo: 24,
            counters: { typed: 120, correct: 118, errors: 1 }
        });

        expect(high).toBeGreaterThan(low);
        expect(low).toBeGreaterThanOrEqual(0.15);
        expect(high).toBeLessThanOrEqual(0.98);
    });
});
