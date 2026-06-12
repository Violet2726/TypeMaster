/** @vitest-environment jsdom */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { STORAGE_KEYS } from '@typemaster/contracts';
import CoachPage from '../CoachPage';
import { renderWithProvider } from '../../test/render-with-provider';
import { mockRouterPush, resetMockNavigation } from '../../test/next-navigation';

const preferences = {
    language: 'en-US',
    keyboardLayout: 'qwerty',
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
};

const latestSession = {
    id: 'session-1',
    config: {
        source: 'builtin',
        mode: 'time',
        durationSeconds: 30
    },
    sourceTextMeta: {
        label: 'Built-in word bank',
        source: 'builtin'
    },
    result: {
        wpm: 72,
        rawWpm: 78,
        accuracy: 96,
        consistency: 91,
        durationSeconds: 30,
        correctChars: 120,
        incorrectChars: 5,
        extraChars: 0,
        missedChars: 0,
        completedAt: '2026-06-10T09:00:00.000Z'
    }
};

describe('CoachPage', () => {
    beforeEach(() => {
        resetMockNavigation();
    });

    test('turns the legacy coach route into an actionable empty briefing', async () => {
        renderWithProvider(<CoachPage />, {
            route: '/coach',
            storageState: {
                [STORAGE_KEYS.settings]: preferences,
                [STORAGE_KEYS.sessions]: [],
                [STORAGE_KEYS.coachAdvices]: []
            }
        });

        expect(await screen.findByRole('heading', { name: 'Coach briefing' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'No coaching signal yet' })).toBeInTheDocument();
        expect(screen.getByText('Complete a fresh round so the coach can prepare a focused follow-up.')).toBeInTheDocument();
        expect(screen.getByText('Keep the loop small')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Start a round' }));
        await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/practice'));

        fireEvent.click(screen.getByRole('button', { name: 'Open insights' }));
        await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/insights'));
    });

    test('surfaces the latest coach advice and supporting signals', async () => {
        renderWithProvider(<CoachPage />, {
            route: '/coach',
            storageState: {
                [STORAGE_KEYS.settings]: preferences,
                [STORAGE_KEYS.sessions]: [latestSession],
                [STORAGE_KEYS.coachAdvices]: [
                    {
                        id: 'coach-1',
                        sessionId: 'session-1',
                        source: 'ai',
                        headline: 'Hold this pace',
                        summary: 'Keep the same pressure next round.',
                        comparison: {
                            label: 'improved',
                            summary: 'Speed improved without accuracy loss.'
                        },
                        nextDrill: {
                            label: 'Accuracy reset',
                            reason: 'Clean up the misses before increasing pressure.'
                        }
                    }
                ],
                [STORAGE_KEYS.skillProfile]: {
                    id: 'profile-1',
                    level: {
                        id: 'intermediate',
                        label: 'Intermediate'
                    },
                    summary: 'Rhythm is stable, accuracy needs occasional cleanup.',
                    metrics: {
                        avgWpm: 70,
                        avgAccuracy: 95,
                        avgConsistency: 90
                    }
                }
            }
        });

        expect(await screen.findByRole('heading', { name: 'Coach briefing' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Hold this pace' })).toBeInTheDocument();
        expect(screen.getByText('Keep the same pressure next round.')).toBeInTheDocument();
        expect(screen.getAllByText('Speed improved without accuracy loss.').length).toBeGreaterThanOrEqual(2);
        expect(screen.getByRole('heading', { name: 'Accuracy reset' })).toBeInTheDocument();
        expect(screen.getByText('Clean up the misses before increasing pressure.')).toBeInTheDocument();
        expect(screen.getByText('72 WPM / 96%')).toBeInTheDocument();
        expect(screen.getByText('Intermediate')).toBeInTheDocument();
    });
});
