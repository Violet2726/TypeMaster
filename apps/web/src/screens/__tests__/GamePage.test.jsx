/** @vitest-environment jsdom */
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import GamePage from '../GamePage';
import { renderWithProvider } from '../../test/render-with-provider';

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

describe('GamePage', () => {
    beforeEach(() => {
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

    test('starts TypeRift and opens the DOM pause layer', async () => {
        renderWithProvider(<GamePage />, { route: '/raid' });

        await waitFor(() => expect(typeof window.render_game_to_text).toBe('function'));
        fireEvent.click(await screen.findByRole('button', { name: /远征/ }));

        await waitFor(() => {
            const snapshot = JSON.parse(window.render_game_to_text());
            expect(snapshot.phase).toBe('playing');
        });

        act(() => {
            window.advanceTime(2200);
        });
        const active = JSON.parse(window.render_game_to_text());
        expect(active.enemies.length).toBeGreaterThan(0);
        expect(active.hud.depth).toBe(1);

        fireEvent.keyDown(window, { key: 'Escape' });

        const pauseDialog = await screen.findByRole('dialog', { name: 'TypeRift 已暂停' });
        expect(pauseDialog).toBeInTheDocument();
        expect(within(pauseDialog).getByRole('button', { name: '继续' })).toBeInTheDocument();
        expect(within(pauseDialog).getByRole('button', { name: '撤离' })).toBeDisabled();
    });
});
