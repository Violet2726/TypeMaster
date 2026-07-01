import { BarChart3, Flag, Home, Keyboard, Swords } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ShellRouteId = 'today' | 'typerift' | 'practice' | 'missions' | 'insights' | 'result';
export type ShellLayoutMode = 'standard' | 'focus';

export type ShellRoute = {
    id: ShellRouteId,
    href: string,
    icon: LucideIcon,
    labelKey?: 'home' | 'typerift' | 'practice' | 'missions' | 'insights',
    fallbackLabel: string,
    showInNav: boolean,
    layout: ShellLayoutMode
};

export const SHELL_ROUTES: ShellRoute[] = [
    {
        id: 'today',
        href: '/',
        icon: Home,
        labelKey: 'home',
        fallbackLabel: 'Today',
        showInNav: true,
        layout: 'standard'
    },
    {
        id: 'typerift',
        href: '/#typerift',
        icon: Swords,
        labelKey: 'typerift',
        fallbackLabel: 'TypeRift',
        showInNav: true,
        layout: 'standard'
    },
    {
        id: 'practice',
        href: '/practice',
        icon: Keyboard,
        labelKey: 'practice',
        fallbackLabel: 'Practice',
        showInNav: true,
        layout: 'focus'
    },
    {
        id: 'missions',
        href: '/missions',
        icon: Flag,
        labelKey: 'missions',
        fallbackLabel: 'Missions',
        showInNav: true,
        layout: 'standard'
    },
    {
        id: 'insights',
        href: '/insights',
        icon: BarChart3,
        labelKey: 'insights',
        fallbackLabel: 'Insights',
        showInNav: true,
        layout: 'standard'
    },
    {
        id: 'result',
        href: '/result',
        icon: BarChart3,
        fallbackLabel: 'Result',
        showInNav: false,
        layout: 'standard'
    }
];

export function getRouteForPath(pathname = '/') {
    return SHELL_ROUTES.find((route) => (
        route.href === '/'
            ? pathname === '/'
            : pathname.startsWith(route.href)
    )) || SHELL_ROUTES[0];
}

export function getVisibleShellRoutes() {
    return SHELL_ROUTES.filter((route) => route.showInNav);
}
