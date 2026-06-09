import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

type ProviderPayload = {
    model: string,
    messages: unknown[],
    stream: boolean,
    max_tokens: number,
    temperature: number,
    response_format?: unknown,
};

export function loadAiConfig() {
    let AI_API_KEY = process.env.AI_API_KEY;
    let AI_API_URL = process.env.AI_API_URL;

    try {
        const config = require('../../config');
        if (config.AI_API_KEY) AI_API_KEY = config.AI_API_KEY;
        if (config.AI_API_URL) AI_API_URL = config.AI_API_URL;
    } catch {
        // Environment variables are the default deployment path.
    }

    return {
        AI_API_KEY,
        AI_API_URL
    };
}

function parsePayloadObject(payload: unknown): Record<string, unknown> {
    const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {};
}

export function buildProviderPayload(payload: unknown, fallbackModel = 'glm-4-flash'): ProviderPayload {
    const body = parsePayloadObject(payload);
    const safePayload: ProviderPayload = {
        model: typeof body.model === 'string' ? body.model : fallbackModel,
        messages: Array.isArray(body.messages) ? body.messages : [],
        stream: body.stream === true,
        max_tokens: typeof body.max_tokens === 'number' ? body.max_tokens : 4096,
        temperature: typeof body.temperature === 'number' ? body.temperature : 0.8
    };

    if (body.response_format && typeof body.response_format === 'object') {
        safePayload.response_format = body.response_format;
    }

    return safePayload;
}
