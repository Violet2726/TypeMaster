import { NavLink, useLocation } from 'react-router-dom';
import { getLanguageMeta } from '../i18n';

export function Header({ settings, copy, onToggleTheme, onOpenSettings }) {
    const location = useLocation();
    const compact = settings.focusMode && location.pathname === '/practice';
    const languageMeta = getLanguageMeta(settings.language);

    return (
        <header className={`app-header ${compact ? 'is-compact' : ''}`}>
            <div className="container app-header__inner">
                <div className="brand-block">
                    <NavLink to="/" className="logo">
                        <span className="logo-mark" />
                        <span className="logo-word">Type<span>Master</span></span>
                    </NavLink>
                    {!compact && <p className="hero-kicker">{copy.shell.kicker}</p>}
                </div>

                {!compact && (
                    <nav className="nav-links" aria-label="Primary">
                        <NavLink to="/" className="nav-link">{copy.nav.home}</NavLink>
                        <NavLink to="/practice" className="nav-link">{copy.nav.practice}</NavLink>
                        <NavLink to="/insights" className="nav-link">{copy.nav.insights}</NavLink>
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
