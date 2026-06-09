import type { z } from 'zod';
import { CoachAdviceRecordSchema } from '@typemaster/contracts/training-state';
import { enqueueCoachFeedback } from '../infra/jobs';
import { getTrainingRepository } from '../repositories/training-repository';

type CoachAdviceRecord = z.infer<typeof CoachAdviceRecordSchema>;

export function getCoachAdviceRecords(userId: string | undefined, sessionId?: string) {
    return getTrainingRepository().listCoachAdvices(userId, sessionId);
}

export function saveCoachAdviceRecord(userId: string | undefined, record: CoachAdviceRecord) {
    return getTrainingRepository().saveCoachAdvice(userId, record);
}

export async function requestCoachFeedbackGeneration(
    userId: string | undefined,
    sessionId: string,
    payload: Record<string, unknown> = {}
) {
    if (!userId || !sessionId) {
        return null;
    }

    await saveCoachAdviceRecord(userId, {
        sessionId,
        status: 'pending',
        strengths: [],
        weaknesses: [],
        providerMeta: {
            requestedAt: new Date().toISOString()
        }
    });

    return enqueueCoachFeedback({
        userId,
        sessionId,
        ...payload
    });
}
