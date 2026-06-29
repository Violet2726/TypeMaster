'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppFrame } from './AppFrame';
import { getRouteForPath } from './route-registry';

type Props = { children: ReactNode };

export function AppFrameWrapper({ children }: Props) {
    const pathname = usePathname();
    const route = getRouteForPath(pathname || '/');

    if (route.layout === 'fullscreen') {
        return <>{children}</>;
    }

    return <AppFrame>{children}</AppFrame>;
}
