import type { Hono } from 'hono';
import { saveTrainingPlanRequestSchema } from '@typemaster/contracts/api';
import { getUserIdForIdentity } from '../services/auth-service';
import { getTrainingPlanSnapshot, saveTrainingPlanSnapshot } from '../services/plan-service';
import { resolveRequestIdentity } from '../infra/auth-context';
import { createBadRequestResponse, parseJsonBody } from '../lib/request-validation';

export function registerPlanRoutes(app: Hono) {
    app.get('/plans', async (c) => {
        const identity = await resolveRequestIdentity(c);
        const userId = await getUserIdForIdentity(identity);
        return c.json({ trainingPlan: await getTrainingPlanSnapshot(userId) });
    });

    app.post('/plans', async (c) => {
        try {
            const identity = await resolveRequestIdentity(c);
            const userId = await getUserIdForIdentity(identity);
            const body = await parseJsonBody(c, saveTrainingPlanRequestSchema);
            return c.json({
                trainingPlan: await saveTrainingPlanSnapshot(userId, body.trainingPlan || null)
            });
        } catch (error: unknown) {
            return createBadRequestResponse(c, error);
        }
    });
}
