'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StoredSettingsSchema } from '@typemaster/contracts/storage';
import { getCopy, getLanguageMeta } from '../../../i18n';
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

export function Header({ settings, copy, hasTrainingPlan = false, onToggleTheme, onOpenSettings }: HeaderProps) {
    const pathname = usePathname();
    const compact = settings.focusMode && pathname === '/practice';
    const languageMeta = getLanguageMeta(settings.language);
    const trainingCopy = getTrainingCopy(settings.language);

    return (
        <header className={`app-header ${compact ? 'is-compact' : ''}`}>
            <div className="container app-header__inner">
                <div className="brand-block">
                    <Link href="/" className="logo">
                        <span className="logo-mark" />
                        <span className="logo-word">Type<span>Master</span></span>
                    </Link>
                    {!compact && <p className="hero-kicker">{copy.shell.kicker}</p>}
                </div>

                {!compact && (
                    <nav className="nav-links" aria-label="Primary">
                        <Link href="/" className={`nav-link ${pathname === '/' ? 'active' : ''}`}>{copy.nav.home}</Link>
                        <Link href="/practice" className={`nav-link ${pathname === '/practice' ? 'active' : ''}`}>{copy.nav.practice}</Link>
                        {hasTrainingPlan && <Link href="/plan" className={`nav-link ${pathname === '/plan' ? 'active' : ''}`}>{trainingCopy.nav.plan}</Link>}
                        <Link href="/challenge" className={`nav-link ${pathname === '/challenge' ? 'active' : ''}`}>{trainingCopy.nav.challenge}</Link>
                        <Link href="/insights" className={`nav-link ${pathname === '/insights' ? 'active' : ''}`}>{copy.nav.insights}</Link>
                    </nav>
                )}

                <div className="nav-actions">
                    <button className="nav-icon" type="button" onClick={onToggleTheme} title={copy.nav.toggleTheme}>
                        {settings.theme === 'serika-dark' ? copy.settings.themeLight : copy.settings.themeDark}
                    </button>
                    <button className="nav-icon" type="button" onClick={onOpenSettings} title={copy.nav.openSettings}>
                        {copy.common.language}: {languageMeta.shortLabel}
                    </button>
                </div>
            </div>
        </header>
    );
}
