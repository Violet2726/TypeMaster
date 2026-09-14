'use client';

import { Button, Notice, StatList } from '@typerift/ui';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { translate } from '../../i18n';
import { useUiStore } from '../../store/ui';

const SAMPLE = 'the quiet signal becomes a blade of light';

export function OnboardingScreen() {
    const router = useRouter();
    const locale = useUiStore((state) => state.settings.locale);
    const updateSettings = useUiStore((state) => state.updateSettings);
    const t = (key: string) => translate(locale, key);
    const [step, setStep] = useState<1 | 2>(1);
    const [callSign, setCallSign] = useState('Pilot');
    const [typed, setTyped] = useState('');
    const [errors, setErrors] = useState(0);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const correct = useMemo(() => {
        let count = 0;
        for (let index = 0; index < typed.length; index += 1) {
            if (typed[index] === SAMPLE[index]) count += 1;
        }
        return count;
    }, [typed]);
    const accuracy = typed.length ? Math.round((correct / typed.length) * 1000) / 10 : 100;
    const elapsedMin = Math.max(((startedAt ? Date.now() - startedAt : 0) / 60_000) || 1 / 60, 1 / 60);
    const wpm = Math.round((correct / 5) / elapsedMin);

    async function persist(complete: boolean, difficulty: 'flow' | 'standard' | 'surge' = 'standard') {
        setSaving(true);
        setError(null);
        try {
            await api.patchPlayer({
                callSign: callSign.trim() || 'Pilot',
                locale,
                difficulty,
                onboardingComplete: complete
            });
            updateSettings({ locale });
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'api.error.internal');
            // offline-friendly local marker
            try {
                localStorage.setItem(
                    'typerift:v2:player-patch',
                    JSON.stringify({
                        callSign: callSign.trim() || 'Pilot',
                        locale,
                        difficulty,
                        onboardingComplete: complete,
                        updatedAt: new Date().toISOString()
                    })
                );
            } catch {
                // ignore
            }
            return false;
        } finally {
            setSaving(false);
        }
    }

    async function skip() {
        await persist(true, 'standard');
        router.replace('/');
    }

    async function finish() {
        const difficulty = accuracy >= 97 && wpm >= 50 ? 'surge' : accuracy >= 90 ? 'standard' : 'flow';
        await persist(true, difficulty);
        router.replace('/play?mode=first-rift');
    }

    return (
        <div className="page onboarding-page">
            <header className="page-heading">
                <p className="eyebrow">{t('onboarding.eyebrow')}</p>
                <h1>{step === 1 ? t('onboarding.title') : t('onboarding.calibrateTitle')}</h1>
                <p className="lede">{step === 1 ? t('onboarding.subtitle') : t('onboarding.calibrateBody')}</p>
            </header>

            {step === 1 ? (
                <section className="onboarding-step">
                    <label className="field">
                        <span>{t('onboarding.callSign')}</span>
                        <input value={callSign} maxLength={24} onChange={(event) => setCallSign(event.target.value)} />
                    </label>
                    <p className="muted">{t('onboarding.privacy')}</p>
                    <div className="button-row">
                        <Button onClick={() => setStep(2)}>{t('onboarding.continue')}</Button>
                        <Button variant="quiet" onClick={() => void skip()} disabled={saving}>
                            {t('onboarding.skip')}
                        </Button>
                    </div>
                </section>
            ) : (
                <section className="onboarding-step">
                    <p className="sample-line" aria-label={t('onboarding.sample')}>
                        {SAMPLE.split('').map((char, index) => {
                            const current = typed[index];
                            const className = current == null ? '' : current === char ? 'is-correct' : 'is-error';
                            return (
                                <span key={`${char}-${index}`} className={className}>
                                    {char}
                                </span>
                            );
                        })}
                    </p>
                    <label className="field">
                        <span>{t('onboarding.input')}</span>
                        <input
                            value={typed}
                            autoFocus
                            aria-label={t('onboarding.input')}
                            onChange={(event) => {
                                const value = event.target.value.slice(0, SAMPLE.length);
                                if (!startedAt) setStartedAt(Date.now());
                                if (value.length > typed.length) {
                                    const nextChar = value[value.length - 1];
                                    const expected = SAMPLE[value.length - 1];
                                    if (nextChar !== expected) setErrors((count) => count + 1);
                                }
                                setTyped(value);
                            }}
                        />
                    </label>
                    <StatList
                        items={[
                            { label: t('debrief.accuracy'), value: `${accuracy}%` },
                            { label: t('debrief.speed'), value: `${wpm}` },
                            { label: t('debrief.combo'), value: String(Math.max(0, typed.length - errors)) }
                        ]}
                    />
                    <div className="button-row">
                        <Button onClick={() => void finish()} disabled={saving || typed.length < 12}>
                            {t('onboarding.start')}
                        </Button>
                        <Button variant="quiet" onClick={() => void skip()} disabled={saving}>
                            {t('onboarding.skip')}
                        </Button>
                    </div>
                </section>
            )}
            {error ? <Notice tone="warning">{t('onboarding.offlineSaved')}</Notice> : null}
        </div>
    );
}