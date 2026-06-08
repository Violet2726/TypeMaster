/** @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { Header } from '../Header';
import { getCopy } from '../../i18n';

const baseSettings = {
    language: 'en-US',
    theme: 'serika-dark',
    fontScale: 'md',
    focusMode: false
};

function renderHeader(hasTrainingPlan) {
    return render(
        <MemoryRouter initialEntries={['/']}>
            <Header
                settings={baseSettings}
                copy={getCopy('en-US')}
                hasTrainingPlan={hasTrainingPlan}
                onToggleTheme={vi.fn()}
                onOpenSettings={vi.fn()}
            />
        </MemoryRouter>
    );
}

describe('Header', () => {
    test('only shows the plan link when a training plan exists', () => {
        const { rerender } = renderHeader(false);

        expect(screen.queryByRole('link', { name: 'Plan' })).not.toBeInTheDocument();

        rerender(
            <MemoryRouter initialEntries={['/']}>
                <Header
                    settings={baseSettings}
                    copy={getCopy('en-US')}
                    hasTrainingPlan
                    onToggleTheme={vi.fn()}
                    onOpenSettings={vi.fn()}
                />
            </MemoryRouter>
        );

        expect(screen.getByRole('link', { name: 'Plan' })).toBeInTheDocument();
    });
});
