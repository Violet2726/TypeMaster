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

function renderHeader(hasTrainingPlan, pathname = '/') {
    setMockNavigation({ pathname });

    return render(
        <Header
            settings={baseSettings}
            copy={getCopy('en-US')}
            hasTrainingPlan={hasTrainingPlan}
            onToggleTheme={vi.fn()}
            onOpenSettings={vi.fn()}
        />
    );
}

describe('Header', () => {
    test('only shows the plan link when a training plan exists', () => {
        const { rerender } = renderHeader(false);

        expect(screen.queryByRole('link', { name: 'Plan' })).not.toBeInTheDocument();

        rerender(
            <Header
                settings={baseSettings}
                copy={getCopy('en-US')}
                hasTrainingPlan
                onToggleTheme={vi.fn()}
                onOpenSettings={vi.fn()}
            />
        );

        // Desktop nav + mobile tab bar both render a "Plan" link
        const planLinks = screen.getAllByRole('link', { name: 'Plan' });
        expect(planLinks.length).toBeGreaterThanOrEqual(1);
    });

    test('marks the active desktop nav link as the current page', () => {
        renderHeader(false, '/challenge');

        const challengeLinks = screen.getAllByRole('link', { name: 'Challenge' });
        expect(challengeLinks.some((link) => link.getAttribute('aria-current') === 'page')).toBe(true);
        expect(screen.queryByRole('link', { name: 'Home', current: 'page' })).not.toBeInTheDocument();
    });
});
