import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { API_FALLBACK_CACHE_KEY, STORAGE_KEYS } from '@typemaster/contracts';
import { AppProviders } from '../application/AppProviders';
import { resetClientCacheForTests, writeClientCache, writeLocalPreference } from '../services/storage';
import { setMockNavigation } from './next-navigation';

type RenderWithProviderOptions = {
    route?: string,
    storageState?: Record<string, unknown>,
};

const CLIENT_CACHE_KEYS = new Set([
    API_FALLBACK_CACHE_KEY,
    STORAGE_KEYS.sessions,
    STORAGE_KEYS.coachAdvices,
    STORAGE_KEYS.skillProfile,
    STORAGE_KEYS.trainingPlan,
    STORAGE_KEYS.diagnosticJourney,
    STORAGE_KEYS.activeSessionContext
]);

export function renderWithProvider(ui: ReactElement, { route = '/', storageState = {} }: RenderWithProviderOptions = {}) {
    resetClientCacheForTests();
    setMockNavigation({ route });
    window.localStorage.clear();
    Object.entries(storageState).forEach(([key, value]) => {
        if (CLIENT_CACHE_KEYS.has(key)) {
            writeClientCache(key, value);
            return;
        }

        if (key === STORAGE_KEYS.settings) {
            writeLocalPreference(key, value);
            return;
        }

        window.localStorage.setItem(key, JSON.stringify(value));
    });

    return render(
        <AppProviders>
            {ui}
        </AppProviders>
    );
}
