import type { z } from 'zod';
import {
    AchievementSchema,
    SkillProfileSchema,
    StreakStateSchema
} from '@typemaster/contracts/training-state';
import { getTrainingRepository } from '../repositories/training-repository';

type SkillProfileSnapshot = {
    skillProfile: z.infer<typeof SkillProfileSchema> | null,
    achievements: z.infer<typeof AchievementSchema>[],
    streakState: z.infer<typeof StreakStateSchema> | null,
};

export function getSkillProfileSnapshot(userId: string | undefined) {
    return getTrainingRepository().loadSkillProfile(userId);
}

export function saveSkillProfileSnapshot(
    userId: string | undefined,
    { skillProfile, achievements, streakState }: SkillProfileSnapshot
) {
    return getTrainingRepository().saveSkillProfile(userId, {
        skillProfile,
        achievements,
        streakState
    });
}
