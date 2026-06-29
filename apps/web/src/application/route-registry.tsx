import { BarChart3, Brain, Home, Keyboard, Swords, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ShellRouteId = 'today' | 'practice' | 'plan' | 'challenge' | 'insights' | 'raid' | 'result';
export type ShellLayoutMode = 'standard' | 'focus' | 'fullscreen';

export type ShellRoute = {
    id: ShellRouteId,
    href: string,
    icon: LucideIcon,
    labelKey?: 'home' | 'practice' | 'insights',
    trainingLabelKey?: 'plan' | 'challenge',
    fallbackLabel: string,
    showInNav: boolean,
    requiresPlan?: boolean,
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
        id: 'practice',
        href: '/practice',
        icon: Keyboard,
        labelKey: 'practice',
        fallbackLabel: 'Practice',
        showInNav: true,
        layout: 'focus'
    },
    {
        id: 'plan',
        href: '/plan',
        icon: Brain,
        trainingLabelKey: 'plan',
        fallbackLabel: 'Plan',
        showInNav: true,
        requiresPlan: true,
        layout: 'standard'
    },
    {
        id: 'challenge',
        href: '/challenge',
        icon: Target,
        trainingLabelKey: 'challenge',
        fallbackLabel: 'Challenge',
        showInNav: true,
        layout: 'standard'
    },
    {
        id: 'raid',
        href: '/game',
        icon: Swords,
        fallbackLabel: 'Raid',
        showInNav: true,
        layout: 'fullscreen'
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

export function getVisibleShellRoutes(hasTrainingPlan: boolean) {
    return SHELL_ROUTES.filter((route) => (
        route.showInNav && (!route.requiresPlan || hasTrainingPlan)
    ));
}
