import { describe, it, expect } from 'vitest';
import { buildInsights, buildKeyboardHotspots, buildKeyboardHotspotsFromStats } from '../insights';

describe('insights.js', () => {
    describe('buildInsights', () => {
        const createMockSession = (overrides = {}) => ({
            id: `session-${Math.random()}`,
            config: {
                source: 'builtin',
                difficulty: 'medium'
            },
            result: {
                wpm: 50,
                accuracy: 95,
                consistency: 88,
                topErrorChars: ['a', 'e', 's'],
                topErrorWords: ['hello', 'world'],
                completedAt: new Date().toISOString()
            },
            ...overrides
        });

        it('returns insights object with required fields', () => {
            const result = buildInsights([]);
            expect(result).toHaveProperty('totalSessions');
            expect(result).toHaveProperty('latestSession');
            expect(result).toHaveProperty('recent7');
            expect(result).toHaveProperty('recent30');
            expect(result).toHaveProperty('bestWpmOverall');
            expect(result).toHaveProperty('avgAccuracyOverall');
            expect(result).toHaveProperty('aiShareOverall');
            expect(result).toHaveProperty('topErrorChars');
            expect(result).toHaveProperty('topErrorWords');
            expect(result).toHaveProperty('keyboardHotspots');
            expect(result).toHaveProperty('daily7');
            expect(result).toHaveProperty('daily30');
        });

        it('returns zero counts for empty sessions', () => {
            const result = buildInsights([]);
            expect(result.totalSessions).toBe(0);
            expect(result.recent7.count).toBe(0);
            expect(result.recent30.count).toBe(0);
            expect(result.bestWpmOverall).toBe(0);
            expect(result.aiShareOverall).toBe(0);
        });

        it('calculates totalSessions correctly', () => {
            const sessions = [createMockSession(), createMockSession()];
            const result = buildInsights(sessions);
            expect(result.totalSessions).toBe(2);
        });

        it('returns latestSession as first session', () => {
            const sessions = [
                createMockSession({ id: 'newer' }),
                createMockSession({ id: 'older' })
            ];
            const result = buildInsights(sessions);
            expect(result.latestSession.id).toBe('newer');
        });

        it('returns null latestSession for empty sessions', () => {
            const result = buildInsights([]);
            expect(result.latestSession).toBeNull();
        });

        it('handles non-array input gracefully', () => {
            const result = buildInsights(null);
            expect(result.totalSessions).toBe(0);
        });

        it('handles undefined input', () => {
            const result = buildInsights(undefined);
            expect(result.totalSessions).toBe(0);
        });

        it('calculates bestWpmOverall correctly', () => {
            const sessions = [
                createMockSession({ result: { wpm: 40, accuracy: 95, topErrorChars: [], topErrorWords: [] } }),
                createMockSession({ result: { wpm: 60, accuracy: 95, topErrorChars: [], topErrorWords: [] } }),
                createMockSession({ result: { wpm: 50, accuracy: 95, topErrorChars: [], topErrorWords: [] } })
            ];
            const result = buildInsights(sessions);
            expect(result.bestWpmOverall).toBe(60);
        });

        it('calculates avgAccuracyOverall correctly', () => {
            const sessions = [
                createMockSession({ result: { wpm: 50, accuracy: 90, topErrorChars: [], topErrorWords: [] } }),
                createMockSession({ result: { wpm: 50, accuracy: 94, topErrorChars: [], topErrorWords: [] } }),
                createMockSession({ result: { wpm: 50, accuracy: 96, topErrorChars: [], topErrorWords: [] } })
            ];
            const result = buildInsights(sessions);
            expect(result.avgAccuracyOverall).toBeCloseTo(93.3, 1);
        });

        it('calculates aiShareOverall correctly', () => {
            const sessions = [
                createMockSession({ config: { source: 'ai' } }),
                createMockSession({ config: { source: 'builtin' } }),
                createMockSession({ config: { source: 'ai' } })
            ];
            const result = buildInsights(sessions);
            expect(result.aiShareOverall).toBe(67);
        });

        it('returns 0 aiShareOverall when no sessions', () => {
            const result = buildInsights([]);
            expect(result.aiShareOverall).toBe(0);
        });

        it('aggregates topErrorChars from recent 30 sessions', () => {
            const sessions = [
                createMockSession({ result: { wpm: 50, accuracy: 95, topErrorChars: ['a', 'b'], topErrorWords: [] } }),
                createMockSession({ result: { wpm: 50, accuracy: 95, topErrorChars: ['a', 'c'], topErrorWords: [] } })
            ];
            const result = buildInsights(sessions);
            expect(result.topErrorChars.length).toBeGreaterThan(0);
            const aEntry = result.topErrorChars.find((e) => e.label === 'a');
            expect(aEntry.count).toBe(2);
        });

        it('aggregates error characters into keyboard zones', () => {
            const sessions = [
                createMockSession({ result: { wpm: 50, accuracy: 95, topErrorChars: ['a', 's', 'd', 'j', '1', '.'], topErrorWords: [] } }),
                createMockSession({ result: { wpm: 52, accuracy: 94, topErrorChars: ['a', 'g', 'k'], topErrorWords: [] } })
            ];
            const result = buildInsights(sessions, { keyboardLayout: 'qwerty' });

            expect(result.keyboardHotspots.total).toBe(9);
            expect(result.keyboardHotspots.primaryZone).toMatchObject({
                id: 'leftHome',
                count: 5,
                share: 56
            });
            expect(result.keyboardHotspots.zones.find((zone) => zone.id === 'numberRow')).toMatchObject({
                count: 1,
                chars: [{ label: '1', count: 1 }]
            });
            expect(result.keyboardHotspots.zones.find((zone) => zone.id === 'symbolLayer')).toMatchObject({
                count: 1
            });
        });

        it('respects keyboard layout when resolving zones', () => {
            const qwerty = buildKeyboardHotspots(['f', 'f', 'p'], { keyboardLayout: 'qwerty' });
            const colemak = buildKeyboardHotspots(['f', 'f', 'p'], { keyboardLayout: 'colemak' });

            expect(qwerty.primaryZone.id).toBe('leftHome');
            expect(colemak.primaryZone.id).toBe('leftTop');
        });

        it('builds keyboard hotspots from counted character stats', () => {
            const result = buildKeyboardHotspotsFromStats([
                { label: 'a', count: 4 },
                { label: 's', count: 2 },
                { label: '.', count: 1 }
            ], { keyboardLayout: 'qwerty' });

            expect(result.primaryZone).toMatchObject({
                id: 'leftHome',
                count: 6,
                share: 86
            });
            expect(result.zones.find((zone) => zone.id === 'symbolLayer')).toMatchObject({
                count: 1
            });
        });

        it('limits topErrorChars to 5 entries', () => {
            const sessions = [
                createMockSession({ result: { wpm: 50, accuracy: 95, topErrorChars: ['a'], topErrorWords: [] } }),
                createMockSession({ result: { wpm: 50, accuracy: 95, topErrorChars: ['b'], topErrorWords: [] } }),
                createMockSession({ result: { wpm: 50, accuracy: 95, topErrorChars: ['c'], topErrorWords: [] } }),
                createMockSession({ result: { wpm: 50, accuracy: 95, topErrorChars: ['d'], topErrorWords: [] } }),
                createMockSession({ result: { wpm: 50, accuracy: 95, topErrorChars: ['e'], topErrorWords: [] } }),
                createMockSession({ result: { wpm: 50, accuracy: 95, topErrorChars: ['f'], topErrorWords: [] } })
            ];
            const result = buildInsights(sessions);
            expect(result.topErrorChars.length).toBeLessThanOrEqual(5);
        });

        it('generates daily7 series with 7 days', () => {
            const result = buildInsights([]);
            expect(result.daily7.length).toBe(7);
            expect(result.daily7[0]).toHaveProperty('key');
            expect(result.daily7[0]).toHaveProperty('date');
            expect(result.daily7[0]).toHaveProperty('count');
            expect(result.daily7[0]).toHaveProperty('avgWpm');
            expect(result.daily7[0]).toHaveProperty('avgAccuracy');
        });

        it('generates daily30 series with 30 days', () => {
            const result = buildInsights([]);
            expect(result.daily30.length).toBe(30);
        });

        it('recent7 reflects only first 7 sessions', () => {
            const sessions = Array.from({ length: 10 }, (_, i) =>
                createMockSession({
                    id: `s${i}`,
                    result: { wpm: 40 + i * 10, accuracy: 95, topErrorChars: [], topErrorWords: [] }
                })
            );
            const result = buildInsights(sessions);
            expect(result.recent7.count).toBe(7);
        });

        it('handles sessions with missing result fields', () => {
            const sessions = [
                { id: 'incomplete', config: {}, result: null }
            ];
            const result = buildInsights(sessions);
            expect(result.totalSessions).toBe(1);
            expect(result.bestWpmOverall).toBe(0);
        });
    });
});
