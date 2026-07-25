'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { flushOutbox, initializeV2Storage } from '../lib/storage';
import { api } from '../lib/api';
import { useUiStore } from '../store/ui';

function Runtime({ children }: PropsWithChildren) {
    const hydrate = useUiStore((state) => state.hydrate);
    const settings = useUiStore((state) => state.settings);
    useEffect(() => {
        void initializeV2Storage().finally(hydrate);
        const flush = () => void flushOutbox(api.completeRun);
        window.addEventListener('online', flush);
        flush();
        return () => window.removeEventListener('online', flush);
    }, [hydrate]);
    useEffect(() => {
        const root = document.documentElement;
        root.dataset.theme = settings.theme;
        root.dataset.reduceMotion = String(settings.reduceMotion);
        root.dataset.reduceTransparency = String(settings.reduceTransparency);
        root.dataset.contrast = String(settings.enhancedContrast);
        root.dataset.colorSafe = String(settings.colorSafe);
        root.dataset.noFlash = String(settings.noFlash);
        root.style.setProperty('--user-text-scale', String(settings.textScale));
        root.lang = settings.locale;
    }, [settings]);
    return children;
}

export function Providers({ children }: PropsWithChildren) {
    const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }));
    const content = (
        <QueryClientProvider client={queryClient}>
            <Runtime>{children}</Runtime>
        </QueryClientProvider>
    );
    const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    return key ? <ClerkProvider publishableKey={key}>{content}</ClerkProvider> : content;
}
