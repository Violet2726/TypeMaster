/** @vitest-environment jsdom */
import { fireEvent, screen } from '@testing-library/react';
import MissionsPage from '../MissionsPage';
import { renderWithProvider } from '../../test/render-with-provider';
import { mockRouterPush, resetMockNavigation } from '../../test/next-navigation';

describe('MissionsPage', () => {
    beforeEach(() => {
        resetMockNavigation();
        window.fetch = vi.fn(() => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }));
        window.matchMedia = vi.fn(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('renders mission choices as a compact action list', async () => {
        const { container } = renderWithProvider(<MissionsPage />, {
            route: '/missions',
            storageState: {
                'typemaster:v7:settings': {
                    language: 'zh-CN'
                }
            }
        });

        expect(await screen.findByRole('heading', { name: 'TypeRift 任务中心' })).toBeInTheDocument();
        expect(container.querySelector('.app-card-grid')).not.toBeInTheDocument();
        expect(container.querySelectorAll('.mission-action-row')).toHaveLength(3);
    });

    test('routes mission action rows to their selected workflow', async () => {
        const { container } = renderWithProvider(<MissionsPage />, {
            route: '/missions',
            storageState: {
                'typemaster:v7:settings': {
                    language: 'zh-CN'
                }
            }
        });

        const rows = container.querySelectorAll('.mission-action-row');
        expect(rows).toHaveLength(3);

        fireEvent.click(rows[0]);

        expect(mockRouterPush).toHaveBeenCalledWith('/practice');
    });
});
