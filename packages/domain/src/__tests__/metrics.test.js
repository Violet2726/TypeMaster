import { describe, it, expect } from 'vitest';
import {
    calculateMetrics,
    calculateConsistency,
    collectErrorBreakdown,
    deriveComparison
} from '../metrics';

describe('metrics.js', () => {
    describe('calculateMetrics', () => {
        it('returns zero WPM when elapsed time is zero', () => {
            const result = calculateMetrics({
                words: ['hello', 'world'],
                typedHistory: [],
                currentInput: '',
                elapsedMs: 0,
                totalKeystrokes: 0,
                correctKeystrokes: 0,
                wpmHistory: []
            });
            expect(result.wpm).toBe(0);
            expect(result.rawWpm).toBe(0);
        });

        it('calculates positive WPM for valid input', () => {
            const result = calculateMetrics({
                words: ['hello', 'world'],
                typedHistory: ['hello', 'world'],
                currentInput: '',
                elapsedMs: 60000,
                totalKeystrokes: 12,
                correctKeystrokes: 11,
                wpmHistory: []
            });
            expect(result.wpm).toBeGreaterThan(0);
        });

        it('calculates accuracy based on keystrokes', () => {
            const result = calculateMetrics({
                words: ['hello'],
                typedHistory: ['hella'],
                currentInput: '',
                elapsedMs: 60000,
                totalKeystrokes: 10,
                correctKeystrokes: 8,
                wpmHistory: []
            });
            expect(result.accuracy).toBe(80);
        });

        it('returns 100 accuracy when no keystrokes', () => {
            const result = calculateMetrics({
                words: ['hello'],
                typedHistory: [],
                currentInput: '',
                elapsedMs: 0,
                totalKeystrokes: 0,
                correctKeystrokes: 0,
                wpmHistory: []
            });
            expect(result.accuracy).toBe(100);
        });

        it('includes completedAt timestamp', () => {
            const before = new Date().toISOString();
            const result = calculateMetrics({
                words: ['test'],
                typedHistory: [],
                currentInput: '',
                elapsedMs: 1000,
                totalKeystrokes: 0,
                correctKeystrokes: 0,
                wpmHistory: []
            });
            const after = new Date().toISOString();
            expect(result.completedAt).toBeDefined();
            expect(result.completedAt >= before).toBe(true);
            expect(result.completedAt <= after).toBe(true);
        });

        it('calculates durationSeconds correctly', () => {
            const result = calculateMetrics({
                words: ['hello'],
                typedHistory: [],
                currentInput: '',
                elapsedMs: 30000,
                totalKeystrokes: 0,
                correctKeystrokes: 0,
                wpmHistory: []
            });
            expect(result.durationSeconds).toBe(30);
        });

        it('uses duration of 1 second as minimum', () => {
            const result = calculateMetrics({
                words: ['hello'],
                typedHistory: [],
                currentInput: '',
                elapsedMs: 0,
                totalKeystrokes: 0,
                correctKeystrokes: 0,
                wpmHistory: []
            });
            expect(result.durationSeconds).toBe(1);
        });
    });

    describe('calculateConsistency', () => {
        it('returns 100 for empty array', () => {
            expect(calculateConsistency([])).toBe(100);
        });

        it('returns 100 for single element array', () => {
            expect(calculateConsistency([50])).toBe(100);
        });

        it('returns 100 for non-array input', () => {
            expect(calculateConsistency(null)).toBe(100);
            expect(calculateConsistency(undefined)).toBe(100);
        });

        it('calculates 100 for identical values', () => {
            expect(calculateConsistency([50, 50, 50])).toBe(100);
        });

        it('returns less than 100 for varied values', () => {
            const result = calculateConsistency([30, 60, 90]);
            expect(result).toBeLessThan(100);
            expect(result).toBeGreaterThan(0);
        });

        it('returns 0 for extremely varied values', () => {
            const result = calculateConsistency([0, 100, 0, 100]);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(100);
        });

        it('handles mean of zero', () => {
            const result = calculateConsistency([0, 0, 0]);
            expect(result).toBe(100);
        });
    });

    describe('collectErrorBreakdown', () => {
        it('returns empty arrays for no errors', () => {
            const result = collectErrorBreakdown(['hello'], ['hello'], '', true);
            expect(result.topErrorChars).toEqual([]);
            expect(result.topErrorWords).toEqual([]);
            expect(result.errorCharStats).toEqual([]);
            expect(result.errorWordStats).toEqual([]);
        });

        it('collects incorrect characters', () => {
            const result = collectErrorBreakdown(['hello'], ['hella'], '', true);
            expect(result.topErrorChars.length).toBeGreaterThan(0);
        });

        it('collects extra characters', () => {
            const result = collectErrorBreakdown(['hello'], ['helloo'], '', true);
            expect(result.topErrorChars.length).toBeGreaterThan(0);
        });

        it('collects missed characters', () => {
            const result = collectErrorBreakdown(['hello'], ['hell'], '', true);
            expect(result.topErrorWords.length).toBeGreaterThan(0);
        });

        it('limits results to top 5', () => {
            const words = ['aaaaa', 'bbbbb', 'ccccc', 'ddddd', 'eeeee', 'fffff'];
            const typed = ['bbbbb', 'ccccc', 'ddddd', 'eeeee', 'fffff', 'aaaaa'];
            const result = collectErrorBreakdown(words, typed, '', true);
            expect(result.topErrorChars.length).toBeLessThanOrEqual(5);
            expect(result.topErrorWords.length).toBeLessThanOrEqual(5);
        });

        it('handles empty inputs', () => {
            const result = collectErrorBreakdown([], [], '', true);
            expect(result.topErrorChars).toEqual([]);
            expect(result.topErrorWords).toEqual([]);
        });

        it('returns ranked count stats for later drill feedback', () => {
            const result = collectErrorBreakdown(['alpha', 'alpha'], ['alpja', 'alpja'], '', true);
            expect(result.errorCharStats).toContainEqual({ label: 'j', count: 2 });
            expect(result.errorWordStats).toContainEqual({ label: 'alpha', count: 2 });
        });

        it('excludes current input when includeCurrent is false', () => {
            const result = collectErrorBreakdown(['hello', 'world'], ['hello'], 'wrld', false);
            expect(result.topErrorChars.length).toBe(0);
        });
    });

    describe('deriveComparison', () => {
        it('returns baseline for no history', () => {
            const result = deriveComparison([], 'session-1', { wpm: 50, accuracy: 95 }, 'zh-CN');
            expect(result.label).toBe('baseline');
            expect(result.wpmDelta).toBeNull();
            expect(result.accuracyDelta).toBeNull();
        });

        it('calculates positive delta when improving', () => {
            const history = [
                { id: 's1', result: { wpm: 40, accuracy: 90 } },
                { id: 's2', result: { wpm: 40, accuracy: 90 } }
            ];
            const result = deriveComparison(history, 's3', { wpm: 60, accuracy: 95 }, 'zh-CN');
            expect(result.wpmDelta).toBeGreaterThan(0);
            expect(result.accuracyDelta).toBeGreaterThan(0);
            expect(result.label).toBe('up');
        });

        it('calculates negative delta when declining', () => {
            const history = [
                { id: 's1', result: { wpm: 60, accuracy: 95 } },
                { id: 's2', result: { wpm: 60, accuracy: 95 } }
            ];
            const result = deriveComparison(history, 's3', { wpm: 40, accuracy: 85 }, 'zh-CN');
            expect(result.wpmDelta).toBeLessThan(0);
            expect(result.accuracyDelta).toBeLessThan(0);
            expect(result.label).toBe('down');
        });

        it('returns mixed label for mixed performance', () => {
            const history = [
                { id: 's1', result: { wpm: 50, accuracy: 90 } },
                { id: 's2', result: { wpm: 50, accuracy: 90 } }
            ];
            const result = deriveComparison(history, 's3', { wpm: 60, accuracy: 80 }, 'zh-CN');
            expect(result.label).toBe('mixed');
        });

        it('generates Chinese summary by default', () => {
            const history = [
                { id: 's1', result: { wpm: 50, accuracy: 90 } }
            ];
            const result = deriveComparison(history, 's2', { wpm: 55, accuracy: 92 }, 'zh-CN');
            expect(result.summary).toContain('速度');
            expect(result.summary).toContain('准确率');
        });

        it('generates English summary when language is en-US', () => {
            const history = [
                { id: 's1', result: { wpm: 50, accuracy: 90 } }
            ];
            const result = deriveComparison(history, 's2', { wpm: 55, accuracy: 92 }, 'en-US');
            expect(result.summary).toContain('speed');
            expect(result.summary).toContain('accuracy');
        });

        it('excludes current session from baseline calculation', () => {
            const history = [
                { id: 's1', result: { wpm: 40, accuracy: 90 } },
                { id: 's2', result: { wpm: 40, accuracy: 90 } }
            ];
            const result = deriveComparison(history, 's1', { wpm: 50, accuracy: 95 }, 'zh-CN');
            expect(result.wpmDelta).toBeGreaterThan(0);
        });
    });
});
