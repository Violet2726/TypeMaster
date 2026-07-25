import { describe, expect, it } from 'vitest';
import {
    EMPTY_PLAYER_PROGRESS,
    advanceMissions,
    applyRunProgress,
    buildDeterministicInsights,
    buildMissionSet,
    buildRunResult,
    buildRunSnapshot,
    createRun,
    dispatchRun,
    hashRunResult,
    hashSeed,
    levelRequirement,
    progressionForRun,
    randomAt,
    stableId,
    tickRun,
    type RunEnemy,
    type RunResult,
    type RunState
} from './index';

const sampleResult: RunResult = {
    contentVersion: 2,
    runId: 'result-1',
    mode: 'daily-rift',
    difficulty: 'standard',
    seed: 'daily',
    score: 5_200,
    accuracy: 98.5,
    wpm: 62,
    maxCombo: 130,
    durationMs: 360_000,
    areaIndex: 2,
    endReason: 'timeout',
    defeated: 40,
    bosses: 3,
    weakChars: ['q', 'p'],
    upgradeIds: ['clean-strike'],
    encounteredIds: ['drift', 'harbor-mind'],
    defeatedBossIds: ['harbor-mind']
};

function running(overrides: Partial<RunState> = {}): RunState {
    return { ...dispatchRun(createRun({ id: 'run', mode: 'expedition', seed: 'seed' }), { type: 'start' }).state, ...overrides };
}

function enemy(overrides: Partial<RunEnemy> = {}): RunEnemy {
    return { id: 'enemy-1', archetypeId: 'drift', word: 'a', typed: '', lane: 0, pressure: 0.2, speed: 0, hp: 1, maxHp: 1, boss: false, ...overrides };
}

describe('gameplay command branches', () => {
    it('forces Daily Rift to Standard and ignores ticks before start', () => {
        const idle = createRun({ id: 'daily', mode: 'daily-rift', difficulty: 'surge', seed: 'same' });
        expect(idle.difficulty).toBe('standard');
        expect(tickRun(idle, 50).state).toBe(idle);
        expect(dispatchRun(idle, { type: 'resume' }).state).toBe(idle);
    });

    it('pauses, resumes, and extracts after the first area', () => {
        const active = running({ areaIndex: 1 });
        const paused = dispatchRun(active, { type: 'pause' }).state;
        expect(paused.phase).toBe('paused');
        const resumed = dispatchRun(paused, { type: 'resume' }).state;
        expect(dispatchRun(resumed, { type: 'extract' }).state.endReason).toBe('extracted');
        expect(dispatchRun(running(), { type: 'extract' }).state.phase).toBe('running');
    });

    it('spawns a boss, advances areas, and handles leaked pressure', () => {
        const bossDue = tickRun(running({ elapsedMs: 198_010, spawnCooldownMs: 5_000 }), 16.7).state;
        expect(bossDue.enemies.some((item) => item.boss)).toBe(true);
        const changed = tickRun(running({ elapsedMs: 219_990, areaIndex: 0, spawnCooldownMs: 5_000 }), 20);
        expect(changed.state.areaIndex).toBe(1);
        expect(changed.events.some((event) => event.type === 'area-changed')).toBe(true);
        const leaked = tickRun(running({ enemies: [enemy({ pressure: 0.999, speed: 0.001 })], currentTargetId: 'enemy-1' }), 50).state;
        expect(leaked.enemies).toHaveLength(0);
        expect(leaked.fracture).toBeGreaterThan(0);
        expect(leaked.currentTargetId).toBeNull();
    });

    it('ends on fracture, timeout, and expedition victory', () => {
        expect(tickRun(running({ fracture: 99, enemies: [enemy({ pressure: 0.999, speed: 0.001 })] }), 50).state.endReason).toBe('fracture');
        const quick = dispatchRun(createRun({ id: 'quick', mode: 'quick-pulse', seed: 'q' }), { type: 'start' }).state;
        expect(tickRun({ ...quick, elapsedMs: quick.durationMs - 1 }, 50).state.endReason).toBe('timeout');
        const expedition = running({ elapsedMs: 659_999 });
        expect(tickRun(expedition, 50).state.endReason).toBe('victory');
    });

    it('defeats targets, opens upgrades, validates choices, and releases Surge', () => {
        const ready = running({ enemies: [enemy()], xp: 70, nextUpgradeXp: 80 });
        const upgraded = dispatchRun(ready, { type: 'type', char: 'a' }).state;
        expect(upgraded.phase).toBe('upgrade');
        expect(upgraded.counters.defeated).toBe(1);
        expect(upgraded.upgradeChoices).toHaveLength(3);
        expect(dispatchRun(upgraded, { type: 'choose-upgrade', upgradeId: 'missing' }).state).toBe(upgraded);
        const chosen = dispatchRun(upgraded, { type: 'choose-upgrade', upgradeId: upgraded.upgradeChoices[0]!.id }).state;
        expect(chosen.level).toBe(2);
        expect(chosen.upgrades).toHaveLength(1);
        const stackable = {
            id: 'clean-strike',
            category: 'weapon' as const,
            rarity: 'common' as const,
            titleKey: 'upgrade.clean-strike.title',
            descriptionKey: 'upgrade.clean-strike.description',
            stack: 1,
            maxStacks: 3
        };
        const stacked = dispatchRun(
            {
                ...upgraded,
                phase: 'upgrade',
                upgrades: [stackable],
                upgradeChoices: [{ ...stackable, stack: 2 }]
            },
            { type: 'choose-upgrade', upgradeId: 'clean-strike' }
        ).state;
        expect(stacked.phase).toBe('running');
        expect(stacked.upgrades[0]?.stack).toBe(2);
        const surged = dispatchRun(running({ energy: 100, enemies: [enemy(), enemy({ id: 'boss', boss: true, hp: 4, maxHp: 4 })] }), { type: 'surge' }).state;
        expect(surged.energy).toBe(0);
        expect(surged.enemies).toHaveLength(1);
        expect(surged.enemies[0]?.hp).toBe(2);
    });

    it('records unmatched input and builds snapshots and hashes', () => {
        const active = running({ enemies: [enemy({ word: 'z' })] });
        const errored = dispatchRun(active, { type: 'type', char: 'x' }).state;
        expect(errored.weakCounts.x).toBe(1);
        const snapshot = buildRunSnapshot(errored);
        expect(snapshot.accuracy).toBe(0);
        const result = buildRunResult({ ...errored, phase: 'complete', endReason: 'fracture' });
        expect(result.weakChars).toEqual(['x']);
        expect(hashRunResult(result)).not.toBe(hashRunResult({ ...result, score: 1 }));
    });
});

