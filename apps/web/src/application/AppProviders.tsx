'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppStateBootstrap } from '../store/app-state-bootstrap';
import { hydrateClientCache } from '../services/storage';
import { PageLoadingFallback } from './PageLoadingFallback';
import { createAppQueryClient } from './query-client';

type AppProvidersProps = {
    children: ReactNode,
    queryClient?: QueryClient | null,
};

function isSynchronousHydrationRuntime() {
    return typeof window !== 'undefined' && window.navigator.userAgent.includes('jsdom');
}

export function AppProviders({ children, queryClient = null }: AppProvidersProps) {
    const [client] = useState(() => queryClient || createAppQueryClient());
    const [cacheReady, setCacheReady] = useState(isSynchronousHydrationRuntime);

    useEffect(() => {
        let active = true;

        hydrateClientCache().then(() => {
            if (active) {
                setCacheReady(true);
            }
        });

        return () => {
            active = false;
        };
    }, []);

    if (!cacheReady) {
        return <PageLoadingFallback />;
    }

    return (
        <QueryClientProvider client={client}>
            <AppStateBootstrap>
                {children}
            </AppStateBootstrap>
        </QueryClientProvider>
    );
}
