import {
    ActiveSessionContextSchema,
    AchievementSchema,
    CoachAdviceContentSchema,
    CoachAdviceComparisonSchema,
    CoachAdviceRecordSchema,
    DiagnosticJourneySchema,
    SessionRecordSchema,
    SessionIntentSchema,
    SessionTrainingMetaSchema,
    SkillProfileSchema,
    TrainingSurfaceSchema,
    TrainingPlanSchema,
    normalizeCoachAdviceComparison,
    normalizeCoachAdviceContent,
    normalizeCoachAdviceRecord,
    normalizeSessionResult,
    normalizeSessionRecord
} from '../training-state.js';

describe('training state contracts', () => {
    test('parses skill profile snapshots with explicit level and weak-zone structure', () => {
        expect(SkillProfileSchema.parse({
            createdAt: '2026-06-08T00:00:00.000Z',
            level: { id: 'builder', label: 'Builder' },
            summary: 'Focus on accuracy.',
            primaryFocus: 'accuracy',
            weakZones: [{ id: 'accuracy', label: 'accuracy', score: 92 }],
            metrics: { avgAccuracy: 92, avgConsistency: 84 }
        })).toMatchObject({
            level: { id: 'builder', label: 'Builder' },
            primaryFocus: 'accuracy'
        });
    });

    test('parses training plan and diagnostic journey shapes explicitly', () => {
        const step = {
            id: 'starter-day-1',
            title: 'Reset accuracy',
            summary: 'Round summary',
            status: 'pending',
            config: {
                source: 'builtin',
                mode: 'time',
                durationSeconds: 45,
                wordCount: 25,
                includeNumbers: false,
                includePunctuation: false,
                aiTemplate: 'daily',
                difficulty: 'medium'
            }
        };

        expect(TrainingPlanSchema.parse({
            id: 'plan-1',
            title: '7-day starter plan',
            summary: 'Stabilize the clearest weakness first.',
            status: 'active',
            currentStepIndex: 0,
            steps: [step]
        }).steps[0].id).toBe('starter-day-1');

        expect(DiagnosticJourneySchema.parse({
            id: 'diagnostic-1',
            title: '3-minute assessment',
            summary: 'Three short rounds.',
            status: 'active',
            currentStepIndex: 0,
            steps: [step]
        }).steps).toHaveLength(1);
    });

    test('parses active session context as a discriminated union', () => {
        expect(ActiveSessionContextSchema.parse({
            type: 'plan',
            planId: 'plan-1',
            stepId: 'starter-day-1'
        })).toMatchObject({
            type: 'plan',
            planId: 'plan-1'
        });

        expect(ActiveSessionContextSchema.parse({
            type: 'challenge',
            challengeId: 'daily-2026-06-08',
            stepId: 'daily-2026-06-08',
            title: 'Daily challenge'
        })).toMatchObject({
            type: 'challenge',
            challengeId: 'daily-2026-06-08'
        });
    });

    test('parses achievement and coach advice records with explicit shape', () => {
        expect(AchievementSchema.parse({
            id: 'first-session',
            title: 'First Session',
            description: 'Finish the first complete round.',
            unlockedAt: '2026-06-08T00:00:00.000Z',
            unlocked: true
        })).toMatchObject({
            id: 'first-session',
            unlocked: true
        });

        expect(CoachAdviceRecordSchema.parse({
            id: 'coach-1',
            sessionId: 'session-1',
            source: 'ai',
            headline: 'Hold this pace',
            summary: 'Keep the same pressure next round.',
            strengths: ['Speed'],
            weaknesses: ['Punctuation'],
            nextDrill: {
                label: 'Start next drill',
                reason: 'Practice more',
                configPatch: {
                    source: 'ai',
                    difficulty: 'medium'
                },
                aiPrompt: 'Generate another drill'
            }
        })).toMatchObject({
            sessionId: 'session-1',
            source: 'ai'
        });
    });

    test('normalizes session and coach advice records with stable defaults', () => {
        expect(normalizeSessionRecord({
            id: 'session-1',
            result: { wpm: 88 }
        })).toEqual({
            id: 'session-1',
            result: {
                accuracy: 0,
                consistency: 0,
                correctChars: 0,
                durationSeconds: 0,
                errorCharStats: [],
                errorWordStats: [],
                errors: 0,
                extraChars: 0,
                incorrectChars: 0,
                missedChars: 0,
                rawWpm: 0,
                wpm: 88,
                topErrorChars: [],
                topErrorWords: []
            }
        });

        expect(SessionRecordSchema.parse({
            id: 'session-2',
            timeline: {
                samples: [],
                labels: []
            }
        }).timeline).toMatchObject({
            samples: [],
            labels: [],
            wpm: [],
            raw: [],
            accuracy: [],
            burst: [],
            errors: [],
            pauseMoments: []
        });

        expect(SessionRecordSchema.parse({
            id: 'session-adaptive',
            sourceTextMeta: {
                source: 'builtin',
                label: 'Adaptive accuracy drill',
                generatedBy: 'adaptive',
                adaptiveFocus: 'accuracy',
                adaptiveHotspots: ['alpha', 'again'],
                adaptiveTargetChars: ['a'],
                adaptiveTargetWords: ['alpha'],
                adaptiveBaselineCount: 4,
                adaptiveSourceSessionId: 'session-0',
                adaptiveMetrics: {
                    accuracy: 92,
                    missCount: 4
                }
            }
        }).sourceTextMeta).toMatchObject({
            generatedBy: 'adaptive',
            adaptiveFocus: 'accuracy',
            adaptiveHotspots: ['alpha', 'again'],
            adaptiveTargetChars: ['a'],
            adaptiveTargetWords: ['alpha'],
            adaptiveBaselineCount: 4,
            adaptiveSourceSessionId: 'session-0',
            adaptiveMetrics: {
                accuracy: 92,
                missCount: 4
            }
        });

        expect(SessionRecordSchema.parse({
            id: 'session-keyboard-zone',
            sourceTextMeta: {
                source: 'builtin',
                label: 'Left home row drill',
                generatedBy: 'keyboard-zone',
                keyboardZone: 'leftHome',
                keyboardLayout: 'qwerty',
                keyboardZoneChars: ['a', 's'],
                keyboardZoneShare: 56
            }
        }).sourceTextMeta).toMatchObject({
            generatedBy: 'keyboard-zone',
            keyboardZone: 'leftHome',
            keyboardLayout: 'qwerty',
            keyboardZoneChars: ['a', 's'],
            keyboardZoneShare: 56
        });

        expect(normalizeCoachAdviceRecord({
            sessionId: 'session-1',
            source: 'fallback'
        })).toEqual({
            sessionId: 'session-1',
            status: 'complete',
            source: 'fallback',
            strengths: [],
            weaknesses: [],
            providerMeta: {}
        });

        expect(normalizeCoachAdviceContent({
            headline: 'Hold this pace',
            summary: 'Keep the same pressure next round.'
        })).toEqual({
            headline: 'Hold this pace',
            summary: 'Keep the same pressure next round.',
            strengths: [],
            weaknesses: []
        });

        expect(normalizeSessionResult({ wpm: 88 })).toEqual({
            accuracy: 0,
            consistency: 0,
            correctChars: 0,
            durationSeconds: 0,
            errorCharStats: [],
            errorWordStats: [],
            errors: 0,
            extraChars: 0,
            incorrectChars: 0,
            missedChars: 0,
            rawWpm: 0,
            wpm: 88,
            topErrorChars: [],
            topErrorWords: []
        });

        expect(CoachAdviceComparisonSchema.parse({ summary: 'Better than last time' })).toEqual({
            label: 'mixed',
            summary: 'Better than last time',
            wpmDelta: null,
            accuracyDelta: null
        });

        expect(normalizeCoachAdviceComparison({})).toEqual({
            label: 'mixed',
            summary: '',
            wpmDelta: null,
            accuracyDelta: null
        });
    });

    test('parses vNext training surface and session intent metadata', () => {
        expect(TrainingSurfaceSchema.parse('practice')).toBe('practice');
        expect(TrainingSurfaceSchema.parse('missions')).toBe('missions');
        expect(SessionIntentSchema.parse('endless-rift')).toBe('endless-rift');
        expect(SessionIntentSchema.parse('daily-mutation')).toBe('daily-mutation');
        expect(SessionIntentSchema.parse('first-breach')).toBe('first-breach');
        expect(SessionIntentSchema.parse('baseline-mission')).toBe('baseline-mission');

        expect(SessionTrainingMetaSchema.parse({
            type: 'practice',
            surface: 'practice',
            intent: 'adaptive-drill',
            focus: 'accuracy',
            sourceSessionId: 'session-0',
            title: 'Adaptive accuracy drill'
        })).toMatchObject({
            type: 'practice',
            surface: 'practice',
            intent: 'adaptive-drill',
            focus: 'accuracy',
            sourceSessionId: 'session-0'
        });

        expect(normalizeSessionRecord({
            id: 'session-free',
            kind: 'practice',
            intent: 'free-practice',
            startedAt: '2026-06-08T08:00:00.000Z',
            completedAt: '2026-06-08T08:01:00.000Z',
            durationSeconds: 60,
            focus: 'speed',
            source: 'builtin',
            trainingMeta: {
                type: 'practice',
                surface: 'practice',
                intent: 'free-practice'
            }
        })).toMatchObject({
            kind: 'practice',
            intent: 'free-practice',
            trainingMeta: {
                type: 'practice',
                surface: 'practice',
                intent: 'free-practice'
            }
        });
    });
});
