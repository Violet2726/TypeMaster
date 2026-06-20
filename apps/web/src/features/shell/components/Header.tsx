'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Moon, Sun, Home, Keyboard, Target, BarChart3, Brain, Settings } from 'lucide-react';
import { StoredSettingsSchema } from '@typemaster/contracts/storage';
import { getCopy } from '../../../i18n';
import { getTrainingCopy } from '../../../training/copy';

type Settings = ReturnType<typeof StoredSettingsSchema.parse>;
type AppCopy = ReturnType<typeof getCopy>;

type HeaderProps = {
    settings: Settings,
    copy: AppCopy,
    hasTrainingPlan?: boolean,
    onToggleTheme: () => void,
    onOpenSettings: () => void,
};

type NavItem = { href: string; label: string; icon: typeof Home; show: boolean };

function buildNavItems(copy: AppCopy, trainingCopy: any, hasTrainingPlan: boolean): NavItem[] {
    return [
        { href: '/', label: copy.nav.home, icon: Home, show: true },
        { href: '/practice', label: copy.nav.practice, icon: Keyboard, show: true },
        { href: '/plan', label: trainingCopy.nav.plan, icon: Brain, show: hasTrainingPlan },
        { href: '/challenge', label: trainingCopy.nav.challenge, icon: Target, show: true },
        { href: '/insights', label: copy.nav.insights, icon: BarChart3, show: true },
    ].filter((item) => item.show);
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

export function Header({ settings, copy, hasTrainingPlan = false, onToggleTheme, onOpenSettings }: HeaderProps) {
    const pathname = usePathname();
    const compact = settings.focusMode && pathname === '/practice';
    const trainingCopy = getTrainingCopy(settings.language);
    const ThemeIcon = settings.theme === 'serika-dark' ? Sun : Moon;
    const themeLabel = settings.theme === 'serika-dark' ? copy.settings.themeLight : copy.settings.themeDark;
    const navItems = buildNavItems(copy, trainingCopy, hasTrainingPlan);

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
                        <button
                            className="nav-icon nav-icon--tool"
                            type="button"
                            onClick={onToggleTheme}
                            title={themeLabel}
                            aria-label={copy.nav.toggleTheme}
                        >
                            <ThemeIcon aria-hidden="true" size={17} strokeWidth={2.2} />
                        </button>
                        <button
                            className="nav-icon nav-icon--tool"
                            type="button"
                            onClick={onOpenSettings}
                            title={copy.nav.openSettings}
                            aria-label={copy.nav.openSettings}
                        >
                            <Settings aria-hidden="true" size={17} strokeWidth={2.2} />
                        </button>
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
