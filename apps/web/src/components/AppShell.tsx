'use client';

import { Archive, Crosshair, Home, Settings, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import { translate } from '../i18n';
import { useUiStore } from '../store/ui';
import { ProfileSheet } from './ProfileSheet';
import { SettingsSheet } from './SettingsSheet';

function TypeRiftMark() {
    return (
        <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="32" height="32" rx="9" fill="currentColor" opacity="0.08" />
            <path d="M7 8.5h18l-5.2 7.4H24L13.5 27l2.4-8.2H8.2L12.4 12H7z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx="22.5" cy="9.5" r="1.4" fill="currentColor" />
        </svg>
    );
}

export function AppShell({ children }: PropsWithChildren) {
    const pathname = usePathname();
    const locale = useUiStore((state) => state.settings.locale);
    const openSettings = useUiStore((state) => state.openSettings);
    const openProfile = useUiStore((state) => state.openProfile);
    const t = (key: string) => translate(locale, key);
    const immersive = pathname.startsWith('/play');
    const links = [
        { href: '/', label: t('nav.home'), icon: Home },
        { href: '/missions', label: t('nav.missions'), icon: Crosshair },
        { href: '/archive', label: t('nav.archive'), icon: Archive }
    ];

    return (
        <div className={immersive ? 'app-shell is-immersive' : 'app-shell'}>
            <a className="skip-link" href="#main">
                Skip to content
            </a>
            {!immersive ? (
                <header className="topbar glass-bar">
                    <Link href="/" className="brand">
                        <TypeRiftMark />
                        <span>TypeRift</span>
                    </Link>
                    <nav className="topnav" aria-label="Primary">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const active = pathname === link.href;
                            return (
                                <Link key={link.href} href={link.href} className={active ? 'topnav__link is-active' : 'topnav__link'}>
                                    <Icon size={16} aria-hidden="true" />
                                    <span>{link.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                    <div className="topbar__actions">
                        <button className="ghost-button" onClick={openProfile} aria-label={t('profile.title')}>
                            <UserRound size={18} />
                            <span>{t('profile.title')}</span>
                        </button>
                        <button className="ghost-button" onClick={openSettings} aria-label={t('nav.settings')}>
                            <Settings size={18} />
                            <span>{t('nav.settings')}</span>
                        </button>
                    </div>
                </header>
            ) : null}
            <main id="main" className="app-main">
                {children}
            </main>
            {!immersive ? (
                <nav className="bottomnav glass-bar" aria-label="Mobile">
                    {links.map((link) => {
                        const Icon = link.icon;
                        const active = pathname === link.href;
                        return (
                            <Link key={link.href} href={link.href} className={active ? 'bottomnav__link is-active' : 'bottomnav__link'}>
                                <Icon size={18} aria-hidden="true" />
                                <span>{link.label}</span>
                            </Link>
                        );
                    })}
                    <button className="bottomnav__link" onClick={openProfile}>
                        <UserRound size={18} />
                        <span>{t('profile.title')}</span>
                    </button>
                    <button className="bottomnav__link" onClick={openSettings}>
                        <Settings size={18} />
                        <span>{t('nav.settings')}</span>
                    </button>
                </nav>
            ) : null}
            <SettingsSheet />
            <ProfileSheet />
        </div>
    );
}
