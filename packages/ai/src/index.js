import {
    buildLocalCoachAdvice,
    createDraftFromText,
    estimateTargetWordCount,
    getDifficultyLabel,
    getDifficultyMeta,
    getTemplateLabel,
    getTemplateMeta
} from '@typemaster/domain';
import { normalizeCoachAdviceContent } from '@typemaster/contracts/training-state';

const PRACTICE_TEXT_API_URL = '/api/practice-text';
const COACH_ADVICE_API_URL = '/api/coach';
const AI_PROXY_FLAG = '1';

export class AiServiceError extends Error {
    constructor(code, message, options = {}) {
        super(message);
        this.name = 'AiServiceError';
        this.code = code || 'unknown';
        this.status = options.status || null;
        this.cause = options.cause || null;
    }
}

function withTimeout(timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return {
        controller,
        cleanup: () => clearTimeout(timer)
    };
}

function shouldUseAiProxy() {
    const env = typeof process !== 'undefined' ? process.env : {};
    return env.NEXT_PUBLIC_TYPEMASTER_AI_PROXY === AI_PROXY_FLAG;
}

function assertAiProxyEnabled() {
    if (!shouldUseAiProxy()) {
        throw new AiServiceError(
            'missing_config',
            'AI proxy is disabled. Set NEXT_PUBLIC_TYPEMASTER_AI_PROXY=1 before requesting AI features.'
        );
    }
}

function cleanJsonText(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('```')) {
        return trimmed.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    }
    return trimmed;
}

function extractMessageContent(payload) {
    if (!payload || !Array.isArray(payload.choices) || payload.choices.length === 0) {
        return '';
    }

    if (typeof payload.choices[0].text === 'string') {
        return payload.choices[0].text;
    }

    const message = payload.choices[0].message;
    if (!message) return '';

    if (typeof message.content === 'string') {
        return message.content;
    }

    if (Array.isArray(message.content)) {
        return message.content
            .map((item) => (typeof item === 'string' ? item : item?.text || ''))
            .join('');
    }

    return '';
}

async function throwResponseError(response) {
    const text = await response.text().catch(() => '');
    const message = (text || '').trim();
    const code = !message
        ? 'server_error'
        : /Missing AI_API_KEY|Missing AI_API_URL|AI proxy is disabled/i.test(message)
            ? 'missing_config'
            : response.status >= 500
                ? 'server_error'
                : 'server_error';

    throw new AiServiceError(code, message || 'The AI service returned an error.', {
        status: response.status
    });
}

function normalizeThrownError(error) {
    if (error instanceof AiServiceError) {
        return error;
    }

    if (error?.name === 'AbortError') {
        return new AiServiceError('timeout', 'The AI request timed out.', { cause: error });
    }

    if (error instanceof TypeError) {
        return new AiServiceError('network', 'The AI request failed before a response arrived.', { cause: error });
    }

    return new AiServiceError('unknown', error?.message || 'Unknown AI service error.', { cause: error });
}

async function streamTextResponse(response) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');

    if (!reader) {
        return '';
    }

    let fullText = '';
    let carry = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        carry += decoder.decode(value, { stream: true });
        const chunks = carry.split('\n');
        carry = chunks.pop() || '';

        chunks.forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) {
                return;
            }

            const data = trimmed.slice(6);
            if (data === '[DONE]') {
                return;
            }

            try {
                const parsed = JSON.parse(data);
                fullText += parsed.choices?.[0]?.delta?.content || '';
            } catch {
                // Streaming frames may split JSON chunks; incomplete frames are ignored.
            }
        });
    }

    if (carry.trim().startsWith('data: ')) {
        try {
            const parsed = JSON.parse(carry.trim().slice(6));
            fullText += parsed.choices?.[0]?.delta?.content || '';
        } catch {
            // A trailing incomplete frame is safe to ignore.
        }
    }

    return fullText.trim();
}

function getEnglishOrChinese(language, english, chinese) {
    return language === 'en-US' ? english : chinese;
}

function normalizeCoachAdvicePayload(rawAdvice, language = 'zh-CN') {
    let advice;
    try {
        advice = typeof rawAdvice === 'string' ? JSON.parse(cleanJsonText(rawAdvice)) : rawAdvice;
    } catch (error) {
        throw new AiServiceError('server_error', 'The AI returned an invalid coach payload.', { cause: error });
    }

    const body = advice && typeof advice === 'object' && !Array.isArray(advice) ? advice : {};
    const nextDrill = body.nextDrill && typeof body.nextDrill === 'object' && !Array.isArray(body.nextDrill)
        ? body.nextDrill
        : {};
    const comparison = body.comparison && typeof body.comparison === 'object' && !Array.isArray(body.comparison)
        ? body.comparison
        : null;

    return {
        headline: body.headline || getEnglishOrChinese(language, 'Keep moving into the next drill', '继续进入下一轮训练'),
        summary: body.summary || getEnglishOrChinese(
            language,
            'This round is complete. Keep iterating on the current weakness.',
            '本次训练已经完成，建议继续围绕当前弱点迭代。'
        ),
        strengths: Array.isArray(body.strengths) ? body.strengths.filter(Boolean) : [],
        weaknesses: Array.isArray(body.weaknesses) ? body.weaknesses.filter(Boolean) : [],
        nextDrill: {
            label: nextDrill.label || getEnglishOrChinese(language, 'Start next drill', '开始下一轮'),
            reason: nextDrill.reason || getEnglishOrChinese(
                language,
                'Keep reinforcing the current weakness.',
                '继续强化本次训练暴露出的短板。'
            ),
            configPatch: nextDrill.configPatch || {},
            aiPrompt: nextDrill.aiPrompt || ''
        },
        comparison: comparison || {
            label: 'mixed',
            summary: getEnglishOrChinese(
                language,
                'A training summary has been generated for this round.',
                '已生成本轮训练建议。'
            )
        },
        language
    };
}

