/** @vitest-environment jsdom */
import { screen } from '@testing-library/react';
import HomePage from '../HomePage';
import { renderWithProvider } from '../../test/render-with-provider';

describe('HomePage', () => {
    test('shows the training dashboard when skill profile and plan exist', async () => {
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
                }
            }
        });

        expect(await screen.findByRole('button', { name: 'Start challenge' })).toBeInTheDocument();
        expect(screen.getByText('What to train today')).toBeInTheDocument();
        expect(screen.getByText('Start from one of these lanes')).toBeInTheDocument();
        expect(screen.getAllByText('Builder').length).toBeGreaterThan(0);
        expect(screen.getByRole('button', { name: 'Continue today\'s task' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Free practice' })).toBeInTheDocument();
    });
});
