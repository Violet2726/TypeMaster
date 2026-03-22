/**
 * AI 服务层。
 *
 * 它是前端和 `/api/chat` 代理之间的唯一桥梁，负责两类能力：
 * 1. 生成练习文本（流式）
 * 2. 生成结构化教练建议（非流式 JSON）
 *
 * 另外，这里也负责做超时控制、返回值清洗和本地兜底入口。
 */
import {
    buildLocalCoachAdvice,
    createDraftFromText,
    estimateTargetWordCount,
    getDifficultyMeta,
    getTemplateMeta
} from '../engine';

const AI_API_URL = '/api/chat';

/**
 * 为 fetch 构造超时控制器。
 */
function withTimeout(timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    return {
        controller,
        cleanup: () => clearTimeout(timer)
    };
}

/**
 * 清洗模型有时返回的 ```json 包裹。
 */
function cleanJsonText(text) {
    const trimmed = (text || '').trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('```')) {
        return trimmed.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
    }
    return trimmed;
}

/**
 * 兼容不同上游模型返回格式，抽取文本内容。
 */
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

/**
 * 解析 SSE 流式响应，把 delta 内容拼接为完整文本。
 */
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
                // 流式帧可能会被拆包，这里允许无害失败。
            }
        });
    }

    if (carry.trim().startsWith('data: ')) {
        try {
            const parsed = JSON.parse(carry.trim().slice(6));
            fullText += parsed.choices?.[0]?.delta?.content || '';
        } catch (error) {
            // 收尾帧如果不完整，直接忽略即可。
        }
    }

    return fullText.trim();
}

/**
 * 根据当前训练配置生成 AI 练习文本。
 */
export async function generatePracticeText(config, promptOverride = '') {
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
            throw new Error('Failed to generate practice text');
        }

        const text = await streamTextResponse(response);
        if (!text) {
            throw new Error('The AI returned an empty practice text.');
        }

        return createDraftFromText(text, { ...config, source: 'ai' }, {
            label: `${template.label} · ${difficulty.label}`,
            template: config.aiTemplate,
            difficulty: config.difficulty,
            prompt: promptOverride || null,
            generatedBy: 'ai'
        });
    } finally {
        cleanup();
    }
}

/**
 * 规范化 AI 教练返回结果，确保页面拿到的结构稳定。
 */
function normalizeCoachAdvicePayload(rawAdvice) {
    const advice = typeof rawAdvice === 'string' ? JSON.parse(cleanJsonText(rawAdvice)) : rawAdvice;

    return {
        headline: advice.headline || '继续下一练',
        summary: advice.summary || '本次训练已完成，建议继续根据弱项迭代。',
        strengths: Array.isArray(advice.strengths) ? advice.strengths.filter(Boolean) : [],
        weaknesses: Array.isArray(advice.weaknesses) ? advice.weaknesses.filter(Boolean) : [],
        nextDrill: {
            label: advice.nextDrill?.label || '开始下一练',
            reason: advice.nextDrill?.reason || '继续强化本次训练短板',
            configPatch: advice.nextDrill?.configPatch || {},
            aiPrompt: advice.nextDrill?.aiPrompt || ''
        },
        comparison: advice.comparison || {
            label: 'mixed',
            summary: advice.comparison?.summary || '已生成本次训练建议。'
        },
        language: 'zh-CN'
    };
}

/**
 * 生成 AI 教练建议。
 * 这里强制要求模型返回结构化 JSON，而不是自由文本。
 */
export async function generateCoachAdvice({ session, history }) {
    const { config, result, sourceTextMeta } = session;
    const template = getTemplateMeta(config.aiTemplate);

    /**
     * 只传最近 5 次摘要，避免 prompt 过长。
     */
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
                        content: 'You are an AI typing coach. Return only valid JSON. Keep the language zh-CN. Do not wrap the JSON in markdown.'
                    },
                    {
                        role: 'user',
                        content: JSON.stringify({
                            goal: 'Generate coaching feedback for a typing test result.',
                            template: template.label,
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
                                language: 'zh-CN'
                            }
                        })
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error('Failed to generate coach advice');
        }

        const payload = await response.json();
        const content = extractMessageContent(payload);
        if (!content) {
            throw new Error('The AI returned an empty coach payload.');
        }

        return normalizeCoachAdvicePayload(content);
    } finally {
        cleanup();
    }
}

/**
 * 暴露本地回退入口，方便 store 在 AI 失败时快速切换。
 */
export function buildFallbackCoachAdvice(payload) {
    return buildLocalCoachAdvice(payload);
}
