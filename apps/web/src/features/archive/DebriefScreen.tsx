'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Gauge, Keyboard, Layers3, Sparkles, Target, Zap } from 'lucide-react';
import Link from 'next/link';
import { buildDeterministicInsights } from '@typerift/domain';
import { api } from '../../lib/api';
import { getLocalRun } from '../../lib/storage';
import { translate } from '../../i18n';
import { useUiStore } from '../../store/ui';

export function DebriefScreen({ runId }: { runId: string }) {
    const locale = useUiStore((state) => state.settings.locale);
    const t = (key: string) => translate(locale, key);
    const local = useQuery({ queryKey: ['local-run', runId], queryFn: () => getLocalRun(runId) });
    const coach = useQuery({ queryKey: ['coach', runId], queryFn: () => api.coach(runId), enabled: Boolean(local.data), retry: false });
    if (local.isLoading) return <div className="run-loading">{t('debrief.loading')}</div>;
    if (!local.data)
        return (
            <div className="page not-found">
                <p className="eyebrow">Signal absent</p>
                <h1>Run record unavailable.</h1>
                <Link className="tr-button tr-button--primary" href="/">
                    Return to hub
                </Link>
            </div>
        );
    const result = local.data.result;
    const insights = buildDeterministicInsights(result);
    const nextHref = result.weakChars.length ? `/play?mode=repair-trial` : '/play?mode=expedition';
    return (
        <div className="page debrief-page">
            <header className="debrief-hero">
                <div>
                    <p className="eyebrow">
                        <CheckCircle2 size={16} />
                        {t('debrief.eyebrow')} · {local.data.verified ? t('common.verified') : t('common.unranked')}
                    </p>
                    <h1>{t('debrief.title')}</h1>
                    <p>
                        {result.mode.replaceAll('-', ' ')} · {Math.round(result.durationMs / 1000)}s · {result.endReason}
                    </p>
                </div>
                <div className="debrief-score">
                    <span>{t('debrief.score')}</span>
                    <strong>{result.score.toLocaleString()}</strong>
                </div>
            </header>
            <section className="stat-ribbon" aria-label="Run statistics">
                <div>
                    <Gauge size={19} />
                    <span>{t('debrief.accuracy')}</span>
                    <strong>{result.accuracy}%</strong>
                </div>
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
                    <span>Defeated</span>
                    <strong>{result.defeated}</strong>
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
                                    <strong>{id.replaceAll('-', ' ')}</strong>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="empty-copy">No upgrades acquired in this run.</p>
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
                                    <h3>{insight.id.replace('-', ' ')}</h3>
                                    <p>{insight.bodyKey.replaceAll('.', ' ')}</p>
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
                        <p className="card-label">TypeRift Coach · {coach.data?.status ?? 'local'}</p>
                        <h2>{result.accuracy >= 96 ? 'The signal stayed clean under pressure.' : 'Accuracy broke before your tempo did.'}</h2>
                        <p>
                            {coach.data?.polishedText ??
                                (result.weakChars.length
                                    ? `Repair ${result.weakChars.join(' · ')} next. The recommendation is generated locally from aggregate metrics and is available offline.`
                                    : 'Your input stayed balanced. Increase pressure only when the same rhythm feels effortless.')}
                        </p>
                    </div>
                </section>
            </div>
            <Link className="tr-button tr-button--primary floating-cta" href={nextHref}>
                {result.weakChars.length ? t('debrief.next') : t('debrief.again')}
                <ArrowRight size={18} />
            </Link>
        </div>
    );
}
