import { ACCEPTED_INPUT, AREAS, BOSSES, CONTENT_VERSION, DIFFICULTY_SPEED, ENEMY_ARCHETYPES, MODE_DURATION_MS, UPGRADES, WORDS } from './content';
import { randomAt, stableId } from './rng';
import type { CreateRunOptions, ReplayLog, RunCommand, RunEnemy, RunEvent, RunResult, RunSnapshot, RunState, RunUpgrade } from './types';

type EventDraft = Omit<RunEvent, 'id'>;
const EMPTY_COUNTERS = { typed: 0, correct: 0, errors: 0, defeated: 0, bosses: 0, cleanStreak: 0 };

function clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
}

function stacks(state: RunState, id: string) {
    return state.upgrades.find((item) => item.id === id)?.stack ?? 0;
}

function withEvents(base: RunState, next: RunState, drafts: EventDraft[]) {
    const events = drafts.map((draft, index) => ({ ...draft, id: base.eventIndex + index + 1 }));
    return { state: { ...next, eventIndex: base.eventIndex + events.length }, events };
}

function accuracy(state: RunState) {
    return state.counters.typed ? (state.counters.correct / state.counters.typed) * 100 : 100;
}

function runWord(state: RunState, index: number, min: number, max: number): string {
    const focus = state.focusChars.filter((char) => ACCEPTED_INPUT.test(char));
    const matching = focus.length ? WORDS.filter((word) => focus.some((char) => word.includes(char.toLowerCase()))) : WORDS;
    const pool = matching.filter((word) => word.length >= min && word.length <= max);
    const source = pool.length ? pool : matching;
    const base = source[Math.floor(randomAt(state.seed, index * 7 + 3) * source.length)] ?? 'echo';
    if (state.mode !== 'expedition' && state.mode !== 'daily-rift') return base;
    const challenge = randomAt(state.seed, index * 17 + 13);
    if (challenge < 0.12) return `${base}${Math.floor(randomAt(state.seed, index * 19 + 5) * 10)}`;
    if (challenge < 0.2) {
        const punctuation = ['?', '!', '-'] as const;
        return `${base}${punctuation[Math.floor(randomAt(state.seed, index * 23 + 7) * punctuation.length)] ?? '?'}`;
    }
    return base;
}

function spawnEnemy(state: RunState, boss = false): RunEnemy {
    const index = state.spawnIndex;
    if (boss) {
        const definition = BOSSES[state.areaIndex] ?? BOSSES[0];
        return {
            id: stableId('boss', state.seed, index),
            archetypeId: definition.id,
            word: runWord(state, index, 7, 10),
            typed: '',
            lane: 1,
            pressure: 0.08,
            speed: 0.000012,
            hp: definition.hp,
            maxHp: definition.hp,
            boss: true
        };
    }
    const definition = ENEMY_ARCHETYPES[Math.floor(randomAt(state.seed, index * 5 + 1) * ENEMY_ARCHETYPES.length)] ?? ENEMY_ARCHETYPES[0];
    return {
        id: stableId('enemy', state.seed, index),
        archetypeId: definition.id,
        word: runWord(state, index, definition.wordMin, definition.wordMax),
        typed: '',
        lane: Math.floor(randomAt(state.seed, index * 11 + 9) * 3),
        pressure: 0.04,
        speed: definition.speed,
        hp: definition.hp,
        maxHp: definition.hp,
        boss: false
    };
}

function upgradeChoices(state: RunState): RunUpgrade[] {
    const available = UPGRADES.filter((definition) => stacks(state, definition.id) < definition.maxStacks);
    const choices: RunUpgrade[] = [];
    for (let offset = 0; choices.length < 3 && offset < Math.max(1, available.length * 3); offset += 1) {
        const definition = available[Math.floor(randomAt(state.seed, state.level * 31 + offset) * available.length)];
        if (definition && !choices.some((item) => item.id === definition.id)) {
            choices.push({ ...definition, stack: stacks(state, definition.id) + 1 });
        }
    }
    return choices;
}

function completeState(state: RunState, endReason: RunResult['endReason']) {
    return { state: { ...state, phase: 'complete' as const, endReason }, event: { type: 'completed' as const, value: endReason } };
}

