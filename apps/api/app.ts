import { Hono } from 'hono';
import { createApiRoutes } from './routes/api';
import { registerStaticRoutes } from './routes/static';

export function createApp() {
    const app = new Hono();

    app.route('/api', createApiRoutes());
    registerStaticRoutes(app);
    app.notFound(() => new Response('Not found', { status: 404 }));

    return app;
}

export const app = createApp();

export default app;
