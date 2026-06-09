import type { Hono } from 'hono';
import { saveSkillProfileRequestSchema } from '@typemaster/contracts/api';
import { getUserIdForIdentity } from '../services/auth-service';
import { getSkillProfileSnapshot, saveSkillProfileSnapshot } from '../services/profile-service';
import { resolveRequestIdentity } from '../infra/auth-context';
import { createBadRequestResponse, parseJsonBody } from '../lib/request-validation';

export function registerProfileRoutes(app: Hono) {
    app.get('/profiles', async (c) => {
        const identity = await resolveRequestIdentity(c);
        const userId = await getUserIdForIdentity(identity);
        return c.json(await getSkillProfileSnapshot(userId));
    });

    app.post('/profiles', async (c) => {
        try {
            const identity = await resolveRequestIdentity(c);
            const userId = await getUserIdForIdentity(identity);
            const body = await parseJsonBody(c, saveSkillProfileRequestSchema);
            const nextProfile = await saveSkillProfileSnapshot(userId, {
                skillProfile: body.skillProfile || null,
                achievements: body.achievements || [],
                streakState: body.streakState || null
            });

            return c.json(nextProfile);
        } catch (error: unknown) {
            return createBadRequestResponse(c, error);
        }
    });
}
