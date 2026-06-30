import { AREAS, GAME_PHASES, getGameCopy } from './content.js';
import { getUpgradeEffects, serializeUpgrades } from './upgrades.js';
import { clamp } from './rng.js';

export function isExtractAvailable(state) {
    if (state.mode === 'first-descent') return state.elapsed >= state.durationSeconds;
    return state.areaIndex > 0 && !state.enemies.some((enemy) => enemy.alive && enemy.boss);
}

export function finishRun(state, endReason, extractReason = null) {
    const effects = getUpgradeEffects(state.upgrades);
    const copy = getGameCopy(state.language);
    const perfect = (state.counters.leaked || 0) === 0;
    const extractBonus = endReason === 'extract'
        ? Math.round(state.score * ((effects.extractScore || 0) + (perfect ? 0.15 : 0)))
        : 0;
    const victoryBonus = endReason === 'victory' ? 1000 + state.bossDefeated.length * 180 : 0;

    return {
        ...state,
        phase: GAME_PHASES.gameover,
        endedAt: state.elapsed,
        endReason,
        extractReason,
        score: state.score + extractBonus + victoryBonus,
        liveMessage: endReason === 'victory' ? copy.victory : endReason === 'extract' ? copy.extracted : copy.defeated
    };
}

export function buildGameResult(state) {
    const durationSeconds = Math.max(0, Math.round(state.endedAt ?? state.elapsed ?? 0));
    const typed = state.counters?.typed || 0;
    const correct = state.counters?.correct || 0;
    const accuracy = typed ? Math.round((correct / typed) * 100) : 100;
    const wpm = durationSeconds > 0 ? Math.round((correct / 5) / (durationSeconds / 60)) : 0;
    const weakestChars = Object.entries(state.errorCounts || {})
        .sort((a, b) => b[1] - a[1])
        .map(([label]) => label)
        .slice(0, 5);
    const area = AREAS[state.areaIndex] || AREAS[0];

    return {
        version: state.version,
        mode: state.mode,
        score: Math.round(state.score || 0),
        wpm,
        accuracy,
        maxCombo: state.maxCombo || 0,
        areaIndex: state.areaIndex || 0,
        areaId: area.id,
        areaName: area.name,
        areaNameZh: area.nameZh,
        depth: state.depth || 1,
        durationSeconds,
        enemiesDefeated: state.counters?.kills || 0,
        eliteDefeated: state.counters?.elites || 0,
        bossesDefeated: state.counters?.bosses || 0,
        enemiesLeaked: state.counters?.leaked || 0,
        totalCharsTyped: typed,
        totalCharsCorrect: correct,
        focusChars: state.focusChars || [],
        weakestChars,
        endReason: state.endReason || null,
        extractReason: state.extractReason || null,
        upgradeBuild: serializeUpgrades(state.upgrades),
        anomalyId: state.anomaly?.id || null,
        anomaly: state.anomaly || null,
        livesRemaining: state.lives || 0,
        heat: Math.round(clamp(state.heat || 0, 0, 100)),
        codexProgress: buildGameCodexProgress(state),
        recommendation: weakestChars.length
            ? `下一局优先处理 ${weakestChars.slice(0, 3).join(' / ')}`
            : '保持节奏，尝试更高热度构筑。'
    };
}

export function buildGameCodexProgress(state) {
    const seen = state.codexSeen || {};
    const enemyEntries = Object.keys(seen).map((id) => ({ id, discovered: true }));
    return {
        discovered: enemyEntries.length + (state.bossDefeated?.length || 0),
        total: 12 + 5 + 16,
        enemies: enemyEntries,
        bosses: (state.bossDefeated || []).map((id) => ({ id, discovered: true, defeated: true })),
        upgrades: serializeUpgrades(state.upgrades).map((upgrade) => ({ ...upgrade, discovered: true }))
    };
}

export function buildGameCodexFromSessions(sessions = []) {
    const safeSessions = Array.isArray(sessions) ? sessions : [];
    const gameSessions = safeSessions.filter((session) => (
        session?.kind === 'game'
        || session?.trainingMeta?.type === 'game'
        || session?.gameMeta?.version === 'typerift-v1'
    ));
    const discovered = new Set();
    const bosses = new Set();
    const upgrades = new Map();

    gameSessions.forEach((session) => {
        const codex = session?.gameMeta?.codexProgress || {};
        (codex.enemies || []).forEach((entry) => discovered.add(entry.id));
        (codex.bosses || []).forEach((entry) => bosses.add(entry.id));
        (session?.gameMeta?.upgradeBuild || session?.trainingMeta?.upgradeBuild || []).forEach((upgrade) => {
            upgrades.set(upgrade.id, { ...upgrade, discovered: true });
        });
    });

    return {
        discovered: discovered.size + bosses.size + upgrades.size,
        total: 12 + 5 + 16,
        enemies: [...discovered].map((id) => ({ id, discovered: true })),
        bosses: [...bosses].map((id) => ({ id, discovered: true, defeated: true })),
        upgrades: [...upgrades.values()]
    };
}