describe('progression, missions, insights, and seeded utilities', () => {
    it('levels repeatedly and deduplicates unlocks and achievements', () => {
        expect(levelRequirement(1)).toBe(180);
        expect(levelRequirement(3)).toBe(360);
        const delta = progressionForRun(sampleResult);
        expect(delta.codexIds).toHaveLength(2);
        expect(delta.achievementIds).toHaveLength(4);
        const applied = applyRunProgress({ ...EMPTY_PLAYER_PROGRESS, resonanceXp: 170, codexIds: delta.codexIds }, sampleResult, '2026-07-16');
        expect(applied.progress.resonanceLevel).toBeGreaterThan(1);
        expect(new Set(applied.progress.codexIds).size).toBe(applied.progress.codexIds.length);
        const sameDay = applyRunProgress(applied.progress, { ...sampleResult, score: 0, accuracy: 10, bosses: 0, maxCombo: 0 }, '2026-07-16');
        expect(sameDay.progress.activeDays).toBe(applied.progress.activeDays);
    });

    it('advances every mission metric and supports focus and positive insights', () => {
        const missions = buildMissionSet('2026-07-16', '2026-W29');
        const advanced = advanceMissions(missions, sampleResult, '2026-07-16T08:00:00.000Z');
        expect(advanced.filter((mission) => mission.completed).length).toBeGreaterThan(3);
        const repair = advanceMissions(advanced, { ...sampleResult, mode: 'repair-trial' }, '2026-07-16T08:00:00.000Z');
        expect(repair.find((mission) => mission.metric === 'repair-runs')?.progress).toBe(1);
        const positive = buildDeterministicInsights(sampleResult);
        expect(positive.map((item) => item.severity)).toContain('positive');
        const focus = buildDeterministicInsights({ ...sampleResult, accuracy: 80, wpm: 20, weakChars: [] });
        expect(focus[0]?.severity).toBe('focus');
        expect(focus[2]?.value).toBe('—');
    });

    it('produces stable seeded values and ids', () => {
        expect(hashSeed('rift')).toBe(hashSeed('rift'));
        expect(randomAt('rift', 4)).toBe(randomAt('rift', 4));
        expect(randomAt('rift', 4)).toBeGreaterThanOrEqual(0);
        expect(stableId('enemy', 'rift', 2)).toBe(stableId('enemy', 'rift', 2));
    });
});
