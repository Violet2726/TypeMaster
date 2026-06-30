import { describe, expect, test } from 'vitest';
import { createGameEngine } from '../game-engine';
import { createGameSessionRecord } from '../../../../store/session-completion-use-cases';

describe('TypeRift runtime regression', () => {
    test('starts a run and applies typed input to the active enemy', () => {
        const engine = createGameEngine({
            language: 'en-US',
            seed: 'runtime-input-regression',
            wordPool: ['aa']
        });

        let update = engine.dispatch('start', { gameMode: 'first-descent' });
        expect(update.snapshot.phase).toBe('playing');

        update = engine.tick(0.5);
        const target = update.snapshot.arena.enemies[0];
        expect(target.word).toBe('aa');

        update = engine.dispatch('type-char', { char: 'a' });
        expect(update.snapshot.hud.targetTyped).toBe('a');
        expect(update.events.some((event) => event.type === 'char_correct')).toBe(true);
    });

    test('chooses an upgrade and clears the upgrade overlay state', () => {
        const engine = createGameEngine({
            language: 'en-US',
            seed: 'runtime-upgrade-regression'
        });

        engine.dispatch('start', { gameMode: 'first-descent' });
        engine.state.upgradeChoices = [{
            id: 'aegis-line',
            category: 'relic',
            rarity: 'rare',
            name: 'Aegis Line',
            nameZh: 'Aegis Line',
            summary: 'Maximum lives +1.',
            effect: { maxLives: 1 },
            stack: 1
        }];

        const update = engine.dispatch('choose-upgrade', { upgradeId: 'aegis-line' });

        expect(update.snapshot.upgradeChoices).toEqual([]);
        expect(update.snapshot.activeUpgrades?.[0]?.id).toBe('aegis-line');
        expect(update.events.some((event) => event.type === 'upgrade_chosen')).toBe(true);
        expect(update.snapshot.hud.maxLives).toBe(6);
    });

    test('ends a run and produces a persistable game session record', () => {
        const engine = createGameEngine({
            language: 'en-US',
            seed: 'runtime-result-regression'
        });

        engine.dispatch('start', { gameMode: 'first-descent' });
        const update = engine.tick(1000);
        const result = update.snapshot.overlay?.result;

        expect(update.snapshot.phase).toBe('gameover');
        expect(result?.endReason).toBe('extract');

        const session = createGameSessionRecord(result);
        expect(session.kind).toBe('game');
        expect(session.gameMeta.score).toBe(result?.score);
        expect(session.trainingMeta.type).toBe('game');
        expect(session.result.durationSeconds).toBe(result?.durationSeconds);
    });
});
