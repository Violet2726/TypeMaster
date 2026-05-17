import {
    AiServiceError,
    cleanJsonText,
    extractMessageContent,
    normalizeThrownError,
    normalizeCoachAdvicePayload,
    throwResponseError
} from '../ai-service';
import { describe, it, expect, vi } from 'vitest';

describe('AiServiceError', () => {
    it('should create an instance with correct properties', () => {
        const cause = new Error('original error');
        const error = new AiServiceError('test_code', 'Test message', {
            status: 500,
            cause
        });

        expect(error.name).toBe('AiServiceError');
        expect(error.code).toBe('test_code');
        expect(error.message).toBe('Test message');
        expect(error.status).toBe(500);
        expect(error.cause).toBe(cause);
    });

    it('should use default values when optional parameters are not provided', () => {
        const error = new AiServiceError();

        expect(error.code).toBe('unknown');
        expect(error.status).toBeNull();
        expect(error.cause).toBeNull();
    });
});

describe('cleanJsonText', () => {
    it('should return trimmed text if it is not wrapped in markdown code blocks', () => {
        expect(cleanJsonText('  hello world  ')).toBe('hello world');
    });

    it('should remove markdown code block wrappers (```json)', () => {
        expect(cleanJsonText('```json\n{"key": "value"}\n```')).toBe('{"key": "value"}');
    });

    it('should remove markdown code block wrappers (```)', () => {
        expect(cleanJsonText('```\n{"key": "value"}\n```')).toBe('{"key": "value"}');
    });

    it('should handle case-insensitive json in code block', () => {
        expect(cleanJsonText('```JSON\n{"key": "value"}\n```')).toBe('{"key": "value"}');
    });

    it('should return empty string for falsy input', () => {
        expect(cleanJsonText('')).toBe('');
        expect(cleanJsonText(null)).toBe('');
        expect(cleanJsonText(undefined)).toBe('');
    });

    it('should handle only code block markers', () => {
        expect(cleanJsonText('```')).toBe('');
        expect(cleanJsonText('```json')).toBe('');
    });
});

describe('extractMessageContent', () => {
    it('should extract text from choices[0].text', () => {
        const payload = { choices: [{ text: 'Hello from text' }] };
        expect(extractMessageContent(payload)).toBe('Hello from text');
    });

    it('should extract content from choices[0].message.content as string', () => {
        const payload = { choices: [{ message: { content: 'Hello from message' } }] };
        expect(extractMessageContent(payload)).toBe('Hello from message');
    });

    it('should extract and join content from choices[0].message.content as array', () => {
        const payload = {
            choices: [
                {
                    message: {
                        content: ['Hello ', { text: 'from ' }, 'array']
                    }
                }
            ]
        };
        expect(extractMessageContent(payload)).toBe('Hello from array');
    });

    it('should return empty string for invalid payload', () => {
        expect(extractMessageContent(null)).toBe('');
        expect(extractMessageContent(undefined)).toBe('');
        expect(extractMessageContent({})).toBe('');
        expect(extractMessageContent({ choices: [] })).toBe('');
        expect(extractMessageContent({ choices: [{}] })).toBe('');
        expect(extractMessageContent({ choices: [{ message: null }] })).toBe('');
    });
});

describe('normalizeThrownError', () => {
    it('should return AiServiceError as-is', () => {
        const original = new AiServiceError('test', 'test message');
        expect(normalizeThrownError(original)).toBe(original);
    });

    it('should convert AbortError to timeout error', () => {
        const abortError = { name: 'AbortError' };
        const result = normalizeThrownError(abortError);
        expect(result.code).toBe('timeout');
        expect(result.message).toBe('The AI request timed out.');
        expect(result.cause).toBe(abortError);
    });

    it('should convert TypeError to network error', () => {
        const typeError = new TypeError('Network failed');
        const result = normalizeThrownError(typeError);
        expect(result.code).toBe('network');
        expect(result.message).toBe('The AI request failed before a response arrived.');
        expect(result.cause).toBe(typeError);
    });

    it('should convert other errors to unknown error', () => {
        const error = new Error('Something went wrong');
        const result = normalizeThrownError(error);
        expect(result.code).toBe('unknown');
        expect(result.message).toBe('Something went wrong');
        expect(result.cause).toBe(error);
    });

    it('should handle falsy input', () => {
        const result = normalizeThrownError(null);
        expect(result.code).toBe('unknown');
        expect(result.message).toBe('Unknown AI service error.');
    });
});

