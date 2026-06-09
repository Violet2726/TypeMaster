/** @vitest-environment jsdom */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import InsightsPage from '../InsightsPage';
import { renderWithProvider } from '../../test/render-with-provider';
import { mockRouterPush, resetMockNavigation } from '../../test/next-navigation';
import { usePracticeRuntimeStore } from '../../features/practice/state/practice-runtime-store';

describe('InsightsPage', () => {
    beforeEach(() => {
        resetMockNavigation();
    });

    test('groups frequent error characters by keyboard area', async () => {
        renderWithProvider(<InsightsPage />, {
            route: '/insights',
            storageState: {
                'typemaster:v5:preferences': {
                    language: 'en-US',
                    keyboardLayout: 'qwerty',
                    lastConfig: {
                        source: 'builtin',
                        mode: 'words',
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
                        config: { source: 'builtin' },
                        sourceTextMeta: { label: 'Built-in word bank' },
                        result: {
                            wpm: 62,
                            rawWpm: 70,
                            accuracy: 93,
                            consistency: 88,
                            durationSeconds: 30,
                            completedAt: '2026-06-09T09:00:00.000Z',
                            topErrorChars: ['a', 's', 'd', 'j', '1', '.'],
                            topErrorWords: ['alpha']
                        }
                    },
                    {
                        id: 'session-2',
                        config: { source: 'builtin' },
                        sourceTextMeta: { label: 'Built-in word bank' },
                        result: {
                            wpm: 58,
                            rawWpm: 66,
                            accuracy: 94,
                            consistency: 86,
                            durationSeconds: 30,
                            completedAt: '2026-06-08T09:00:00.000Z',
                            topErrorChars: ['a', 'g', 'k'],
                            topErrorWords: ['again']
                        }
                    }
                ]
            }
        });

        expect(await screen.findByRole('heading', { name: 'Keyboard pressure' })).toBeInTheDocument();
        expect(screen.getAllByText('Left hand / home row').length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText((_, element) => element?.textContent === 'Recent misses: 9')).toBeInTheDocument();
        expect(screen.getByText('a · 2 / s · 1 / d · 1 / g · 1')).toBeInTheDocument();
        expect(screen.getByText('56%')).toBeInTheDocument();
        expect(screen.getByText('Number row')).toBeInTheDocument();
        expect(screen.getByText('Symbol layer')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Practice this zone' }));

        await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/practice'));
        expect(usePracticeRuntimeStore.getState().currentDraft.sourceTextMeta).toMatchObject({
            generatedBy: 'keyboard-zone',
            label: 'Left home row drill',
            keyboardZone: 'leftHome',
            keyboardLayout: 'qwerty',
            keyboardZoneChars: ['a', 's', 'd', 'g'],
            keyboardZoneShare: 56
        });
        expect(usePracticeRuntimeStore.getState().config).toMatchObject({
            source: 'builtin',
            mode: 'words',
            wordCount: 32
        });
    });
});
