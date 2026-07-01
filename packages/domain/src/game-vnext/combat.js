import { GAME_PHASES, getGameCopy } from './content.js';
import { getUpgradeEffects, generateUpgradeChoices } from './upgrades.js';
import { clamp } from './rng.js';

function activeEnemies(state) {
    return state.enemies.filter((enemy) => enemy.alive && !enemy.leaked);
}

function findTarget(state, char) {
    const enemies = activeEnemies(state);
    const current = enemies.find((enemy) => enemy.id === state.currentTargetId);
    if (current && current.word[current.typed.length]?.toLowerCase() === char) return current;
    return enemies.find((enemy) => enemy.word[enemy.typed.length]?.toLowerCase() === char) || current || null;
}

function addError(state, key) {
    const effects = getUpgradeEffects(state.upgrades);
    const bufferKey = `area-${state.area.id}`;
    const canBuffer = effects.errorBuffer && !state.areaErrorBuffer[bufferKey];
    const errorCounts = { ...state.errorCounts, [key]: (state.errorCounts[key] || 0) + 1 };
    return {
        ...state,
        heat: clamp(state.heat + (canBuffer ? 1 : 6), 0, 100),
        combo: canBuffer ? state.combo : 0,
        areaErrorBuffer: canBuffer ? { ...state.areaErrorBuffer, [bufferKey]: true } : state.areaErrorBuffer,
        errorCounts,
        counters: { ...state.counters, typed: state.counters.typed + 1, errors: state.counters.errors + 1 }
    };
}

function maybeLevelUp(state) {
    if (state.xp < state.nextUpgradeXp || state.upgradeChoices?.length) return { state, events: [] };
    return {
        state: {
            ...state,
            level: state.level + 1,
            xp: state.xp - state.nextUpgradeXp,
            nextUpgradeXp: Math.round(state.nextUpgradeXp * 1.22 + 24),
            upgradeChoices: generateUpgradeChoices(state),
            liveMessage: getGameCopy(state.language).upgradeReady
        },
        events: [{ type: 'upgrade_ready', level: state.level + 1 }]
    };
}

function defeatEnemy(state, enemy) {
    const effects = getUpgradeEffects(state.upgrades);
    const typed = Math.max(1, state.counters.typed);
    const accuracy = state.counters.correct / typed;
    const heatBonus = (effects.heatScore || 0) * state.heat;
    const scoreMultiplier = 1
        + (effects.scoreMultiplier || 0)
        + (state.anomaly?.scoreMultiplier ? state.anomaly.scoreMultiplier - 1 : 0)
        + (accuracy >= 0.96 ? (effects.accuracyScore || 0) : 0)
        + heatBonus
        + (enemy.boss ? (effects.bossScore || 0) : 0);
    const comboBonus = 1 + Math.min(1.5, state.combo * 0.012 + (effects.comboScore || 0));
    const scoreGain = Math.round(enemy.score * scoreMultiplier * comboBonus);
    const xpGain = Math.round((enemy.boss ? 82 : enemy.elite ? 36 : 18) * (1 + (effects.focusXp || 0)));
    const codexSeen = { ...state.codexSeen, [enemy.archetype || enemy.type]: true };
    const bossDefeated = enemy.boss ? [...state.bossDefeated, enemy.bossId] : state.bossDefeated;
    const nextCounters = {
        ...state.counters,
        kills: state.counters.kills + 1,
        elites: state.counters.elites + (enemy.elite && !enemy.boss ? 1 : 0),
        bosses: state.counters.bosses + (enemy.boss ? 1 : 0)
    };

    let nextState = {
        ...state,
        enemies: state.enemies.map((item) => item.id === enemy.id ? { ...item, alive: false, typed: item.word } : item),
        currentTargetId: null,
        score: state.score + scoreGain,
        combo: state.combo + 1,
        maxCombo: Math.max(state.maxCombo, state.combo + 1),
        energy: clamp(state.energy + (enemy.boss ? 18 : enemy.elite ? 10 : 5), 0, 100),
        xp: state.xp + xpGain,
        heat: clamp(state.heat - (enemy.boss ? 12 : 2), 0, 100),
        counters: nextCounters,
        codexSeen,
        bossDefeated,
        feedback: { kind: enemy.boss ? 'boss' : 'kill', enemyId: enemy.id, at: state.elapsed }
    };

    const levelResult = maybeLevelUp(nextState);
    return {
        state: levelResult.state,
        events: [
            { type: enemy.boss ? 'boss_defeated' : 'enemy_defeated', enemyId: enemy.id, enemyType: enemy.type, scoreGain },
            ...levelResult.events
        ]
    };
}

