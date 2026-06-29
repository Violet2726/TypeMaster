'use client';

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

function getNavProps(pathname: string, href: string) {
    const isActive = href === '/'
        ? pathname === '/'
        : pathname === href;

    return {
        className: `nav-link${isActive ? ' active' : ''}`,
        'aria-current': isActive ? 'page' as const : undefined
    };
}

export function Header({ settings, copy, onToggleTheme, onOpenSettings }: HeaderProps) {
    const pathname = usePathname();
    const compact = settings.focusMode && pathname === '/practice';
    const ThemeIcon = settings.theme === 'serika-dark' ? Sun : Moon;
    const navItems = getVisibleShellRoutes().map((route) => ({
        ...route,
        label: resolveRouteLabel(route, copy)
    }));

    return (
        <>
            <header className={`app-header ${compact ? 'is-compact' : ''}`}>
                <div className="container app-header__inner">
                    <Link href="/" className="logo">
                        <span className="logo-mark" />
                        <span className="logo-word">Type<span>Master</span></span>
                    </Link>

                    {!compact && (
                        <nav className="nav-links" aria-label="Primary">
                            {navItems.map(({ href, label }) => (
                                <Link key={href} href={href} {...getNavProps(pathname, href)}>
                                    {label}
                                </Link>
                            ))}
                        </nav>
                    )}

                    <div className="nav-actions">
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
                        const isActive = href === '/'
                            ? pathname === '/'
                            : pathname.startsWith(href);
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
