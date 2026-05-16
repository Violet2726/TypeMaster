import { describe, it, expect, vi } from 'vitest';
import {
    AiServiceError,
    generatePracticeText,
    generateCoachAdvice,
    buildFallbackCoachAdvice,
    cleanJsonText,
    extractMessageContent,
    normalizeThrownError,
    normalizeCoachAdvicePayload,
    throwResponseError,
    streamTextResponse,
    withTimeout
} from '../ai-service.js';

describe('ai-service', () => {
    describe('AiServiceError', () => {
        it('should create an error with correct properties', () => {
            const cause = new Error('cause');
            const error = new AiServiceError('test_code', 'Test message', { status: 500, cause });
            expect(error.name).toBe('AiServiceError');
            expect(error.code).toBe('test_code');
            expect(error.message).toBe('Test message');
            expect(error.status).toBe(500);
            expect(error.cause).toBe(cause);
        });

        it('should handle missing options', () => {
            const error = new AiServiceError('test_code', 'Test message');
            expect(error.status).toBeNull();
            expect(error.cause).toBeNull();
        });

        it('should use default code if not provided', () => {
            const error = new AiServiceError(undefined, 'Test message');
            expect(error.code).toBe('unknown');
        });
    });

    describe('cleanJsonText', () => {
        it('should return plain text as-is', () => {
            expect(cleanJsonText('{"key": "value"}')).toBe('{"key": "value"}');
        });

        it('should remove markdown code block wrapper', () => {
            expect(cleanJsonText('```json\n{"key": "value"}\n```')).toBe('{"key": "value"}');
            expect(cleanJsonText('```\n{"key": "value"}\n```')).toBe('{"key": "value"}');
        });

        it('should handle empty string', () => {
            expect(cleanJsonText('')).toBe('');
            expect(cleanJsonText(null)).toBe('');
            expect(cleanJsonText(undefined)).toBe('');
        });
    });

    describe('extractMessageContent', () => {
        it('should extract from choices[0].text', () => {
            expect(extractMessageContent({ choices: [{ text: 'Hello' }] })).toBe('Hello');
        });

        it('should extract from choices[0].message.content (string)', () => {
            expect(extractMessageContent({ choices: [{ message: { content: 'Hello' } }] })).toBe('Hello');
        });

        it('should extract from choices[0].message.content (array)', () => {
            expect(extractMessageContent({ choices: [{ message: { content: ['Hello', ' ', 'World'] } }] })).toBe('Hello World');
        });

        it('should handle empty payload', () => {
            expect(extractMessageContent(null)).toBe('');
            expect(extractMessageContent({})).toBe('');
        });

        it('should handle empty choices', () => {
            expect(extractMessageContent({ choices: [] })).toBe('');
        });
    });

    describe('normalizeThrownError', () => {
        it('should return AiServiceError as-is', () => {
            const original = new AiServiceError('test', 'message');
            expect(normalizeThrownError(original)).toBe(original);
        });

        it('should convert AbortError to timeout error', () => {
            const abortError = new Error('Aborted');
            abortError.name = 'AbortError';
            const result = normalizeThrownError(abortError);
            expect(result.code).toBe('timeout');
            expect(result.message).toBe('The AI request timed out.');
        });

        it('should convert TypeError to network error', () => {
            const typeError = new TypeError('Failed to fetch');
            const result = normalizeThrownError(typeError);
            expect(result.code).toBe('network');
            expect(result.message).toBe('The AI request failed before a response arrived.');
        });

        it('should convert other errors to unknown error', () => {
            const error = new Error('Something went wrong');
            const result = normalizeThrownError(error);
            expect(result.code).toBe('unknown');
            expect(result.message).toBe('Something went wrong');
        });
    });

    describe('normalizeCoachAdvicePayload', () => {
        it('should normalize complete valid payload (Chinese)', () => {
            const payload = {
                headline: 'Great job!',
                summary: 'You did well.',
                strengths: ['Speed', 'Accuracy'],
                weaknesses: ['Punctuation'],
                nextDrill: {
                    label: 'Next drill',
                    reason: 'Practice more',
                    configPatch: { difficulty: 'hard' },
                    aiPrompt: 'Generate harder text'
                },
                comparison: {
                    label: 'improved',
                    summary: 'Better than last time'
                }
            };
            const result = normalizeCoachAdvicePayload(payload, 'zh-CN');
            expect(result.headline).toBe('Great job!');
            expect(result.summary).toBe('You did well.');
            expect(result.strengths).toEqual(['Speed', 'Accuracy']);
            expect(result.weaknesses).toEqual(['Punctuation']);
            expect(result.nextDrill.label).toBe('Next drill');
            expect(result.language).toBe('zh-CN');
        });

        it('should handle missing fields (English)', () => {
            const payload = {};
            const result = normalizeCoachAdvicePayload(payload, 'en-US');
            expect(result.headline).toBe('Keep moving into the next drill');
            expect(result.summary).toBe('This round is complete. Keep iterating on the current weakness.');
            expect(result.strengths).toEqual([]);
            expect(result.weaknesses).toEqual([]);
        });

        it('should parse JSON string payload', () => {
            const payload = JSON.stringify({ headline: 'Test' });
            const result = normalizeCoachAdvicePayload(payload, 'zh-CN');
            expect(result.headline).toBe('Test');
        });

        it('should throw error for invalid JSON string', () => {
            expect(() => normalizeCoachAdvicePayload('invalid-json', 'zh-CN')).toThrow(AiServiceError);
        });
    });

    describe('throwResponseError', () => {
        it('should throw error for missing API key', async () => {
            const response = {
                ok: false,
                text: async () => 'Missing AI_API_KEY'
            };
            await expect(throwResponseError(response)).rejects.toThrow(AiServiceError);
        });

        it('should throw server error for 5xx status', async () => {
            const response = {
                ok: false,
                status: 500,
                text: async () => 'Internal Server Error'
            };
            await expect(throwResponseError(response)).rejects.toThrow(AiServiceError);
        });
    });

    describe('generatePracticeText', () => {
        it('should throw error when fetch fails', async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')));
            await expect(generatePracticeText({ aiTemplate: 'daily', difficulty: 'easy', source: 'ai', includePunctuation: false, includeNumbers: false })).rejects.toThrow(AiServiceError);
            vi.unstubAllGlobals();
        });
    });

    describe('generateCoachAdvice', () => {
        it('should throw error when fetch fails', async () => {
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')));
            await expect(generateCoachAdvice({ session: { config: {}, result: {}, sourceTextMeta: {} }, history: [] })).rejects.toThrow(AiServiceError);
            vi.unstubAllGlobals();
        });
    });
});