describe('normalizeCoachAdvicePayload', () => {
    it('should normalize a complete valid payload (Chinese)', () => {
        const raw = {
            headline: 'Great job!',
            summary: 'Nice work on this drill.',
            strengths: ['Good speed', 'High accuracy'],
            weaknesses: ['Some typos'],
            nextDrill: {
                label: 'Next drill',
                reason: 'Keep practicing',
                configPatch: { difficulty: 'hard' },
                aiPrompt: 'Focus on speed'
            },
            comparison: {
                label: 'improved',
                summary: 'Better than last time'
            }
        };

        const result = normalizeCoachAdvicePayload(raw, 'zh-CN');
        expect(result.headline).toBe('Great job!');
        expect(result.summary).toBe('Nice work on this drill.');
        expect(result.strengths).toEqual(['Good speed', 'High accuracy']);
        expect(result.weaknesses).toEqual(['Some typos']);
        expect(result.nextDrill.label).toBe('Next drill');
        expect(result.comparison.label).toBe('improved');
        expect(result.language).toBe('zh-CN');
    });

    it('should normalize a complete valid payload (English)', () => {
        const raw = {
            headline: 'Excellent!',
            summary: 'Well done.',
            strengths: ['Fast'],
            weaknesses: [],
            nextDrill: {
                label: 'Keep going',
                reason: 'Practice more',
                configPatch: {},
                aiPrompt: ''
            },
            comparison: {
                label: 'same',
                summary: 'Consistent performance'
            }
        };

        const result = normalizeCoachAdvicePayload(raw, 'en-US');
        expect(result.language).toBe('en-US');
    });

    it('should provide default values for missing fields (Chinese)', () => {
        const raw = {};
        const result = normalizeCoachAdvicePayload(raw, 'zh-CN');
        expect(result.headline).toBe('继续下一练');
        expect(result.strengths).toEqual([]);
        expect(result.weaknesses).toEqual([]);
        expect(result.nextDrill.label).toBe('开始下一练');
    });

    it('should provide default values for missing fields (English)', () => {
        const raw = {};
        const result = normalizeCoachAdvicePayload(raw, 'en-US');
        expect(result.headline).toBe('Keep moving into the next drill');
        expect(result.nextDrill.label).toBe('Start next drill');
    });

    it('should parse JSON string input', () => {
        const raw = JSON.stringify({
            headline: 'From string',
            summary: 'Parsed correctly'
        });
        const result = normalizeCoachAdvicePayload(raw);
        expect(result.headline).toBe('From string');
        expect(result.summary).toBe('Parsed correctly');
    });

    it('should handle markdown-wrapped JSON', () => {
        const raw = '```json\n{"headline": "Wrapped in markdown"}\n```';
        const result = normalizeCoachAdvicePayload(raw);
        expect(result.headline).toBe('Wrapped in markdown');
    });

    it('should throw error for invalid JSON', () => {
        expect(() => normalizeCoachAdvicePayload('not valid json')).toThrow(AiServiceError);
    });
});

describe('throwResponseError', () => {
    it('should throw AiServiceError with missing_config for Missing AI_API_KEY message', async () => {
        const mockResponse = {
            ok: false,
            status: 500,
            text: async () => 'Missing AI_API_KEY'
        };

        await expect(throwResponseError(mockResponse)).rejects.toThrow(AiServiceError);
        await expect(throwResponseError(mockResponse)).rejects.toMatchObject({
            code: 'missing_config',
            status: 500
        });
    });

    it('should throw AiServiceError with server_error for 5xx status', async () => {
        const mockResponse = {
            ok: false,
            status: 502,
            text: async () => 'Internal server error'
        };

        await expect(throwResponseError(mockResponse)).rejects.toThrow(AiServiceError);
        await expect(throwResponseError(mockResponse)).rejects.toMatchObject({
            code: 'server_error',
            status: 502
        });
    });

    it('should handle empty response text', async () => {
        const mockResponse = {
            ok: false,
            status: 400,
            text: async () => ''
        };

        await expect(throwResponseError(mockResponse)).rejects.toThrow(AiServiceError);
        await expect(throwResponseError(mockResponse)).rejects.toMatchObject({
            code: 'server_error'
        });
    });
});