function resolveFatalFracture(state: RunState): { state: RunState; events: EventDraft[] } {
    if (state.fracture < 100) return { state, events: [] };
    if (stacks(state, 'second-light') && !state.secondLightUsed) {
        return {
            state: {
                ...state,
                fracture: 60,
                secondLightUsed: true,
                enemies: state.enemies.map((enemy) => ({ ...enemy, pressure: Math.max(0.02, enemy.pressure - 0.35) }))
            },
            events: [{ type: 'second-light', value: 60 }]
        };
    }
    const completed = completeState(state, 'fracture');
    return { state: completed.state, events: [completed.event] };
}

function scoreMultiplier(state: RunState, enemy: RunEnemy) {
    const baseCombo = Math.min(0.5, state.combo * 0.005);
    const echo = Math.min(0.15 * stacks(state, 'echo-lance'), state.combo * 0.0015 * stacks(state, 'echo-lance'));
    return (
        1 +
        baseCombo +
        echo +
        (accuracy(state) >= 96 ? stacks(state, 'clean-strike') * 0.08 : 0) +
        stacks(state, 'deep-breath') * 0.12 +
        stacks(state, 'velocity-glyph') * 0.12 +
        stacks(state, 'black-core-key') * 0.18 +
        (enemy.boss ? stacks(state, 'boss-glyph') * 0.3 : 0)
    );
}

function defeatEnemy(state: RunState, target: RunEnemy): { state: RunState; events: EventDraft[] } {
    const baseScore = target.boss ? 240 : 30 + target.word.length * 4;
    const score = state.score + Math.round(baseScore * scoreMultiplier(state, target));
    const focusBoost = target.word.split('').some((char) => state.focusChars.includes(char)) ? 1 + stacks(state, 'focus-glyph') * 0.2 : 1;
    const gainedXp = Math.round((target.boss ? 82 : 24 + target.word.length * 2) * focusBoost);
    const energy = clamp(
        state.energy + (target.boss ? 18 + stacks(state, 'boss-glyph') * 8 : 10 + stacks(state, 'resonance-loop') * 3),
        0,
        100
    );
    const remaining = state.enemies.filter((enemy) => enemy.id !== target.id);
    const arcTargets = [...remaining]
        .filter((enemy) => !enemy.boss)
        .sort((a, b) => b.pressure - a.pressure)
        .slice(0, stacks(state, 'prism-arc'))
        .map((enemy) => enemy.id);
    const enemies = remaining.map((enemy) => (arcTargets.includes(enemy.id) ? { ...enemy, pressure: Math.max(0.02, enemy.pressure - 0.06) } : enemy));
    return {
        state: {
            ...state,
            enemies,
            currentTargetId: state.currentTargetId === target.id ? null : state.currentTargetId,
            currentTargetHadError: state.currentTargetId === target.id ? false : state.currentTargetHadError,
            score,
            energy,
            xp: state.xp + gainedXp,
            counters: {
                ...state.counters,
                defeated: state.counters.defeated + 1,
                bosses: state.counters.bosses + (target.boss ? 1 : 0)
            },
            defeatedBossIds: target.boss ? [...new Set([...state.defeatedBossIds, target.archetypeId])] : state.defeatedBossIds
        },
        events: [{ type: 'defeated', enemyId: target.id, value: target.archetypeId }]
    };
}

function applySignalRay(state: RunState): { state: RunState; events: EventDraft[] } {
    const count = stacks(state, 'signal-ray');
    if (!count || state.counters.correct === 0 || state.counters.correct % 30 !== 0) return { state, events: [] };
    const targetIds = [...state.enemies]
        .filter((enemy) => !enemy.boss)
        .sort((a, b) => b.pressure - a.pressure)
        .slice(0, count)
        .map((enemy) => enemy.id);
    let next = state;
    const events: EventDraft[] = [];
    for (const id of targetIds) {
        const target = next.enemies.find((enemy) => enemy.id === id);
        if (!target) continue;
        if (target.hp <= 1) {
            const defeated = defeatEnemy(next, target);
            next = defeated.state;
            events.push(...defeated.events);
        } else {
            next = { ...next, enemies: next.enemies.map((enemy) => (enemy.id === id ? { ...enemy, hp: enemy.hp - 1, typed: '' } : enemy)) };
        }
    }
    return { state: next, events };
}

