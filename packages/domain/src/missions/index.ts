import type { RunResult } from '../game/types';

export type MissionCadence = 'daily' | 'weekly';
export type MissionMetric = 'runs' | 'defeated' | 'accuracy' | 'bosses' | 'repair-runs' | 'daily-score';

export type Mission = {
    id: string;
    cadence: MissionCadence;
    periodKey: string;
    titleKey: string;
    descriptionKey: string;
    metric: MissionMetric;
    target: number;
    progress: number;
    rewardShards: number;
    completed: boolean;
    completedAt: string | null;
    rewardedAt: string | null;
};

export type MissionSnapshot = {
    serverNow: string;
    dailyResetAt: string;
    weeklyResetAt: string;
    missions: Mission[];
};

type MissionDefinition = Omit<Mission, 'id' | 'periodKey' | 'progress' | 'completed' | 'completedAt' | 'rewardedAt'>;

const DAILY_DEFINITIONS: MissionDefinition[] = [
    {
        cadence: 'daily',
        titleKey: 'mission.daily.enter.title',
        descriptionKey: 'mission.daily.enter.description',
        metric: 'runs',
        target: 1,
        rewardShards: 24
    },
    {
        cadence: 'daily',
        titleKey: 'mission.daily.accuracy.title',
        descriptionKey: 'mission.daily.accuracy.description',
        metric: 'accuracy',
        target: 96,
        rewardShards: 32
    },
    {
        cadence: 'daily',
        titleKey: 'mission.daily.break.title',
        descriptionKey: 'mission.daily.break.description',
        metric: 'defeated',
        target: 24,
        rewardShards: 36
    }
];

const WEEKLY_DEFINITIONS: MissionDefinition[] = [
    {
        cadence: 'weekly',
        titleKey: 'mission.weekly.boss.title',
        descriptionKey: 'mission.weekly.boss.description',
        metric: 'bosses',
        target: 5,
        rewardShards: 110
    },
    {
        cadence: 'weekly',
        titleKey: 'mission.weekly.repair.title',
        descriptionKey: 'mission.weekly.repair.description',
        metric: 'repair-runs',
        target: 3,
        rewardShards: 90
    },
    {
        cadence: 'weekly',
        titleKey: 'mission.weekly.daily.title',
        descriptionKey: 'mission.weekly.daily.description',
        metric: 'daily-score',
        target: 5_000,
        rewardShards: 120
    }
];

export function buildMissionSet(dayKey: string, weekKey: string): Mission[] {
    return [
        ...DAILY_DEFINITIONS.map((definition, index) => ({
            ...definition,
            id: `${dayKey}:d${index + 1}`,
            periodKey: dayKey,
            progress: 0,
            completed: false,
            completedAt: null,
            rewardedAt: null
        })),
        ...WEEKLY_DEFINITIONS.map((definition, index) => ({
            ...definition,
            id: `${weekKey}:w${index + 1}`,
            periodKey: weekKey,
            progress: 0,
            completed: false,
            completedAt: null,
            rewardedAt: null
        }))
    ];
}

function contribution(metric: MissionMetric, result: RunResult): number {
    if (metric === 'runs') return 1;
    if (metric === 'defeated') return result.defeated;
    if (metric === 'accuracy') return result.accuracy;
    if (metric === 'bosses') return result.bosses;
    if (metric === 'repair-runs') return result.mode === 'repair-trial' ? 1 : 0;
    return result.mode === 'daily-rift' ? result.score : 0;
}

export function advanceMissions(missions: Mission[], result: RunResult, completedAt: string): Mission[] {
    return missions.map((mission) => {
        if (mission.completed) return mission;
        const amount = contribution(mission.metric, result);
        const progress = mission.metric === 'accuracy' ? Math.max(mission.progress, amount) : Math.min(mission.target, mission.progress + amount);
        const completed = progress >= mission.target;
        return {
            ...mission,
            progress,
            completed,
            completedAt: completed ? completedAt : null
        };
    });
}

export function grantMissionRewards(
    missions: Mission[],
    rewardedAt: string
): {
    missions: Mission[];
    missionShards: number;
    completedMissionIds: string[];
} {
    let missionShards = 0;
    const completedMissionIds: string[] = [];
    const next = missions.map((mission) => {
        if (!mission.completed || mission.rewardedAt) return mission;
        missionShards += mission.rewardShards;
        completedMissionIds.push(mission.id);
        return { ...mission, rewardedAt };
    });
    return { missions: next, missionShards, completedMissionIds };
}

export function nextUtcMidnight(from: Date): string {
    return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + 1, 0, 0, 0, 0)).toISOString();
}

export function nextUtcWeekReset(from: Date): string {
    const day = from.getUTCDay() || 7;
    const daysUntilMonday = 8 - day;
    return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + daysUntilMonday, 0, 0, 0, 0)).toISOString();
}

export function buildMissionSnapshot(missions: Mission[], serverNow: Date): MissionSnapshot {
    return {
        serverNow: serverNow.toISOString(),
        dailyResetAt: nextUtcMidnight(serverNow),
        weeklyResetAt: nextUtcWeekReset(serverNow),
        missions
    };
}
