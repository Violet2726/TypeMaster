'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Gauge, Keyboard, Layers3, RotateCcw, Sparkles, Target, Zap } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { buildDeterministicInsights } from '@typerift/domain';
import { GameButton } from '@typerift/ui';
import { api } from '../../lib/api';
import { getLocalRun, listLocalRuns } from '../../lib/storage';
import { translate } from '../../i18n';
import { useUiStore } from '../../store/ui';

/** The result screen is not an endpoint; it is the entrance to the next action. */
function nextAction(weakChars: string[], accuracy: number, isFirstRun: boolean) {
    if (isFirstRun) return 'continue' as const;
    if (weakChars.length >= 2) return 'repair' as const;
    if (accuracy >= 96) return 'continue' as const;
    return 'retry' as const;
}

function formatDelta(current: number, previous: number | null, t: (key: string) => string) {
    if (previous === null) return t('debrief.firstRun');
    const delta = Math.round((current - previous) * 10) / 10;
    if (delta > 0) return t('debrief.improved').replace('{delta}', String(delta));
    if (delta < 0) return t('debrief.declined').replace('{delta}', String(Math.abs(delta)));
    return t('debrief.same');
}

export function DebriefScreen({ runId }: { runId: string }) {
    const locale = useUiStore((state) => state.settings.locale);
    const t = (key: string) => translate(locale, key);
    const [showDetails, setShowDetails] = useState(false);
    const local = useQuery({ queryKey: ['local-run', runId], queryFn: () => getLocalRun(runId) });
    const history = useQuery({ queryKey: ['local-runs'], queryFn: listLocalRuns });
    const coach = useQuery({ queryKey: ['coach', runId], queryFn: () => api.coach(runId), enabled: Boolean(local.data), retry: false });

    if (local.isLoading) return <div className="run-loading">{t('debrief.loading')}</div>;
    if (!local.data)
        return (
            <div className="page not-found">
                <p className="eyebrow">{t('debrief.missingEyebrow')}</p>
                <h1>{t('debrief.missingTitle')}</h1>
                <Link className="tr-button tr-button--primary" href="/">
                    {t('debrief.returnHub')}
                </Link>
            </div>
        );

    const result = local.data.result;
    const insights = buildDeterministicInsights(result);
    const previous = (history.data ?? []).find((entry) => entry.id !== runId && entry.result.mode === result.mode) ?? null;
    const isFirstRun = !previous;
    const action = nextAction(result.weakChars, result.accuracy, isFirstRun);
    const weakLabel = result.weakChars.slice(0, 3).join(' · ');

    const primary =
        action === 'repair'
            ? { href: '/play?mode=repair-trial', label: t('debrief.trainWeak').replace('{keys}', weakLabel), icon: <Keyboard size={18} /> }
            : action === 'continue'
              ? { href: '/play?mode=expedition', label: t('debrief.continue'), icon: <ArrowRight size={18} /> }
              : { href: `/play?mode=${result.mode}`, label: t('debrief.retry'), icon: <RotateCcw size={18} /> };

    return (
        <div className="page debrief-page">
            <header className="debrief-hero">
                <div>
                    <p className="eyebrow">
                        <CheckCircle2 size={16} />
                        {t('debrief.complete')} · {local.data.verified ? t('common.verified') : t('common.unranked')}
                    </p>
                    <h1>{t('debrief.title')}</h1>
                    <p className="debrief-context">
                        {t(`mode.${result.mode}`)} · {Math.round(result.durationMs / 1000)}s · {t(`debrief.end.${result.endReason}`)}
                    </p>
                </div>
            </header>

            <section className="debrief-focus" aria-label={t('debrief.accuracy')}>
                <p className="debrief-focus__label">{t('debrief.accuracy')}</p>
                <p className="debrief-focus__value">{result.accuracy}%</p>
                <p className="debrief-focus__delta">{formatDelta(result.accuracy, previous?.result.accuracy ?? null, t)}</p>
            </section>

            <section className="debrief-weak" aria-label={t('debrief.weakest')}>
                <p className="debrief-weak__label">{t('debrief.weakest')}</p>
                {result.weakChars.length ? <p className="debrief-weak__keys">{weakLabel}</p> : <p className="debrief-weak__keys is-clear">{t('debrief.noWeak')}</p>}
            </section>

            <div className="debrief-next">
                <Link className="game-button game-button--accent debrief-next__primary" href={primary.href}>
                    {primary.icon}
                    <span>{primary.label}</span>
                </Link>
                <Link className="game-button game-button--ghost" href={`/play?mode=${result.mode}`}>
                    <RotateCcw size={16} />
                    <span>{t('debrief.retry')}</span>
                </Link>
                <GameButton tone="ghost" aria-expanded={showDetails} aria-controls="run-details" onClick={() => setShowDetails((value) => !value)}>
                    {showDetails ? t('debrief.hideDetails') : t('debrief.details')}
                </GameButton>
            </div>

            <p className="debrief-advice">{action === 'repair' ? t('debrief.recommendWeak') : t('debrief.recommendStrong')}</p>

            {showDetails ? (
                <div className="debrief-details" id="run-details">
                    <section className="stat-ribbon" aria-label={t('debrief.statistics')}>
                        <div>
                            <Zap size={19} />
                            <span>{t('debrief.speed')}</span>
                            <strong>{result.wpm} WPM</strong>
                        </div>
                        <div>
                            <Target size={19} />
                            <span>{t('debrief.combo')}</span>
                            <strong>{result.maxCombo}</strong>
                        </div>
                        <div>
                            <Sparkles size={19} />
                            <span>{t('debrief.defeated')}</span>
                            <strong>{result.defeated}</strong>
                        </div>
                        <div>
                            <Gauge size={19} />
                            <span>{t('debrief.score')}</span>
                            <strong>{result.score.toLocaleString()}</strong>
                        </div>
                    </section>
                    <div className="debrief-grid">
                        <section className="debrief-card">
                            <div className="section-heading">
                                <h2>
                                    <Layers3 size={18} />
                                    {t('debrief.build')}
                                </h2>
                                <span>{result.upgradeIds.length}</span>
                            </div>
                            {result.upgradeIds.length ? (
                                <div className="build-list">
                                    {result.upgradeIds.map((id) => (
                                        <div key={id}>
                                            <span>
                                                <Sparkles size={17} />
                                            </span>
                                            <strong>{t(`upgrade.${id}.title`)}</strong>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="empty-copy">{t('debrief.emptyBuild')}</p>
                            )}
                        </section>
                        <section className="debrief-card">
                            <div className="section-heading">
                                <h2>
                                    <Keyboard size={18} />
                                    {t('debrief.insights')}
                                </h2>
                            </div>
                            <div className="insight-list">
                                {insights.map((insight) => (
                                    <article key={insight.id} className={`severity-${insight.severity}`}>
                                        <span>{insight.value}</span>
                                        <div>
                                            <h3>{t(`insight.${insight.id}.title`)}</h3>
                                            <p>{t(insight.bodyKey)}</p>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                        <section className="debrief-card debrief-card--wide">
                            <div className="coach-orb">
                                <Sparkles size={21} />
                            </div>
                            <div>
                                <p className="card-label">
                                    {t('debrief.coach')} · {coach.data?.status ?? 'local'}
                                </p>
                                <h2>{coach.data?.polishedText ? t('debrief.coachTitle') : t('debrief.coachLocalTitle')}</h2>
                                <p>{coach.data?.polishedText ?? t('debrief.coachLocalBody')}</p>
                            </div>
                        </section>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
