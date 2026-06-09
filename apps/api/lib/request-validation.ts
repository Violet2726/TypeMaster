import type { Context } from 'hono';
import { ZodError, type ZodSchema } from 'zod';

export async function parseJsonBody<T>(c: Context, schema: ZodSchema<T>) {
    const body = await c.req.json();
    return schema.parse(body);
}

export function createBadRequestResponse(c: Context, error: unknown) {
    const message =
        error instanceof ZodError
            ? error.issues?.[0]?.message || 'Invalid request'
            : error instanceof Error
                ? error.message
                : 'Invalid request';

    return c.json({ error: message }, 400);
}
