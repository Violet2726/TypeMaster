import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';
import {
    redirectMock,
    usePathnameMock,
    useRouterMock,
    useSearchParamsMock
} from './next-navigation';

vi.mock('next/navigation', () => ({
    redirect: redirectMock,
    usePathname: usePathnameMock,
    useRouter: useRouterMock,
    useSearchParams: useSearchParamsMock
}));

vi.mock('next/link', () => ({
    default: ({
        href,
        children,
        prefetch: _prefetch,
        replace: _replace,
        scroll: _scroll,
        shallow: _shallow,
        locale: _locale,
        ...props
    }) => React.createElement('a', {
        href: typeof href === 'string' ? href : href?.pathname || '/',
        ...props
    }, children)
}));