function completeTargetSegment(state, target) {
    const copy = getGameCopy(state.language);

    if (target.shield > 0) {
        return {
            state: {
                ...state,
                enemies: state.enemies.map((enemy) => enemy.id === target.id ? { ...enemy, typed: '', shield: enemy.shield - 1 } : enemy),
                feedback: { kind: 'shield', enemyId: target.id, at: state.elapsed },
                liveMessage: copy.shieldBroken
            },
            events: [{ type: 'enemy_shield_broken', enemyId: target.id }]
        };
    }

    const nextHp = target.hp - 1 - (target.boss && getUpgradeEffects(state.upgrades).bossDamage ? 1 : 0);
    if (nextHp <= 0) return defeatEnemy(state, target);

    return {
        state: {
            ...state,
            enemies: state.enemies.map((enemy) => enemy.id === target.id ? { ...enemy, typed: '', hp: nextHp, phase: enemy.boss ? enemy.phase + 1 : enemy.phase } : enemy),
            feedback: { kind: target.boss ? 'boss_phase' : 'segment', enemyId: target.id, at: state.elapsed }
        },
        events: [{ type: target.boss ? 'boss_phase' : 'enemy_segment', enemyId: target.id, hp: nextHp }]
    };
}

export function processGameInput(state, rawChar) {
    if (state.phase !== GAME_PHASES.playing || state.upgradeChoices?.length) return { state, events: [] };
    const char = String(rawChar || '').slice(-1).toLowerCase();
    if (!char) return { state, events: [] };
    const copy = getGameCopy(state.language);
    const target = findTarget(state, char);

    if (!target) {
        const errored = addError(state, char);
        return {
            state: { ...errored, liveMessage: copy.miss, feedback: { kind: 'error', at: state.elapsed } },
            events: [{ type: 'char_error', char }]
        };
    }

    const expected = target.word[target.typed.length]?.toLowerCase();
    if (char !== expected) {
        const errored = addError(state, expected || char);
        return {
            state: { ...errored, currentTargetId: target.id, liveMessage: copy.error.replace('{expected}', expected || '') },
            events: [{ type: 'char_error', enemyId: target.id, char, expected }]
        };
    }

    const typed = `${target.typed}${char}`;
    const nextCounters = { ...state.counters, typed: state.counters.typed + 1, correct: state.counters.correct + 1 };
    const nextState = {
        ...state,
        enemies: state.enemies.map((enemy) => enemy.id === target.id ? { ...enemy, typed } : enemy),
        currentTargetId: target.id,
        counters: nextCounters,
        liveMessage: target.word.slice(typed.length) || copy.hit
    };
    const nextTarget = { ...target, typed };

    if (typed.length >= target.word.length) {
        const result = completeTargetSegment(nextState, nextTarget);
        return { state: result.state, events: [{ type: 'char_correct', enemyId: target.id, char }, ...result.events] };
    }

    return { state: nextState, events: [{ type: 'char_correct', enemyId: target.id, char }] };
}

export function activateSurge(state) {
    if (state.phase !== GAME_PHASES.playing || state.upgradeChoices?.length) return { state, events: [] };

    const copy = getGameCopy(state.language);
    if ((state.energy || 0) < 100) {
        return {
            state: { ...state, liveMessage: copy.surgeCharging },
            events: [{ type: 'surge_not_ready' }]
        };
    }

    const enemies = activeEnemies(state);
    const boss = enemies.find((enemy) => enemy.boss);
    const clearTargets = enemies
        .filter((enemy) => !enemy.boss)
        .sort((a, b) => b.y - a.y)
        .slice(0, 4);
    let nextState = {
        ...state,
        energy: 0,
        heat: clamp(state.heat - 18, 0, 100),
        combo: state.combo + (clearTargets.length ? 2 : 0),
        maxCombo: Math.max(state.maxCombo, state.combo + (clearTargets.length ? 2 : 0)),
        liveMessage: copy.surgeOnline,
        feedback: { kind: 'surge', at: state.elapsed }
    };
    let events = [{ type: 'surge_activated', count: clearTargets.length + (boss ? 1 : 0) }];

    if (boss) {
        if (boss.hp <= 2) {
            const result = defeatEnemy(nextState, boss);
            nextState = result.state;
            events = [...events, ...result.events];
        } else {
            nextState = {
                ...nextState,
                enemies: nextState.enemies.map((enemy) => (
                    enemy.id === boss.id
                        ? { ...enemy, hp: enemy.hp - 2, phase: (enemy.phase || 1) + 1 }
                        : enemy
                )),
                feedback: { kind: 'boss_phase', enemyId: boss.id, at: state.elapsed }
            };
            events.push({ type: 'boss_phase', enemyId: boss.id, hp: boss.hp - 2 });
        }
    }

    clearTargets.forEach((target) => {
        const current = nextState.enemies.find((enemy) => enemy.id === target.id && enemy.alive);
        if (!current) return;
        const result = defeatEnemy(nextState, current);
        nextState = result.state;
        events = [...events, ...result.events];
    });

    return { state: { ...nextState, energy: 0 }, events };
}
