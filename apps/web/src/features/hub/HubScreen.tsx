'use client';

import { useQuery } from '@tanstack/react-query';
import { ActionRow, Button, Notice, Progress, StatList } from '@typerift/ui';
import { ArrowRight, CalendarDays, CloudOff, Gem, Radar } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { countOutbox, listLocalRuns } from '../../lib/storage';
import { translate } from '../../i18n';
import { useUiStore } from '../../store/ui';

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

export function HubScreen() {
    const locale = useUiStore((state) => state.settings.locale);
    const t = (key: string) => translate(locale, key);
    const me = useQuery({ queryKey: ['me'], queryFn: api.me });
    const runs = useQuery({ queryKey: ['local-runs'], queryFn: listLocalRuns });
    const pending = useQuery({ queryKey: ['outbox-count'], queryFn: countOutbox });
    const nextMission = me.data?.missionSnapshot.missions.find((mission) => !mission.completed);
    const latest = runs.data?.[0];
    const progress = me.data?.progress;
    const level = progress?.resonanceLevel ?? 1;
    const xp = progress?.resonanceXp ?? 0;
    const xpMax = 180 + Math.max(0, level - 1) * 90;

    return (
        <div className="page hub-page">
            <header className="page-heading">
                <p className="eyebrow">
                    <Radar size={16} aria-hidden="true" />
                    {t('hub.eyebrow')}
                </p>
                <h1>{t('hub.title')}</h1>
                <p className="lede">{t('hub.subtitle')}</p>
                <div className="hub-cta">
                    <Button className="hub-cta__primary" icon={<ArrowRight size={18} />}>
                        <Link href="/play?mode=expedition">{t('hub.enter')}</Link>
                    </Button>
                </div>
            </header>

            {pending.data ? (
                <Notice tone="warning" title={t('common.offline')}>
                    {t('hub.pendingSync').replace('{count}', String(pending.data))}
                </Notice>
            ) : null}
            {me.isError ? (
                <Notice tone="danger" title={t('common.error')}>
                    {t('hub.loadFailed')}
                </Notice>
            ) : null}

            <section className="hub-status" aria-label={t('common.level')}>
                <StatList
                    items={[
                        { label: t('common.level'), value: String(level) },
                        { label: t('common.shards'), value: String(progress?.shards ?? 0) },
                        { label: t('profile.activeDays'), value: String(progress?.activeDays ?? 0) },
                        { label: me.data?.player.callSign ? t('profile.callSign') : t('common.loading'), value: me.data?.player.callSign ?? '—' }
                    ]}
                />
                <div className="hub-status__meter">
                    <div className="hub-status__meter-label">
                        <span>{t('hub.resonance')}</span>
                        <span>
                            {xp}/{xpMax}
                        </span>
                    </div>
                    <Progress value={xp} max={xpMax} label={t('hub.resonance')} />
                </div>
            </section>

            <section className="hub-actions" aria-label={t('hub.actions')}>
                <ActionRow
                    eyebrow={t('hub.daily')}
                    title={t('hub.daily')}
                    detail={t('hub.dailyMeta')}
                    href="/play?mode=daily-rift"
                    action={<CalendarDays size={18} aria-hidden="true" />}
                />
                <ActionRow
                    eyebrow={t('hub.mission')}
                    title={nextMission ? missionTitle(nextMission.metric, locale) : t('hub.missionsClear')}
                    detail={
                        nextMission
                            ? `${Math.min(nextMission.progress, nextMission.target)} / ${nextMission.target} · +${nextMission.rewardShards} ${t('common.shards')}`
                            : t('missions.subtitle')
                    }
                    href="/missions"
                    action={<Gem size={18} aria-hidden="true" />}
                />
                <ActionRow
                    eyebrow={t('hub.archive')}
                    title={latest ? `${latest.result.score.toLocaleString()} · ${latest.result.accuracy}%` : t('hub.noRuns')}
                    detail={latest ? latest.result.mode.replaceAll('-', ' ') : t('hub.archiveHint')}
                    href={latest ? `/debrief/${latest.id}` : '/archive'}
                    action={latest ? <ArrowRight size={18} aria-hidden="true" /> : <CloudOff size={18} aria-hidden="true" />}
                />
            </section>
        </div>
    );
}