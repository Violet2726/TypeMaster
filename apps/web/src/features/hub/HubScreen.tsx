'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, CloudOff, Compass, Gem, Sparkles, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { Notice } from '@typerift/ui';
import { api } from '../../lib/api';
import { countOutbox, listLocalRuns, type LocalRun } from '../../lib/storage';
import { translate } from '../../i18n';
import { useUiStore } from '../../store/ui';
import { activeStreak, aggregateWeakKeys, metricAverage, metricDelta, weeklyInsight } from './hub-stats';

function missionTitle(metric: string | undefined, locale: 'zh-CN' | 'en-US') {
    const names: Record<string, [string, string]> = {
        runs: ['完成一局战斗', 'Complete one run'],
        defeated: ['击破 24 个信号体', 'Break 24 signals'],
        accuracy: ['保持 96% 准确率', 'Hold 96% accuracy'],
        bosses: ['击破 5 名首领', 'Defeat five bosses'],
        'repair-runs': ['完成 3 次修复试炼', 'Finish 3 Repair Trials'],
        'daily-score': ['Daily 累计 5000 分', 'Score 5000 in Daily']
    };
    const value = names[metric ?? 'runs'] ?? names.runs!;
    return locale === 'en-US' ? value[1] : value[0];
}

function formatDelta(delta: number | null) {
    if (delta === null || delta === 0) return null;
    return `${delta > 0 ? '↑' : '↓'}${Math.abs(delta)}`;
}

/** Home answers three questions only: what to do now, whether you improved, why to return. */
export function HubScreen() {
    const locale = useUiStore((state) => state.settings.locale);
    const t = useCallback((key: string) => translate(locale, key), [locale]);
    const me = useQuery({ queryKey: ['me'], queryFn: api.me });
    const runs = useQuery({ queryKey: ['local-runs'], queryFn: listLocalRuns });
    const pending = useQuery({ queryKey: ['outbox-count'], queryFn: countOutbox });

    const history: LocalRun[] = useMemo(() => runs.data ?? [], [runs.data]);
    const weakKeys = useMemo(() => aggregateWeakKeys(history), [history]);
    const accuracy = metricAverage(history, 'accuracy');
    const accuracyDelta = metricDelta(history, 'accuracy');
    const wpm = metricAverage(history, 'wpm');
    const wpmDelta = metricDelta(history, 'wpm');
    const streak = useMemo(() => activeStreak(history, new Date()), [history]);
    const insight = useMemo(() => weeklyInsight(history, t), [history, t]);

    const hasHistory = history.length > 0;
    const nextMission = me.data?.missionSnapshot.missions.find((mission) => !mission.completed);
    const primaryHref = hasHistory ? '/play?mode=expedition' : '/play';
    const primaryLabel = hasHistory ? t('hub.continue') : t('hub.begin');

    return (
        <div className="page hub-page">
            <header className="hub-hero">
                <p className="eyebrow">
                    <Sparkles size={16} aria-hidden="true" />
                    {t('hub.trainingEyebrow')}
                </p>
                <h1>{t('hub.trainingTitle')}</h1>
                {weakKeys.length ? (
                    <p className="hub-hero__weak">
                        {t('hub.weakKeys')} <strong>{weakKeys.join(' · ')}</strong>
                    </p>
                ) : (
                    <p className="hub-hero__weak">{t('hub.weakKeysNone')}</p>
                )}
                <p className="hub-hero__meta">
                    {t('hub.expeditionMeta')} · {t('mode.expedition')}
                </p>
                <Link className="game-button game-button--accent hub-hero__cta" href={primaryHref}>
                    {primaryLabel}
                    <ArrowRight size={18} aria-hidden="true" />
                </Link>
            </header>

            {pending.data ? (
                <Notice tone="warning" title={t('common.offline')}>
                    {t('hub.pendingSync').replace('{count}', String(pending.data))}
                </Notice>
            ) : null}
            {me.isError ? (
                <Notice tone="info" title={t('common.offline')}>
                    {t('hub.loadFailed')}
                </Notice>
            ) : null}

            <section className="hub-signals" aria-label={t('hub.signals')}>
                <article>
                    <p className="hub-signal__label">{t('debrief.accuracy')}</p>
                    <p className="hub-signal__value">{accuracy === null ? '—' : `${accuracy}%`}</p>
                    <p className="hub-signal__delta">{formatDelta(accuracyDelta) ?? t('hub.noBaseline')}</p>
                </article>
                <article>
                    <p className="hub-signal__label">{t('debrief.speed')}</p>
                    <p className="hub-signal__value">{wpm === null ? '—' : `${wpm} WPM`}</p>
                    <p className="hub-signal__delta">{formatDelta(wpmDelta) ?? t('hub.noBaseline')}</p>
                </article>
                <article>
                    <p className="hub-signal__label">{t('hub.streak')}</p>
                    <p className="hub-signal__value">{streak === 0 ? '—' : t('hub.streakValue').replace('{days}', String(streak))}</p>
                    <p className="hub-signal__delta">{streak > 0 ? t('hub.streakKeep') : t('hub.streakStart')}</p>
                </article>
            </section>

            <p className="hub-insight">{insight}</p>

            <nav className="hub-secondary" aria-label={t('hub.actions')}>
                <Link href="/play?mode=repair-trial">
                    <Wrench size={18} aria-hidden="true" />
                    <span>{t('hub.focusLab')}</span>
                </Link>
                <Link href="/missions">
                    <Gem size={18} aria-hidden="true" />
                    <span>{t('nav.missions')}</span>
                    {nextMission ? <em>{missionTitle(nextMission.metric, locale)}</em> : null}
                </Link>
                <Link href="/archive">
                    <Compass size={18} aria-hidden="true" />
                    <span>{t('hub.insights')}</span>
                </Link>
                <Link href="/play?mode=daily-rift">
                    <CalendarDays size={18} aria-hidden="true" />
                    <span>{t('hub.daily')}</span>
                </Link>
                {!hasHistory ? (
                    <span className="hub-secondary__hint">
                        <CloudOff size={16} aria-hidden="true" />
                        {t('hub.offlineHint')}
                    </span>
                ) : null}
            </nav>
        </div>
    );
}
