import type { Hono } from 'hono';
import { ImportTrainingDataRequestSchema } from '@typemaster/contracts/api';
import { resolveRequestIdentity } from '../infra/auth-context';
import { createBadRequestResponse, parseJsonBody } from '../lib/request-validation';
import { getUserIdForIdentity } from '../services/auth-service';
import { exportTrainingDataBundle, importTrainingDataBundle } from '../services/export-service';

export function registerExportRoutes(app: Hono) {
    app.get('/exports', async (c) => {
        const identity = await resolveRequestIdentity(c);
        const userId = await getUserIdForIdentity(identity);

        return c.json({
            bundle: await exportTrainingDataBundle(userId)
        });
    });

    app.post('/exports', async (c) => {
        try {
            const identity = await resolveRequestIdentity(c);
            const userId = await getUserIdForIdentity(identity);
            const body = await parseJsonBody(c, ImportTrainingDataRequestSchema);

            return c.json({
                bundle: await importTrainingDataBundle(userId, body.bundle)
            });
        } catch (error: unknown) {
            return createBadRequestResponse(c, error);
        }
    });
}
