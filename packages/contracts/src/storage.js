import { z } from 'zod';
import {
    ActiveSessionContextSchema,
    CoachAdviceRecordSchema,
    DiagnosticJourneySchema,
    SessionRecordSchema,
    SkillProfileSchema,
    TrainingConfigSchema,
    TrainingPlanSchema
} from './training-state.js';

export const StoredSettingsSchema = z.object({
    language: z.string().optional(),
    theme: z.string().optional(),
    fontScale: z.string().optional(),
    focusMode: z.boolean().optional(),
    soundEffects: z.boolean().optional(),
    keyboardLayout: z.string().optional(),
    customWordBankText: z.string().optional(),
    lastConfig: TrainingConfigSchema.optional()
}).catchall(z.unknown());

export const StoredSessionsSchema = z.array(SessionRecordSchema);
export const StoredCoachAdviceRecordsSchema = z.array(CoachAdviceRecordSchema);
export const StoredSkillProfileSchema = SkillProfileSchema.nullable();
export const StoredTrainingPlanSchema = TrainingPlanSchema.nullable();
export const StoredDiagnosticJourneySchema = DiagnosticJourneySchema.nullable();
export const StoredActiveSessionContextSchema = ActiveSessionContextSchema.nullable();

export const TrainingDataBundleSchema = z.object({
    version: z.literal(7).optional().default(7),
    exportedAt: z.string().optional(),
    settings: StoredSettingsSchema.nullable().optional(),
    sessions: StoredSessionsSchema.optional().default([]),
    coachAdviceRecords: StoredCoachAdviceRecordsSchema.optional().default([]),
    skillProfile: StoredSkillProfileSchema.optional().default(null),
    trainingPlan: StoredTrainingPlanSchema.optional().default(null)
}).catchall(z.unknown());

export function parseStoredSettings(value) {
    return StoredSettingsSchema.parse(value);
}

export function parseStoredSessions(value) {
    return StoredSessionsSchema.parse(value);
}

export function parseStoredCoachAdviceRecords(value) {
    return StoredCoachAdviceRecordsSchema.parse(value);
}

export function parseStoredSkillProfile(value) {
    return StoredSkillProfileSchema.parse(value);
}

export function parseStoredTrainingPlan(value) {
    return StoredTrainingPlanSchema.parse(value);
}

export function parseStoredDiagnosticJourney(value) {
    return StoredDiagnosticJourneySchema.parse(value);
}

export function parseStoredActiveSessionContext(value) {
    return StoredActiveSessionContextSchema.parse(value);
}

export function parseTrainingDataBundle(value) {
    return TrainingDataBundleSchema.parse(value);
}

export function createTrainingDataBundle(payload = {}) {
    return TrainingDataBundleSchema.parse({
        exportedAt: new Date().toISOString(),
        ...payload
    });
}
