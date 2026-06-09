import type { Hono } from 'hono';
import { resolveRequestIdentity } from '../infra/auth-context';
import { getUserIdForIdentity } from '../services/auth-service';
import { getCoachAdviceRecords } from '../services/coach-service';

export function registerCoachFeedbackRoutes(app: Hono) {
    app.get('/coach-feedback', async (c) => {
        const identity = await resolveRequestIdentity(c);
        const userId = await getUserIdForIdentity(identity);
        const sessionId = c.req.query('sessionId') || undefined;

        return c.json({
            coachAdvices: await getCoachAdviceRecords(userId, sessionId)
        });
    });
}
