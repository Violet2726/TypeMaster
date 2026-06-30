/** @vitest-environment jsdom */
import { fireEvent, screen, waitFor } from '@testing-library/react';
import HomePage from '../HomePage';
import { renderWithProvider } from '../../test/render-with-provider';
import { mockRouterPush, resetMockNavigation } from '../../test/next-navigation';

const baseConfig = {
    source: 'builtin',
    mode: 'time',
    durationSeconds: 30,
    wordCount: 25,
    includePunctuation: false,
    includeNumbers: false,
    aiTemplate: 'daily',
    difficulty: 'medium'
};

describe('HomePage', () => {
    beforeEach(() => {
        resetMockNavigation();
    });

    test('shows the Raid Command Center as the first-run home', async () => {
        renderWithProvider(<HomePage />, {
            storageState: {
                'typemaster:v6:settings': {
                    language: 'zh-CN',
                    lastConfig: baseConfig
                }
            }
        });

        expect(await screen.findByRole('heading', { name: 'Arcade Rift 指挥台' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '开始 Arcade Rift' })).toBeInTheDocument();
        expect(screen.getByText('无历史迁移，vNext 会从第一局重新建立画像。')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Start assessment/i })).not.toBeInTheDocument();
    });

    test('routes the primary action to the new Raid route', async () => {
        renderWithProvider(<HomePage />, {
            storageState: {
                'typemaster:v6:settings': {
                    language: 'zh-CN',
                    lastConfig: baseConfig
                }
            }
        });

        fireEvent.click(await screen.findByRole('button', { name: '开始 Arcade Rift' }));

        await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/raid'));
    });

    test('renders the latest v6 Arcade Rift feedback when evidence exists', async () => {
        renderWithProvider(<HomePage />, {
            storageState: {
                'typemaster:v6:settings': {
                    language: 'zh-CN',
                    lastConfig: baseConfig
                },
                'typemaster:v6:sessions': [
                    {
                        id: 'raid-1',
                        kind: 'raid',
                        intent: 'endless-rift',
                        completedAt: '2026-06-08T08:00:00.000Z',
                        durationSeconds: 420,
                        source: 'raid',
                        focus: 'accuracy',
                        gameMeta: {
                            riftLayer: 6,
                            threatLevel: 6,
                            endReason: 'extract',
                            weakestChars: ['t']
                        },
                        result: {
                            score: 12000,
                            wpm: 82,
                            accuracy: 97,
                            durationSeconds: 420,
                            completedAt: '2026-06-08T08:00:00.000Z',
                            topErrorChars: ['t']
                        },
                        trainingMeta: {
                            type: 'raid',
                            surface: 'raid',
                            intent: 'endless-rift',
                            title: 'Arcade Rift',
                            riftLayer: 6,
                            threatLevel: 6,
                            endReason: 'extract'
                        }
                    }
                ]
            }
        });

        expect(await screen.findByRole('heading', { name: '上一局反馈' })).toBeInTheDocument();
        expect(screen.getByText('威胁 6')).toBeInTheDocument();
        expect(screen.getByText('97%')).toBeInTheDocument();
    });
});
