import { useState } from 'react';
import { StoredSettingsSchema } from '@typemaster/contracts/storage';
import { SUPPORTED_KEYBOARD_LAYOUTS, SUPPORTED_LANGUAGES, getKeyboardLayoutLabel } from '@typemaster/domain';
import { getCopy } from '../../../i18n';
import type { CurrentUserSnapshot } from '../../account/api/use-current-user-query';
import type { AccountStatus } from '../../account/state/account-connection-store';
import { getTrainingCopy } from '../../../training/copy';

type Settings = ReturnType<typeof StoredSettingsSchema.parse>;
type AppCopy = ReturnType<typeof getCopy>;

type SettingsDrawerProps = {
    isOpen: boolean,
    settings: Settings,
    copy: AppCopy,
    account: CurrentUserSnapshot,
    accountStatus: AccountStatus,
    onClose: () => void,
    onChange: (patch: Partial<Settings>) => void,
    onSignIn: (displayName: string) => Promise<unknown>,
    onSignOut: () => Promise<unknown> | void,
    onExportData: () => Promise<string> | string,
    onImportData: (payload: string) => Promise<unknown> | unknown,
};

export function SettingsDrawer({
    isOpen,
    settings,
    copy,
    account,
    accountStatus,
    onClose,
    onChange,
    onSignIn,
    onSignOut,
    onExportData,
    onImportData
}: SettingsDrawerProps) {
    const [displayName, setDisplayName] = useState('');
    const [importPayload, setImportPayload] = useState('');
    const [importNotice, setImportNotice] = useState('');
    const trainingCopy = getTrainingCopy(settings.language);

    if (!isOpen) {
        return null;
    }

    const handleExport = async () => {
        const payload = await onExportData();
        setImportPayload(payload);
        setImportNotice('');
    };

    const handleImport = async () => {
        if (!importPayload.trim()) {
            return;
        }

        try {
            await onImportData(importPayload);
            setImportNotice(trainingCopy.account.importSuccess);
        } catch (error) {
            setImportNotice(error instanceof Error ? error.message : 'Import failed.');
        }
    };

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

                    <label className="field">
                        <span>{trainingCopy.practice.layoutLabel}</span>
                        <select value={settings.keyboardLayout} onChange={(event) => onChange({ keyboardLayout: event.target.value })}>
                            {SUPPORTED_KEYBOARD_LAYOUTS.map((layout) => (
                                <option key={layout.id} value={layout.id}>{getKeyboardLayoutLabel(layout.id, settings.language)}</option>
                            ))}
                        </select>
                    </label>

                    <label className="toggle-field">
                        <span>{copy.settings.sound}</span>
                        <button
                            type="button"
                            className={`toggle-btn ${settings.soundEffects ? 'active' : ''}`}
                            onClick={() => onChange({ soundEffects: !settings.soundEffects })}
                        >
                            {settings.soundEffects ? copy.settings.focusOn : copy.settings.focusOff}
                        </button>
                    </label>
                </div>

                <section className="panel settings-section">
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{trainingCopy.account.title}</p>
                            <h2>{account?.displayName || trainingCopy.account.idle}</h2>
                        </div>
                        <span className={`panel-badge badge-${account ? 'success' : accountStatus === 'loading' ? 'loading' : 'idle'}`}>
                            {trainingCopy.account[accountStatus] || trainingCopy.account.idle}
                        </span>
                    </div>
                    <p className="muted-text">{trainingCopy.account.body}</p>

                    {!account && (
                        <div className="workshop-grid settings-section__form">
                            <label className="field">
                                <span>{trainingCopy.account.nameLabel}</span>
                                <input
                                    type="text"
                                    value={displayName}
                                    placeholder={trainingCopy.account.namePlaceholder}
                                    onChange={(event) => setDisplayName(event.target.value)}
                                />
                            </label>
                            <button
                                type="button"
                                className="action-btn primary"
                                onClick={() => onSignIn(displayName).then(() => setDisplayName('')).catch(() => {})}
                                disabled={!displayName.trim() || accountStatus === 'loading'}
                            >
                                {trainingCopy.account.signIn}
                            </button>
                        </div>
                    )}

                    {account && (
                        <div className="results-actions settings-section__actions">
                            <button type="button" className="action-btn" onClick={onSignOut}>
                                {trainingCopy.account.signOut}
                            </button>
                        </div>
                    )}
                </section>

                <section className="panel settings-section">
                    <div className="panel-head">
                        <div>
                            <p className="panel-kicker">{trainingCopy.account.export}</p>
                            <h2>{trainingCopy.account.importLabel}</h2>
                        </div>
                    </div>

                    <div className="results-actions">
                        <button type="button" className="action-btn" onClick={handleExport}>
                            {trainingCopy.account.export}
                        </button>
                        <button type="button" className="action-btn primary" onClick={handleImport}>
                            {trainingCopy.account.import}
                        </button>
                    </div>

                    <label className="field settings-section__import">
                        <span>{trainingCopy.account.importLabel}</span>
                        <textarea
                            value={importPayload}
                            placeholder={trainingCopy.account.importPlaceholder}
                            onChange={(event) => {
                                setImportPayload(event.target.value);
                                setImportNotice('');
                            }}
                            rows={8}
                        />
                    </label>

                    {importNotice && <p className="muted-text">{importNotice}</p>}
                </section>
            </aside>
        </div>
    );
}
