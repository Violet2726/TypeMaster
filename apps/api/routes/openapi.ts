import type { Hono } from 'hono';
import { createOpenApiDocument } from '../openapi';

export function registerOpenApiRoutes(app: Hono) {
    app.get('/openapi.json', (c) => c.json(createOpenApiDocument()));
}
