import { z } from 'zod';

const TrainingConfigFieldMap = {
    mode: z.enum(['time', 'words']),
    durationSeconds: z.number(),
    wordCount: z.number(),
    includePunctuation: z.boolean(),
    includeNumbers: z.boolean(),
    source: z.enum(['builtin', 'custom', 'ai']),
    aiTemplate: z.enum(['daily', 'business', 'tech', 'developer']),
    difficulty: z.enum(['easy', 'medium', 'hard'])
};

export const NormalizedTrainingConfigSchema = z.object(TrainingConfigFieldMap).catchall(z.unknown());
export const TrainingConfigSchema = z.object({
    mode: TrainingConfigFieldMap.mode.optional(),
    durationSeconds: TrainingConfigFieldMap.durationSeconds.optional(),
    wordCount: TrainingConfigFieldMap.wordCount.optional(),
    includePunctuation: TrainingConfigFieldMap.includePunctuation.optional(),
    includeNumbers: TrainingConfigFieldMap.includeNumbers.optional(),
    source: TrainingConfigFieldMap.source.optional(),
    aiTemplate: TrainingConfigFieldMap.aiTemplate.optional(),
    difficulty: TrainingConfigFieldMap.difficulty.optional()
}).catchall(z.unknown());

export const SkillLevelSchema = z.object({
    id: z.string(),
    label: z.string()
}).catchall(z.unknown());

export const WeakZoneSchema = z.object({
    id: z.string(),
    label: z.string(),
    score: z.number()
}).catchall(z.unknown());

export const SkillProfileMetricsSchema = z.object({
    avgWpm: z.number().optional(),
    avgAccuracy: z.number().optional(),
    avgConsistency: z.number().optional(),
    avgDuration: z.number().optional()
}).catchall(z.unknown());

export const SkillProfileSchema = z.object({
    id: z.string().optional(),
    createdAt: z.string().optional(),
    level: SkillLevelSchema.optional(),
    summary: z.string().optional(),
    primaryFocus: z.string().optional(),
    weakZones: z.array(WeakZoneSchema).optional().default([]),
    topErrorChars: z.array(z.string()).optional().default([]),
    topErrorWords: z.array(z.string()).optional().default([]),
    metrics: SkillProfileMetricsSchema.optional()
}).catchall(z.unknown());

export const AchievementSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    unlockedAt: z.string().nullable(),
    unlocked: z.boolean()
}).catchall(z.unknown());

export const TrainingStepSchema = z.object({
    id: z.string(),
    order: z.number().optional(),
    title: z.string(),
    summary: z.string(),
    config: TrainingConfigSchema,
    status: z.enum(['pending', 'complete']),
    text: z.string().optional(),
    completedSessionId: z.string().nullable().optional()
}).catchall(z.unknown());

export const TrainingPlanSchema = z.object({
    id: z.string(),
    type: z.string().optional(),
    title: z.string(),
    summary: z.string(),
    primaryFocus: z.string().optional(),
    status: z.enum(['active', 'complete']),
    currentStepIndex: z.number().optional(),
    startedAt: z.string().optional(),
    updatedAt: z.string().optional(),
    steps: z.array(TrainingStepSchema)
}).catchall(z.unknown());

export const DiagnosticJourneySchema = z.object({
    id: z.string(),
    type: z.string().optional(),
    title: z.string(),
    summary: z.string(),
    status: z.enum(['active', 'complete']),
    currentStepIndex: z.number().optional(),
    startedAt: z.string().optional(),
    updatedAt: z.string().optional(),
    steps: z.array(TrainingStepSchema)
}).catchall(z.unknown());

export const WeeklyGoalSchema = z.object({
    target: z.number(),
    completed: z.number(),
    percent: z.number()
}).catchall(z.unknown());

export const StreakStateSchema = z.object({
    current: z.number(),
    weeklyGoal: WeeklyGoalSchema
}).catchall(z.unknown());

export const CoachAdviceComparisonSchema = z.object({
    label: z.string().optional().default('mixed'),
    summary: z.string().optional().default(''),
    wpmDelta: z.number().nullable().optional().default(null),
    accuracyDelta: z.number().nullable().optional().default(null)
}).catchall(z.unknown());

export const CoachAdviceNextDrillSchema = z.object({
    label: z.string().optional(),
    reason: z.string().optional(),
    configPatch: TrainingConfigSchema.optional().default({}),
    aiPrompt: z.string().optional()
}).catchall(z.unknown());

export const CoachAdviceContentSchema = z.object({
    headline: z.string().optional(),
    summary: z.string().optional(),
    strengths: z.array(z.string()).optional().default([]),
    weaknesses: z.array(z.string()).optional().default([]),
    nextDrill: CoachAdviceNextDrillSchema.optional(),
    comparison: CoachAdviceComparisonSchema.optional(),
    language: z.string().optional()
}).catchall(z.unknown());

export const CoachAdviceRecordSchema = CoachAdviceContentSchema.extend({
    id: z.string().optional(),
    sessionId: z.string(),
    status: z.enum(['pending', 'complete', 'failed']).optional().default('complete'),
    source: z.enum(['ai', 'fallback']).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    providerMeta: z.record(z.unknown()).optional().default({}),
    fallbackReasonCode: z.string().optional(),
    fallbackReasonMessage: z.string().optional()
}).catchall(z.unknown());

const SessionCountStatSchema = z.object({
    label: z.string(),
    count: z.number()
}).catchall(z.unknown());

