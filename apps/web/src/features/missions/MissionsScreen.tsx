'use client';

import { useQuery } from '@tanstack/react-query';
import { Notice, Progress } from '@typerift/ui';
import Link from 'next/link';
import { api } from '../../lib/api';
import { translate } from '../../i18n';
import { useUiStore } from '../../store/ui';

function formatReset(value: string, locale: string) {
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(value));
}

export function MissionsScreen() {
    const locale = useUiStore((state) => state.settings.locale);
    const t = (key: string) => translate(locale, key);
    const missions = useQuery({ queryKey: ['missions'], queryFn: api.missions });
    const snapshot = missions.data;

    return (
        <div className="page missions-page">
            <header className="page-heading page-heading--split">
                <div>
                    <p className="eyebrow">{t('missions.eyebrow')}</p>
                    <h1>{t('missions.title')}</h1>
                    <p className="lede">{t('missions.subtitle')}</p>
                </div>
                {/* A link styled as a button: nesting <a> inside <button> is invalid and breaks
                    screen readers, so the anchor carries the button classes directly. */}
                <Link className="tr-button tr-button--primary" href="/play?mode=repair-trial">
                    <span>{t('missions.startRepair')}</span>
                </Link>
            </header>

            {missions.isLoading ? <p>{t('common.loading')}</p> : null}
            {missions.isError ? <Notice tone="danger">{t('missions.loadFailed')}</Notice> : null}

            {snapshot ? (
                <>
                    <div className="missions-reset">
                        <p>
                            {t('missions.dailyReset')}: {formatReset(snapshot.dailyResetAt, locale)} UTC
                        </p>
                        <p>
                            {t('missions.weeklyReset')}: {formatReset(snapshot.weeklyResetAt, locale)} UTC
                        </p>
                    </div>
                    <section className="missions-group">
                        <h2>{t('missions.daily')}</h2>
                        {snapshot.missions
                            .filter((mission) => mission.cadence === 'daily')
                            .map((mission) => (
                                <article key={mission.id} className="mission-row">
                                    <div>
                                        <h3>{translate(locale, mission.titleKey)}</h3>
                                        <p>{translate(locale, mission.descriptionKey)}</p>
                                        <Progress value={mission.progress} max={mission.target} label={translate(locale, mission.titleKey)} />
                                    </div>
                                    <div className="mission-row__meta">
                                        <strong>
                                            {Math.min(mission.progress, mission.target)}/{mission.target}
                                        </strong>
                                        <span>
                                            +{mission.rewardShards} {t('common.shards')}
                                        </span>
                                        <span>
                                            {mission.rewardedAt ? t('missions.rewarded') : mission.completed ? t('missions.complete') : t('missions.active')}
                                        </span>
                                    </div>
                                </article>
                            ))}
                    </section>
                    <section className="missions-group">
                        <h2>{t('missions.weekly')}</h2>
                        {snapshot.missions
                            .filter((mission) => mission.cadence === 'weekly')
                            .map((mission) => (
                                <article key={mission.id} className="mission-row">
                                    <div>
                                        <h3>{translate(locale, mission.titleKey)}</h3>
                                        <p>{translate(locale, mission.descriptionKey)}</p>
                                        <Progress value={mission.progress} max={mission.target} label={translate(locale, mission.titleKey)} />
                                    </div>
                                    <div className="mission-row__meta">
                                        <strong>
                                            {Math.min(mission.progress, mission.target)}/{mission.target}
                                        </strong>
                                        <span>
                                            +{mission.rewardShards} {t('common.shards')}
                                        </span>
                                        <span>
                                            {mission.rewardedAt ? t('missions.rewarded') : mission.completed ? t('missions.complete') : t('missions.active')}
                                        </span>
                                    </div>
                                </article>
                            ))}
                    </section>
                </>
            ) : null}
        </div>
    );
}
