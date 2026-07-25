import { describe, expect, it } from 'vitest';
import {
    CompleteRunRequestSchema,
    CompleteRunResponseSchema,
    ContentVersionSchema,
    MissionSnapshotSchema,
    ReplayLogSchema,
    RunCommandSchema,
    SettingsSchema,
    StartRunResponseSchema
} from './index';

const commandLog = {
    contentVersion: 2,
    seed: 'contract-seed',
    mode: 'expedition',
    difficulty: 'standard',
    focusChars: ['a', '7', '?'],
    endedAtMs: 1_200,
    entries: [
        { atMs: 0, command: { type: 'start' } },
        { atMs: 500, command: { type: 'type', char: 'a' } }
    ]
} as const;

const mission = {
    id: '2026-07-18:d1',
    cadence: 'daily',
    periodKey: '2026-07-18',
    titleKey: 'mission.daily.enter.title',
    descriptionKey: 'mission.daily.enter.description',
    metric: 'runs',
    target: 1,
    progress: 1,
    rewardShards: 24,
    completed: true,
    completedAt: '2026-07-18T03:00:00.000Z',
    rewardedAt: '2026-07-18T03:00:00.000Z'
} as const;

describe('strict v2 contracts', () => {
    it('accepts only content version 2', () => {
        expect(ContentVersionSchema.safeParse(2).success).toBe(true);
        expect(ContentVersionSchema.safeParse(1).success).toBe(false);
    });

    it('rejects unknown command fields', () => {
        expect(RunCommandSchema.safeParse({ type: 'start', legacy: true }).success).toBe(false);
    });

    it('limits typed commands to domain input characters', () => {
        for (const char of ['a', 'z', '0', '9', '?', '!', '-']) {
            expect(RunCommandSchema.safeParse({ type: 'type', char }).success).toBe(true);
        }
        for (const char of ['A', '.', '_', '中', 'ab']) {
            expect(RunCommandSchema.safeParse({ type: 'type', char }).success).toBe(false);
        }
    });

    it('rejects old settings shapes', () => {
        expect(SettingsSchema.safeParse({ sound: true }).success).toBe(false);
    });

    it('requires replay completion time and accepts an optional signed ticket', () => {
        expect(ReplayLogSchema.safeParse(commandLog).success).toBe(true);
        expect(ReplayLogSchema.safeParse({ ...commandLog, endedAtMs: undefined }).success).toBe(false);
        expect(CompleteRunRequestSchema.safeParse({ commandLog }).success).toBe(true);
        expect(CompleteRunRequestSchema.safeParse({ ticket: 'signed-ticket', commandLog }).success).toBe(true);
    });

    it('rejects client-authored results, hashes, and v1 signatures', () => {
        expect(CompleteRunRequestSchema.safeParse({ commandLog, result: {}, clientHash: 'deadbeef' }).success).toBe(false);
        expect(
            StartRunResponseSchema.safeParse({
                runId: 'run-1',
                mode: 'daily-rift',
                difficulty: 'standard',
                seed: 'daily-seed',
                contentVersion: 2,
                expiresAt: '2026-07-18T04:00:00.000Z',
                signature: 'old-signature'
            }).success
        ).toBe(false);
    });

    it('accepts signed v2 run starts', () => {
        expect(
            StartRunResponseSchema.safeParse({
                runId: 'run-1',
                mode: 'daily-rift',
                difficulty: 'surge',
                seed: 'daily-seed',
                contentVersion: 2,
                expiresAt: '2026-07-18T04:00:00.000Z',
                ticket: 'signed-ticket'
            }).success
        ).toBe(true);
    });

    it('requires authoritative mission timing and one settlement reward summary', () => {
        const missionSnapshot = {
            serverNow: '2026-07-18T03:00:00.000Z',
            dailyResetAt: '2026-07-19T00:00:00.000Z',
            weeklyResetAt: '2026-07-20T00:00:00.000Z',
            missions: [mission]
        };
        expect(MissionSnapshotSchema.safeParse(missionSnapshot).success).toBe(true);
        expect(
            CompleteRunResponseSchema.safeParse({
                run: {
                    contentVersion: 2,
                    runId: 'run-1',
                    mode: 'expedition',
                    difficulty: 'standard',
                    seed: 'contract-seed',
                    score: 1_200,
                    accuracy: 98,
                    wpm: 72,
                    maxCombo: 44,
                    durationMs: 1_200,
                    areaIndex: 0,
                    endReason: 'extracted',
                    defeated: 8,
                    bosses: 0,
                    weakChars: ['q'],
                    upgradeIds: [],
                    encounteredIds: ['enemy.scribe'],
                    defeatedBossIds: []
                },
                verified: true,
                progression: {
                    resonanceLevel: 2,
                    resonanceXp: 12,
                    shards: 80,
                    unlockedUpgradeIds: [],
                    codexIds: ['enemy.scribe'],
                    achievementIds: ['achievement.first-contact'],
                    activeDays: 1,
                    lastActiveDate: '2026-07-18'
                },
                missionSnapshot,
                rewards: {
                    runXp: 42,
                    runShards: 18,
                    missionShards: 24,
                    newCodexIds: ['enemy.scribe'],
                    newAchievementIds: ['achievement.first-contact'],
                    completedMissionIds: ['2026-07-18:d1']
                },
                idempotent: false
            }).success
        ).toBe(true);
    });
});
