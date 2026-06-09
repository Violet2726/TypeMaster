import type { z } from 'zod';
import { SessionRecordSchema } from '@typemaster/contracts/training-state';
import { getTrainingRepository } from '../repositories/training-repository';
import {
    enqueueProfileRecompute,
    enqueueSessionCompletedWork
} from '../infra/jobs';
import { requestCoachFeedbackGeneration } from './coach-service';

type SessionRecord = z.infer<typeof SessionRecordSchema>;

export function getUserSessions(userId: string | undefined) {
    return getTrainingRepository().listSessions(userId);
}

export async function syncUserSession(userId: string | undefined, session: SessionRecord) {
    const repository = getTrainingRepository();
    const sessions = await repository.saveSession(userId, session);
    const user = await repository.getUser(userId);

    if (user?.id) {
        await Promise.all([
            enqueueSessionCompletedWork({ userId: user.id, sessionId: session.id }),
            requestCoachFeedbackGeneration(user.id, session.id),
            enqueueProfileRecompute({ userId: user.id, sessionId: session.id })
        ]);
    }

    return sessions;
}
