import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    normalizeText,
    tokenizeText,
    estimateTargetWordCount,
    createBuiltinWords,
    createDraftFromWords,
    createBuiltinDraft,
    createDraftFromText,
    doesDraftMatchConfig
} from '../draft';
import { commonWords } from '../../data/words';

describe('draft', () => {
    beforeEach(() => {
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('normalizeText', () => {
        it('should return empty string for null input', () => {
            expect(normalizeText(null)).toBe('');
        });

        it('should return empty string for undefined input', () => {
            expect(normalizeText(undefined)).toBe('');
        });

        it('should replace newlines with spaces', () => {
            expect(normalizeText('hello\nworld')).toBe('hello world');
        });

        it('should replace tabs with spaces', () => {
            expect(normalizeText('hello\tworld')).toBe('hello world');
        });

        it('should replace carriage returns with spaces', () => {
            expect(normalizeText('hello\rworld')).toBe('hello world');
        });

        it('should collapse multiple spaces', () => {
            expect(normalizeText('hello    world')).toBe('hello world');
        });

        it('should trim whitespace', () => {
            expect(normalizeText('  hello world  ')).toBe('hello world');
        });

        it('should handle mixed whitespace characters', () => {
            expect(normalizeText('  hello \r\n\t world  ')).toBe('hello world');
        });
    });

    describe('tokenizeText', () => {
        it('should split text by spaces', () => {
            expect(tokenizeText('hello world')).toEqual(['hello', 'world']);
        });

        it('should filter out empty strings', () => {
            expect(tokenizeText('hello  world')).toEqual(['hello', 'world']);
        });

        it('should handle single word', () => {
            expect(tokenizeText('hello')).toEqual(['hello']);
        });

        it('should handle empty string', () => {
            expect(tokenizeText('')).toEqual([]);
        });

        it('should normalize text before tokenizing', () => {
            expect(tokenizeText('hello\nworld')).toEqual(['hello', 'world']);
        });
    });

    describe('estimateTargetWordCount', () => {
        it('should return wordCount in words mode', () => {
            const config = { mode: 'words', wordCount: 50 };
            expect(estimateTargetWordCount(config)).toBe(50);
        });

        it('should return wordCount in words mode with zero wordCount', () => {
            const config = { mode: 'words', wordCount: 0 };
            expect(estimateTargetWordCount(config)).toBe(0);
        });

        it('should return calculated count for time mode with default duration', () => {
            const config = { mode: 'time', durationSeconds: 30 };
            expect(estimateTargetWordCount(config)).toBe(100);
        });

        it('should return calculated count for time mode with custom duration', () => {
            const config = { mode: 'time', durationSeconds: 60 };
            expect(estimateTargetWordCount(config)).toBe(180);
        });

        it('should return minimum 100 for very short duration', () => {
            const config = { mode: 'time', durationSeconds: 10 };
            expect(estimateTargetWordCount(config)).toBe(100);
        });

        it('should handle undefined durationSeconds', () => {
            const config = { mode: 'time' };
            expect(estimateTargetWordCount(config)).toBe(100);
        });

        it('should handle zero durationSeconds', () => {
            const config = { mode: 'time', durationSeconds: 0 };
            expect(estimateTargetWordCount(config)).toBe(100);
        });
    });

    describe('createBuiltinWords', () => {
        it('should generate exact word count', () => {
            const config = { mode: 'words', wordCount: 10 };
            const words = createBuiltinWords(config);
            expect(words).toHaveLength(10);
        });

        it('should use commonWords as base', () => {
            const config = { mode: 'words', wordCount: 50 };
            const words = createBuiltinWords(config);
            words.forEach(word => {
                expect(commonWords).toContain(word.replace(/[.,!?;:]/g, '').replace(/\d+/g, ''));
            });
        });

        it('should handle words mode with large count', () => {
            const config = { mode: 'words', wordCount: 500 };
            const words = createBuiltinWords(config);
            expect(words).toHaveLength(500);
        });

        it('should handle time mode', () => {
            const config = { mode: 'time', durationSeconds: 30 };
            const words = createBuiltinWords(config);
            expect(words.length).toBeGreaterThan(0);
        });
    });

    describe('createDraftFromWords', () => {
        it('should create draft with correct structure', () => {
            const words = ['hello', 'world'];
            const config = { mode: 'words', wordCount: 2 };
            const draft = createDraftFromWords(words, config);

            expect(draft).toHaveProperty('id');
            expect(draft).toHaveProperty('text');
            expect(draft).toHaveProperty('words');
            expect(draft).toHaveProperty('configSnapshot');
            expect(draft).toHaveProperty('sourceTextMeta');
        });

        it('should join words into text', () => {
            const words = ['hello', 'world'];
            const config = {};
            const draft = createDraftFromWords(words, config);
            expect(draft.text).toBe('hello world');
        });

        it('should copy config to configSnapshot', () => {
            const words = ['hello'];
            const config = { mode: 'words', wordCount: 10 };
            const draft = createDraftFromWords(words, config);
            expect(draft.configSnapshot.mode).toBe('words');
            expect(draft.configSnapshot.wordCount).toBe(10);
        });

        it('should handle non-array input', () => {
            const draft = createDraftFromWords('not an array', {});
            expect(draft.words).toEqual([]);
            expect(draft.text).toBe('');
        });

        it('should filter out empty words', () => {
            const words = ['hello', '', 'world', null];
            const draft = createDraftFromWords(words, {});
            expect(draft.words).toEqual(['hello', 'world']);
        });

        it('should use custom meta label', () => {
            const draft = createDraftFromWords(['hello'], {}, { label: 'Custom Label' });
            expect(draft.sourceTextMeta.label).toBe('Custom Label');
        });

        it('should use builtin label for non-AI source', () => {
            const draft = createDraftFromWords(['hello'], { source: 'builtin' }, { language: 'zh-CN' });
            expect(draft.sourceTextMeta.label).toBe('标准词库训练');
        });

        it('should use AI label for AI source', () => {
            const draft = createDraftFromWords(['hello'], { source: 'ai' }, {});
            expect(draft.sourceTextMeta.label).toBe('AI practice text');
        });

        it('should include custom meta fields', () => {
            const meta = {
                template: 'test-template',
                difficulty: 'hard',
                createdAt: '2024-01-01',
                prompt: 'test prompt',
                generatedBy: 'ai'
            };
            const draft = createDraftFromWords(['hello'], { source: 'ai' }, meta);
            expect(draft.sourceTextMeta.template).toBe('test-template');
            expect(draft.sourceTextMeta.difficulty).toBe('hard');
            expect(draft.sourceTextMeta.createdAt).toBe('2024-01-01');
            expect(draft.sourceTextMeta.prompt).toBe('test prompt');
            expect(draft.sourceTextMeta.generatedBy).toBe('ai');
        });
    });

    describe('createBuiltinDraft', () => {
        it('should create draft with builtin source', () => {
            const config = { mode: 'words', wordCount: 10 };
            const draft = createBuiltinDraft(config);

            expect(draft.sourceTextMeta.source).toBe('builtin');
            expect(draft.sourceTextMeta.generatedBy).toBe('builtin');
            expect(draft.words.length).toBeGreaterThan(0);
        });

        it('should use Chinese label for zh-CN language', () => {
            const config = { mode: 'words', wordCount: 10 };
            const draft = createBuiltinDraft(config, { language: 'zh-CN' });
            expect(draft.sourceTextMeta.label).toBe('标准词库训练');
        });

        it('should use English label for en-US language', () => {
            const config = { mode: 'words', wordCount: 10 };
            const draft = createBuiltinDraft(config, { language: 'en-US' });
            expect(draft.sourceTextMeta.label).toBe('Built-in word bank');
        });
    });

    describe('createDraftFromText', () => {
        it('should tokenize text before creating draft', () => {
            const text = 'hello\nworld';
            const config = {};
            const draft = createDraftFromText(text, config);

            expect(draft.words).toEqual(['hello', 'world']);
            expect(draft.text).toBe('hello world');
        });

        it('should handle empty text', () => {
            const draft = createDraftFromText('', {});
            expect(draft.words).toEqual([]);
            expect(draft.text).toBe('');
        });
    });

    describe('doesDraftMatchConfig', () => {
        it('should return false for undefined draft', () => {
            expect(doesDraftMatchConfig({}, undefined)).toBe(false);
        });

        it('should return false for null draft', () => {
            expect(doesDraftMatchConfig({}, null)).toBe(false);
        });

        it('should return false for draft without configSnapshot', () => {
            expect(doesDraftMatchConfig({}, {})).toBe(false);
        });

        it('should return true when all keys match', () => {
            const draft = {
                configSnapshot: {
                    mode: 'words',
                    durationSeconds: 60,
                    wordCount: 50,
                    includePunctuation: true,
                    includeNumbers: false,
                    source: 'builtin',
                    aiTemplate: null,
                    difficulty: null
                }
            };
            const config = {
                mode: 'words',
                durationSeconds: 60,
                wordCount: 50,
                includePunctuation: true,
                includeNumbers: false,
                source: 'builtin',
                aiTemplate: null,
                difficulty: null
            };
            expect(doesDraftMatchConfig(config, draft)).toBe(true);
        });

        it('should return false when mode does not match', () => {
            const draft = {
                configSnapshot: { mode: 'words' }
            };
            const config = { mode: 'time' };
            expect(doesDraftMatchConfig(config, draft)).toBe(false);
        });

        it('should return false when wordCount does not match', () => {
            const draft = {
                configSnapshot: { wordCount: 50 }
            };
            const config = { wordCount: 100 };
            expect(doesDraftMatchConfig(config, draft)).toBe(false);
        });

        it('should return false when includePunctuation does not match', () => {
            const draft = {
                configSnapshot: { includePunctuation: true }
            };
            const config = { includePunctuation: false };
            expect(doesDraftMatchConfig(config, draft)).toBe(false);
        });

        it('should return false when difficulty does not match', () => {
            const draft = {
                configSnapshot: { difficulty: 'easy' }
            };
            const config = { difficulty: 'hard' };
            expect(doesDraftMatchConfig(config, draft)).toBe(false);
        });
    });
});
