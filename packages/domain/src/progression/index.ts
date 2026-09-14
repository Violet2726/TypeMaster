import { BOSSES, ENEMY_ARCHETYPES } from '../game/content';
import type { RunResult } from '../game/types';

export const CODEX_IDS = [...ENEMY_ARCHETYPES.map(({ id }) => id), ...BOSSES.map(({ id }) => id)] as const;
export const ACHIEVEMENT_IDS = ['first-contact', 'clean-signal', 'unbroken-thread', 'rift-closed'] as const;

export type PlayerProgress = {
    resonanceLevel: number;
    resonanceXp: number;
    shards: number;
    unlockedUpgradeIds: string[];
    codexIds: string[];
    achievementIds: string[];
    activeDays: number;
    lastActiveDate: string | null;
};

export type RunProgression = {
    runXp: number;
    runShards: number;
    unlockedUpgradeIds: string[];
    codexIds: string[];
    achievementIds: string[];
};

export type ProgressionDelta = {
    runXp: number;
    runShards: number;
    newCodexIds: string[];
    newAchievementIds: string[];
    newUpgradeIds: string[];
};

export const EMPTY_PLAYER_PROGRESS: PlayerProgress = {
    resonanceLevel: 1,
    resonanceXp: 0,
    shards: 0,
    unlockedUpgradeIds: [],
    codexIds: [],
    achievementIds: [],
    activeDays: 0,
    lastActiveDate: null
};

export function levelRequirement(level: number): number {
    return 180 + Math.max(0, level - 1) * 90;
}

function upgradeStacks(result: RunResult, upgradeId: string): number {
    return result.upgradeIds.filter((id) => id === upgradeId).length;
}

export function progressionForRun(result: RunResult): RunProgression {
    const quality = Math.max(0.5, result.accuracy / 100);
    const runXp = Math.round((30 + result.defeated * 3 + result.bosses * 36) * quality);
    const vaultMultiplier = 1 + upgradeStacks(result, 'shard-vault') * 0.15;
    const runShards = Math.max(8, Math.round(runXp * 0.42 * vaultMultiplier));
    const knownCodexIds = new Set<string>(CODEX_IDS);
    const codexIds = [...new Set((result.encounteredIds ?? []).filter((id) => knownCodexIds.has(id)))];
    const unlockedUpgradeIds = [...new Set(result.upgradeIds)];
    const achievementIds = [
        'first-contact',
        ...(result.accuracy >= 98 ? ['clean-signal'] : []),
        ...(result.maxCombo >= 100 ? ['unbroken-thread'] : []),
        ...((result.defeatedBossIds?.length ?? 0) >= 3 || result.bosses >= 3 || (result.mode === 'expedition' && result.endReason === 'victory')
            ? ['rift-closed']
            : [])
    ];
    return { runXp, runShards, unlockedUpgradeIds, codexIds, achievementIds };
}

export function applyRunProgress(
    progress: PlayerProgress,
    result: RunResult,
    activeDate: string,
    missionShards = 0
): { progress: PlayerProgress; delta: ProgressionDelta } {
    const reward = progressionForRun(result);
    const newCodexIds = reward.codexIds.filter((id) => !progress.codexIds.includes(id));
    const newAchievementIds = reward.achievementIds.filter((id) => !progress.achievementIds.includes(id));
    const newUpgradeIds = reward.unlockedUpgradeIds.filter((id) => !progress.unlockedUpgradeIds.includes(id));
    let resonanceLevel = progress.resonanceLevel;
    let resonanceXp = progress.resonanceXp + reward.runXp;
    while (resonanceXp >= levelRequirement(resonanceLevel)) {
        resonanceXp -= levelRequirement(resonanceLevel);
        resonanceLevel += 1;
    }
    const changedDay = progress.lastActiveDate !== activeDate;
    return {
        delta: {
            runXp: reward.runXp,
            runShards: reward.runShards,
            newCodexIds,
            newAchievementIds,
            newUpgradeIds
        },
        progress: {
            ...progress,
            resonanceLevel,
            resonanceXp,
            shards: progress.shards + reward.runShards + missionShards,
            unlockedUpgradeIds: [...progress.unlockedUpgradeIds, ...newUpgradeIds],
            codexIds: [...progress.codexIds, ...newCodexIds],
            achievementIds: [...progress.achievementIds, ...newAchievementIds],
            activeDays: progress.activeDays + (changedDay ? 1 : 0),
            lastActiveDate: activeDate
        }
    };
}
