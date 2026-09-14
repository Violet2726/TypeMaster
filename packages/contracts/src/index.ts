import { z } from 'zod';

export const ContentVersionSchema = z.literal(2);
export const RunModeSchema = z.enum(['first-rift', 'expedition', 'daily-rift', 'repair-trial', 'quick-pulse']);
export const DifficultySchema = z.enum(['flow', 'standard', 'surge']);
export const RunEndReasonSchema = z.enum(['victory', 'fracture', 'timeout', 'extracted']);
export const InputCharacterSchema = z.string().regex(/^[a-z0-9?!-]$/);

export const RunCommandSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('start') }).strict(),
    z.object({ type: z.literal('pause') }).strict(),
    z.object({ type: z.literal('resume') }).strict(),
    z.object({ type: z.literal('type'), char: InputCharacterSchema }).strict(),
    z.object({ type: z.literal('surge') }).strict(),
    z.object({ type: z.literal('choose-upgrade'), upgradeId: z.string().min(1).max(80) }).strict(),
    z.object({ type: z.literal('extract') }).strict()
]);

export const ReplayEntrySchema = z
    .object({
        atMs: z.number().int().min(0).max(900_000),
        command: RunCommandSchema
    })
    .strict();

export const ReplayLogSchema = z
    .object({
        contentVersion: ContentVersionSchema,
        seed: z.string().min(1).max(120),
        mode: RunModeSchema,
        difficulty: DifficultySchema,
        focusChars: z.array(InputCharacterSchema).max(6),
        endedAtMs: z.number().int().min(0).max(900_000),
        entries: z.array(ReplayEntrySchema).max(30_000)
    })
    .strict();

export const RunResultSchema = z
    .object({
        contentVersion: ContentVersionSchema,
        runId: z.string().min(1).max(100),
        mode: RunModeSchema,
        difficulty: DifficultySchema,
        seed: z.string().min(1).max(120),
        score: z.number().int().min(0).max(100_000_000),
        accuracy: z.number().min(0).max(100),
        wpm: z.number().min(0).max(500),
        maxCombo: z.number().int().min(0).max(1_000_000),
        durationMs: z.number().int().min(0).max(900_000),
        areaIndex: z.number().int().min(0).max(2),
        endReason: RunEndReasonSchema,
        defeated: z.number().int().min(0).max(100_000),
        bosses: z.number().int().min(0).max(10),
        weakChars: z.array(InputCharacterSchema).max(6),
        upgradeIds: z.array(z.string().min(1).max(80)).max(50),
        encounteredIds: z.array(z.string().min(1).max(100)).max(12),
        defeatedBossIds: z.array(z.string().min(1).max(100)).max(3)
    })
    .strict();

export const PlayerSchema = z
    .object({
        id: z.string().min(1).max(100),
        locale: z.enum(['zh-CN', 'en-US']),
        callSign: z.string().trim().min(1).max(24),
        difficulty: DifficultySchema,
        onboardingComplete: z.boolean(),
        createdAt: z.string().datetime(),
        updatedAt: z.string().datetime()
    })
    .strict();

export const PlayerProgressSchema = z
    .object({
        resonanceLevel: z.number().int().min(1).max(999),
        resonanceXp: z.number().int().min(0),
        shards: z.number().int().min(0),
        unlockedUpgradeIds: z.array(z.string().min(1).max(80)).max(100),
        codexIds: z.array(z.string().min(1).max(100)).max(36),
        achievementIds: z.array(z.string().min(1).max(100)).max(18),
        activeDays: z.number().int().min(0),
        lastActiveDate: z.string().date().nullable()
    })
    .strict();

export const MissionSchema = z
    .object({
        id: z.string().min(1).max(100),
        cadence: z.enum(['daily', 'weekly']),
        periodKey: z.string().min(1).max(32),
        titleKey: z.string().min(1).max(120),
        descriptionKey: z.string().min(1).max(160),
        metric: z.enum(['runs', 'defeated', 'accuracy', 'bosses', 'repair-runs', 'daily-score']),
        target: z.number().min(0),
        progress: z.number().min(0),
        rewardShards: z.number().int().min(0),
        completed: z.boolean(),
        completedAt: z.string().datetime().nullable(),
        rewardedAt: z.string().datetime().nullable()
    })
    .strict();

export const MissionSnapshotSchema = z
    .object({
        serverNow: z.string().datetime(),
        dailyResetAt: z.string().datetime(),
        weeklyResetAt: z.string().datetime(),
        missions: z.array(MissionSchema).max(6)
    })
    .strict();

