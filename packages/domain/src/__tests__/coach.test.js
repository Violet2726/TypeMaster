import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildLocalCoachAdvice } from '../coach';
import * as configModule from '../config';
import * as metricsModule from '../metrics';

vi.mock('../config', () => ({
    getTemplateMeta: vi.fn((templateId) => ({
        id: templateId || 'daily',
        labels: { 'zh-CN': '日常对话', 'en-US': 'Daily conversation' },
        prompt: 'natural daily conversations'
    }))
}));

vi.mock('../metrics', () => ({
    deriveComparison: vi.fn((sessions, currentId, result, language) => ({
        label: 'up',
        summary: language === 'en-US'
            ? 'Compared to recent sessions, speed is +5.0 and accuracy is +2.0%.'
            : '相比最近 5 次平均值，速度 +5.0，准确率 +2.0%。',
        wpmDelta: 5,
        accuracyDelta: 2
    }))
}));

describe('coach.js', () => {
    describe('buildLocalCoachAdvice', () => {
        const baseSession = {
            id: 'session-1',
            config: {
                source: 'builtin',
                aiTemplate: 'daily',
                difficulty: 'medium',
                mode: 'time',
                durationSeconds: 30,
                wordCount: 25,
                includeNumbers: false,
                includePunctuation: false
            },
            result: {
                wpm: 50,
                accuracy: 95,
                consistency: 90,
                topErrorChars: ['a', 'e'],
                topErrorWords: ['hello', 'world'],
                completedAt: '2024-01-01T00:00:00.000Z'
            }
        };

        const baseHistory = [
            { id: 's1', result: { wpm: 45, accuracy: 93 } },
            { id: 's2', result: { wpm: 48, accuracy: 94 } }
        ];

        it('returns advice object with required fields', () => {
            const result = buildLocalCoachAdvice({
                session: baseSession,
                history: baseHistory,
                language: 'zh-CN'
            });

            expect(result).toHaveProperty('headline');
            expect(result).toHaveProperty('summary');
            expect(result).toHaveProperty('strengths');
            expect(result).toHaveProperty('weaknesses');
            expect(result).toHaveProperty('nextDrill');
            expect(result).toHaveProperty('comparison');
            expect(result).toHaveProperty('language');
        });

        it('uses Chinese by default', () => {
            const result = buildLocalCoachAdvice({
                session: baseSession,
                history: baseHistory
            });
            expect(result.language).toBe('zh-CN');
        });

        it('returns English advice when language is en-US', () => {
            const result = buildLocalCoachAdvice({
                session: baseSession,
                history: baseHistory,
                language: 'en-US'
            });
            expect(result.language).toBe('en-US');
            expect(typeof result.headline).toBe('string');
            expect(result.headline.length).toBeGreaterThan(0);
        });

        it('includes top error chars in weaknesses when present', () => {
            const result = buildLocalCoachAdvice({
                session: baseSession,
                history: baseHistory,
                language: 'zh-CN'
            });
            expect(result.weaknesses.length).toBeGreaterThan(0);
        });

        it('returns nextDrill with configPatch', () => {
            const result = buildLocalCoachAdvice({
                session: baseSession,
                history: baseHistory,
                language: 'zh-CN'
            });
            expect(result.nextDrill).toHaveProperty('configPatch');
            expect(result.nextDrill.configPatch).toHaveProperty('source');
            expect(result.nextDrill.configPatch).toHaveProperty('difficulty');
            expect(result.nextDrill.configPatch).toHaveProperty('mode');
        });

        it('downgrades difficulty when accuracy is low', () => {
            const lowAccuracySession = {
                ...baseSession,
                result: { ...baseSession.result, accuracy: 85 }
            };
            const result = buildLocalCoachAdvice({
                session: lowAccuracySession,
                history: baseHistory,
                language: 'zh-CN'
            });
            expect(result.nextDrill.configPatch.difficulty).toBe('easy');
        });

        it('upgrades difficulty when all metrics are good', () => {
            const perfectSession = {
                ...baseSession,
                result: {
                    ...baseSession.result,
                    accuracy: 98,
                    consistency: 95,
                    topErrorChars: [],
                    topErrorWords: []
                }
            };
            const result = buildLocalCoachAdvice({
                session: perfectSession,
                history: baseHistory,
                language: 'zh-CN'
            });
            expect(result.nextDrill.configPatch.difficulty).toBe('hard');
        });

        it('handles empty history', () => {
            const result = buildLocalCoachAdvice({
                session: baseSession,
                history: [],
                language: 'zh-CN'
            });
            expect(result).toHaveProperty('comparison');
            expect(result.comparison).toBeDefined();
        });

        it('returns nextDrill with aiPrompt', () => {
            const result = buildLocalCoachAdvice({
                session: baseSession,
                history: baseHistory,
                language: 'zh-CN'
            });
            expect(result.nextDrill).toHaveProperty('aiPrompt');
            expect(typeof result.nextDrill.aiPrompt).toBe('string');
        });

        it('returns nextDrill with label', () => {
            const result = buildLocalCoachAdvice({
                session: baseSession,
                history: baseHistory,
                language: 'zh-CN'
            });
            expect(result.nextDrill).toHaveProperty('label');
            expect(typeof result.nextDrill.label).toBe('string');
        });

        it('returns nextDrill with reason', () => {
            const result = buildLocalCoachAdvice({
                session: baseSession,
                history: baseHistory,
                language: 'zh-CN'
            });
            expect(result.nextDrill).toHaveProperty('reason');
            expect(typeof result.nextDrill.reason).toBe('string');
        });
    });
});
