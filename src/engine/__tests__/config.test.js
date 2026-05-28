import { describe, it, expect } from 'vitest';
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
    describe('DEFAULT_CONFIG', () => {
        it('should have correct default values', () => {
            expect(DEFAULT_CONFIG.mode).toBe('time');
            expect(DEFAULT_CONFIG.durationSeconds).toBe(30);
            expect(DEFAULT_CONFIG.wordCount).toBe(25);
            expect(DEFAULT_CONFIG.includePunctuation).toBe(false);
            expect(DEFAULT_CONFIG.includeNumbers).toBe(false);
            expect(DEFAULT_CONFIG.source).toBe('builtin');
            expect(DEFAULT_CONFIG.aiTemplate).toBe('daily');
            expect(DEFAULT_CONFIG.difficulty).toBe('medium');
        });
    });

    describe('DEFAULT_SETTINGS', () => {
        it('should have correct default values', () => {
            expect(DEFAULT_SETTINGS.theme).toBe('serika-dark');
            expect(DEFAULT_SETTINGS.fontScale).toBe('md');
            expect(DEFAULT_SETTINGS.focusMode).toBe(false);
            expect(DEFAULT_SETTINGS.soundEffects).toBe(false);
            expect(DEFAULT_SETTINGS.language).toBe('zh-CN');
        });
    });

    describe('SUPPORTED_LANGUAGES', () => {
        it('should contain Chinese language', () => {
            const zhCN = SUPPORTED_LANGUAGES.find(lang => lang.id === 'zh-CN');
            expect(zhCN).toBeDefined();
            expect(zhCN.label).toBe('简体中文');
        });

        it('should contain English language', () => {
            const enUS = SUPPORTED_LANGUAGES.find(lang => lang.id === 'en-US');
            expect(enUS).toBeDefined();
            expect(enUS.label).toBe('English');
        });

        it('should have exactly 2 languages', () => {
            expect(SUPPORTED_LANGUAGES).toHaveLength(2);
        });
    });

    describe('AI_TEMPLATES', () => {
        it('should have 4 templates', () => {
            expect(AI_TEMPLATES).toHaveLength(4);
        });

        it('should have daily template', () => {
            const daily = AI_TEMPLATES.find(t => t.id === 'daily');
            expect(daily).toBeDefined();
            expect(daily.labels['zh-CN']).toBe('日常对话');
            expect(daily.labels['en-US']).toBe('Daily conversation');
        });

        it('should have business template', () => {
            const business = AI_TEMPLATES.find(t => t.id === 'business');
            expect(business).toBeDefined();
            expect(business.labels['zh-CN']).toBe('商务英语');
            expect(business.labels['en-US']).toBe('Business English');
        });

        it('should have tech template', () => {
            const tech = AI_TEMPLATES.find(t => t.id === 'tech');
            expect(tech).toBeDefined();
            expect(tech.labels['zh-CN']).toBe('科技写作');
            expect(tech.labels['en-US']).toBe('Tech writing');
        });

        it('should have developer template', () => {
            const developer = AI_TEMPLATES.find(t => t.id === 'developer');
            expect(developer).toBeDefined();
            expect(developer.labels['zh-CN']).toBe('开发者常用语');
            expect(developer.labels['en-US']).toBe('Developer workflow');
        });

        it('should have prompts for all templates', () => {
            AI_TEMPLATES.forEach(template => {
                expect(template.prompt).toBeDefined();
                expect(typeof template.prompt).toBe('string');
                expect(template.prompt.length).toBeGreaterThan(0);
            });
        });
    });

    describe('DIFFICULTY_OPTIONS', () => {
        it('should have 3 difficulty levels', () => {
            expect(DIFFICULTY_OPTIONS).toHaveLength(3);
        });

        it('should have easy difficulty', () => {
            const easy = DIFFICULTY_OPTIONS.find(d => d.id === 'easy');
            expect(easy).toBeDefined();
            expect(easy.labels['zh-CN']).toBe('入门');
            expect(easy.labels['en-US']).toBe('Easy');
        });

        it('should have medium difficulty', () => {
            const medium = DIFFICULTY_OPTIONS.find(d => d.id === 'medium');
            expect(medium).toBeDefined();
            expect(medium.labels['zh-CN']).toBe('进阶');
            expect(medium.labels['en-US']).toBe('Medium');
        });

        it('should have hard difficulty', () => {
            const hard = DIFFICULTY_OPTIONS.find(d => d.id === 'hard');
            expect(hard).toBeDefined();
            expect(hard.labels['zh-CN']).toBe('挑战');
            expect(hard.labels['en-US']).toBe('Hard');
        });

        it('should have prompts for all difficulties', () => {
            DIFFICULTY_OPTIONS.forEach(difficulty => {
                expect(difficulty.prompt).toBeDefined();
                expect(typeof difficulty.prompt).toBe('string');
                expect(difficulty.prompt.length).toBeGreaterThan(0);
            });
        });
    });

    describe('getTemplateMeta', () => {
        it('should return template by id', () => {
            const template = getTemplateMeta('daily');
            expect(template.id).toBe('daily');
        });

        it('should return first template for invalid id', () => {
            const template = getTemplateMeta('invalid-id');
            expect(template.id).toBe('daily');
        });

        it('should return first template for undefined id', () => {
            const template = getTemplateMeta(undefined);
            expect(template.id).toBe('daily');
        });

        it('should return first template for null id', () => {
            const template = getTemplateMeta(null);
            expect(template.id).toBe('daily');
        });

        it('should return correct template for business id', () => {
            const template = getTemplateMeta('business');
            expect(template.id).toBe('business');
        });

        it('should return correct template for tech id', () => {
            const template = getTemplateMeta('tech');
            expect(template.id).toBe('tech');
        });

        it('should return correct template for developer id', () => {
            const template = getTemplateMeta('developer');
            expect(template.id).toBe('developer');
        });
    });

    describe('getDifficultyMeta', () => {
        it('should return difficulty by id', () => {
            const difficulty = getDifficultyMeta('easy');
            expect(difficulty.id).toBe('easy');
        });

        it('should return medium difficulty for invalid id', () => {
            const difficulty = getDifficultyMeta('invalid-id');
            expect(difficulty.id).toBe('medium');
        });

        it('should return medium difficulty for undefined id', () => {
            const difficulty = getDifficultyMeta(undefined);
            expect(difficulty.id).toBe('medium');
        });

        it('should return medium difficulty for null id', () => {
            const difficulty = getDifficultyMeta(null);
            expect(difficulty.id).toBe('medium');
        });

        it('should return correct difficulty for hard id', () => {
            const difficulty = getDifficultyMeta('hard');
            expect(difficulty.id).toBe('hard');
        });
    });

    describe('getTemplateLabel', () => {
        it('should return Chinese label by default', () => {
            const label = getTemplateLabel('daily');
            expect(label).toBe('日常对话');
        });

        it('should return Chinese label when language is zh-CN', () => {
            const label = getTemplateLabel('daily', 'zh-CN');
            expect(label).toBe('日常对话');
        });

        it('should return English label when language is en-US', () => {
            const label = getTemplateLabel('daily', 'en-US');
            expect(label).toBe('Daily conversation');
        });

        it('should return empty string for invalid template id', () => {
            const label = getTemplateLabel('invalid-id');
            expect(label).toBe('日常对话');
        });

        it('should fall back to Chinese label when English label is missing', () => {
            const template = { labels: { 'zh-CN': 'test' } };
            const label = getTemplateLabel(template, 'en-US');
            expect(label).toBe('test');
        });

        it('should return empty string when no labels exist', () => {
            const template = {};
            const label = getTemplateLabel(template, 'en-US');
            expect(label).toBe('');
        });

        it('should handle template object directly', () => {
            const template = { labels: { 'zh-CN': '测试', 'en-US': 'Test' } };
            expect(getTemplateLabel(template)).toBe('测试');
            expect(getTemplateLabel(template, 'en-US')).toBe('Test');
        });

        it('should handle non-string templateId', () => {
            const template = { labels: { 'zh-CN': '测试' } };
            const label = getTemplateLabel(template);
            expect(label).toBe('测试');
        });
    });

    describe('getDifficultyLabel', () => {
        it('should return Chinese label by default', () => {
            const label = getDifficultyLabel('easy');
            expect(label).toBe('入门');
        });

        it('should return Chinese label when language is zh-CN', () => {
            const label = getDifficultyLabel('easy', 'zh-CN');
            expect(label).toBe('入门');
        });

        it('should return English label when language is en-US', () => {
            const label = getDifficultyLabel('easy', 'en-US');
            expect(label).toBe('Easy');
        });

        it('should return medium label for invalid difficulty id', () => {
            const label = getDifficultyLabel('invalid-id');
            expect(label).toBe('进阶');
        });

        it('should return empty string when no labels exist', () => {
            const difficulty = {};
            const label = getDifficultyLabel(difficulty, 'en-US');
            expect(label).toBe('');
        });

        it('should handle difficulty object directly', () => {
            const difficulty = { labels: { 'zh-CN': '测试', 'en-US': 'Test' } };
            expect(getDifficultyLabel(difficulty)).toBe('测试');
            expect(getDifficultyLabel(difficulty, 'en-US')).toBe('Test');
        });

        it('should fall back to Chinese label when English label is missing', () => {
            const difficulty = { labels: { 'zh-CN': 'test' } };
            const label = getDifficultyLabel(difficulty, 'en-US');
            expect(label).toBe('test');
        });
    });
});
