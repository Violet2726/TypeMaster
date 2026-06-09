'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useAppNavigate() {
    const router = useRouter();

    return useCallback((href: string) => {
        router.push(href);
    }, [router]);
}
