import { vi } from 'vitest';

type MockNavigationOptions = {
    route?: string,
    pathname?: string,
    search?: string | URLSearchParams,
};

let currentPathname = '/';
let currentSearchParams = new URLSearchParams();

export const mockRouterPush = vi.fn();
export const mockRouterReplace = vi.fn();
export const mockRouterPrefetch = vi.fn();
export const mockRouterBack = vi.fn();
export const mockRouterForward = vi.fn();
export const mockRouterRefresh = vi.fn();

function splitRoute(route: string) {
    const url = new URL(route, 'http://typemaster.test');

    return {
        pathname: url.pathname,
        searchParams: new URLSearchParams(url.search)
    };
}

export function setMockNavigation({ route, pathname, search }: MockNavigationOptions = {}) {
    if (route) {
        const next = splitRoute(route);
        currentPathname = next.pathname;
        currentSearchParams = next.searchParams;
        return;
    }

    currentPathname = pathname || currentPathname;

    if (search instanceof URLSearchParams) {
        currentSearchParams = new URLSearchParams(search);
        return;
    }

    if (typeof search === 'string') {
        currentSearchParams = new URLSearchParams(search);
    }
}

export function resetMockNavigation() {
    currentPathname = '/';
    currentSearchParams = new URLSearchParams();
    mockRouterPush.mockReset();
    mockRouterReplace.mockReset();
    mockRouterPrefetch.mockReset();
    mockRouterBack.mockReset();
    mockRouterForward.mockReset();
    mockRouterRefresh.mockReset();
}

export function usePathnameMock() {
    return currentPathname;
}

export function useSearchParamsMock() {
    return currentSearchParams;
}

export function useRouterMock() {
    return {
        push: mockRouterPush,
        replace: mockRouterReplace,
        prefetch: mockRouterPrefetch,
        back: mockRouterBack,
        forward: mockRouterForward,
        refresh: mockRouterRefresh
    };
}

export function redirectMock(href: string) {
    mockRouterReplace(href);
}
