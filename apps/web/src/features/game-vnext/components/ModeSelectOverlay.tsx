'use client';

import { CalendarClock, Compass, GraduationCap, Trophy } from 'lucide-react';
import { MetricCard } from '../../../components/app/AppPrimitives';
import type { getCopy } from '../../../i18n';
import type { GameCodexProgress, GameMode } from '../../../types/game';
import './dialogs.css';

type GameCopy = ReturnType<typeof getCopy>;

export default function ModeSelectOverlay({
    bestScore,
    codexProgress,
    copy,
    onStart
}: {
    bestScore: number,
    codexProgress?: Partial<GameCodexProgress> | null,
    copy: GameCopy,
    onStart: (mode: GameMode) => void,
}) {
    const gameCopy = copy.game;
    const modes = [
        {
            id: 'expedition',
            icon: Compass,
            title: gameCopy.modes.expedition.title,
            meta: gameCopy.modes.expedition.meta,
            body: gameCopy.modes.expedition.body,
            stats: gameCopy.modes.expedition.stats,
            tone: 'primary'
        },
        {
            id: 'daily-anomaly',
            icon: CalendarClock,
            title: gameCopy.modes.daily.title,
            meta: gameCopy.modes.daily.meta,
            body: gameCopy.modes.daily.body,
            stats: gameCopy.modes.daily.stats,
            tone: 'default'
        },
        {
            id: 'first-descent',
            icon: GraduationCap,
            title: gameCopy.modes.first.title,
            meta: gameCopy.modes.first.meta,
            body: gameCopy.modes.first.body,
            stats: gameCopy.modes.first.stats,
            tone: 'default'
        }
    ] as const;

    return (
        <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label={gameCopy.modeAria}>
            <section className="typerift-panel typerift-panel--wide typerift-panel--mode">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>{gameCopy.modeKicker}</span>
                        <h1>{gameCopy.modeTitle}</h1>
                        <p>{gameCopy.modeBody}</p>
                    </div>
                    <div className="typerift-mode-grid">
                        {modes.map((mode, index) => (
                            <button
                                key={mode.id}
                                className={`typerift-mode-card typerift-mode-card--${mode.tone}`}
                                type="button"
                                onClick={() => onStart(mode.id)}
                                autoFocus={index === 0}
                            >
                                <span className="typerift-mode-card__icon">
                                    <mode.icon aria-hidden="true" size={22} strokeWidth={2.1} />
                                </span>
                                <span className="typerift-mode-card__copy">
                                    <small>{mode.meta}</small>
                                    <strong>{mode.title}</strong>
                                    <span>{mode.body}</span>
                                </span>
                                <span className="typerift-mode-card__stats">{mode.stats}</span>
                            </button>
                        ))}
                    </div>
                    <div className="typerift-mode-metrics">
                        <MetricCard
                            icon={Trophy}
                            label={gameCopy.best}
                            value={Math.round(bestScore || 0).toLocaleString()}
                            tone="warning"
                            ariaLabel={gameCopy.bestScoreAria}
                        />
                        <MetricCard
                            label={gameCopy.codex}
                            value={`${codexProgress?.discovered || 0}/${codexProgress?.total || 33}`}
                            tone="primary"
                            ariaLabel={gameCopy.codexProgressAria}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
