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

    test('shows long-term targeted drill progress from recent adaptive and keyboard-zone rounds', async () => {
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
                        id: 'session-zone-latest',
                        config: { source: 'builtin' },
                        sourceTextMeta: {
                            label: 'Left hand / home row reset',
                            source: 'builtin',
                            generatedBy: 'keyboard-zone',
                            keyboardZone: 'leftHome',
                            keyboardLayout: 'qwerty',
                            keyboardZoneChars: ['a', 's', 'd'],
                            keyboardZoneShare: 56
                        },
                        result: {
                            wpm: 63,
                            rawWpm: 71,
                            accuracy: 95,
                            consistency: 89,
                            durationSeconds: 30,
                            completedAt: '2026-06-09T11:00:00.000Z',
                            topErrorChars: ['a', 's'],
                            topErrorWords: [],
                            errorCharStats: [
                                { label: 'a', count: 1 },
                                { label: 's', count: 1 },
                                { label: 'k', count: 1 },
                                { label: '.', count: 1 }
                            ],
                            errorWordStats: []
                        }
                    },
                    {
                        id: 'session-adaptive-clear',
                        config: { source: 'builtin' },
                        sourceTextMeta: {
                            label: 'Adaptive accuracy drill',
                            source: 'builtin',
                            generatedBy: 'adaptive',
                            adaptiveFocus: 'accuracy',
                            adaptiveTargetChars: ['a'],
                            adaptiveTargetWords: ['alpha'],
                            adaptiveBaselineCount: 4
                        },
                        result: {
                            wpm: 60,
                            rawWpm: 67,
                            accuracy: 97,
                            consistency: 91,
                            durationSeconds: 30,
                            completedAt: '2026-06-08T11:00:00.000Z',
                            topErrorChars: [],
                            topErrorWords: [],
                            errorCharStats: [],
                            errorWordStats: []
                        }
                    },
                    {
                        id: 'session-adaptive-stalled',
                        config: { source: 'builtin' },
                        sourceTextMeta: {
                            label: 'Adaptive accuracy drill',
                            source: 'builtin',
                            generatedBy: 'adaptive',
                            adaptiveFocus: 'accuracy',
                            adaptiveTargetChars: ['a'],
                            adaptiveTargetWords: ['alpha'],
                            adaptiveBaselineCount: 4
                        },
                        result: {
                            wpm: 57,
                            rawWpm: 64,
                            accuracy: 93,
                            consistency: 84,
                            durationSeconds: 30,
                            completedAt: '2026-06-07T11:00:00.000Z',
                            topErrorChars: ['a'],
                            topErrorWords: ['alpha'],
                            errorCharStats: [{ label: 'a', count: 2 }],
                            errorWordStats: [{ label: 'alpha', count: 2 }]
                        }
                    }
                ]
            }
        });

        expect(await screen.findByRole('heading', { name: 'Targeted progress' })).toBeInTheDocument();
        expect(screen.getAllByText('Still improving').length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText('67%')).toBeInTheDocument();
        expect(screen.getAllByText('Left hand / home row').length).toBeGreaterThanOrEqual(2);
        expect(screen.getByText('Still showing: a / s')).toBeInTheDocument();
        expect(screen.getByText('Protect accuracy')).toBeInTheDocument();
        expect(screen.getByText('2 rounds / Stable for now')).toBeInTheDocument();
    });
});
