/** @vitest-environment jsdom */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import HomePage from '../HomePage';
import { renderWithProvider } from '../../test/render-with-provider';

const { mockNavigate } = vi.hoisted(() => ({
    mockNavigate: vi.fn()
}));

vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('HomePage', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
    });

    test('shows the training dashboard when skill profile and plan exist', async () => {
        const challengeId = `daily-${new Date().toISOString().slice(0, 10)}`;

        renderWithProvider(<HomePage />, {
            localStorageState: {
                'typemaster:v2:settings': {
                    language: 'en-US',
                    lastConfig: {
                        source: 'builtin',
                        mode: 'time',
                        durationSeconds: 30,
                        wordCount: 25,
                        includePunctuation: false,
                        includeNumbers: false,
                        aiTemplate: 'daily',
                        difficulty: 'medium'
                    }
                },
                'typemaster:v4:skill-profile': {
                    createdAt: '2026-06-08T00:00:00.000Z',
                    level: { id: 'builder', label: 'Builder' },
                    summary: 'Your next phase should focus on reinforcing accuracy.',
                    primaryFocus: 'accuracy',
                    weakZones: [{ id: 'accuracy', label: 'accuracy', score: 92 }],
                    metrics: { avgAccuracy: 92, avgConsistency: 84 }
                },
                'typemaster:v4:training-plan': {
                    id: 'plan-1',
                    title: '7-day starter plan',
                    summary: 'Stabilize the clearest weakness first, then add pressure.',
                    status: 'active',
                    currentStepIndex: 0,
                    steps: [
                        { id: 'step-1', status: 'pending', title: 'Reset accuracy', summary: 'Round summary', config: { mode: 'time', durationSeconds: 45 } }
                    ]
                },
                'typemaster:v2:sessions': [
                    {
                        id: 'session-0',
                        trainingMeta: {
                            type: 'challenge',
                            stepId: challengeId,
                            title: 'Daily challenge'
                        },
                        result: {
                            wpm: 80,
                            accuracy: 97,
                            completedAt: '2026-06-08T07:00:00.000Z'
                        }
                    },
                    {
                        id: 'session-1',
                        trainingMeta: {
                            type: 'challenge',
                            stepId: challengeId,
                            title: 'Daily challenge'
                        },
                        result: {
                            wpm: 88,
                            accuracy: 98,
                            completedAt: '2026-06-08T08:00:00.000Z'
                        }
                    }
                ],
                'typemaster:v4:cloud-store': {
                    currentUserId: 'user-1',
                    users: {
                        'user-1': {
                            id: 'user-1',
                            displayName: 'Alice',
                            createdAt: '2026-06-08T00:00:00.000Z',
                            sessions: [],
                            trainingPlan: null,
                            skillProfile: { level: { id: 'builder', label: 'Builder' } },
                            challengeResults: {},
                            achievements: [],
                            streakState: null
                        }
                    },
                    challenges: {
                        [challengeId]: {
                            id: challengeId,
                            dateKey: new Date().toISOString().slice(0, 10),
                            title: 'Daily challenge',
                            summary: 'Use one shared text to compare stability and accuracy.',
                            text: 'steady focus clear rhythm',
                            config: {
                                source: 'builtin',
                                mode: 'words',
                                wordCount: 10,
                                durationSeconds: 45,
                                includeNumbers: false,
                                includePunctuation: false
                            },
                            leaderboard: [
                                {
                                    id: 'entry-1',
                                    sessionId: 'session-1',
                                    displayName: 'Alice',
                                    userId: 'user-1',
                                    levelId: 'builder',
                                    wpm: 88,
                                    accuracy: 98,
                                    createdAt: '2026-06-08T08:00:00.000Z'
                                }
                            ]
                        }
                    }
                }
            }
        });

        expect(await screen.findByRole('button', { name: 'Retry challenge' })).toBeInTheDocument();
        expect(screen.getByText('What to train today')).toBeInTheDocument();
        expect(screen.getByText('Start from one of these lanes')).toBeInTheDocument();
        expect(screen.getAllByText('Builder').length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: 'Continue today\'s task' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Free practice' })).toBeInTheDocument();
        expect(screen.getByText('New best today')).toBeInTheDocument();
        expect(screen.getByText('Keep pushing the board. Today\'s speed curve is still moving upward.')).toBeInTheDocument();
        expect(screen.getByText('Current rank')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'View leaderboard' })).toBeInTheDocument();
    });

    test('suggests switching back to the plan when challenge momentum fades', async () => {
        const challengeId = `daily-${new Date().toISOString().slice(0, 10)}`;

        renderWithProvider(<HomePage />, {
            localStorageState: {
                'typemaster:v2:settings': {
                    language: 'en-US',
                    lastConfig: {
                        source: 'builtin',
                        mode: 'time',
                        durationSeconds: 30,
                        wordCount: 25,
                        includePunctuation: false,
                        includeNumbers: false,
                        aiTemplate: 'daily',
                        difficulty: 'medium'
                    }
                },
                'typemaster:v4:skill-profile': {
                    createdAt: '2026-06-08T00:00:00.000Z',
                    level: { id: 'builder', label: 'Builder' },
                    summary: 'Your next phase should focus on reinforcing accuracy.',
                    primaryFocus: 'accuracy',
                    weakZones: [{ id: 'accuracy', label: 'accuracy', score: 92 }],
                    metrics: { avgAccuracy: 92, avgConsistency: 84 }
                },
                'typemaster:v4:training-plan': {
                    id: 'plan-1',
                    title: '7-day starter plan',
                    summary: 'Stabilize the clearest weakness first, then add pressure.',
                    status: 'active',
                    currentStepIndex: 0,
                    steps: [
                        { id: 'step-1', status: 'pending', title: 'Reset accuracy', summary: 'Round summary', config: { mode: 'time', durationSeconds: 45 } }
                    ]
                },
                'typemaster:v2:sessions': [
                    {
                        id: 'session-0',
                        trainingMeta: { type: 'challenge', stepId: challengeId, title: 'Daily challenge' },
                        result: { wpm: 96, accuracy: 98, completedAt: '2026-06-08T07:00:00.000Z' }
                    },
                    {
                        id: 'session-1',
                        trainingMeta: { type: 'challenge', stepId: challengeId, title: 'Daily challenge' },
                        result: { wpm: 88, accuracy: 97, completedAt: '2026-06-08T08:00:00.000Z' }
                    },
                    {
                        id: 'session-2',
                        trainingMeta: { type: 'challenge', stepId: challengeId, title: 'Daily challenge' },
                        result: { wpm: 82, accuracy: 95, completedAt: '2026-06-08T09:00:00.000Z' }
                    }
                ],
                'typemaster:v4:cloud-store': {
                    currentUserId: 'user-1',
                    users: {
                        'user-1': {
                            id: 'user-1',
                            displayName: 'Alice',
                            createdAt: '2026-06-08T00:00:00.000Z',
                            sessions: [],
                            trainingPlan: null,
                            skillProfile: { level: { id: 'builder', label: 'Builder' } },
                            challengeResults: {},
                            achievements: [],
                            streakState: null
                        }
                    },
                    challenges: {
                        [challengeId]: {
                            id: challengeId,
                            dateKey: new Date().toISOString().slice(0, 10),
                            title: 'Daily challenge',
                            summary: 'Use one shared text to compare stability and accuracy.',
                            text: 'steady focus clear rhythm',
                            config: {
                                source: 'builtin',
                                mode: 'words',
                                wordCount: 10,
                                durationSeconds: 45,
                                includeNumbers: false,
                                includePunctuation: false
                            },
                            leaderboard: [
                                { id: 'entry-2', sessionId: 'session-2', displayName: 'Alice', userId: 'user-1', levelId: 'builder', wpm: 82, accuracy: 95, createdAt: '2026-06-08T09:00:00.000Z' }
                            ]
                        }
                    }
                }
            }
        });

        const recoverButton = await screen.findByRole('button', { name: 'Back to plan' });
        expect(recoverButton).toBeInTheDocument();
        expect(screen.getByText('The leaderboard push is flattening out. Step away from challenge mode and return to plan work.')).toBeInTheDocument();

        fireEvent.click(recoverButton);

        await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/practice'));
        await waitFor(() => {
            const context = JSON.parse(window.localStorage.getItem('typemaster:v4:active-session-context'));
            expect(context).toMatchObject({
                type: 'plan',
                planId: 'plan-1',
                stepId: 'step-1'
            });
        });
    });
});
