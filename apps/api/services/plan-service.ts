import type { z } from 'zod';
import { TrainingPlanSchema } from '@typemaster/contracts/training-state';
import { getTrainingRepository } from '../repositories/training-repository';

export function getTrainingPlanSnapshot(userId: string | undefined) {
    return getTrainingRepository().loadTrainingPlan(userId);
}

export function saveTrainingPlanSnapshot(userId: string | undefined, trainingPlan: z.infer<typeof TrainingPlanSchema> | null) {
    return getTrainingRepository().saveTrainingPlan(userId, trainingPlan);
}
