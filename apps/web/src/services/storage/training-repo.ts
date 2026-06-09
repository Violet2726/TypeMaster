import { STORAGE_KEYS } from '@typemaster/contracts';
import {
    StoredActiveSessionContextSchema,
    StoredDiagnosticJourneySchema,
    StoredSkillProfileSchema,
    StoredTrainingPlanSchema
} from '@typemaster/contracts/storage';
import { readClientCache, writeClientCache } from './json-store';

type SkillProfile = ReturnType<typeof StoredSkillProfileSchema.parse>;
type TrainingPlan = ReturnType<typeof StoredTrainingPlanSchema.parse>;
type DiagnosticJourney = ReturnType<typeof StoredDiagnosticJourneySchema.parse>;
type ActiveSessionContext = ReturnType<typeof StoredActiveSessionContextSchema.parse>;

export function loadSkillProfile() {
    return readClientCache(STORAGE_KEYS.skillProfile, null, StoredSkillProfileSchema);
}

export function saveSkillProfile(profile: SkillProfile) {
    writeClientCache(STORAGE_KEYS.skillProfile, profile, StoredSkillProfileSchema);
}

export function loadTrainingPlan() {
    return readClientCache(STORAGE_KEYS.trainingPlan, null, StoredTrainingPlanSchema);
}

export function saveTrainingPlan(plan: TrainingPlan) {
    writeClientCache(STORAGE_KEYS.trainingPlan, plan, StoredTrainingPlanSchema);
}

export function loadDiagnosticJourney() {
    return readClientCache(STORAGE_KEYS.diagnosticJourney, null, StoredDiagnosticJourneySchema);
}

export function saveDiagnosticJourney(journey: DiagnosticJourney) {
    writeClientCache(STORAGE_KEYS.diagnosticJourney, journey, StoredDiagnosticJourneySchema);
}

export function loadActiveSessionContext() {
    return readClientCache(STORAGE_KEYS.activeSessionContext, null, StoredActiveSessionContextSchema);
}

export function saveActiveSessionContext(context: ActiveSessionContext) {
    writeClientCache(STORAGE_KEYS.activeSessionContext, context, StoredActiveSessionContextSchema);
}
