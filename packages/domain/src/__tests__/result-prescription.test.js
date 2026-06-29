import { describe, expect, test } from 'vitest';
import { buildResultPrescription } from '../result-prescription.js';

function createSession(overrides = {}) {
    return {
        id: 'session-1',
        config: {
            mode: 'words',
            wordCount: 50
        },
        result: {
            wpm: 70,
            rawWpm: 76,
            accuracy: 97,
            consistency: 92,
            durationSeconds: 60,
            incorrectChars: 1,
            extraChars: 0,
            missedChars: 0,
            topErrorChars: ['a']
        },
        sourceTextMeta: {
            label: 'Practice text'
        },
        trainingMeta: {
            title: 'Practice'
        },
        ...overrides
    };
}

describe('buildResultPrescription', () => {
    test('prioritizes accuracy recovery when misses are high', () => {
        const result = buildResultPrescription(createSession({
            result: {
                ...createSession().result,
                accuracy: 91,
                incorrectChars: 4,
                missedChars: 2
            }
        }));

        expect(result.causeSignals[0]).toMatchObject({
            id: 'accuracy',
            severity: 'high',
            detail: 6
        });
        expect(result.nextAction).toMatchObject({
            intent: 'recovery-drill',
            focus: 'accuracy'
        });
    });

    test('prescribes rhythm work for unstable sessions', () => {
        const result = buildResultPrescription(createSession({
            result: {
                ...createSession().result,
                accuracy: 98,
                consistency: 80
            }
        }));

        expect(result.causeSignals[0].id).toBe('stability');
        expect(result.trainingPrescription).toMatchObject({
            intent: 'adaptive-drill',
            focus: 'rhythm',
            sourceSessionId: 'session-1'
        });
    });

    test('steps up speed when the round is already clean', () => {
        const result = buildResultPrescription(createSession({
            config: {
                mode: 'time',
                durationSeconds: 30
            },
            result: {
                ...createSession().result,
                rawWpm: 71,
                accuracy: 99,
                consistency: 94
            }
        }));

        expect(result.causeSignals[0].id).toBe('speed');
        expect(result.trainingPrescription.dose).toEqual({
            type: 'time',
            value: 30,
            unit: 'seconds'
        });
    });
});