function maybeOpenUpgrade(state: RunState): { state: RunState; events: EventDraft[] } {
    if (state.phase !== 'running' || state.xp < state.nextUpgradeXp || state.upgradeChoices.length) return { state, events: [] };
    const choices = upgradeChoices(state);
    if (!choices.length) return { state, events: [] };
    return { state: { ...state, phase: 'upgrade', upgradeChoices: choices }, events: [{ type: 'upgrade-ready', value: state.level + 1 }] };
}

export function createRun(options: CreateRunOptions): RunState {
    const difficulty = options.mode === 'daily-rift' ? 'standard' : (options.difficulty ?? 'standard');
    return {
        contentVersion: CONTENT_VERSION,
        id: options.id,
        mode: options.mode,
        difficulty,
        phase: 'idle',
        seed: options.seed,
        elapsedMs: 0,
        durationMs: MODE_DURATION_MS[options.mode],
        areaIndex: 0,
        wave: 1,
        bossesSpawned: 0,
        spawnIndex: 0,
        spawnCooldownMs: 500,
        score: 0,
        combo: 0,
        maxCombo: 0,
        fracture: 0,
        energy: 0,
        xp: 0,
        level: 1,
        nextUpgradeXp: 80,
        currentTargetId: null,
        currentTargetHadError: false,
        focusChars: (options.focusChars ?? []).filter((char) => ACCEPTED_INPUT.test(char)).slice(0, 6),
        enemies: [],
        upgrades: [],
        upgradeChoices: [],
        counters: { ...EMPTY_COUNTERS },
        weakCounts: {},
        encounteredIds: [],
        defeatedBossIds: [],
        areaErrorBuffersUsed: 0,
        areaLeakMemoriesUsed: 0,
        secondLightUsed: false,
        lumenMilestone: 0,
        eventIndex: 0,
        endReason: null
    };
}

export function tickRun(state: RunState, deltaMs: number): { state: RunState; events: RunEvent[] } {
    if (state.phase !== 'running') return { state, events: [] };
    const base = state;
    const drafts: EventDraft[] = [];
    const safeDelta = clamp(deltaMs, 0, 50);
    const elapsedMs = Math.min(state.durationMs, state.elapsedMs + safeDelta);
    const previousArea = state.areaIndex;
    const areaIndex = Math.min(AREAS.length - 1, Math.floor((elapsedMs / state.durationMs) * AREAS.length));
    const wave = Math.min(3, Math.floor((((elapsedMs / state.durationMs) * AREAS.length) % 1) * 3) + 1);
    const globalSpeed = DIFFICULTY_SPEED[state.difficulty] * (1 + stacks(state, 'velocity-glyph') * 0.04 + stacks(state, 'black-core-key') * 0.05);
    let enemies = state.enemies.map((enemy) => {
        const lockSlow = enemy.id === state.currentTargetId ? Math.max(0.5, 1 - stacks(state, 'mirror-glyph') * 0.1) : 1;
        return { ...enemy, pressure: enemy.pressure + enemy.speed * safeDelta * globalSpeed * lockSlow };
    });
    const leaking = enemies.filter((enemy) => enemy.pressure >= 1);
    enemies = enemies.filter((enemy) => enemy.pressure < 1);
    const softLanding = stacks(state, 'soft-landing') * 2;
    const leakPenalty = leaking.reduce((total, enemy) => total + Math.max(1, (enemy.boss ? 30 : 14) - softLanding), 0);
    const memoriesAvailable = Math.max(0, stacks(state, 'glass-memory') - state.areaLeakMemoriesUsed);
    const preservedLeaks = Math.min(leaking.length, memoriesAvailable);
    drafts.push(...leaking.map((enemy) => ({ type: 'leaked' as const, enemyId: enemy.id })));
    let next: RunState = {
        ...state,
        elapsedMs,
        areaIndex,
        wave,
        enemies,
        fracture: clamp(state.fracture + leakPenalty, 0, 100),
        combo: leaking.length > preservedLeaks ? 0 : state.combo,
        currentTargetId: enemies.some((enemy) => enemy.id === state.currentTargetId) ? state.currentTargetId : null,
        currentTargetHadError: enemies.some((enemy) => enemy.id === state.currentTargetId) ? state.currentTargetHadError : false,
        spawnCooldownMs: state.spawnCooldownMs - safeDelta,
        areaLeakMemoriesUsed: state.areaLeakMemoriesUsed + preservedLeaks
    };

    const fracture = resolveFatalFracture(next);
    next = fracture.state;
    drafts.push(...fracture.events);
    if (next.phase === 'complete') return withEvents(base, next, drafts);
    if (elapsedMs >= state.durationMs) {
        const completed = completeState(next, state.mode === 'expedition' || state.mode === 'first-rift' ? 'victory' : 'timeout');
        return withEvents(base, completed.state, [...drafts, completed.event]);
    }

    if (areaIndex !== previousArea) {
        drafts.push({ type: 'area-changed', value: AREAS[areaIndex]?.id ?? AREAS[0].id });
        next = { ...next, areaErrorBuffersUsed: 0, areaLeakMemoriesUsed: 0, currentTargetHadError: false };
    }

    const areaEnd = ((areaIndex + 1) / AREAS.length) * state.durationMs;
    const bossDue = elapsedMs >= areaEnd - 22_000 && next.bossesSpawned <= areaIndex && !next.enemies.some((enemy) => enemy.boss);
    const activeCap = 4 + areaIndex + stacks(state, 'deep-breath');
    if (bossDue || (next.spawnCooldownMs <= 0 && next.enemies.length < activeCap)) {
        const enemy = spawnEnemy(next, bossDue);
        drafts.push({ type: 'spawned', enemyId: enemy.id, value: enemy.archetypeId });
        next = {
            ...next,
            enemies: [...next.enemies, enemy],
            encounteredIds: [...new Set([...next.encounteredIds, enemy.archetypeId])],
            spawnIndex: next.spawnIndex + 1,
            bossesSpawned: next.bossesSpawned + (bossDue ? 1 : 0),
            spawnCooldownMs: bossDue ? 3_000 : Math.max(850, 2_100 - (elapsedMs / state.durationMs) * 900)
        };
    }
    return withEvents(base, next, drafts);
}

