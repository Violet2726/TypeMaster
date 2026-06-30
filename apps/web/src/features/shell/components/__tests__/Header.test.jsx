/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
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
    });
});