export function buildPracticeTextProviderPayload(config, promptOverride = '', options = {}) {
    const language = options.language || 'zh-CN';
    const template = getTemplateMeta(config.aiTemplate);
    const difficulty = getDifficultyMeta(config.difficulty);
    const targetWords = estimateTargetWordCount(config);
    const punctuationHint = config.includePunctuation ? 'Include natural punctuation.' : 'Do not use punctuation.';
    const numberHint = config.includeNumbers ? 'Include a few natural numbers.' : 'Do not include digits.';
    const customPrompt = promptOverride
        ? `Also follow this drill requirement: ${promptOverride}`
        : '';

    return {
        stream: false,
        temperature: 0.75,
        max_tokens: 4096,
        messages: [
            {
                role: 'system',
                content: 'You create English typing practice text. Return raw English text only. No title, no markdown, no numbering.'
            },
            {
                role: 'user',
                content: [
                    `Generate coherent English typing practice with strictly ${targetWords} words.`,
                    `Theme: ${template.prompt}.`,
                    difficulty.prompt,
                    punctuationHint,
                    numberHint,
                    customPrompt,
                    `Interface language: ${language}.`
                ].filter(Boolean).join(' ')
            }
        ]
    };
}

export function buildCoachAdviceProviderPayload({ session, history = [], language = 'zh-CN' }) {
    const { config = {}, result = {}, sourceTextMeta = {} } = session;
    const template = getTemplateMeta(config.aiTemplate);
    const recentHistory = history.slice(0, 5).map((item) => ({
        completedAt: item.result?.completedAt,
        wpm: item.result?.wpm,
        accuracy: item.result?.accuracy,
        consistency: item.result?.consistency,
        topErrorChars: item.result?.topErrorChars,
        topErrorWords: item.result?.topErrorWords
    }));

    return {
        stream: false,
        temperature: 0.35,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content: `You are an AI typing coach. Return only valid JSON. Keep the language ${language}. Do not wrap the JSON in markdown.`
            },
            {
                role: 'user',
                content: JSON.stringify({
                    goal: 'Generate coaching feedback for a typing test result.',
                    language,
                    template: getTemplateLabel(template, language),
                    sourceTextMeta,
                    config,
                    result,
                    recentHistory,
                    outputSchema: {
                        headline: 'string',
                        summary: 'string',
                        strengths: ['string'],
                        weaknesses: ['string'],
                        comparison: {
                            label: 'string',
                            summary: 'string'
                        },
                        nextDrill: {
                            label: 'string',
                            reason: 'string',
                            configPatch: {
                                source: 'ai',
                                aiTemplate: 'daily | business | tech | developer',
                                difficulty: 'easy | medium | hard',
                                mode: 'time | words',
                                durationSeconds: 'number',
                                wordCount: 'number',
                                includePunctuation: 'boolean',
                                includeNumbers: 'boolean'
                            },
                            aiPrompt: 'string'
                        },
                        language
                    }
                })
            }
        ]
    };
}

async function readJsonProductResponse(response) {
    if (!response.ok) {
        await throwResponseError(response);
    }

    try {
        return await response.json();
    } catch (error) {
        throw new AiServiceError('server_error', 'The AI API returned invalid JSON.', { cause: error });
    }
}

export async function generatePracticeText(config, promptOverride = '', options = {}) {
    assertAiProxyEnabled();

    const language = options.language || 'zh-CN';
    const template = getTemplateMeta(config.aiTemplate);
    const difficulty = getDifficultyMeta(config.difficulty);
    const { controller, cleanup } = withTimeout(20000);

    try {
        const response = await fetch(PRACTICE_TEXT_API_URL, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                config,
                promptOverride,
                language
            })
        });

        const payload = await readJsonProductResponse(response);
        const text = typeof payload.text === 'string' ? payload.text.trim() : '';
        if (!text) {
            throw new AiServiceError('empty_response', 'The AI returned an empty practice text.');
        }

        const label = `${getTemplateLabel(template, language)} · ${getDifficultyLabel(difficulty, language)}`;
        return createDraftFromText(text, { ...config, source: 'ai' }, {
            label,
            template: config.aiTemplate,
            difficulty: config.difficulty,
            prompt: promptOverride || null,
            generatedBy: 'ai',
            language
        });
    } catch (error) {
        throw normalizeThrownError(error);
    } finally {
        cleanup();
    }
}

export async function generateCoachAdvice({ session, history, language = 'zh-CN' }) {
    assertAiProxyEnabled();

    const { controller, cleanup } = withTimeout(12000);

    try {
        const response = await fetch(COACH_ADVICE_API_URL, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                session,
                history,
                language
            })
        });

        const payload = await readJsonProductResponse(response);
        if (!payload.advice) {
            throw new AiServiceError('empty_response', 'The AI returned an empty coach payload.');
        }

        return normalizeCoachAdviceContent(payload.advice);
    } catch (error) {
        throw normalizeThrownError(error);
    } finally {
        cleanup();
    }
}

export function buildFallbackCoachAdvice(payload) {
    return normalizeCoachAdviceContent(buildLocalCoachAdvice(payload));
}

export {
    cleanJsonText,
    extractMessageContent,
    normalizeThrownError,
    normalizeCoachAdvicePayload,
    shouldUseAiProxy,
    throwResponseError,
    streamTextResponse,
    withTimeout
};