function applyTypedCharacter(state: RunState, rawChar: string): { state: RunState; events: RunEvent[] } {
    if (state.phase !== 'running' || state.upgradeChoices.length) return { state, events: [] };
    const char = rawChar.toLowerCase();
    if (!ACCEPTED_INPUT.test(char)) return { state, events: [] };
    const base = state;
    const drafts: EventDraft[] = [];
    const active = state.currentTargetId ? state.enemies.find((enemy) => enemy.id === state.currentTargetId) : null;
    const target = active ?? [...state.enemies].filter((enemy) => enemy.word.startsWith(char)).sort((a, b) => b.pressure - a.pressure)[0];
    const expected = target?.word[target.typed.length];
    if (!target || expected !== char) {
        const bufferAvailable = state.areaErrorBuffersUsed < stacks(state, 'calm-buffer');
        let next: RunState = {
            ...state,
            currentTargetId: target?.id ?? state.currentTargetId,
            currentTargetHadError: Boolean(target),
            counters: {
                ...state.counters,
                typed: state.counters.typed + 1,
                errors: state.counters.errors + 1,
                cleanStreak: 0
            },
            combo: bufferAvailable ? state.combo : 0,
            fracture: clamp(state.fracture + (bufferAvailable ? 0 : 5), 0, 100),
            weakCounts: { ...state.weakCounts, [expected ?? char]: (state.weakCounts[expected ?? char] ?? 0) + 1 },
            areaErrorBuffersUsed: state.areaErrorBuffersUsed + (bufferAvailable ? 1 : 0)
        };
        drafts.push({ type: 'error', enemyId: target?.id, value: expected ?? char });
        const fatal = resolveFatalFracture(next);
        next = fatal.state;
        drafts.push(...fatal.events);
        return withEvents(base, next, drafts);
    }

    const numberBonus = /[0-9]/.test(char) ? stacks(state, 'number-glyph') : 0;
    const punctuationBonus = /[?!-]/.test(char) ? stacks(state, 'punctuation-glyph') : 0;
    const cleanStreak = state.counters.cleanStreak + 1;
    const steadyHeal = cleanStreak % 25 === 0 ? stacks(state, 'steady-heart') * 2 : 0;
    const combo = state.combo + 1 + numberBonus;
    let next: RunState = {
        ...state,
        currentTargetId: target.id,
        combo,
        maxCombo: Math.max(state.maxCombo, combo),
        score: state.score + 1,
        energy: clamp(state.energy + 2 + numberBonus, 0, 100),
        fracture: Math.max(0, state.fracture - steadyHeal - punctuationBonus),
        counters: {
            ...state.counters,
            typed: state.counters.typed + 1,
            correct: state.counters.correct + 1,
            cleanStreak
        },
        enemies: state.enemies.map((enemy) => (enemy.id === target.id ? { ...enemy, typed: enemy.typed + char } : enemy))
    };
    drafts.push({ type: 'typed', enemyId: target.id, value: char });

    const updatedTarget = next.enemies.find((enemy) => enemy.id === target.id)!;
    if (updatedTarget.typed.length === updatedTarget.word.length) {
        next = { ...next, energy: clamp(next.energy + (state.currentTargetHadError ? 0 : stacks(state, 'quiet-blade') * 3), 0, 100) };
        if (updatedTarget.hp <= 1) {
            const defeated = defeatEnemy(next, updatedTarget);
            next = defeated.state;
            drafts.push(...defeated.events);
        } else {
            next = {
                ...next,
                currentTargetHadError: false,
                enemies: next.enemies.map((enemy) => (enemy.id === updatedTarget.id ? { ...enemy, hp: enemy.hp - 1, typed: '' } : enemy))
            };
        }
    }

    const signal = applySignalRay(next);
    next = signal.state;
    drafts.push(...signal.events);
    const milestone = Math.floor(next.combo / 50);
    if (stacks(next, 'lumen-cascade') && milestone > next.lumenMilestone) {
        next = {
            ...next,
            fracture: Math.max(0, next.fracture - 12),
            enemies: next.enemies.map((enemy) => ({ ...enemy, pressure: Math.max(0.02, enemy.pressure - 0.2) }))
        };
        drafts.push({ type: 'lumen-cascade', value: milestone });
    }
    next = { ...next, lumenMilestone: milestone };
    const upgrade = maybeOpenUpgrade(next);
    next = upgrade.state;
    drafts.push(...upgrade.events);
    return withEvents(base, next, drafts);
}

