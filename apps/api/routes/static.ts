import type { Hono } from 'hono';
import {
    createMissingFrontendBuildResponse,
    hasFrontendBuild,
    serveStaticRequest
} from '../services/static-assets';

export function registerStaticRoutes(app: Hono) {
    app.get('*', async (c) => {
        const hasBuild = await hasFrontendBuild();

        if (!hasBuild) {
            if (c.req.path === '/' || c.req.path === '/index.html') {
                return createMissingFrontendBuildResponse();
            }

            return new Response('404 Not Found', { status: 404 });
        }

        return serveStaticRequest(c.req.path);
    });
}
