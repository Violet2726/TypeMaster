import type { z } from 'zod';
import { createTrainingDataBundle, parseTrainingDataBundle, TrainingDataBundleSchema } from '@typemaster/contracts/storage';
import { getTrainingRepository } from '../repositories/training-repository';

type TrainingDataBundle = z.infer<typeof TrainingDataBundleSchema>;

export async function exportTrainingDataBundle(userId: string | undefined) {
    const repository = getTrainingRepository();
    const [sessions, coachAdviceRecords, profileSnapshot, trainingPlan] = await Promise.all([
        repository.listSessions(userId),
        repository.listCoachAdvices(userId),
        repository.loadSkillProfile(userId),
        repository.loadTrainingPlan(userId)
    ]);

    return createTrainingDataBundle({
        sessions,
        coachAdviceRecords,
        skillProfile: profileSnapshot.skillProfile,
        trainingPlan
    });
}

export async function importTrainingDataBundle(userId: string | undefined, bundle: TrainingDataBundle) {
    const repository = getTrainingRepository();
    const payload = parseTrainingDataBundle(bundle);

    await Promise.all(payload.sessions.map((session) => repository.saveSession(userId, session)));
    await Promise.all(payload.coachAdviceRecords.map((record) => repository.saveCoachAdvice(userId, record)));

    if (payload.skillProfile) {
        const previousSnapshot = await repository.loadSkillProfile(userId);
        await repository.saveSkillProfile(userId, {
            skillProfile: payload.skillProfile,
            achievements: previousSnapshot.achievements,
            streakState: previousSnapshot.streakState
        });
    }

    if (payload.trainingPlan) {
        await repository.saveTrainingPlan(userId, payload.trainingPlan);
    }

    return exportTrainingDataBundle(userId);
}
