import {
    DEFAULT_CONFIG,
    DEFAULT_SETTINGS,
    SUPPORTED_LANGUAGES,
    AI_TEMPLATES,
    DIFFICULTY_OPTIONS,
    getTemplateMeta,
    getDifficultyMeta,
    getTemplateLabel,
    getDifficultyLabel
} from '../config';

describe('config', () => {
    describe('constants', () => {
        test('DEFAULT_CONFIG has expected keys', () => {
            expect(DEFAULT_CONFIG).toMatchObject({
                mode: 'time',
                durationSeconds: 30,
                wordCount: 25,
                includePunctuation: false,
                includeNumbers: false,
                source: 'builtin',
                aiTemplate: 'daily',
                difficulty: 'medium'
            });
        });

        test('DEFAULT_SETTINGS has expected keys', () => {
            expect(DEFAULT_SETTINGS).toMatchObject({
                theme: 'serika-dark',
                fontScale: 'md',
                focusMode: false,
                soundEffects: false,
                language: 'zh-CN'
            });
        });

        test('SUPPORTED_LANGUAGES has expected languages', () => {
            expect(SUPPORTED_LANGUAGES).toEqual([
                { id: 'zh-CN', label: '简体中文' },
                { id: 'en-US', label: 'English' }
            ]);
        });

        test('AI_TEMPLATES has expected templates', () => {
            expect(AI_TEMPLATES.length).toBe(4);
            expect(AI_TEMPLATES[0].id).toBe('daily');
            expect(AI_TEMPLATES[1].id).toBe('business');
            expect(AI_TEMPLATES[2].id).toBe('tech');
            expect(AI_TEMPLATES[3].id).toBe('developer');
        });

        test('DIFFICULTY_OPTIONS has expected difficulties', () => {
            expect(DIFFICULTY_OPTIONS.length).toBe(3);
            expect(DIFFICULTY_OPTIONS[0].id).toBe('easy');
            expect(DIFFICULTY_OPTIONS[1].id).toBe('medium');
            expect(DIFFICULTY_OPTIONS[2].id).toBe('hard');
        });
    });

    describe('getTemplateMeta', () => {
        test('returns correct template for valid id', () => {
            expect(getTemplateMeta('daily')).toEqual(AI_TEMPLATES[0]);
            expect(getTemplateMeta('business')).toEqual(AI_TEMPLATES[1]);
            expect(getTemplateMeta('tech')).toEqual(AI_TEMPLATES[2]);
            expect(getTemplateMeta('developer')).toEqual(AI_TEMPLATES[3]);
        });

        test('falls back to first template for invalid id', () => {
            expect(getTemplateMeta('invalid')).toEqual(AI_TEMPLATES[0]);
            expect(getTemplateMeta(null)).toEqual(AI_TEMPLATES[0]);
            expect(getTemplateMeta(undefined)).toEqual(AI_TEMPLATES[0]);
        });
    });

    describe('getDifficultyMeta', () => {
        test('returns correct difficulty for valid id', () => {
            expect(getDifficultyMeta('easy')).toEqual(DIFFICULTY_OPTIONS[0]);
            expect(getDifficultyMeta('medium')).toEqual(DIFFICULTY_OPTIONS[1]);
            expect(getDifficultyMeta('hard')).toEqual(DIFFICULTY_OPTIONS[2]);
        });

        test('falls back to second difficulty (medium) for invalid id', () => {
            expect(getDifficultyMeta('invalid')).toEqual(DIFFICULTY_OPTIONS[1]);
            expect(getDifficultyMeta(null)).toEqual(DIFFICULTY_OPTIONS[1]);
            expect(getDifficultyMeta(undefined)).toEqual(DIFFICULTY_OPTIONS[1]);
        });
    });

    describe('getTemplateLabel', () => {
        test('returns correct label for zh-CN', () => {
            expect(getTemplateLabel('daily', 'zh-CN')).toBe('日常对话');
            expect(getTemplateLabel('business', 'zh-CN')).toBe('商务英语');
            expect(getTemplateLabel('tech', 'zh-CN')).toBe('科技写作');
            expect(getTemplateLabel('developer', 'zh-CN')).toBe('开发者常用语');
        });

        test('returns correct label for en-US', () => {
            expect(getTemplateLabel('daily', 'en-US')).toBe('Daily conversation');
            expect(getTemplateLabel('business', 'en-US')).toBe('Business English');
            expect(getTemplateLabel('tech', 'en-US')).toBe('Tech writing');
            expect(getTemplateLabel('developer', 'en-US')).toBe('Developer workflow');
        });

        test('falls back to zh-CN for unknown language', () => {
            expect(getTemplateLabel('daily', 'invalid')).toBe('日常对话');
        });

        test('accepts template object as first argument', () => {
            expect(getTemplateLabel(AI_TEMPLATES[0], 'zh-CN')).toBe('日常对话');
            expect(getTemplateLabel(AI_TEMPLATES[0], 'en-US')).toBe('Daily conversation');
        });

        test('returns empty string for invalid template', () => {
            expect(getTemplateLabel(null, 'zh-CN')).toBe('');
            expect(getTemplateLabel(undefined, 'zh-CN')).toBe('');
        });
    });

    describe('getDifficultyLabel', () => {
        test('returns correct label for zh-CN', () => {
            expect(getDifficultyLabel('easy', 'zh-CN')).toBe('入门');
            expect(getDifficultyLabel('medium', 'zh-CN')).toBe('进阶');
            expect(getDifficultyLabel('hard', 'zh-CN')).toBe('挑战');
        });

        test('returns correct label for en-US', () => {
            expect(getDifficultyLabel('easy', 'en-US')).toBe('Easy');
            expect(getDifficultyLabel('medium', 'en-US')).toBe('Medium');
            expect(getDifficultyLabel('hard', 'en-US')).toBe('Hard');
        });

        test('falls back to zh-CN for unknown language', () => {
            expect(getDifficultyLabel('easy', 'invalid')).toBe('入门');
        });

        test('accepts difficulty object as first argument', () => {
            expect(getDifficultyLabel(DIFFICULTY_OPTIONS[0], 'zh-CN')).toBe('入门');
            expect(getDifficultyLabel(DIFFICULTY_OPTIONS[0], 'en-US')).toBe('Easy');
        });

        test('returns empty string for invalid difficulty', () => {
            expect(getDifficultyLabel(null, 'zh-CN')).toBe('');
            expect(getDifficultyLabel(undefined, 'zh-CN')).toBe('');
        });
    });
});
