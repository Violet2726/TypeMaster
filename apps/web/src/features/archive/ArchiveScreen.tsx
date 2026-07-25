'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowRight, BookOpen, CheckCircle2, CircleDashed, Clock3, LockKeyhole, Trophy } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { listLocalRuns } from '../../lib/storage';
import { translate } from '../../i18n';
import { useUiStore } from '../../store/ui';

const enemyIds = ['drift', 'flare', 'veil', 'hinge', 'choir', 'lattice', 'cipher'];
const codex = Array.from({ length: 36 }, (_, index) => ({
    id: index,
    unlocked: index < 7,
    assetId: enemyIds[index],
    label: ['Prism Wisp', 'Glass Manta', 'Quiet Sentinel', 'Echo Leech', 'Phase Weaver', 'Arc Courier', 'Rift Shepherd'][index]
}));

export function ArchiveScreen() {
    const locale = useUiStore((state) => state.settings.locale);
    const t = (key: string) => translate(locale, key);
    const runs = useQuery({ queryKey: ['local-runs'], queryFn: listLocalRuns });
    return (
        <div className="page archive-page">
            <header className="page-heading page-heading--split">
                <div>
                    <p className="eyebrow">
                        <BookOpen size={16} />
                        {t('archive.eyebrow')}
                    </p>
                    <h1>{t('archive.title')}</h1>
                    <p className="lede">{t('archive.subtitle')}</p>
                </div>
                <Link className="tr-button tr-button--primary" href="/play?mode=expedition">
                    {t('archive.start')}
                    <ArrowRight size={18} />
                </Link>
            </header>
            <section className="archive-section">
                <div className="section-heading">
                    <h2>{t('archive.runs')}</h2>
                    <span>{runs.data?.length ?? 0}</span>
                </div>
                <div className="run-list">
                    {runs.data?.length ? (
                        runs.data.slice(0, 8).map((run) => (
                            <Link href={`/debrief/${run.id}`} className="run-row" key={run.id}>
                                <span className="run-mode">
                                    <CircleDashed size={18} />
                                    {run.result.mode.replaceAll('-', ' ')}
                                </span>
                                <span>
                                    <strong>{run.result.score.toLocaleString()}</strong> pts
                                </span>
                                <span>{run.result.accuracy}%</span>
                                <span>{run.result.wpm} WPM</span>
                                <span className="run-date">
                                    <Clock3 size={14} />
                                    {new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(run.completedAt))}
                                </span>
                            </Link>
                        ))
                    ) : (
                        <div className="archive-empty">
                            <CircleDashed size={28} />
                            <p>{t('hub.noRuns')}</p>
                        </div>
                    )}
                </div>
            </section>
            <div className="archive-columns">
                <section className="archive-section">
                    <div className="section-heading">
                        <h2>{t('archive.codex')}</h2>
                        <span>7 / 36</span>
                    </div>
                    <div className="codex-grid">
                        {codex.map((item) => (
                            <div className={item.unlocked ? 'codex-cell is-unlocked' : 'codex-cell'} key={item.id}>
                                {item.unlocked ? (
                                    <>
                                        <Image className="codex-sprite" src={`/game/v1/enemies/${item.assetId}.png`} width={62} height={62} alt="" />
                                        <p>{item.label}</p>
                                    </>
                                ) : (
                                    <>
                                        <LockKeyhole size={18} />
                                        <p>{t('archive.locked')}</p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
                <section className="archive-section achievements">
                    <div className="section-heading">
                        <h2>{t('archive.achievements')}</h2>
                        <span>2 / 18</span>
                    </div>
                    <article>
                        <Trophy size={20} />
                        <div>
                            <h3>Clean Signal</h3>
                            <p>98% accuracy in a completed run</p>
                        </div>
                        <CheckCircle2 size={18} />
                    </article>
                    <article>
                        <Trophy size={20} />
                        <div>
                            <h3>First Contact</h3>
                            <p>Close your first rift</p>
                        </div>
                        <CheckCircle2 size={18} />
                    </article>
                    {Array.from({ length: 3 }, (_, index) => (
                        <article className="is-locked" key={index}>
                            <LockKeyhole size={20} />
                            <div>
                                <h3>{t('archive.locked')}</h3>
                                <p>Continue exploring the rift</p>
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        </div>
    );
}
