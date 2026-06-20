'use client';

import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppFrame } from './AppFrame';

type Props = { children: ReactNode };

export function AppFrameWrapper({ children }: Props) {
    const pathname = usePathname();
    const isGameRoute = pathname?.startsWith('/game');

    if (isGameRoute) {
        return <>{children}</>;
    }

    return <AppFrame>{children}</AppFrame>;
}