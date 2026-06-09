import type { Context, Hono } from 'hono';
import { CoachAdviceRequestSchema, PracticeTextRequestSchema } from '@typemaster/contracts/api';
import { createBadRequestResponse, parseJsonBody } from '../lib/request-validation';
import { AiUseCaseError, generateCoachAdvice, generatePracticeText } from '../lib/ai-use-cases';

function createAiErrorResponse(c: Context, error: unknown) {
    if (error instanceof AiUseCaseError) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: error.status,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    return createBadRequestResponse(c, error);
}

export function registerAiRoutes(app: Hono) {
    app.post('/practice-text', async (c) => {
        try {
            const body = await parseJsonBody(c, PracticeTextRequestSchema);
            return c.json(await generatePracticeText(body));
        } catch (error: unknown) {
            return createAiErrorResponse(c, error);
        }
    });

    app.post('/coach', async (c) => {
        try {
            const body = await parseJsonBody(c, CoachAdviceRequestSchema);
            return c.json(await generateCoachAdvice(body));
        } catch (error: unknown) {
            return createAiErrorResponse(c, error);
        }
    });
}
