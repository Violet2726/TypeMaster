import { describe, expect, it } from 'vitest';
import { applyRunProgress, buildMissionSet, buildRunResult, createRun, dispatchRun, hashRunResult, replayRun, tickRun } from '../index';
import type { ReplayLog } from '../index';

describe('deterministic run engine', () => {
    it('spawns identical enemies for the same seed', () => {
        const create = () => dispatchRun(createRun({ id: 'run-1', mode: 'quick-pulse', seed: 'stable' }), { type: 'start' }).state;
        const first = tickRun(create(), 50).state;
        const second = tickRun(create(), 50).state;
        expect(first.enemies).toEqual(second.enemies);
    });

    it('locks to the matching first character and records errors', () => {
        let state = dispatchRun(createRun({ id: 'run-2', mode: 'first-rift', seed: 'lock' }), { type: 'start' }).state;
        for (let index = 0; index < 11; index += 1) state = tickRun(state, 50).state;
        const enemy = state.enemies[0];
        expect(enemy).toBeDefined();
        const typed = dispatchRun(state, { type: 'type', char: enemy!.word[0]! }).state;
        expect(typed.currentTargetId).toBe(enemy!.id);
        const errored = dispatchRun(typed, { type: 'type', char: 'z' }).state;
        expect(errored.counters.errors).toBe(1);
        expect(errored.combo).toBe(0);
        expect(errored.fracture).toBeGreaterThan(0);
    });

    it('replays a command log into a stable result hash', () => {
        const log: ReplayLog = {
            contentVersion: 2,
            seed: 'daily-2026-07-16',
            mode: 'daily-rift' as const,
            difficulty: 'standard' as const,
            focusChars: [],
            entries: [
                { atMs: 0, command: { type: 'start' as const } },
                { atMs: 50, command: { type: 'type' as const, char: 'e' } }
            ]
        };
        expect(hashRunResult(replayRun(log))).toBe(hashRunResult(replayRun(log)));
    });

    it('applies progression and mission rewards without permanent combat power', () => {
        const result = buildRunResult({
            ...createRun({ id: 'run-3', mode: 'repair-trial', seed: 'repair' }),
            phase: 'complete',
            score: 2_000,
            elapsedMs: 60_000,
            maxCombo: 120,
            counters: { typed: 100, correct: 98, errors: 2, defeated: 30, bosses: 1 },
            endReason: 'timeout'
        });
        const applied = applyRunProgress(
            {
                resonanceLevel: 1,
                resonanceXp: 0,
                shards: 0,
                unlockedUpgradeIds: [],
                codexIds: [],
                achievementIds: [],
                activeDays: 0,
                lastActiveDate: null
            },
            result,
            '2026-07-16'
        );
        expect(applied.progress.shards).toBeGreaterThan(0);
        const missions = buildMissionSet('2026-07-16', '2026-W29');
        expect(missions).toHaveLength(6);
    });
});