export const SettingsSchema = z
    .object({
        theme: z.enum(['system', 'light', 'dark']),
        locale: z.enum(['zh-CN', 'en-US']),
        reduceMotion: z.boolean(),
        reduceTransparency: z.boolean(),
        /** TypeRift-specific: fewer particles, glows and background complexity even without a system preference. */
        reduceEffects: z.boolean(),
        enhancedContrast: z.boolean(),
        colorSafe: z.boolean(),
        noFlash: z.boolean(),
        reactionAssist: z.boolean(),
        music: z.boolean(),
        effects: z.boolean(),
        voice: z.boolean(),
        textScale: z.number().min(1).max(2)
    })
    .strict();

export const StartRunRequestSchema = z
    .object({
        mode: RunModeSchema,
        difficulty: DifficultySchema.optional(),
        clientRunId: z.string().min(1).max(100).optional(),
        focusChars: z.array(InputCharacterSchema).max(6).optional()
    })
    .strict();

export const StartRunResponseSchema = z
    .object({
        runId: z.string().min(1).max(100),
        mode: RunModeSchema,
        difficulty: DifficultySchema,
        seed: z.string().min(1).max(120),
        contentVersion: ContentVersionSchema,
        expiresAt: z.string().datetime(),
        ticket: z.string().min(8).max(2_048)
    })
    .strict();

export const CompleteRunRequestSchema = z
    .object({
        ticket: z.string().min(8).max(2_048).optional(),
        commandLog: ReplayLogSchema
    })
    .strict();

export const RunRewardsSchema = z
    .object({
        runXp: z.number().int().min(0),
        runShards: z.number().int().min(0),
        missionShards: z.number().int().min(0),
        newCodexIds: z.array(z.string().min(1).max(100)).max(12),
        newAchievementIds: z.array(z.string().min(1).max(100)).max(4),
        completedMissionIds: z.array(z.string().min(1).max(100)).max(6)
    })
    .strict();

export const CompleteRunResponseSchema = z
    .object({
        run: RunResultSchema,
        verified: z.boolean(),
        progression: PlayerProgressSchema,
        missionSnapshot: MissionSnapshotSchema,
        rewards: RunRewardsSchema,
        idempotent: z.boolean()
    })
    .strict();

export const StoredRunSchema = z
    .object({
        id: z.string().min(1).max(100),
        playerId: z.string().min(1).max(100),
        result: RunResultSchema,
        verified: z.boolean(),
        completedAt: z.string().datetime()
    })
    .strict();

export const CoachReportSchema = z
    .object({
        runId: z.string().min(1).max(100),
        status: z.enum(['local', 'pending', 'ready']),
        summaryKey: z.string().min(1).max(160),
        focusKeys: z.array(z.string().min(1).max(160)).max(3),
        polishedText: z.string().max(1_200).nullable()
    })
    .strict();

export const LeaderboardEntrySchema = z
    .object({
        rank: z.number().int().min(1),
        callSign: z.string().min(1).max(24),
        score: z.number().int().min(0),
        accuracy: z.number().min(0).max(100),
        runId: z.string().min(1).max(100)
    })
    .strict();

export const ApiErrorSchema = z
    .object({
        error: z
            .object({
                code: z.string().min(1).max(80),
                messageKey: z.string().min(1).max(160),
                requestId: z.string().min(1).max(100)
            })
            .strict()
    })
    .strict();

export type RunCommandContract = z.infer<typeof RunCommandSchema>;
export type ReplayLogContract = z.infer<typeof ReplayLogSchema>;
export type RunResultContract = z.infer<typeof RunResultSchema>;
export type PlayerContract = z.infer<typeof PlayerSchema>;
export type PlayerProgressContract = z.infer<typeof PlayerProgressSchema>;
export type MissionContract = z.infer<typeof MissionSchema>;
export type MissionSnapshotContract = z.infer<typeof MissionSnapshotSchema>;
export type SettingsContract = z.infer<typeof SettingsSchema>;
export type StartRunRequest = z.infer<typeof StartRunRequestSchema>;
export type StartRunResponse = z.infer<typeof StartRunResponseSchema>;
export type CompleteRunRequest = z.infer<typeof CompleteRunRequestSchema>;
export type CompleteRunResponse = z.infer<typeof CompleteRunResponseSchema>;
export type RunRewardsContract = z.infer<typeof RunRewardsSchema>;
export type StoredRunContract = z.infer<typeof StoredRunSchema>;
