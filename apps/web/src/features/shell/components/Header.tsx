'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Settings, Sun } from 'lucide-react';
import { IconButton } from '@typemaster/ui';
import { StoredSettingsSchema } from '@typemaster/contracts/storage';
import { getVisibleShellRoutes } from '../../../application/route-registry';
import { getCopy } from '../../../i18n';

type Settings = ReturnType<typeof StoredSettingsSchema.parse>;
type AppCopy = ReturnType<typeof getCopy>;

type HeaderProps = {
    settings: Settings,
    copy: AppCopy,
    onToggleTheme: () => void,
    onOpenSettings: () => void,
};

function resolveRouteLabel(route, copy: AppCopy) {
    if (route.labelKey) {
        return copy.nav[route.labelKey] || route.fallbackLabel;
    }

    return route.fallbackLabel;
}

function getCurrentHash() {
    return typeof window === 'undefined' ? '' : window.location.hash;
}

function isShellLinkActive(pathname: string, hash: string, href: string) {
    const [hrefPath = '/', hrefHash = ''] = href.split('#');
    const normalizedPath = hrefPath || '/';

    if (hrefHash) {
        return pathname === normalizedPath && hash === `#${hrefHash}`;
    }

    if (normalizedPath === '/') {
        return pathname === '/' && !hash;
    }

    return pathname === normalizedPath;
}

function getNavProps(pathname: string, hash: string, href: string) {
    const isActive = isShellLinkActive(pathname, hash, href);

    return {
        className: `nav-link${isActive ? ' active' : ''}`,
        'aria-current': isActive ? 'page' as const : undefined
    };
}

function getActiveNavRoute(navItems, pathname: string, hash: string) {
    return navItems.find((route) => isShellLinkActive(pathname, hash, route.href)) || navItems[0];
}

function getRouteSummary(routeId: string, copy: AppCopy) {
    switch (routeId) {
        case 'typerift':
            return copy.home.typeRiftLaneBody;
        case 'practice':
            return copy.practice.idleHint;
        case 'missions':
            return copy.missions.body;
        case 'insights':
            return copy.insights.body;
        case 'today':
        default:
            return copy.home.commandBody;
    }
}

export function Header({ settings, copy, onToggleTheme, onOpenSettings }: HeaderProps) {
    const pathname = usePathname();
    const [locationHash, setLocationHash] = useState(getCurrentHash);
    const compact = settings.focusMode && pathname === '/practice';
    const ThemeIcon = settings.theme === 'serika-dark' ? Sun : Moon;
    const navItems = getVisibleShellRoutes().map((route) => ({
        ...route,
        label: resolveRouteLabel(route, copy)
    }));
    const activeRoute = getActiveNavRoute(navItems, pathname, locationHash);
    const activeRouteSummary = getRouteSummary(activeRoute.id, copy);

    useEffect(() => {
        const syncHash = () => setLocationHash(getCurrentHash());

        syncHash();
        window.addEventListener('hashchange', syncHash);
        window.addEventListener('popstate', syncHash);

        return () => {
            window.removeEventListener('hashchange', syncHash);
            window.removeEventListener('popstate', syncHash);
        };
    }, []);

    return (
        <>
            <header className={`app-header ${compact ? 'is-compact' : ''}`}>
                <div className="container app-header__inner">
                    <div className="app-header__start">
                        <Link href="/" className="logo">
                            <span className="logo-mark" />
                            <span className="logo-word">Type<span>Master</span></span>
                        </Link>

                        {!compact ? (
                            <div className="nav-context" aria-label={`${activeRoute.label} summary`}>
                                <span className="nav-context__kicker">{copy.shell.kicker}</span>
                                <strong>{activeRoute.label}</strong>
                                <small>{activeRouteSummary}</small>
                            </div>
                        ) : null}
                    </div>

                    {!compact && (
                        <nav className="nav-links" aria-label="Primary">
                            {navItems.map(({ href, label }) => (
                                <Link key={href} href={href} {...getNavProps(pathname, locationHash, href)}>
                                    <span>{label}</span>
                                </Link>
                            ))}
                        </nav>
                    )}

                    <div className="nav-actions" role="toolbar" aria-label="Shell actions">
                        <IconButton
                            className="nav-icon nav-icon--tool"
                            onClick={onToggleTheme}
                            label={copy.nav.toggleTheme}
                            icon={ThemeIcon}
                        />
                        <IconButton
                            className="nav-icon nav-icon--tool"
                            onClick={onOpenSettings}
                            label={copy.nav.openSettings}
                            icon={Settings}
                        />
                    </div>
                </div>
            </header>

            {/* Mobile bottom tab bar - Apple HIG style */}
            {!compact && (
                <nav className="mobile-tab-bar" aria-label="Mobile navigation">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive = isShellLinkActive(pathname, locationHash, href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`mobile-tab-bar__item${isActive ? ' is-active' : ''}`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <Icon aria-hidden="true" />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </nav>
            )}
        </>
    );
}
