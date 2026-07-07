/** @vitest-environment jsdom */
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { Header } from '../Header';
import { getCopy } from '../../../../i18n';
import { setMockNavigation } from '../../../../test/next-navigation';

const baseSettings = {
    language: 'en-US',
    theme: 'serika-dark',
    fontScale: 'md',
    focusMode: false
};

function renderHeader(pathname = '/') {
    setMockNavigation({ pathname });

    return render(
        <Header
            settings={baseSettings}
            copy={getCopy('en-US')}
            onToggleTheme={vi.fn()}
            onOpenSettings={vi.fn()}
        />
    );
}

function currentLinks(name) {
    return screen.getAllByRole('link', { name }).filter((link) => (
        link.getAttribute('aria-current') === 'page'
    ));
}

afterEach(() => {
    window.history.replaceState(null, '', '/');
    setMockNavigation({ pathname: '/' });
});

describe('Header', () => {
    test('shows the vNext arcade navigation', () => {
        renderHeader();

        expect(screen.getAllByRole('link', { name: 'TypeRift' }).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByRole('link', { name: 'Practice' }).length).toBeGreaterThanOrEqual(1);
        expect(screen.getAllByRole('link', { name: 'Missions' }).length).toBeGreaterThanOrEqual(1);
        expect(screen.queryByRole('link', { name: 'Plan' })).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: 'Challenge' })).not.toBeInTheDocument();
    });

    test('marks the active desktop nav link as the current page', () => {
        renderHeader('/missions');

        const missionLinks = screen.getAllByRole('link', { name: 'Missions' });
        expect(missionLinks.some((link) => link.getAttribute('aria-current') === 'page')).toBe(true);
        expect(screen.queryByRole('link', { name: 'Home', current: 'page' })).not.toBeInTheDocument();
        expect(screen.getByText('Calibrate today, repair exposed weak zones, and return to the next run with a cleaner build path.')).toBeInTheDocument();
    });

    test('moves the current marker from Home to TypeRift when the hash route is active', async () => {
        renderHeader('/');

        expect(currentLinks('Home')).toHaveLength(2);

        act(() => {
            window.history.replaceState(null, '', '/#typerift');
            window.dispatchEvent(new Event('hashchange'));
        });

        await waitFor(() => {
            expect(currentLinks('TypeRift')).toHaveLength(2);
        });
        expect(screen.getByText('Type enemy tags, evolve weapons, and decide whether to extract or dive deeper.')).toBeInTheDocument();
        expect(currentLinks('Home')).toHaveLength(0);
    });
});
