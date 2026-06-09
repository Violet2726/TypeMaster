import {
    normalizeText,
    tokenizeText,
    estimateTargetWordCount,
    createBuiltinWords,
    createDraftFromWords,
    createBuiltinDraft,
    createAdaptiveDrillDraft,
    createDraftFromText,
    doesDraftMatchConfig,
    resolveAdaptiveDrillFocus
} from '../draft';
import { DEFAULT_CONFIG } from '../config';

describe('draft', () => {
    describe('normalizeText', () => {
        test('replaces newlines and tabs with spaces', () => {
            expect(normalizeText('hello\nworld\tfoo')).toBe('hello world foo');
        });

        test('collapses multiple spaces into single', () => {
            expect(normalizeText('  hello   world  ')).toBe('hello world');
        });

        test('handles empty and null/undefined', () => {
            expect(normalizeText('')).toBe('');
            expect(normalizeText(null)).toBe('');
            expect(normalizeText(undefined)).toBe('');
        });
    });

    describe('tokenizeText', () => {
        test('splits text into words', () => {
            expect(tokenizeText('hello world foo')).toEqual(['hello', 'world', 'foo']);
        });

        test('filters out empty strings', () => {
            expect(tokenizeText('  hello   world  ')).toEqual(['hello', 'world']);
        });

        test('handles empty and null/undefined', () => {
            expect(tokenizeText('')).toEqual([]);
            expect(tokenizeText(null)).toEqual([]);
            expect(tokenizeText(undefined)).toEqual([]);
        });
    });

    describe('estimateTargetWordCount', () => {
        test('uses wordCount for words mode', () => {
            expect(estimateTargetWordCount({ ...DEFAULT_CONFIG, mode: 'words', wordCount: 50 })).toBe(50);
        });

        test('calculates for time mode', () => {
            expect(estimateTargetWordCount({ ...DEFAULT_CONFIG, mode: 'time', durationSeconds: 30 })).toBeGreaterThanOrEqual(90);
            expect(estimateTargetWordCount({ ...DEFAULT_CONFIG, mode: 'time', durationSeconds: 10 })).toBeGreaterThanOrEqual(30);
        });

        test('has minimum of 100 words for time mode', () => {
            expect(estimateTargetWordCount({ ...DEFAULT_CONFIG, mode: 'time', durationSeconds: 1 })).toBe(100);
        });
    });

    describe('createBuiltinWords', () => {
        test('creates array of words with correct length', () => {
            const words = createBuiltinWords({ ...DEFAULT_CONFIG, mode: 'words', wordCount: 20 });
            expect(words.length).toBe(20);
        });

        test('adds punctuation when includePunctuation is true', () => {
            const words = createBuiltinWords({ ...DEFAULT_CONFIG, mode: 'words', wordCount: 100, includePunctuation: true });
            const hasPunctuation = words.some(word => /[.,!?;:]/.test(word));
            expect(hasPunctuation).toBe(true);
        });

        test('adds numbers when includeNumbers is true', () => {
            const words = createBuiltinWords({ ...DEFAULT_CONFIG, mode: 'words', wordCount: 100, includeNumbers: true });
            const hasNumbers = words.some(word => /^\d+$/.test(word));
            expect(hasNumbers).toBe(true);
        });
    });

    describe('createDraftFromWords', () => {
        test('creates valid draft structure', () => {
            const words = ['hello', 'world'];
            const draft = createDraftFromWords(words, DEFAULT_CONFIG);
            expect(draft.id).toBeDefined();
            expect(draft.text).toBe('hello world');
            expect(draft.words).toEqual(words);
            expect(draft.configSnapshot).toEqual(DEFAULT_CONFIG);
            expect(draft.sourceTextMeta.source).toBe('builtin');
            expect(draft.sourceTextMeta.generatedBy).toBe('builtin');
        });

        test('handles empty words array', () => {
            const draft = createDraftFromWords([], DEFAULT_CONFIG);
            expect(draft.text).toBe('');
            expect(draft.words).toEqual([]);
        });

        test('handles non-array words', () => {
            const draft = createDraftFromWords(null, DEFAULT_CONFIG);
            expect(draft.words).toEqual([]);
        });

        test('generates id even without crypto.randomUUID', () => {
            const originalCrypto = global.crypto;
            delete global.crypto;
            const draft = createDraftFromWords(['test'], DEFAULT_CONFIG);
            expect(draft.id).toBeDefined();
            global.crypto = originalCrypto;
        });
    });

    describe('createBuiltinDraft', () => {
        test('creates draft from builtin words', () => {
            const draft = createBuiltinDraft(DEFAULT_CONFIG);
            expect(draft.sourceTextMeta.source).toBe('builtin');
            expect(draft.sourceTextMeta.generatedBy).toBe('builtin');
            expect(draft.words.length).toBeGreaterThan(0);
        });

        test('uses language option for label', () => {
            const draftZh = createBuiltinDraft(DEFAULT_CONFIG, { language: 'zh-CN' });
            expect(draftZh.sourceTextMeta.label).toBe('标准词库训练');
            const draftEn = createBuiltinDraft(DEFAULT_CONFIG, { language: 'en-US' });
            expect(draftEn.sourceTextMeta.label).toBe('Built-in word bank');
        });
    });

    describe('createDraftFromText', () => {
        test('creates draft from raw text', () => {
            const text = 'hello world foo bar';
            const draft = createDraftFromText(text, DEFAULT_CONFIG);
            expect(draft.words).toEqual(['hello', 'world', 'foo', 'bar']);
            expect(draft.text).toBe(text);
        });

        test('uses provided meta', () => {
            const draft = createDraftFromText('test', { ...DEFAULT_CONFIG, source: 'ai' }, { template: 'daily', difficulty: 'easy' });
            expect(draft.sourceTextMeta.template).toBe('daily');
            expect(draft.sourceTextMeta.difficulty).toBe('easy');
        });
    });

    describe('createAdaptiveDrillDraft', () => {
        test('builds an accuracy drill from error hotspots', () => {
            const draft = createAdaptiveDrillDraft({
                config: { ...DEFAULT_CONFIG, mode: 'time', durationSeconds: 60 },
                result: {
                    accuracy: 92,
                    consistency: 91,
                    wpm: 52,
                    rawWpm: 61,
                    incorrectChars: 3,
                    extraChars: 1,
                    missedChars: 0,
                    topErrorChars: ['a'],
                    topErrorWords: ['alpha']
                }
            }, { language: 'en-US' });

            expect(resolveAdaptiveDrillFocus({
                result: { accuracy: 92, consistency: 91, wpm: 52, rawWpm: 61 }
            })).toBe('accuracy');
            expect(draft.sourceTextMeta.generatedBy).toBe('adaptive');
            expect(draft.sourceTextMeta.label).toBe('Adaptive accuracy drill');
            expect(draft.sourceTextMeta.adaptiveFocus).toBe('accuracy');
            expect(draft.sourceTextMeta.adaptiveHotspots).toContain('alpha');
            expect(draft.sourceTextMeta.adaptiveMetrics).toMatchObject({
                accuracy: 92,
                consistency: 91,
                missCount: 4,
                rawGap: 9
            });
            expect(draft.configSnapshot).toMatchObject({
                source: 'builtin',
                mode: 'words',
                wordCount: 28,
                includeNumbers: false,
                includePunctuation: false
            });
            expect(draft.words).toContain('alpha');
            expect(draft.words).toHaveLength(28);
        });

        test('keeps speed drills slightly denser when the round is already clean', () => {
            const draft = createAdaptiveDrillDraft({
                config: { ...DEFAULT_CONFIG, mode: 'words', wordCount: 30, includePunctuation: true, includeNumbers: true },
                result: {
                    accuracy: 98,
                    consistency: 94,
                    wpm: 72,
                    rawWpm: 75,
                    incorrectChars: 0,
                    extraChars: 0,
                    missedChars: 0,
                    topErrorChars: [],
                    topErrorWords: []
                }
            }, { language: 'en-US' });

            expect(draft.sourceTextMeta.label).toBe('Adaptive speed drill');
            expect(draft.configSnapshot.wordCount).toBe(35);
            expect(draft.configSnapshot.includePunctuation).toBe(true);
            expect(draft.configSnapshot.includeNumbers).toBe(true);
            expect(draft.words.some((word) => /[.,!?;:]$/.test(word))).toBe(true);
            expect(draft.words.some((word) => /^\d+$/.test(word))).toBe(true);
            expect(draft.words).toHaveLength(35);
        });
    });

    describe('doesDraftMatchConfig', () => {
        test('returns true when config matches', () => {
            const config = { ...DEFAULT_CONFIG };
            const draft = createBuiltinDraft(config);
            expect(doesDraftMatchConfig(config, draft)).toBe(true);
        });

        test('returns false when config changes', () => {
            const config = { ...DEFAULT_CONFIG };
            const draft = createBuiltinDraft(config);
            expect(doesDraftMatchConfig({ ...config, durationSeconds: 60 }, draft)).toBe(false);
        });

        test('returns false when draft is invalid', () => {
            expect(doesDraftMatchConfig(DEFAULT_CONFIG, null)).toBe(false);
            expect(doesDraftMatchConfig(DEFAULT_CONFIG, undefined)).toBe(false);
            expect(doesDraftMatchConfig(DEFAULT_CONFIG, {})).toBe(false);
        });
    });
});
