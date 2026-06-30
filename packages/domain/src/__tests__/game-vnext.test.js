import { describe, expect, it } from 'vitest';
import {
    GAME_PHASES,
    buildGameResult,
    buildGameSnapshot,
    chooseUpgrade,
    createGameState,
    dispatchGameCommand,
    generateEnemy,
    generateUpgradeChoices,
    processGameInput,
    updateGameState
} from '../game-vnext/index.js';

const WORD_POOL = ['go', 'cat', 'home', 'focus', 'vector', 'steady', 'index', 'trace', 'form', 'from', 'quiet', 'signal'];

function start(seed = 'test-seed', extra = {}) {
    const state = createGameState({ seed, wordPool: WORD_POOL, ...extra });
    return dispatchGameCommand(state, 'start', extra).state;
}

function typeWord(state, word) {
    let next = state;
    for (const char of word) {
        next = processGameInput(next, char).state;
    }
    return next;
}

describe('TypeRift game domain', () => {
    it('creates an idle state and starts Expedition', () => {
        const idle = createGameState({ seed: 'alpha' });
        expect(idle.phase).toBe(GAME_PHASES.idle);
        expect(idle.mode).toBe('expedition');

        const playing = dispatchGameCommand(idle, 'start', { gameMode: 'expedition' }).state;
        expect(playing.phase).toBe(GAME_PHASES.playing);
        expect(playing.area.id).toBe('neon-archive');
        expect(playing.version).toBe('typerift-v1');
    });

    it('generates deterministic enemies for the same seed and index', () => {
        const state = { ...start('same'), spawnIndex: 2, areaIndex: 2, elapsed: 12 };
        const a = generateEnemy(state, 'mirror');
        const b = generateEnemy(state, 'mirror');

        expect(a.type).toBe('mirror');
        expect(a.word).toBe(b.word);
        expect(a.xRatio).toBe(b.xRatio);
        expect(a.speed).toBe(b.speed);
    });

    it('keeps the active target after a wrong key so the player can recover', () => {
        const enemy = { ...generateEnemy({ ...start('recover'), spawnIndex: 0 }, 'spark'), word: 'go' };
        let state = { ...start('recover'), enemies: [enemy], spawnTimer: 999 };

        state = processGameInput(state, 'g').state;
        const activeId = state.currentTargetId;
        const errored = processGameInput(state, '#').state;

        expect(errored.currentTargetId).toBe(activeId);
        expect(errored.combo).toBe(0);
        expect(errored.counters.errors).toBe(1);

        const recovered = processGameInput(errored, 'o').state;
        expect(recovered.counters.kills).toBe(1);
    });

    it('defeats enemies, scores, and opens upgrades when enough xp is earned', () => {
        const enemy = { ...generateEnemy({ ...start('kill'), spawnIndex: 0 }, 'spark'), word: 'go', score: 30 };
        let state = { ...start('kill'), enemies: [enemy], spawnTimer: 999, xp: 88, nextUpgradeXp: 90 };

        state = typeWord(state, 'go');

        expect(state.counters.kills).toBe(1);
        expect(state.combo).toBe(1);
        expect(state.score).toBeGreaterThan(0);
        expect(state.upgradeChoices).toHaveLength(3);
    });

    it('chooses upgrades and applies max life effects', () => {
        let state = { ...start('upgrade'), upgradeChoices: generateUpgradeChoices(start('upgrade')) };
        state = { ...state, upgradeChoices: [{ id: 'aegis-line', category: 'relic', rarity: 'rare', name: 'Aegis Line', effect: { maxLives: 1 } }] };

        const result = chooseUpgrade(state, 'aegis-line');

        expect(result.state.upgrades).toHaveLength(1);
        expect(result.state.maxLives).toBe(6);
        expect(result.events[0].type).toBe('upgrade_chosen');
    });

    it('spawns a boss at a new area boundary', () => {
        const state = { ...start('boss'), elapsed: 193, areaIndex: 0, area: { id: 'neon-archive' }, spawnTimer: 999 };
        const result = updateGameState(state, 0.1);

        expect(result.state.areaIndex).toBeGreaterThan(0);
        expect(result.state.enemies.some((enemy) => enemy.boss)).toBe(true);
        expect(result.events.some((event) => event.type === 'boss_spawned')).toBe(true);
    });

    it('ends the run when lives are depleted by leaked enemies', () => {
        const state = {
            ...start('defeat'),
            lives: 1,
            enemies: [
                { id: 'e1', type: 'spark', word: 'cat', typed: '', xRatio: 0.5, y: 1.04, speed: 0.5, hp: 1, maxHp: 1, alive: true, leaked: false, score: 10 }
            ],
            spawnTimer: 999
        };

        const result = updateGameState(state, 0.1);

        expect(result.state.phase).toBe(GAME_PHASES.gameover);
        expect(result.state.endReason).toBe('defeat');
    });

    it('builds result and snapshot data for persistence and UI', () => {
        const state = {
            ...start('result'),
            phase: GAME_PHASES.gameover,
            endReason: 'extract',
            extractReason: 'timer',
            score: 1200,
            maxCombo: 12,
            areaIndex: 2,
            depth: 3,
            elapsed: 270,
            endedAt: 270,
            counters: { typed: 100, correct: 95, errors: 5, kills: 20, leaked: 1, elites: 2, bosses: 1, upgrades: 2, perfectClears: 0 },
            errorCounts: { a: 3, s: 2 },
            lives: 4,
            upgrades: [{ id: 'pulse-lance', category: 'weapon', rarity: 'common', name: 'Pulse Lance', effect: {} }],
            codexSeen: { spark: true },
            bossDefeated: ['archive-seraph']
        };

        const result = buildGameResult(state);
        const snapshot = buildGameSnapshot(state);

        expect(result.version).toBe('typerift-v1');
        expect(result.accuracy).toBe(95);
        expect(result.depth).toBe(3);
        expect(result.upgradeBuild[0].id).toBe('pulse-lance');
        expect(snapshot.overlay.type).toBe('result');
        expect(snapshot.overlay.isVictory).toBe(true);
    });
});