export const SessionResultSchema = z.object({
    wpm: z.number().optional().default(0),
    rawWpm: z.number().optional().default(0),
    accuracy: z.number().optional().default(0),
    consistency: z.number().optional().default(0),
    correctChars: z.number().optional().default(0),
    incorrectChars: z.number().optional().default(0),
    extraChars: z.number().optional().default(0),
    missedChars: z.number().optional().default(0),
    durationSeconds: z.number().optional().default(0),
    completedAt: z.string().optional(),
    errors: z.number().optional().default(0),
    topErrorChars: z.array(z.string()).optional().default([]),
    topErrorWords: z.array(z.string()).optional().default([]),
    errorCharStats: z.array(SessionCountStatSchema).optional().default([]),
    errorWordStats: z.array(SessionCountStatSchema).optional().default([])
}).catchall(z.unknown());

export const SessionTimelineSampleSchema = z.object({
    time: z.number().optional(),
    wpm: z.number().optional(),
    raw: z.number().optional(),
    accuracy: z.number().optional(),
    burst: z.number().optional(),
    errors: z.number().optional()
}).catchall(z.unknown());

export const SessionTimelineSchema = z.object({
    samples: z.array(SessionTimelineSampleSchema).optional().default([]),
    labels: z.array(z.number()).optional().default([]),
    wpm: z.array(z.number()).optional().default([]),
    raw: z.array(z.number()).optional().default([]),
    accuracy: z.array(z.number()).optional().default([]),
    burst: z.array(z.number()).optional().default([]),
    errors: z.array(z.number()).optional().default([]),
    pauseMoments: z.array(z.number()).optional().default([])
}).catchall(z.unknown());

export const SessionSourceTextMetaSchema = z.object({
    source: z.string().optional(),
    label: z.string().optional(),
    template: z.string().nullable().optional(),
    difficulty: z.string().nullable().optional(),
    createdAt: z.string().optional(),
    prompt: z.string().nullable().optional(),
    generatedBy: z.string().optional(),
    adaptiveFocus: z.string().nullable().optional(),
    adaptiveHotspots: z.array(z.string()).optional().default([]),
    adaptiveTargetChars: z.array(z.string()).optional().default([]),
    adaptiveTargetWords: z.array(z.string()).optional().default([]),
    adaptiveBaselineCount: z.number().optional().default(0),
    adaptiveSourceSessionId: z.string().nullable().optional(),
    adaptiveMetrics: z.record(z.unknown()).optional().default({}),
    keyboardZone: z.string().nullable().optional(),
    keyboardLayout: z.string().nullable().optional(),
    keyboardZoneChars: z.array(z.string()).optional().default([]),
    keyboardZoneShare: z.number().optional().default(0)
}).catchall(z.unknown());

export const TrainingSurfaceSchema = z.enum([
    'today',
    'practice',
    'missions',
    'insights',
    'raid',
    'result'
]);

export const SessionIntentSchema = z.enum([
    'free-practice',
    'baseline-mission',
    'daily-mission',
    'focus-drill',
    'challenge-mission',
    'endless-raid',
    'daily-focus-raid',
    'adaptive-drill',
    'keyboard-zone-drill',
    'recovery-drill'
]);

export const SessionTrainingMetaSchema = z.object({
    type: z.enum(['free', 'practice', 'mission', 'raid']).optional(),
    surface: TrainingSurfaceSchema.optional(),
    intent: SessionIntentSchema.optional(),
    focus: z.string().nullable().optional(),
    sourceSessionId: z.string().nullable().optional(),
    stepId: z.string().optional(),
    title: z.string().optional()
}).catchall(z.unknown());

export const SessionRecordSchema = z.object({
    id: z.string(),
    kind: z.enum(['raid', 'practice', 'mission']).optional(),
    intent: SessionIntentSchema.optional(),
    startedAt: z.string().optional(),
    completedAt: z.string().optional(),
    durationSeconds: z.number().optional(),
    focus: z.string().nullable().optional(),
    source: z.string().optional(),
    gameMeta: z.record(z.unknown()).optional(),
    config: TrainingConfigSchema.optional(),
    result: SessionResultSchema.optional(),
    timeline: SessionTimelineSchema.optional(),
    sourceTextMeta: SessionSourceTextMetaSchema.optional(),
    coachAdviceId: z.string().nullable().optional(),
    trainingMeta: SessionTrainingMetaSchema.nullable().optional()
}).catchall(z.unknown());

export function normalizeSessionRecord(value) {
    return SessionRecordSchema.parse(value);
}

export function normalizeSessionResult(value) {
    return SessionResultSchema.parse(value);
}

export function normalizeCoachAdviceComparison(value) {
    return CoachAdviceComparisonSchema.parse(value);
}

export function normalizeCoachAdviceContent(value) {
    return CoachAdviceContentSchema.parse(value);
}

export function normalizeCoachAdviceRecord(value) {
    return CoachAdviceRecordSchema.parse(value);
}

export function normalizeAchievementRecord(value) {
    return AchievementSchema.parse(value);
}

export const ActiveSessionContextSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('diagnostic'),
        journeyId: z.string().nullable().optional(),
        stepId: z.string().nullable().optional()
    }).catchall(z.unknown()),
    z.object({
        type: z.literal('plan'),
        planId: z.string(),
        stepId: z.string()
    }).catchall(z.unknown()),
    z.object({
        type: z.literal('challenge'),
        challengeId: z.string(),
        stepId: z.string().nullable().optional(),
        title: z.string().optional(),
        summary: z.string().optional()
    }).catchall(z.unknown())
]);
