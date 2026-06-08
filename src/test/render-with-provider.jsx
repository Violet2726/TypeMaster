import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { PracticeProvider } from '../store/practice-store';

export function renderWithProvider(ui, { route = '/', localStorageState = {} } = {}) {
    window.localStorage.clear();
    Object.entries(localStorageState).forEach(([key, value]) => {
        window.localStorage.setItem(key, JSON.stringify(value));
    });

    return render(
        <MemoryRouter initialEntries={[route]}>
            <PracticeProvider>
                {ui}
            </PracticeProvider>
        </MemoryRouter>
    );
}
