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

    test('shows the TypeRift command center as the first-run home', async () => {
        renderWithProvider(<HomePage />, {
            storageState: {
                'typemaster:v7:settings': {
                    language: 'zh-CN',
                    lastConfig: baseConfig
                }
            }
        });

        expect(await screen.findByRole('heading', { name: 'TypeRift 指挥台' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '开始 TypeRift' })).toBeInTheDocument();
        expect(screen.getByText('不迁移旧游戏记录。TypeRift 会从第一次下潜开始建立全新的图鉴和成绩。')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Start assessment/i })).not.toBeInTheDocument();
    });

    test('routes the primary action to the retained game route', async () => {
        renderWithProvider(<HomePage />, {
            storageState: {
                'typemaster:v7:settings': {
                    language: 'zh-CN',
                    lastConfig: baseConfig
                }
            }
        });

        fireEvent.click(await screen.findByRole('button', { name: '开始 TypeRift' }));

        await waitFor(() => expect(mockRouterPush).toHaveBeenCalledWith('/raid'));
    });

    test('renders the latest v7 TypeRift feedback when evidence exists', async () => {
        renderWithProvider(<HomePage />, {
            storageState: {
                'typemaster:v7:settings': {
                    language: 'zh-CN',
                    lastConfig: baseConfig
                },
                'typemaster:v7:sessions': [
                    {
                        id: 'game-1',
                        kind: 'game',
                        intent: 'expedition',
                        completedAt: '2026-06-08T08:00:00.000Z',
                        durationSeconds: 420,
                        source: 'game',
                        focus: 'accuracy',
                        gameMeta: {
                            version: 'typerift-v1',
                            depth: 4,
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
                            type: 'game',
                            surface: 'game',
                            intent: 'expedition',
                            title: 'TypeRift: Echo Siege',
                            depth: 4,
                            endReason: 'extract'
                        }
                    }
                ]
            }
        });

        expect(await screen.findByRole('heading', { name: '上一局信号' })).toBeInTheDocument();
        expect(screen.getByText('层数 4')).toBeInTheDocument();
        expect(screen.getByText('97%')).toBeInTheDocument();
    });
});
