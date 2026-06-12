/** @vitest-environment jsdom */
import { screen } from '@testing-library/react';
import DiagnosticPage from '../DiagnosticPage';
import { renderWithProvider } from '../../test/render-with-provider';

const config = {
    source: 'builtin',
    mode: 'time',
    durationSeconds: 60,
    wordCount: 25,
    includePunctuation: false,
    includeNumbers: false,
    aiTemplate: 'daily',
    difficulty: 'medium'
};

describe('DiagnosticPage', () => {
    test('renders active diagnostic progress and current step summary', async () => {
        renderWithProvider(<DiagnosticPage />, {
            route: '/diagnostic',
            storageState: {
                'typemaster:v5:preferences': {
                    language: 'en-US',
                    lastConfig: config
                },
                'typemaster:v5:diagnostic-resume': {
                    id: 'diagnostic-1',
                    type: 'diagnostic',
                    title: '3-minute diagnostic',
                    summary: 'Complete a short profile before the plan starts.',
                    status: 'active',
                    currentStepIndex: 1,
                    startedAt: '2026-06-08T08:00:00.000Z',
                    updatedAt: '2026-06-08T08:01:00.000Z',
                    steps: [
                        {
                            id: 'diagnostic-accuracy',
                            order: 1,
                            title: 'Accuracy baseline',
                            summary: 'Warm up with a clean baseline.',
                            config,
                            status: 'complete',
                            text: '',
                            completedSessionId: 'session-accuracy'
                        },
                        {
                            id: 'diagnostic-rhythm',
                            order: 2,
                            title: 'Rhythm pulse',
                            summary: 'Watch the pace over a shorter round.',
                            config: { ...config, durationSeconds: 30 },
                            status: 'pending',
                            text: '',
                            completedSessionId: null
                        },
                        {
                            id: 'diagnostic-symbols',
                            order: 3,
                            title: 'Symbol readiness',
                            summary: 'Add numbers and punctuation.',
                            config: { ...config, includePunctuation: true, includeNumbers: true },
                            status: 'pending',
                            text: '',
                            completedSessionId: null
                        }
                    ]
                }
            }
        });

        expect(await screen.findByRole('heading', { name: 'Use 3 minutes to define the first training path' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Resume assessment' })).toBeInTheDocument();
        expect(screen.getByText('1/3')).toBeInTheDocument();
        expect(screen.getAllByText('Rhythm pulse').length).toBeGreaterThan(0);
        expect(screen.getAllByText('30s').length).toBeGreaterThan(1);
        expect(screen.getByText('2 left')).toBeInTheDocument();
    });
});
