'use client';

import { Button, Sheet } from '@typerift/ui';
import { translate } from '../i18n';
import { useUiStore } from '../store/ui';

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
    return (
        <label className="setting-row">
            <span>{label}</span>
            <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        </label>
    );
}

export function SettingsSheet() {
    const open = useUiStore((state) => state.settingsOpen);
    const close = useUiStore((state) => state.closeSettings);
    const settings = useUiStore((state) => state.settings);
    const update = useUiStore((state) => state.updateSettings);
    const t = (key: string) => translate(settings.locale, key);
    return (
        <Sheet open={open} title={t('settings.title')} onClose={close}>
            <div className="settings-group">
                <p className="settings-group__title">{t('settings.appearance')}</p>
                <label className="setting-row">
                    <span>{t('settings.themeMode')}</span>
                    <select
                        aria-label={t('settings.themeMode')}
                        value={settings.theme}
                        onChange={(event) => update({ theme: event.target.value as 'system' | 'light' | 'dark' })}
                    >
                        <option value="light">{t('settings.themeLight')}</option>
                        <option value="dark">{t('settings.themeDark')}</option>
                        <option value="system">{t('settings.themeSystem')}</option>
                    </select>
                </label>
                <Toggle label={t('settings.motion')} checked={settings.reduceMotion} onChange={(value) => update({ reduceMotion: value })} />
                <Toggle label={t('settings.reduceEffects')} checked={settings.reduceEffects} onChange={(value) => update({ reduceEffects: value })} />
                <Toggle label={t('settings.transparency')} checked={settings.reduceTransparency} onChange={(value) => update({ reduceTransparency: value })} />
                <Toggle label={t('settings.contrast')} checked={settings.enhancedContrast} onChange={(value) => update({ enhancedContrast: value })} />
                <Toggle label={t('settings.colorSafe')} checked={settings.colorSafe} onChange={(value) => update({ colorSafe: value })} />
                <Toggle label={t('settings.noFlash')} checked={settings.noFlash} onChange={(value) => update({ noFlash: value })} />
                <Toggle label={t('settings.reaction')} checked={settings.reactionAssist} onChange={(value) => update({ reactionAssist: value })} />
                <label className="setting-slider">
                    <span>{t('settings.textScale')}</span>
                    <input
                        aria-label={t('settings.textScale')}
                        type="range"
                        min="1"
                        max="2"
                        step="0.1"
                        value={settings.textScale}
                        onChange={(event) => update({ textScale: Number(event.target.value) })}
                    />
                </label>
            </div>
            <div className="settings-group">
                <p className="settings-group__title">{t('settings.sound')}</p>
                <Toggle label={t('settings.music')} checked={settings.music} onChange={(value) => update({ music: value })} />
                <Toggle label={t('settings.effects')} checked={settings.effects} onChange={(value) => update({ effects: value })} />
                <Toggle label={t('settings.voice')} checked={settings.voice} onChange={(value) => update({ voice: value })} />
            </div>
            <Button variant="secondary" className="language-button" onClick={() => update({ locale: settings.locale === 'zh-CN' ? 'en-US' : 'zh-CN' })}>
                {t('settings.language')}
            </Button>
        </Sheet>
    );
}