export function dispatchRun(state: RunState, command: RunCommand): { state: RunState; events: RunEvent[] } {
    const base = state;
    if (command.type === 'start' && state.phase === 'idle') return withEvents(base, { ...state, phase: 'running' }, [{ type: 'started' }]);
    if (command.type === 'pause' && state.phase === 'running') return withEvents(base, { ...state, phase: 'paused' }, [{ type: 'paused' }]);
    if (command.type === 'resume' && state.phase === 'paused') return withEvents(base, { ...state, phase: 'running' }, [{ type: 'resumed' }]);
    if (command.type === 'type') return applyTypedCharacter(state, command.char);
    if (command.type === 'extract' && state.phase === 'running' && state.areaIndex > 0) {
        const completed = completeState(state, 'extracted');
        return withEvents(base, completed.state, [completed.event]);
    }
    if (command.type === 'surge' && state.phase === 'running' && state.energy >= 100) {
        const nonBoss = state.enemies.filter((enemy) => !enemy.boss);
        const bossDamage = 2 + stacks(state, 'terminal-wave');
        const enemies = state.enemies.flatMap((enemy) =>
            enemy.boss ? [{ ...enemy, hp: Math.max(1, enemy.hp - bossDamage), typed: '' }] : []
        );
        const next: RunState = {
            ...state,
            enemies,
            currentTargetId: enemies.some((enemy) => enemy.id === state.currentTargetId) ? state.currentTargetId : null,
            currentTargetHadError: false,
            energy: 0,
            fracture: Math.max(0, state.fracture - 15),
            score: state.score + nonBoss.length * 20,
            counters: { ...state.counters, defeated: state.counters.defeated + nonBoss.length }
        };
        return withEvents(base, next, [{ type: 'surge', value: nonBoss.length }]);
    }
    if (command.type === 'choose-upgrade' && state.phase === 'upgrade') {
        const selected = state.upgradeChoices.find((item) => item.id === command.upgradeId);
        if (!selected) return { state, events: [] };
        const existing = state.upgrades.find((item) => item.id === selected.id);
        const nextStack = (existing?.stack ?? 0) + 1;
        if (nextStack > selected.maxStacks) return { state, events: [] };
        const upgrades = existing
            ? state.upgrades.map((item) => (item.id === selected.id ? { ...item, stack: nextStack } : item))
            : [...state.upgrades, { ...selected, stack: nextStack }];
        const provisional = { ...state, upgrades };
        const orbit = stacks(provisional, 'orbit-burst');
        const fractureGlyph = stacks(provisional, 'fracture-glyph');
        const next: RunState = {
            ...state,
            phase: 'running',
            upgrades,
            upgradeChoices: [],
            level: state.level + 1,
            xp: Math.max(0, state.xp - state.nextUpgradeXp),
            nextUpgradeXp: Math.round(state.nextUpgradeXp * 1.35),
            energy: clamp(state.energy + orbit * 10, 0, 100),
            fracture: Math.max(0, state.fracture - fractureGlyph * 8),
            enemies: state.enemies.map((enemy) => ({ ...enemy, pressure: Math.max(0.02, enemy.pressure - orbit * 0.12) })),
            lumenMilestone: Math.floor(state.combo / 50)
        };
        return withEvents(base, next, [{ type: 'upgrade-chosen', value: selected.id }]);
    }
    return { state, events: [] };
}

