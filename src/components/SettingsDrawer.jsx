import { SUPPORTED_LANGUAGES } from '../engine/config';

export function SettingsDrawer({ isOpen, settings, copy, onClose, onChange }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="settings-overlay" role="presentation" onClick={onClose}>
            <aside
                className="settings-drawer"
                role="dialog"
                aria-modal="true"
                aria-label={copy.settings.title}
                onClick={(event) => event.stopPropagation()}
            >
                <div className="panel-head">
                    <div>
                        <p className="panel-kicker">{copy.settings.kicker}</p>
                        <h2>{copy.settings.title}</h2>
                    </div>
                    <button type="button" className="ghost-btn" onClick={onClose}>{copy.common.close}</button>
                </div>

                <div className="settings-grid">
                    <label className="field">
                        <span>{copy.settings.language}</span>
                        <select value={settings.language} onChange={(event) => onChange({ language: event.target.value })}>
                            {SUPPORTED_LANGUAGES.map((language) => (
                                <option key={language.id} value={language.id}>{language.label}</option>
                            ))}
                        </select>
                    </label>

                    <label className="field">
                        <span>{copy.settings.theme}</span>
                        <select value={settings.theme} onChange={(event) => onChange({ theme: event.target.value })}>
                            <option value="serika-dark">{copy.settings.themeDark}</option>
                            <option value="serika-light">{copy.settings.themeLight}</option>
                        </select>
                    </label>

                    <label className="field">
                        <span>{copy.settings.fontScale}</span>
                        <select value={settings.fontScale} onChange={(event) => onChange({ fontScale: event.target.value })}>
                            <option value="sm">{copy.settings.fontSm}</option>
                            <option value="md">{copy.settings.fontMd}</option>
                            <option value="lg">{copy.settings.fontLg}</option>
                        </select>
                    </label>

                    <label className="toggle-field">
                        <span>{copy.settings.focusMode}</span>
                        <button
                            type="button"
                            className={`toggle-btn ${settings.focusMode ? 'active' : ''}`}
                            onClick={() => onChange({ focusMode: !settings.focusMode })}
                        >
                            {settings.focusMode ? copy.settings.focusOn : copy.settings.focusOff}
                        </button>
                    </label>

                    <div className="toggle-field disabled-card">
                        <span>{copy.settings.sound}</span>
                        <button type="button" className="toggle-btn" disabled>
                            {copy.common.comingSoon}
                        </button>
                        <p className="muted-text">{copy.settings.soundComingSoon}</p>
                    </div>
                </div>
            </aside>
        </div>
    );
}

