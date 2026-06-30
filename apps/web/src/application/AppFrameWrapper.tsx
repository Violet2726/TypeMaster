'use client';

import { type ReactNode } from 'react';
import { AppFrame } from './AppFrame';

type Props = { children: ReactNode };

export function AppFrameWrapper({ children }: Props) {
    return <AppFrame>{children}</AppFrame>;
}
