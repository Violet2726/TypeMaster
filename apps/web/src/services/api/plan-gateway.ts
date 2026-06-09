import {
    SkillProfileResponseSchema,
    saveSkillProfileRequestSchema,
    saveTrainingPlanRequestSchema,
    TrainingPlanResponseSchema
} from '@typemaster/contracts/api';
import { getCurrentUserRecord, readApiFallbackCache, writeApiFallbackCache } from './local-cache';
import { requestJson } from './remote';

type TrainingPlanSnapshot = ReturnType<typeof saveTrainingPlanRequestSchema.parse>['trainingPlan'];
type SkillProfileSyncPayload = ReturnType<typeof saveSkillProfileRequestSchema.parse>;
type SkillProfileSnapshot = SkillProfileSyncPayload['skillProfile'];
type SkillProfileExtras = {
    achievements?: SkillProfileSyncPayload['achievements'],
    streakState?: SkillProfileSyncPayload['streakState'],
};

export class PlanGateway {
    async saveTrainingPlan(trainingPlan: TrainingPlanSnapshot) {
        try {
            await requestJson('/plans', {
                method: 'POST',
                body: { trainingPlan },
                requestSchema: saveTrainingPlanRequestSchema,
                responseSchema: TrainingPlanResponseSchema
            });
            return { status: 'synced' };
        } catch {
            const state = readApiFallbackCache();
            const currentUser = getCurrentUserRecord(state);
            if (!currentUser) {
                return { status: 'skipped' };
            }

            currentUser.trainingPlan = trainingPlan;
            currentUser.lastSyncedAt = new Date().toISOString();
            writeApiFallbackCache(state);
            return { status: 'synced' };
        }
    }

    async loadTrainingPlan() {
        try {
            const payload = await requestJson('/plans', {
                responseSchema: TrainingPlanResponseSchema
            });
            return payload.trainingPlan || null;
        } catch {
            const state = readApiFallbackCache();
            const currentUser = getCurrentUserRecord(state);
            return currentUser?.trainingPlan || null;
        }
    }

    async saveSkillProfile(skillProfile: SkillProfileSnapshot, extras: SkillProfileExtras = {}) {
        const requestAchievements = extras.achievements ?? [];
        const requestStreakState = extras.streakState ?? null;

        try {
            await requestJson('/profiles', {
                method: 'POST',
                body: {
                    skillProfile,
                    achievements: requestAchievements,
                    streakState: requestStreakState
                },
                requestSchema: saveSkillProfileRequestSchema,
                responseSchema: SkillProfileResponseSchema
            });
            return { status: 'synced' };
        } catch {
            const state = readApiFallbackCache();
            const currentUser = getCurrentUserRecord(state);
            if (!currentUser) {
                return { status: 'skipped' };
            }

            currentUser.skillProfile = skillProfile;
            currentUser.achievements = extras.achievements || currentUser.achievements || [];
            currentUser.streakState = extras.streakState || currentUser.streakState || null;
            currentUser.lastSyncedAt = new Date().toISOString();
            writeApiFallbackCache(state);
            return { status: 'synced' };
        }
    }

    async loadSkillProfile() {
        try {
            const payload = await requestJson('/profiles', {
                responseSchema: SkillProfileResponseSchema
            });
            return payload.skillProfile || null;
        } catch {
            const state = readApiFallbackCache();
            const currentUser = getCurrentUserRecord(state);
            return currentUser?.skillProfile || null;
        }
    }
}
