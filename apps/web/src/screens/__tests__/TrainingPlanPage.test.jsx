/** @vitest-environment jsdom */
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import TrainingPlanPage from '../TrainingPlanPage';
import { renderWithProvider } from '../../test/render-with-provider';
import { loadActiveSessionContext } from '../../services/storage';
import { mockRouterPush, resetMockNavigation } from '../../test/next-navigation';

describe('TrainingPlanPage', () => {
    beforeEach(() => {
        resetMockNavigation();
    });

    test('starts the diagnostic flow instead of showing empty plan metrics', async () => {
        renderWithProvider(<TrainingPlanPage />, {
            route: '/plan',
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
                }
            }
        });

        expect(await screen.findByRole('heading', { name: 'Start with a 3-minute assessment' })).toBeInTheDocument();
        expect(screen.queryByText('0/0')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Start assessment' }));

        await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/practice'));
        await waitFor(() => {
            expect(loadActiveSessionContext()).toMatchObject({
                type: 'diagnostic',
                stepId: 'diagnostic-accuracy'
            });
        });
    });

    test('routes completed plans into a fresh reassessment flow', async () => {
        renderWithProvider(<TrainingPlanPage />, {
            route: '/plan',
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
                'typemaster:v5:training-plan-cache': {
                    id: 'plan-1',
                    title: '7-day starter plan',
                    summary: 'Stabilize the clearest weakness first, then add pressure.',
                    status: 'complete',
                    currentStepIndex: 6,
                    steps: [
                        { id: 'starter-day-1', status: 'complete', title: 'Reset accuracy', summary: 'Round summary', config: { mode: 'time', durationSeconds: 45 } }
                    ]
                }
            }
        });

        expect((await screen.findAllByRole('heading', { name: 'Reassess for the next phase' })).length).toBeGreaterThanOrEqual(2);
        expect(screen.getByRole('button', { name: 'Start reassessment' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Start reassessment' }));

        await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/practice'));
        await waitFor(() => {
            expect(loadActiveSessionContext()).toMatchObject({
                type: 'diagnostic',
                stepId: 'diagnostic-accuracy'
            });
        });
    });

    test('surfaces the active plan step and continues that drill', async () => {
        renderWithProvider(<TrainingPlanPage />, {
            route: '/plan',
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
                'typemaster:v5:training-plan-cache': {
                    id: 'plan-1',
                    title: '7-day starter plan',
                    summary: 'Stabilize the clearest weakness first, then add pressure.',
                    status: 'active',
                    currentStepIndex: 1,
                    steps: [
                        {
                            id: 'starter-day-1',
                            order: 1,
                            status: 'complete',
                            title: 'Reset accuracy',
                            summary: 'Round summary',
                            config: { mode: 'time', durationSeconds: 45 }
                        },
                        {
                            id: 'starter-day-2',
                            order: 2,
                            status: 'pending',
                            title: 'Add controlled speed',
                            summary: 'Push only after accuracy is stable.',
                            config: {
                                source: 'builtin',
                                mode: 'words',
                                wordCount: 32,
                                durationSeconds: 30,
                                includePunctuation: false,
                                includeNumbers: false,
                                aiTemplate: 'daily',
                                difficulty: 'medium'
                            }
                        }
                    ]
                }
            }
        });

        expect(await screen.findByRole('heading', { name: '7-day starter plan' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Plan progress' })).toBeInTheDocument();
        expect(within(screen.getByLabelText('Next action')).getByText('Add controlled speed')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Continue plan' }));

        await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/practice'));
        await waitFor(() => {
            expect(loadActiveSessionContext()).toMatchObject({
                type: 'plan',
                planId: 'plan-1',
                stepId: 'starter-day-2'
            });
        });
    });
});
