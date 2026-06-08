/**
 * AI 服务层。
 *
 * 统一处理：
 * - AI 练习文本生成
 * - AI 教练建议生成
 * - 错误归类与超时控制
 * - 本地规则兜底入口
 */
import {
    buildLocalCoachAdvice,
    createDraftFromText,
    estimateTargetWordCount,
    getDifficultyLabel,
    getDifficultyMeta,
    getTemplateLabel,
    getTemplateMeta
} from '../engine';

const AI_API_URL = '/api/chat';
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
    return import.meta.env?.VITE_TYPEMASTER_AI_PROXY === AI_PROXY_FLAG;
}

function assertAiProxyEnabled() {
    if (!shouldUseAiProxy()) {
        throw new AiServiceError(
            'missing_config',
            'AI proxy is disabled. Set VITE_TYPEMASTER_AI_PROXY=1 before requesting AI features.'
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
        : /Missing AI_API_KEY|Missing AI_API_URL/i.test(message)
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
            } catch (error) {
                // 流式帧拆包时允许无害忽略。
            }
        });
    }

    if (carry.trim().startsWith('data: ')) {
        try {
            const parsed = JSON.parse(carry.trim().slice(6));
            fullText += parsed.choices?.[0]?.delta?.content || '';
        } catch (error) {
            // 收尾帧不完整时忽略。
        }
    }

    return fullText.trim();
}

function normalizeCoachAdvicePayload(rawAdvice, language = 'zh-CN') {
    let advice;
    try {
        advice = typeof rawAdvice === 'string' ? JSON.parse(cleanJsonText(rawAdvice)) : rawAdvice;
    } catch (error) {
        throw new AiServiceError('server_error', 'The AI returned an invalid coach payload.', { cause: error });
    }

    const isEnglish = language === 'en-US';

    return {
        headline: advice.headline || (isEnglish ? 'Keep moving into the next drill' : '继续下一练'),
        summary: advice.summary || (isEnglish
            ? 'This round is complete. Keep iterating on the current weakness.'
            : '本次训练已完成，建议继续根据弱项迭代。'),
        strengths: Array.isArray(advice.strengths) ? advice.strengths.filter(Boolean) : [],
        weaknesses: Array.isArray(advice.weaknesses) ? advice.weaknesses.filter(Boolean) : [],
        nextDrill: {
            label: advice.nextDrill?.label || (isEnglish ? 'Start next drill' : '开始下一练'),
            reason: advice.nextDrill?.reason || (isEnglish
                ? 'Keep reinforcing the current weakness.'
                : '继续强化本次训练短板'),
            configPatch: advice.nextDrill?.configPatch || {},
            aiPrompt: advice.nextDrill?.aiPrompt || ''
        },
        comparison: advice.comparison || {
            label: 'mixed',
            summary: advice.comparison?.summary || (isEnglish
                ? 'A training summary has been generated for this round.'
                : '已生成本次训练建议。')
        },
        language
    };
}

export async function generatePracticeText(config, promptOverride = '', options = {}) {
    assertAiProxyEnabled();

    const language = options.language || 'zh-CN';
    const template = getTemplateMeta(config.aiTemplate);
    const difficulty = getDifficultyMeta(config.difficulty);
    const targetWords = estimateTargetWordCount(config);
    const punctuationHint = config.includePunctuation ? 'Include natural punctuation.' : 'Do not use punctuation.';
    const numberHint = config.includeNumbers ? 'Include a few natural numbers.' : 'Do not include digits.';
    const customPrompt = promptOverride
        ? `Also follow this drill requirement: ${promptOverride}`
        : '';

    const { controller, cleanup } = withTimeout(20000);

    try {
        const response = await fetch(AI_API_URL, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                stream: true,
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
                            customPrompt
                        ].join(' ')
                    }
                ]
            })
        });

        if (!response.ok) {
            await throwResponseError(response);
        }

        const text = await streamTextResponse(response);
        if (!text) {
            throw new AiServiceError('empty_response', 'The AI returned an empty practice text.');
        }

        return createDraftFromText(text, { ...config, source: 'ai' }, {
            label: `${getTemplateLabel(template, language)} · ${getDifficultyLabel(difficulty, language)}`,
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

    const { config, result, sourceTextMeta } = session;
    const template = getTemplateMeta(config.aiTemplate);
    const recentHistory = history.slice(0, 5).map((item) => ({
        completedAt: item.result.completedAt,
        wpm: item.result.wpm,
        accuracy: item.result.accuracy,
        consistency: item.result.consistency,
        topErrorChars: item.result.topErrorChars,
        topErrorWords: item.result.topErrorWords
    }));

    const { controller, cleanup } = withTimeout(12000);

    try {
        const response = await fetch(AI_API_URL, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
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
            })
        });

        if (!response.ok) {
            await throwResponseError(response);
        }

        const payload = await response.json();
        const content = extractMessageContent(payload);
        if (!content) {
            throw new AiServiceError('empty_response', 'The AI returned an empty coach payload.');
        }

        return normalizeCoachAdvicePayload(content, language);
    } catch (error) {
        throw normalizeThrownError(error);
    } finally {
        cleanup();
    }
}

export function buildFallbackCoachAdvice(payload) {
    return buildLocalCoachAdvice(payload);
}

// Export internal functions for testing
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

