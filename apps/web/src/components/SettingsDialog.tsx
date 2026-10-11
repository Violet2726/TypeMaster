'use client';

import { AccessibleDialog } from './AccessibleDialog';
import { translate } from '../i18n';
import type { Settings } from '../lib/storage';

export function SettingsDialog({
    open,
    settings,
    onClose,
    onUpdate
}: {
    open: boolean;
    settings: Settings;
    onClose: () => void;
    onUpdate: (settings: Settings) => void;
}) {
    const t = (key: Parameters<typeof translate>[1]) => translate(settings.locale, key);
    const update = (patch: Partial<Settings>) => onUpdate({ ...settings, ...patch });

    return (
        <AccessibleDialog open={open} title={t('settings.title')} closeLabel={t('settings.close')} onClose={onClose}>
            <fieldset className="setting-group">
                <legend>{t('settings.language')}</legend>
                <div className="segmented-control" role="group" aria-label={t('settings.language')}>
                    <button type="button" aria-pressed={settings.locale === 'zh-CN'} onClick={() => update({ locale: 'zh-CN' })}>
                        {t('settings.chinese')}
                    </button>
                    <button type="button" aria-pressed={settings.locale === 'en-US'} onClick={() => update({ locale: 'en-US' })}>
                        {t('settings.english')}
                    </button>
                </div>
            </fieldset>
            <label className="setting-row">
                <span>{t('settings.reduceMotion')}</span>
                <input
                    type="checkbox"
                    role="switch"
                    checked={settings.reduceMotion}
                    onChange={(event) => update({ reduceMotion: event.currentTarget.checked })}
                />
            </label>
            <label className="setting-row">
                <span>{t('settings.contrast')}</span>
                <input
                    type="checkbox"
                    role="switch"
                    checked={settings.enhancedContrast}
                    onChange={(event) => update({ enhancedContrast: event.currentTarget.checked })}
                />
            </label>
            <label className="setting-range">
                <span>
                    {t('settings.textSize')} <output>{Math.round(settings.textScale * 100)}%</output>
                </span>
                <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.25"
                    value={settings.textScale}
                    aria-label={t('settings.textSize')}
                    onChange={(event) => update({ textScale: Number(event.currentTarget.value) })}
                />
            </label>
            <p className="settings-footnote">{t('settings.localPrivacy')}</p>
        </AccessibleDialog>
    );
}
