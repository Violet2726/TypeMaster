import { AREAS, GAME_PHASES, getGameCopy } from './content.js';
import { getUpgradeEffects } from './upgrades.js';
import { finishRun } from './scoring.js';
import { buildSpawnProfile, generateBoss, generateEnemy, getAreaIndex } from './spawning.js';
import { clamp, seededRandom } from './rng.js';

function moveEnemies(state, deltaTime) {
    const effects = getUpgradeEffects(state.upgrades);
    const confuseSlow = effects.confuseSlow || 0;
    return state.enemies.map((enemy) => {
        if (!enemy.alive) return enemy;
        const roleSlow = enemy.role === 'confuse' || enemy.role === 'decoy' ? 1 - confuseSlow : 1;
        return { ...enemy, y: enemy.y + enemy.speed * deltaTime * roleSlow };
    });
}

function updateArea(state) {
    const areaIndex = getAreaIndex(state);
    if (areaIndex === state.areaIndex) return { state, events: [] };
    const area = AREAS[areaIndex] || AREAS[0];
    return {
        state: {
            ...state,
            areaIndex,
            area,
            depth: areaIndex + 1,
            areaErrorBuffer: {},
            liveMessage: area.nameZh || area.name
        },
        events: [{ type: 'area_changed', area }]
    };
}

function handleLeaks(state) {
    const leaking = state.enemies.filter((enemy) => enemy.alive && !enemy.leaked && enemy.y >= 1.02);
    if (!leaking.length) return { state, events: [] };

    const effects = getUpgradeEffects(state.upgrades);
    let lives = state.lives - leaking.length;
    let lastStandTriggered = false;
    if (lives <= 0 && effects.lastStand && !state.lastStandUsed) {
        lives = 1;
        lastStandTriggered = true;
    }

    const errorCounts = { ...state.errorCounts };
    leaking.forEach((enemy) => {
        const missed = enemy.word[enemy.typed.length] || enemy.word[0];
        errorCounts[missed] = (errorCounts[missed] || 0) + 1;
    });

    const nextState = {
        ...state,
        lives,
        enemies: state.enemies.map((enemy) => (
            lastStandTriggered && enemy.alive
                ? { ...enemy, alive: false, leaked: true }
                : leaking.some((item) => item.id === enemy.id)
                    ? { ...enemy, alive: false, leaked: true }
                    : enemy
        )),
        combo: 0,
        heat: clamp(state.heat + leaking.length * 9, 0, 100),
        counters: { ...state.counters, leaked: state.counters.leaked + leaking.length },
        errorCounts,
        lastStandUsed: state.lastStandUsed || lastStandTriggered,
        liveMessage: lives > 0 ? getGameCopy(state.language).linePressure : getGameCopy(state.language).defeated
    };

    if (lives <= 0) {
        return {
            state: finishRun(nextState, 'defeat'),
            events: [{ type: 'enemy_leaked', count: leaking.length }, { type: 'game_ended', endReason: 'defeat' }]
        };
    }

    return { state: nextState, events: [{ type: 'enemy_leaked', count: leaking.length }] };
}

function spawnEnemies(state, deltaTime) {
    const events = [];
    let nextState = state;
    const profile = buildSpawnProfile(nextState);
    const aliveCount = nextState.enemies.filter((enemy) => enemy.alive && !enemy.leaked).length;

    if (profile.bossDue) {
        const boss = generateBoss(nextState);
        nextState = {
            ...nextState,
            enemies: [...nextState.enemies, boss],
            bossSpawnedAreas: [...nextState.bossSpawnedAreas, nextState.area.id],
            spawnIndex: nextState.spawnIndex + 1,
            codexSeen: { ...nextState.codexSeen, [boss.bossId]: true },
            liveMessage: boss.labelZh || boss.label
        };
        events.push({ type: 'boss_spawned', enemy: boss });
    }

    let spawnTimer = nextState.spawnTimer - deltaTime;
    let count = aliveCount;
    while (spawnTimer <= 0 && count < profile.activeCap && !nextState.upgradeChoices?.length) {
        const enemy = generateEnemy(nextState);
        const rng = seededRandom(nextState.seed, `interval-${nextState.spawnIndex}`);
        nextState = {
            ...nextState,
            enemies: [...nextState.enemies, enemy],
            spawnIndex: nextState.spawnIndex + 1,
            codexSeen: { ...nextState.codexSeen, [enemy.archetype || enemy.type]: true }
        };
        events.push({ type: 'enemy_spawned', enemy });
        count += 1;
        spawnTimer += profile.spawnInterval * (0.86 + rng() * 0.28);
    }

    return { state: { ...nextState, spawnTimer }, events };
}

export function updateGameState(state, deltaTime) {
    if (state.phase !== GAME_PHASES.playing) return { state, events: [] };
    if (state.upgradeChoices?.length) return { state, events: [] };

    let nextState = {
        ...state,
        elapsed: state.elapsed + Math.max(0, deltaTime),
        enemies: moveEnemies(state, deltaTime),
        heat: clamp(state.heat + deltaTime * 0.28, 0, 100)
    };
    let events = [];

    if (nextState.elapsed >= nextState.durationSeconds) {
        const endReason = nextState.mode === 'expedition' && nextState.bossDefeated.includes('terminal-eclipse')
            ? 'victory'
            : 'extract';
        return { state: finishRun(nextState, endReason, 'timer'), events: [{ type: 'game_ended', endReason }] };
    }

    const areaUpdate = updateArea(nextState);
    nextState = areaUpdate.state;
    events = [...events, ...areaUpdate.events];

    const leakUpdate = handleLeaks(nextState);
    nextState = leakUpdate.state;
    events = [...events, ...leakUpdate.events];
    if (nextState.phase === GAME_PHASES.gameover) return { state: nextState, events };

    const spawnUpdate = spawnEnemies(nextState, deltaTime);
    nextState = spawnUpdate.state;
    events = [...events, ...spawnUpdate.events];

    return { state: nextState, events };
}