export function buildRunSnapshot(state: RunState): RunSnapshot {
    const minutes = Math.max(state.elapsedMs / 60_000, 1 / 60);
    return {
        contentVersion: state.contentVersion,
        id: state.id,
        mode: state.mode,
        difficulty: state.difficulty,
        phase: state.phase,
        elapsedMs: state.elapsedMs,
        durationMs: state.durationMs,
        areaIndex: state.areaIndex,
        areaId: AREAS[state.areaIndex]?.id ?? AREAS[0].id,
        wave: state.wave,
        score: state.score,
        combo: state.combo,
        fracture: state.fracture,
        energy: state.energy,
        level: state.level,
        xp: state.xp,
        nextUpgradeXp: state.nextUpgradeXp,
        enemies: state.enemies.map((enemy) => ({ ...enemy })),
        upgrades: state.upgrades.map((item) => ({ ...item })),
        upgradeChoices: state.upgradeChoices.map((item) => ({ ...item })),
        endReason: state.endReason,
        accuracy: state.counters.typed ? Math.round((state.counters.correct / state.counters.typed) * 1000) / 10 : 100,
        wpm: Math.round((state.counters.correct / 5 / minutes) * 10) / 10
    };
}

export function buildRunResult(state: RunState): RunResult {
    const snapshot = buildRunSnapshot(state);
    const weakChars = Object.entries(state.weakCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([char]) => char);
    return {
        contentVersion: CONTENT_VERSION,
        runId: state.id,
        mode: state.mode,
        difficulty: state.difficulty,
        seed: state.seed,
        score: state.score,
        accuracy: snapshot.accuracy,
        wpm: snapshot.wpm,
        maxCombo: state.maxCombo,
        durationMs: state.elapsedMs,
        areaIndex: state.areaIndex,
        endReason: state.endReason ?? 'timeout',
        defeated: state.counters.defeated,
        bosses: state.counters.bosses,
        weakChars,
        upgradeIds: state.upgrades.flatMap((item) => Array.from({ length: item.stack }, () => item.id)),
        encounteredIds: [...state.encounteredIds],
        defeatedBossIds: [...state.defeatedBossIds]
    };
}

export function replayRun(log: ReplayLog, id = 'replayed-run'): RunResult {
    let state = createRun({ id, mode: log.mode, difficulty: log.difficulty, seed: log.seed, focusChars: log.focusChars });
    let cursor = 0;
    const entries = [...log.entries].sort((a, b) => a.atMs - b.atMs);
    for (const entry of entries) {
        const target = Math.min(log.endedAtMs, Math.max(cursor, entry.atMs));
        while (cursor < target && state.phase === 'running') {
            const delta = Math.min(50, target - cursor);
            state = tickRun(state, delta).state;
            cursor += delta;
        }
        cursor = target;
        state = dispatchRun(state, entry.command).state;
        if (state.phase === 'complete') break;
    }
    const end = Math.min(log.endedAtMs, state.durationMs);
    while (cursor < end && state.phase === 'running') {
        const delta = Math.min(50, end - cursor);
        state = tickRun(state, delta).state;
        cursor += delta;
    }
    return buildRunResult(state);
}

export function hashRunResult(result: RunResult): string {
    const canonical = JSON.stringify(result);
    let hash = 2166136261;
    for (let index = 0; index < canonical.length; index += 1) {
        hash ^= canonical.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}
