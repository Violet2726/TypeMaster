import { useState } from 'react';
import { StoredSettingsSchema } from '@typemaster/contracts/storage';
import { CheckCircle2, Cloud, Download, Eye, Globe2, Keyboard, Palette, ShieldCheck, Type, Upload, UserRound, Volume2, X } from 'lucide-react';
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

function AppleToggle({
    checked,
    onChange,
    ariaLabel
}: {
    checked: boolean,
    onChange: () => void,
    ariaLabel?: string
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            className={`apple-toggle ${checked ? 'is-on' : ''}`}
            onClick={onChange}
        >
            <span className="apple-toggle__thumb" />
        </button>
    );
}

function SettingsIcon({ icon: Icon, tone = 'blue' }) {
    return (
        <span className={`settings-row__icon settings-row__icon--${tone}`} aria-hidden="true">
            <Icon size={17} strokeWidth={2.2} />
        </span>
    );
}

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
    const languageLabel = SUPPORTED_LANGUAGES.find((language) => language.id === settings.language)?.label || settings.language;
    const themeLabel = settings.theme === 'serika-light' ? copy.settings.themeLight : copy.settings.themeDark;
    const focusLabel = settings.focusMode ? copy.settings.focusOn : copy.settings.focusOff;
    const soundLabel = settings.soundEffects ? copy.settings.focusOn : copy.settings.focusOff;
    const layoutLabel = getKeyboardLayoutLabel(settings.keyboardLayout, settings.language);
    const accountLabel = account?.displayName || trainingCopy.account.idle;
    const accountBadge = trainingCopy.account[accountStatus] || trainingCopy.account.idle;

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
                <div className="settings-drawer__header">
                    <div>
                        <p className="panel-kicker">{copy.settings.kicker}</p>
                        <h2>{copy.settings.title}</h2>
                    </div>
                    <button type="button" className="settings-drawer__close" onClick={onClose} aria-label={copy.common.close} title={copy.common.close}>
                        <X aria-hidden="true" size={18} strokeWidth={2.35} />
                    </button>
                </div>

                <div className="settings-drawer__safe"><div className="settings-drawer__scroll">
                    <section className="settings-summary-card" aria-label={copy.settings.summaryTitle}>
                        <div className="settings-summary-card__head">
                            <span className="settings-summary-card__icon" aria-hidden="true">
                                <ShieldCheck size={22} strokeWidth={2.25} />
                            </span>
                            <div>
                                <p className="panel-kicker">{copy.settings.summaryTitle}</p>
                                <h3>{accountLabel}</h3>
                            </div>
                            <span className={`panel-badge badge-${account ? 'success' : accountStatus === 'loading' ? 'loading' : 'idle'}`}>
                                {accountBadge}
                            </span>
                        </div>
                        <div className="settings-summary-card__grid">
                            <span>
                                <small>{copy.settings.language}</small>
                                <strong>{languageLabel}</strong>
                            </span>
                            <span>
                                <small>{copy.settings.theme}</small>
                                <strong>{themeLabel}</strong>
                            </span>
                            <span>
                                <small>{trainingCopy.practice.layoutLabel}</small>
                                <strong>{layoutLabel}</strong>
                            </span>
                        </div>
                    </section>

                    <section className="settings-group">
                        <p className="settings-group__label">{copy.settings.preferencesTitle}</p>
                        <div className="settings-group__items">
                            <div className="settings-row">
                                <span className="settings-row__main">
                                    <SettingsIcon icon={Globe2} tone="blue" />
                                    <span className="settings-row__label">{copy.settings.language}</span>
                                </span>
                                <select
                                    className="settings-row__select"
                                    value={settings.language}
                                    onChange={(event) => onChange({ language: event.target.value })}
                                >
                                    {SUPPORTED_LANGUAGES.map((language) => (
                                        <option key={language.id} value={language.id}>{language.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="settings-row">
                                <span className="settings-row__main">
                                    <SettingsIcon icon={Palette} tone="purple" />
                                    <span className="settings-row__label">{copy.settings.theme}</span>
                                </span>
                                <select
                                    className="settings-row__select"
                                    value={settings.theme}
                                    onChange={(event) => onChange({ theme: event.target.value })}
                                >
                                    <option value="serika-dark">{copy.settings.themeDark}</option>
                                    <option value="serika-light">{copy.settings.themeLight}</option>
                                </select>
                            </div>

                            <div className="settings-row">
                                <span className="settings-row__main">
                                    <SettingsIcon icon={Type} tone="orange" />
                                    <span className="settings-row__label">{copy.settings.fontScale}</span>
                                </span>
                                <select
                                    className="settings-row__select"
                                    value={settings.fontScale}
                                    onChange={(event) => onChange({ fontScale: event.target.value })}
                                >
                                    <option value="sm">{copy.settings.fontSm}</option>
                                    <option value="md">{copy.settings.fontMd}</option>
                                    <option value="lg">{copy.settings.fontLg}</option>
                                </select>
                            </div>

                            <div className="settings-row">
                                <span className="settings-row__main">
                                    <SettingsIcon icon={Keyboard} tone="green" />
                                    <span className="settings-row__label">{trainingCopy.practice.layoutLabel}</span>
                                </span>
                                <select
                                    className="settings-row__select"
                                    value={settings.keyboardLayout}
                                    onChange={(event) => onChange({ keyboardLayout: event.target.value })}
                                >
                                    {SUPPORTED_KEYBOARD_LAYOUTS.map((layout) => (
                                        <option key={layout.id} value={layout.id}>{getKeyboardLayoutLabel(layout.id, settings.language)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="settings-group">
                        <p className="settings-group__label">{copy.settings.sessionTitle}</p>
                        <div className="settings-group__items">
                            <div className="settings-row">
                                <span className="settings-row__main">
                                    <SettingsIcon icon={Eye} tone="indigo" />
                                    <span className="settings-row__stack">
                                        <span className="settings-row__label">{copy.settings.focusMode}</span>
                                        <span className="settings-row__hint">{focusLabel}</span>
                                    </span>
                                </span>
                                <AppleToggle
                                    checked={settings.focusMode}
                                    onChange={() => onChange({ focusMode: !settings.focusMode })}
                                    ariaLabel={copy.settings.focusMode}
                                />
                            </div>

                            <div className="settings-row">
                                <span className="settings-row__main">
                                    <SettingsIcon icon={Volume2} tone="pink" />
                                    <span className="settings-row__stack">
                                        <span className="settings-row__label">{copy.settings.sound}</span>
                                        <span className="settings-row__hint">{soundLabel}</span>
                                    </span>
                                </span>
                                <AppleToggle
                                    checked={settings.soundEffects}
                                    onChange={() => onChange({ soundEffects: !settings.soundEffects })}
                                    ariaLabel={copy.settings.sound}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="settings-group">
                        <p className="settings-group__label">{trainingCopy.account.title}</p>
                        <div className="settings-group__items">
                            <div className="settings-account">
                                <div className="settings-account__hero">
                                    <span className="settings-account__avatar" aria-hidden="true">
                                        <UserRound size={20} strokeWidth={2.2} />
                                    </span>
                                    <div className="settings-account__info">
                                        <strong>{account?.displayName || trainingCopy.account.idle}</strong>
                                        <span className={`panel-badge badge-${account ? 'success' : accountStatus === 'loading' ? 'loading' : 'idle'}`}>
                                            {trainingCopy.account[accountStatus] || trainingCopy.account.idle}
                                        </span>
                                    </div>
                                </div>
                                <p className="muted-text">{trainingCopy.account.body}</p>

                                {!account && (
                                    <div className="settings-account__form">
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
                                            <Cloud aria-hidden="true" size={17} strokeWidth={2.2} />
                                            {trainingCopy.account.signIn}
                                        </button>
                                    </div>
                                )}

                                {account && (
                                    <div className="results-actions">
                                        <button type="button" className="action-btn" onClick={onSignOut}>
                                            {trainingCopy.account.signOut}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="settings-group">
                        <p className="settings-group__label">{copy.settings.dataTitle}</p>
                        <div className="settings-group__items">
                            <div className="settings-data">
                                <div className="settings-data__summary">
                                    <CheckCircle2 aria-hidden="true" size={18} strokeWidth={2.25} />
                                    <div>
                                        <strong>{copy.settings.dataSummaryTitle}</strong>
                                        <p>{copy.settings.dataSummaryBody}</p>
                                    </div>
                                </div>
                                <div className="results-actions settings-data__actions">
                                    <button type="button" className="action-btn" onClick={handleExport}>
                                        <Download aria-hidden="true" size={17} strokeWidth={2.2} />
                                        {trainingCopy.account.export}
                                    </button>
                                    <button type="button" className="action-btn primary" onClick={handleImport}>
                                        <Upload aria-hidden="true" size={17} strokeWidth={2.2} />
                                        {trainingCopy.account.import}
                                    </button>
                                </div>

                                <label className="field">
                                    <span>{trainingCopy.account.importLabel}</span>
                                    <textarea
                                        value={importPayload}
                                        placeholder={trainingCopy.account.importPlaceholder}
                                        onChange={(event) => {
                                            setImportPayload(event.target.value);
                                            setImportNotice('');
                                        }}
                                        rows={6}
                                    />
                                </label>

                                {importNotice && <p className="muted-text">{importNotice}</p>}
                            </div>
                        </div>
                    </section>
                </div></div>
            </aside>
        </div>
    );
}
