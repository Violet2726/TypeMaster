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

function createCanvasContext() {
    return {
        setTransform: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        drawImage: vi.fn(),
        fillRect: vi.fn(),
        stroke: vi.fn(),
        fill: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        closePath: vi.fn(),
        arc: vi.fn(),
        roundRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        fillText: vi.fn(),
        measureText: vi.fn((text) => ({ width: String(text).length * 8 }))
    };
}

describe('HomePage', () => {
    beforeEach(() => {
        resetMockNavigation();
        window.history.replaceState(null, '', '/');
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 0);
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
        vi.spyOn(window.HTMLCanvasElement.prototype, 'getContext').mockReturnValue(createCanvasContext());
        window.fetch = vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }));
        window.ResizeObserver = class {
            observe() {}
            disconnect() {}
        };
        window.matchMedia = vi.fn(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        delete window.render_game_to_text;
        delete window.advanceTime;
    });

    test('shows the TypeRift command center as the first-run home', async () => {
        const { container } = renderWithProvider(<HomePage />, {
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
        expect(container.querySelector('.home-typerift')).not.toBeInTheDocument();
        expect(container.querySelector('.app-card-grid')).not.toBeInTheDocument();
        expect(container.querySelectorAll('.home-action-row')).toHaveLength(3);
        expect(container.querySelector('.home-recent-list')).not.toBeInTheDocument();
        expect(container.querySelector('.home-recent-summary')).toBeInTheDocument();
        expect(container.querySelector('.home-recent-summary__detail')).not.toBeInTheDocument();
    });

    test('opens TypeRift as a cardized command-center experience', async () => {
        renderWithProvider(<HomePage />, {
            storageState: {
                'typemaster:v7:settings': {
                    language: 'zh-CN',
                    lastConfig: baseConfig
                }
            }
        });

        fireEvent.click(await screen.findByRole('button', { name: '开始 TypeRift' }));

        await waitFor(() => expect(screen.getByRole('application')).toBeInTheDocument());
    });

    test('routes compact action rows to the selected workflow', async () => {
        const { container } = renderWithProvider(<HomePage />, {
            storageState: {
                'typemaster:v7:settings': {
                    language: 'zh-CN',
                    lastConfig: baseConfig
                }
            }
        });

        const rows = container.querySelectorAll('.home-action-row');
        expect(rows).toHaveLength(3);

        fireEvent.click(rows[1]);

        expect(mockRouterPush).toHaveBeenCalledWith('/missions');
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
        expect(screen.getByLabelText('TypeRift recent status')).toBeInTheDocument();
        expect(screen.getByText('97%')).toBeInTheDocument();
    });
});
