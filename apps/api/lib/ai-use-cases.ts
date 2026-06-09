import {
    buildCoachAdviceProviderPayload,
    buildPracticeTextProviderPayload,
    extractMessageContent,
    normalizeCoachAdvicePayload
} from '@typemaster/ai';
import { normalizeCoachAdviceContent } from '@typemaster/contracts/training-state';
import { buildProviderPayload, loadAiConfig } from './ai-provider';

type ProviderPayload = ReturnType<typeof buildProviderPayload>;

export class AiUseCaseError extends Error {
    status: number;

    constructor(message: string, status = 500) {
        super(message);
        this.name = 'AiUseCaseError';
        this.status = status;
    }
}

function createProviderRequest(payload: unknown): ProviderPayload {
    return buildProviderPayload(payload);
}

async function requestProviderJson(payload: unknown) {
    const { AI_API_KEY, AI_API_URL } = loadAiConfig();

    if (!AI_API_KEY || !AI_API_URL) {
        throw new AiUseCaseError('Missing AI_API_KEY or AI_API_URL', 500);
    }

    const response = await fetch(AI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${AI_API_KEY}`
        },
        body: JSON.stringify(createProviderRequest(payload))
    });

    const text = await response.text();
    if (!response.ok) {
        throw new AiUseCaseError(text.trim() || 'AI provider request failed', response.status);
    }

    try {
        return JSON.parse(text);
    } catch (error: unknown) {
        throw new AiUseCaseError(error instanceof Error ? error.message : 'AI provider returned invalid JSON', 500);
    }
}

export async function generatePracticeText(payload: { config?: unknown, promptOverride?: string, language?: string }) {
    const providerPayload = buildPracticeTextProviderPayload(
        payload.config,
        payload.promptOverride || '',
        { language: payload.language || 'zh-CN' }
    );
    const providerResponse = await requestProviderJson(providerPayload);
    const text = extractMessageContent(providerResponse).trim();

    if (!text) {
        throw new AiUseCaseError('AI provider returned empty practice text', 500);
    }

    return { text };
}

export async function generateCoachAdvice(payload: { session?: unknown, history?: unknown[], language?: string }) {
    const language = payload.language || 'zh-CN';
    const providerPayload = buildCoachAdviceProviderPayload({
        session: payload.session,
        history: payload.history || [],
        language
    });
    const providerResponse = await requestProviderJson(providerPayload);
    const content = extractMessageContent(providerResponse).trim();

    if (!content) {
        throw new AiUseCaseError('AI provider returned empty coach advice', 500);
    }

    const advice = normalizeCoachAdviceContent(normalizeCoachAdvicePayload(content, language));
    return { advice };
}
