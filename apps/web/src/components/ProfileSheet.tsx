'use client';

import { useQuery } from '@tanstack/react-query';
import { Button, Notice, Sheet, StatList } from '@typerift/ui';
import { useState } from 'react';
import { api } from '../lib/api';
import { countOutbox } from '../lib/storage';
import { translate } from '../i18n';
import { useUiStore } from '../store/ui';

export function ProfileSheet() {
    const open = useUiStore((state) => state.profileOpen);
    const close = useUiStore((state) => state.closeProfile);
    const locale = useUiStore((state) => state.settings.locale);
    const t = (key: string) => translate(locale, key);
    const me = useQuery({ queryKey: ['me'], queryFn: api.me, enabled: open });
    const pending = useQuery({ queryKey: ['outbox-count'], queryFn: countOutbox, enabled: open });
    const [callSign, setCallSign] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const player = me.data?.player;
    const progress = me.data?.progress;
    const currentSign = callSign || player?.callSign || '';

    async function save() {
        if (!currentSign.trim()) return;
        setSaving(true);
        setError(null);
        try {
            await api.patchPlayer({ callSign: currentSign.trim() });
            await me.refetch();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'api.error.internal');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Sheet open={open} title={t('profile.title')} onClose={close}>
            {me.isLoading ? <p>{t('common.loading')}</p> : null}
            {me.isError ? <Notice tone="danger" title={t('common.error')}>{t('profile.loadFailed')}</Notice> : null}
            {player && progress ? (
                <div className="profile-sheet">
                    <label className="field">
                        <span>{t('profile.callSign')}</span>
                        <input
                            value={currentSign}
                            maxLength={24}
                            onChange={(event) => setCallSign(event.target.value)}
                            aria-label={t('profile.callSign')}
                        />
                    </label>
                    <div className="profile-sheet__actions">
                        <Button variant="secondary" onClick={() => void save()} disabled={saving}>
                            {saving ? t('common.saving') : t('profile.save')}
                        </Button>
                    </div>
                    {error ? <Notice tone="danger">{translate(locale, error)}</Notice> : null}
                    <StatList
                        items={[
                            { label: t('common.level'), value: String(progress.resonanceLevel) },
                            { label: t('common.shards'), value: String(progress.shards) },
                            { label: t('profile.activeDays'), value: String(progress.activeDays) },
                            {
                                label: t('profile.session'),
                                value: player.id.startsWith('guest') || player.id === 'guest-local' ? t('profile.guest') : t('profile.signedIn')
                            },
                            { label: t('profile.pendingSync'), value: String(pending.data ?? 0) }
                        ]}
                    />
                </div>
            ) : null}
        </Sheet>
    );
}