import { describe, expect, test } from 'vitest';
import { buildTargetedDrillFeedback } from '../drill-feedback';

describe('drill-feedback.js', () => {
    test('summarizes adaptive drills against the stored target baseline', () => {
        const result = buildTargetedDrillFeedback({
            id: 'session-adaptive-1',
            result: {
                errorCharStats: [{ label: 'a', count: 1 }],
                errorWordStats: [{ label: 'alpha', count: 1 }]
            },
            sourceTextMeta: {
                generatedBy: 'adaptive',
                adaptiveFocus: 'accuracy',
                adaptiveTargetChars: ['a'],
                adaptiveTargetWords: ['alpha'],
                adaptiveBaselineCount: 5
            }
        });

        expect(result).toMatchObject({
            type: 'adaptive',
            tone: 'progress',
            focus: 'accuracy',
            baselineCount: 5,
            currentCount: 2,
            delta: 3,
            remainingTargets: ['alpha', 'a']
        });
    });

    test('summarizes keyboard-zone drills from current error stats', () => {
        const result = buildTargetedDrillFeedback({
            id: 'session-zone-1',
            result: {
                errorCharStats: [
                    { label: 'a', count: 1 },
                    { label: 's', count: 1 },
                    { label: 'k', count: 1 },
                    { label: '.', count: 1 }
                ]
            },
            sourceTextMeta: {
                generatedBy: 'keyboard-zone',
                keyboardZone: 'leftHome',
                keyboardLayout: 'qwerty',
                keyboardZoneShare: 60
            }
        });

        expect(result).toMatchObject({
            type: 'keyboard-zone',
            tone: 'progress',
            zoneId: 'leftHome',
            baselineShare: 60,
            currentShare: 50,
            delta: 10,
            remainingTargets: ['a', 's']
        });
    });

    test('returns null for non-targeted sessions', () => {
        expect(buildTargetedDrillFeedback({
            id: 'session-free',
            result: {},
            sourceTextMeta: {
                generatedBy: 'builtin'
            }
        })).toBeNull();
    });
});
