import { describe, it, expect } from 'vitest';
import {
    RAID_PHASES,
    RAID_RELICS,
    buildRaidResult,
    buildRaidSnapshot,
    calculateRaidPressure,
    chooseRaidRelic,
    createRaidState,
    dispatchRaidCommand,
    generateRaidMonster,
    generateRelicChoices,
    getDailyMutation,
    getGameCopy,
    processRaidInput,
    updateRaidState
} from '../game.js';

const WORD_POOL = ['go', 'cat', 'home', 'focus', 'vector', 'steady', 'index', 'trace', 'form', 'from', 'quiet', 'signal'];

function start(seed = 'test-seed', extra = {}) {
    const state = createRaidState({ seed, wordPool: WORD_POOL, ...extra });
    return dispatchRaidCommand(state, 'start', extra).state;
}

function tick(state, seconds) {
    let next = state;
    const steps = Math.max(1, Math.ceil(seconds / 0.05));
    for (let index = 0; index < steps; index += 1) {
        next = updateRaidState(next, seconds / steps).state;
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

describe('Arcade Rift domain', () => {
    it('creates an idle Arcade Rift state and starts Endless Rift', () => {
        const idle = createRaidState({ seed: 'alpha' });
        expect(idle.phase).toBe(RAID_PHASES.idle);
        expect(idle.raidMode).toBe('endless-rift');

        const playing = dispatchRaidCommand(idle, 'start', { raidMode: 'endless-rift' }).state;
        expect(playing.phase).toBe(RAID_PHASES.playing);
        expect(playing.riftLayer).toBe(1);
        expect(playing.difficultyProfile.spawnInterval).toBeGreaterThan(0);
    });

    it('generates deterministic monsters for the same seed, layer, and spawn index', () => {
        const a = generateRaidMonster({ seed: 'same', type: 'splitter', riftLayer: 4, spawnIndex: 2, wordPool: WORD_POOL });
        const b = generateRaidMonster({ seed: 'same', type: 'splitter', riftLayer: 4, spawnIndex: 2, wordPool: WORD_POOL });

        expect(a.type).toBe('splitter');
        expect(a.word).toBe(b.word);
        expect(a.xRatio).toBe(b.xRatio);
        expect(a.speed).toBe(b.speed);
    });

    it('uses focus characters for Glyph monsters', () => {
        const monster = generateRaidMonster({
            seed: 'glyph-focus',
            type: 'glyph',
            riftLayer: 5,
            spawnIndex: 0,
            focusChars: ['z'],
            wordPool: WORD_POOL
        });

        expect(monster.type).toBe('glyph');
        expect(monster.word.includes('z') || /\d/.test(monster.word) || /[?!+\-]/.test(monster.word)).toBe(true);
    });

    it('raises rift layer only at 90-second boundaries', () => {
        let state = start('layer');
        state = { ...state, elapsed: 89.98, riftLayer: 1, threatLevel: 1 };

        const result = updateRaidState(state, 0.08);

        expect(result.state.riftLayer).toBe(2);
        expect(result.events.some((event) => event.type === 'rift_layer_up')).toBe(true);
    });

    it('keeps the active target after a wrong key so the player can recover', () => {
        const monster = generateRaidMonster({ seed: 'recover', type: 'nib', riftLayer: 1, spawnIndex: 0, wordPool: WORD_POOL });
        let state = { ...start('recover'), enemies: [monster], spawnTimer: 999 };

        state = processRaidInput(state, monster.word[0]).state;
        const activeId = state.currentTargetId;
        const errored = processRaidInput(state, '#').state;

        expect(errored.currentTargetId).toBe(activeId);
        expect(errored.combo).toBe(0);
        expect(errored.counters.errors).toBe(1);

        const recovered = processRaidInput(errored, monster.word[1]).state;
        expect(recovered.currentTargetId).toBe(activeId);
        expect(recovered.counters.correct).toBe(2);
    });

    it('defeats monsters, scores, and advances combo', () => {
        const monster = { ...generateRaidMonster({ seed: 'kill', type: 'nib', riftLayer: 1, spawnIndex: 0, wordPool: WORD_POOL }), word: 'go' };
        let state = { ...start('kill'), enemies: [monster], spawnTimer: 999 };

        state = typeWord(state, 'go');

        expect(state.counters.kills).toBe(1);
        expect(state.combo).toBeGreaterThanOrEqual(1);
        expect(state.score).toBeGreaterThan(0);
        expect(state.currentTargetId).toBe(null);
    });

    it('requires Mossback segments before defeat', () => {
        const monster = { ...generateRaidMonster({ seed: 'moss', type: 'mossback', riftLayer: 3, spawnIndex: 0, wordPool: WORD_POOL }), word: 'home' };
        let state = { ...start('moss'), enemies: [monster], spawnTimer: 999 };

        state = typeWord(state, 'home');
        expect(state.enemies[0].alive).toBe(true);
        expect(state.enemies[0].hp).toBe(1);

        state = typeWord(state, 'home');
        expect(state.counters.kills).toBe(1);
    });

    it('moves Blink monsters between lanes before they are typed', () => {
        const monster = generateRaidMonster({ seed: 'blink', type: 'blink', riftLayer: 3, spawnIndex: 0, wordPool: WORD_POOL });
        const state = { ...start('blink'), enemies: [monster], spawnTimer: 999 };

        const moved = tick(state, 2.5);

        expect(moved.enemies[0].xRatio).not.toBe(monster.xRatio);
    });

    it('lets Bloom shielding absorb the first clear of a nearby monster', () => {
        const bloom = { ...generateRaidMonster({ seed: 'bloom', type: 'bloom', riftLayer: 3, spawnIndex: 0, wordPool: WORD_POOL }), xRatio: 0.5, y: 0.4, word: 'home' };
        const nib = { ...generateRaidMonster({ seed: 'nib', type: 'nib', riftLayer: 3, spawnIndex: 1, wordPool: WORD_POOL }), xRatio: 0.54, y: 0.42, word: 'go' };
        let state = { ...start('shield'), enemies: [bloom, nib], spawnTimer: 999 };

        state = typeWord(state, 'go');
        expect(state.enemies.find((enemy) => enemy.id === nib.id).alive).toBe(true);
        expect(state.enemies.find((enemy) => enemy.id === nib.id).shieldBroken).toBe(true);
        expect(state.counters.shieldBreaks).toBe(1);

        state = typeWord(state, 'go');
        expect(state.counters.kills).toBe(1);
    });

    it('opens relic choices and applies the selected relic', () => {
        const monster = { ...generateRaidMonster({ seed: 'relic', type: 'nib', riftLayer: 1, spawnIndex: 0, wordPool: WORD_POOL }), word: 'go' };
        let state = { ...start('relic'), enemies: [monster], spawnTimer: 999, nextRelicKill: 1 };

        state = typeWord(state, 'go');
        expect(state.relicChoices).toHaveLength(3);

        const chosen = chooseRaidRelic(state, state.relicChoices[0].id);
        expect(chosen.state.relics).toHaveLength(1);
        expect(chosen.state.relicChoices).toBe(null);
        expect(chosen.events[0].type).toBe('relic_chosen');
    });

    it('generates relic choices without repeating maxed relics', () => {
        const maxed = RAID_RELICS.find((relic) => relic.id === 'combo-core');
        const state = { ...start('choices'), relics: [maxed, maxed, maxed], counters: { ...start('choices').counters, kills: 8 } };

        const choices = generateRelicChoices(state);

        expect(choices).toHaveLength(3);
        expect(choices.some((choice) => choice.id === 'combo-core')).toBe(false);
    });

    it('allows extraction only on camp-gate rift layers', () => {
        const locked = dispatchRaidCommand(start('extract-locked'), 'extract');
        expect(locked.state.phase).toBe(RAID_PHASES.playing);
        expect(locked.events[0].type).toBe('extract_locked');

        const ready = { ...start('extract-ready'), riftLayer: 3, threatLevel: 3, highestRiftLayer: 3, highestThreatLevel: 3, elapsed: 190 };
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

    it('builds Arcade Rift result and snapshot data for persistence/UI', () => {
        const state = {
            ...start('result'),
            phase: RAID_PHASES.gameover,
            endReason: 'extract',
            extractReason: 'rift-gate',
            score: 1200,
            maxCombo: 12,
            riftLayer: 3,
            threatLevel: 3,
            highestRiftLayer: 4,
            highestThreatLevel: 4,
            elapsed: 270,
            endedAt: 270,
            counters: { typed: 100, correct: 95, errors: 5, kills: 20, leaked: 1, eliteKills: 1, guardianPhases: 2, shieldBreaks: 0, relicChoices: 2 },
            errorCounts: { a: 3, s: 2 },
            lives: 4,
            relics: [RAID_RELICS[0]],
            codexSeen: { nib: true, guardian: true, 'lumen-maw': true },
            guardianDefeated: ['lumen-maw']
        };

        const result = buildRaidResult(state);
        const snapshot = buildRaidSnapshot(state);

        expect(result.accuracy).toBe(95);
        expect(result.riftLayer).toBe(4);
        expect(result.monstersDefeated).toBe(20);
        expect(result.relicBuild[0].id).toBe('combo-core');
        expect(result.codexProgress.discovered).toBeGreaterThan(0);
        expect(snapshot.overlay.type).toBe('result');
        expect(snapshot.overlay.isVictory).toBe(true);
    });

    it('keeps Daily Mutation deterministic for a date key', () => {
        expect(getDailyMutation('2026-06-30')).toEqual(getDailyMutation('2026-06-30'));
    });

    it('returns clean Arcade Rift copy by default', () => {
        expect(getGameCopy().title).toBe('Arcade Rift');
        expect(getGameCopy('en-US').title).toBe('Arcade Rift');
    });

    it('computes pressure from accuracy, speed, life, recovery, combo, and relic relief', () => {
        const low = calculateRaidPressure({
            elapsed: 60,
            lives: 1,
            maxLives: 5,
            combo: 0,
            counters: { typed: 50, correct: 30, errors: 20 },
            relics: [RAID_RELICS.find((relic) => relic.id === 'calm-meter')]
        });
        const high = calculateRaidPressure({
            elapsed: 600,
            lives: 5,
            maxLives: 5,
            combo: 44,
            counters: { typed: 120, correct: 118, errors: 1 },
            relics: []
        });

        expect(high).toBeGreaterThan(low);
        expect(low).toBeGreaterThanOrEqual(0.12);
        expect(high).toBeLessThanOrEqual(0.98);
    });
});
