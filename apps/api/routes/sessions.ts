import type { Hono } from 'hono';
import { saveSessionRequestSchema } from '@typemaster/contracts/api';
import { getUserIdForIdentity } from '../services/auth-service';
import { getUserSessions, syncUserSession } from '../services/session-service';
import { resolveRequestIdentity } from '../infra/auth-context';
import { createBadRequestResponse, parseJsonBody } from '../lib/request-validation';

export function registerSessionRoutes(app: Hono) {
    app.get('/sessions', async (c) => {
        const identity = await resolveRequestIdentity(c);
        const userId = await getUserIdForIdentity(identity);
        return c.json({ sessions: await getUserSessions(userId) });
    });

    app.post('/sessions', async (c) => {
        try {
            const identity = await resolveRequestIdentity(c);
            const userId = await getUserIdForIdentity(identity);
            const body = await parseJsonBody(c, saveSessionRequestSchema);
            return c.json({ sessions: await syncUserSession(userId, body.session) });
        } catch (error: unknown) {
            return createBadRequestResponse(c, error);
        }
    });
}
