import type { Hono } from 'hono';
import { serve } from 'inngest/hono';
import { inngest } from '../infra/jobs';
import { inngestFunctions } from '../jobs/inngest-functions';

const inngestHandler = serve({
    client: inngest,
    functions: inngestFunctions
});

export function registerInngestRoutes(app: Hono) {
    app.on(['GET', 'POST', 'PUT'], '/inngest', (c) => inngestHandler(c));
}
