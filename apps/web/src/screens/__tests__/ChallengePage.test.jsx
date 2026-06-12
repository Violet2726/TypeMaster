/** @vitest-environment jsdom */
import { screen } from '@testing-library/react';
import ChallengePage from '../ChallengePage';
import { renderWithProvider } from '../../test/render-with-provider';

describe('ChallengePage', () => {
    test('renders a first-run challenge dashboard without placeholder metrics', async () => {
        renderWithProvider(<ChallengePage />, {
            storageState: {
                'typemaster:v5:preferences': {
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
                'typemaster:v5:sessions-cache': []
            }
        });

        expect((await screen.findAllByText('Your challenge status')).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('No result posted yet. Finish one round and your rank plus best status will appear here.').length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByText('No same-level results yet. You can leave the first one.').length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByText('--')).not.toBeInTheDocument();
        expect(screen.queryByText('0 WPM')).not.toBeInTheDocument();
        expect(screen.queryByText('0%')).not.toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: 'Start challenge' }).length).toBeGreaterThan(1);
    });

    test('renders daily challenge controls and leaderboard section', async () => {
        const challengeId = `daily-${new Date().toISOString().slice(0, 10)}`;

        renderWithProvider(<ChallengePage />, {
            storageState: {
                'typemaster:v5:preferences': {
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
                'typemaster:v5:sessions-cache': [
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
                    },
                    {
                        id: 'session-2',
                        trainingMeta: {
                            type: 'challenge',
                            stepId: challengeId,
                            title: 'Daily challenge'
                        },
                        result: {
                            wpm: 96,
                            accuracy: 98,
                            completedAt: '2026-06-08T09:00:00.000Z'
                        }
                    }
                ],
                'typemaster:v5:skill-profile-cache': {
                    createdAt: '2026-06-08T00:00:00.000Z',
                    level: { id: 'builder', label: 'Builder' },
                    summary: 'Keep pushing challenge consistency.',
                    primaryFocus: 'accuracy',
                    weakZones: [{ id: 'accuracy', label: 'accuracy', score: 92 }],
                    metrics: { avgAccuracy: 92, avgConsistency: 84 }
                },
                'typemaster:v5:api-fallback-cache': {
                    currentUserId: 'user-1',
                    users: {
                        'user-1': {
                            id: 'user-1',
                            displayName: 'Alice',
                            createdAt: '2026-06-08T00:00:00.000Z',
                            lastSyncedAt: null,
                            sessions: [],
                            trainingPlan: null,
                            skillProfile: { level: { id: 'builder', label: 'Builder' } },
                            challengeResults: {},
                            achievements: [],
                            streakState: null,
                            userProfile: { displayName: 'Alice' }
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
                                includePunctuation: false,
                                aiTemplate: 'daily',
                                difficulty: 'medium'
                            },
                            leaderboard: [
                                {
                                    id: 'entry-1',
                                    challengeId,
                                    sessionId: 'session-1',
                                    displayName: 'Alice',
                                    userId: 'user-1',
                                    levelId: 'builder',
                                    wpm: 88,
                                    accuracy: 98,
                                    createdAt: '2026-06-08T08:00:00.000Z'
                                },
                                {
                                    id: 'entry-2',
                                    challengeId,
                                    sessionId: 'session-2',
                                    displayName: 'Alice',
                                    userId: 'user-1',
                                    levelId: 'builder',
                                    wpm: 96,
                                    accuracy: 98,
                                    createdAt: '2026-06-08T09:00:00.000Z'
                                }
                            ]
                        }
                    }
                }
            }
        });

        expect(await screen.findByRole('heading', { name: 'Daily challenge' })).toBeInTheDocument();
        expect(screen.getAllByRole('button', { name: /challenge/i }).length).toBeGreaterThan(0);
        expect(screen.getByText('Your challenge status')).toBeInTheDocument();
        expect(screen.getByText('Peer group')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Today\'s trend' })).toBeInTheDocument();
        expect(screen.getByText('Speed change')).toBeInTheDocument();
        expect(screen.getByText('Run focus')).toBeInTheDocument();
        expect(screen.getByText('Vs previous')).toBeInTheDocument();
        expect(screen.getAllByText(/challenge pressure on|small amount of pressure|good moment to keep pushing/i).length).toBeGreaterThan(0);
        expect(screen.getByRole('heading', { name: 'Today\'s replay' })).toBeInTheDocument();
        expect(screen.getAllByText('Best run').length).toBeGreaterThan(0);
        expect(screen.getByRole('heading', { name: 'Leaderboard' })).toBeInTheDocument();
    });
});
