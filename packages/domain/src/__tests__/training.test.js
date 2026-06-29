import { describe, it, expect } from 'vitest';
import {
    createDiagnosticJourney,
    getActiveJourneyStep,
    advanceJourney,
    buildSkillProfile,
    createStarterTrainingPlan,
    getActiveTrainingStep,
    advanceTrainingPlan,
    getTrainingPlanProgress,
    createDraftFromTrainingStep,
    calculateSessionStreak,
    calculateWeeklySessions
} from '../training';

describe('training.js', () => {
    it('creates a 3-step diagnostic journey', () => {
        const journey = createDiagnosticJourney('en-US');

        expect(journey.status).toBe('active');
        expect(journey.steps).toHaveLength(3);
        expect(getActiveJourneyStep(journey)?.id).toBe('diagnostic-accuracy');
    });

    it('advances diagnostic journey and completes the last step', () => {
        let journey = createDiagnosticJourney('en-US');
        journey = advanceJourney(journey, 'session-1');
        expect(journey.currentStepIndex).toBe(1);
        expect(getActiveJourneyStep(journey)?.id).toBe('diagnostic-rhythm');

        journey = advanceJourney(journey, 'session-2');
        journey = advanceJourney(journey, 'session-3');
        expect(journey.status).toBe('complete');
        expect(journey.steps[2].completedSessionId).toBe('session-3');
    });

    it('builds a skill profile with primary focus areas', () => {
        const sessions = [
            {
                config: { includeNumbers: false, includePunctuation: false },
                result: {
                    wpm: 42,
                    accuracy: 91,
                    consistency: 80,
                    durationSeconds: 60,
                    topErrorChars: ['a', 'a', 's'],
                    topErrorWords: ['alpha', 'alpha', 'steady']
                }
            },
            {
                config: { includeNumbers: true, includePunctuation: true },
                result: {
                    wpm: 46,
                    accuracy: 92,
                    consistency: 78,
                    durationSeconds: 60,
                    topErrorChars: ['a', 'd'],
                    topErrorWords: ['alpha', 'delta']
                }
            },
            {
                config: { includeNumbers: false, includePunctuation: false },
                trainingMeta: {
                    type: 'raid',
                    surface: 'raid',
                    score: 3200,
                    maxCombo: 28
                },
                result: {
                    wpm: 54,
                    accuracy: 94,
                    consistency: 86,
                    durationSeconds: 180,
                    topErrorChars: ['s'],
                    topErrorWords: []
                }
            }
        ];

        const profile = buildSkillProfile(sessions, 'en-US');

        expect(profile.level.id).toBe('foundation');
        expect(profile.primaryFocus).toBe('accuracy');
        expect(profile.weakZones.some((item) => item.id === 'rhythm')).toBe(true);
        expect(profile.topErrorChars[0]).toBe('a');
        expect(profile.topErrorWords[0]).toBe('alpha');
        expect(profile.keyboardFocus).toMatchObject({
            zoneId: 'leftHome',
            repeatedSessionCount: 2
        });
        expect(profile.metrics.surfaces).toMatchObject({
            practice: 2,
            raid: 1
        });
        expect(profile.metrics.raidBestScore).toBe(3200);
        expect(profile.metrics.raidMaxCombo).toBe(28);
    });

    it('creates a 7-day starter plan and advances through it', () => {
        const plan = createStarterTrainingPlan({
            primaryFocus: 'accuracy',
            topErrorChars: ['a'],
            topErrorWords: ['alpha']
        }, 'en-US');

        expect(plan.steps).toHaveLength(7);
        expect(getActiveTrainingStep(plan)?.id).toBe('starter-day-1');

        const updated = advanceTrainingPlan(plan, 'session-1');
        expect(updated.currentStepIndex).toBe(1);
        expect(updated.steps[0].status).toBe('complete');
        expect(getTrainingPlanProgress(updated)).toEqual({
            total: 7,
            completed: 1,
            percent: 14
        });
    });

    it('replaces the weak spot day with a keyboard zone step when the pressure repeats', () => {
        const plan = createStarterTrainingPlan({
            primaryFocus: 'accuracy',
            topErrorChars: ['a'],
            topErrorWords: ['alpha'],
            keyboardFocus: {
                zoneId: 'leftHome',
                zoneShare: 56,
                zoneChars: ['a', 's', 'd'],
                repeatedSessionCount: 2,
                totalErrors: 9,
                keyboardLayout: 'qwerty'
            }
        }, 'en-US');

        expect(plan.steps[2]).toMatchObject({
            id: 'starter-day-3',
            generatedBy: 'keyboard-zone',
            keyboardZone: 'leftHome',
            keyboardZoneChars: ['a', 's', 'd']
        });
        expect(plan.steps[2].title).toBe('Left hand / home row reset');
    });

    it('creates a draft from a training step', () => {
        const plan = createStarterTrainingPlan({
            primaryFocus: 'accuracy',
            topErrorChars: ['a'],
            topErrorWords: ['alpha']
        }, 'en-US');

        const draft = createDraftFromTrainingStep(plan.steps[2], 'en-US');

        expect(draft).toBeDefined();
        expect(draft.sourceTextMeta.label).toBe(plan.steps[2].title);
        expect(draft.words.length).toBeGreaterThan(0);
    });

    it('creates a keyboard-zone draft from a specialized training step', () => {
        const draft = createDraftFromTrainingStep({
            id: 'starter-day-3',
            order: 3,
            title: 'Left hand / home row reset',
            summary: 'Pressure stayed here twice.',
            status: 'pending',
            config: {
                source: 'builtin',
                mode: 'words',
                durationSeconds: 30,
                wordCount: 32,
                includeNumbers: false,
                includePunctuation: false,
                aiTemplate: 'daily',
                difficulty: 'medium'
            },
            generatedBy: 'keyboard-zone',
            keyboardZone: 'leftHome',
            keyboardLayout: 'qwerty',
            keyboardZoneChars: ['a', 's', 'd'],
            keyboardZoneShare: 56
        }, 'en-US');

        expect(draft.sourceTextMeta).toMatchObject({
            generatedBy: 'keyboard-zone',
            label: 'Left hand / home row reset',
            keyboardZone: 'leftHome',
            keyboardLayout: 'qwerty',
            keyboardZoneChars: ['a', 's', 'd'],
            keyboardZoneShare: 56
        });
        expect(draft.configSnapshot.wordCount).toBe(32);
    });

    it('calculates streak and weekly session counts', () => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        const twoDaysAgo = new Date(now.getTime() - (2 * 24 * 60 * 60 * 1000));

        const sessions = [
            { result: { completedAt: now.toISOString() } },
            { result: { completedAt: yesterday.toISOString() } },
            { result: { completedAt: twoDaysAgo.toISOString() } }
        ];

        expect(calculateSessionStreak(sessions)).toBe(3);
        expect(calculateWeeklySessions(sessions)).toBe(3);
    });
});
