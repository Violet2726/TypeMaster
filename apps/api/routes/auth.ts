import type { Hono } from 'hono';
import { SignInRequestSchema } from '@typemaster/contracts/api';
import { getCurrentUserForIdentity, signInUser } from '../services/auth-service';
import { resolveRequestIdentity } from '../infra/auth-context';
import { createBadRequestResponse, parseJsonBody } from '../lib/request-validation';

export function registerAuthRoutes(app: Hono) {
    app.get('/me', async (c) => {
        const identity = await resolveRequestIdentity(c);
        return c.json({ user: await getCurrentUserForIdentity(identity) });
    });

    app.post('/auth/sign-in', async (c) => {
        try {
            const body = await parseJsonBody(c, SignInRequestSchema);
            const user = await signInUser(body.displayName);
            return c.json({ user });
        } catch (error: unknown) {
            return createBadRequestResponse(c, error);
        }
    });
}
