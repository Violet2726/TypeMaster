import { AREAS, GAME_PHASES } from './content.js';
import { buildSpawnProfile } from './spawning.js';
import { buildGameResult, isExtractAvailable } from './scoring.js';
import { serializeUpgrades } from './upgrades.js';

function activeEnemies(state) {
    return (state.enemies || []).filter((enemy) => enemy.alive && !enemy.leaked);
}

function currentTargetFrom(state, enemies) {
    return enemies.find((enemy) => enemy.id === state.currentTargetId)
        || enemies.find((enemy) => enemy.typed)
        || enemies[0]
        || null;
}

export function buildGameSnapshot(state) {
    const enemies = activeEnemies(state);
    const target = currentTargetFrom(state, enemies);
    const area = AREAS[state.areaIndex] || AREAS[0];
    const result = buildGameResult(state);
    const profile = buildSpawnProfile(state);
    const progress = state.durationSeconds > 0 ? state.elapsed / state.durationSeconds : 0;

    return {
        version: state.version,
        phase: state.phase,
        mode: state.mode,
        anomaly: state.anomaly,
        area,
        hud: {
            score: Math.round(state.score || 0),
            areaIndex: state.areaIndex,
            areaName: area.name,
            areaNameZh: area.nameZh,
            depth: state.depth,
            combo: state.combo || 0,
            maxCombo: state.maxCombo || 0,
            lives: state.lives || 0,
            maxLives: state.maxLives || 5,
            heat: Math.round(state.heat || 0),
            energy: Math.round(state.energy || 0),
            level: state.level || 1,
            xp: state.xp || 0,
            nextUpgradeXp: state.nextUpgradeXp || 1,
            accuracy: result.accuracy,
            wpm: result.wpm,
            targetWord: target?.word || '',
            targetTyped: target?.typed || '',
            progress,
            elapsedSeconds: Math.round(state.elapsed || 0),
            durationSeconds: state.durationSeconds,
            extractAvailable: isExtractAvailable(state),
            upgradeCount: state.upgrades?.length || 0
        },
        arena: {
            safeLineY: 1.02,
            feedback: state.feedback,
            profile,
            enemies: enemies.map((enemy) => ({
                id: enemy.id,
                type: enemy.type,
                archetype: enemy.archetype,
                label: enemy.label,
                labelZh: enemy.labelZh,
                role: enemy.role,
                color: enemy.color,
                word: enemy.word,
                typed: enemy.typed,
                xRatio: enemy.xRatio,
                y: enemy.y,
                hp: enemy.hp,
                maxHp: enemy.maxHp,
                shield: enemy.shield,
                isTarget: enemy.id === target?.id,
                elite: enemy.elite,
                boss: enemy.boss,
                bossId: enemy.bossId
            }))
        },
        upgradeChoices: state.upgradeChoices || [],
        activeUpgrades: serializeUpgrades(state.upgrades),
        codexProgress: result.codexProgress,
        overlay: state.phase === GAME_PHASES.gameover
            ? { type: 'result', result, isVictory: result.endReason === 'victory' || result.endReason === 'extract' }
            : state.phase === GAME_PHASES.idle
                ? { type: 'mode-select' }
                : state.upgradeChoices?.length
                    ? { type: 'upgrade-choice', choices: state.upgradeChoices }
                    : null,
        liveMessage: state.liveMessage || ''
    };
}

