'use client';

import { BookOpen, CalendarClock, ChevronRight, Compass, GraduationCap, Trophy } from 'lucide-react';
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
    const codexValue = `${codexProgress?.discovered || 0}/${codexProgress?.total || 33}`;
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
                    <div className="typerift-mode-status" aria-label={`${gameCopy.bestScoreAria}; ${gameCopy.codexProgressAria}`}>
                        <span>
                            <Trophy aria-hidden="true" size={15} strokeWidth={2.2} />
                            <small>{gameCopy.best}</small>
                            <strong>{Math.round(bestScore || 0).toLocaleString()}</strong>
                        </span>
                        <span>
                            <BookOpen aria-hidden="true" size={15} strokeWidth={2.2} />
                            <small>{gameCopy.codex}</small>
                            <strong>{codexValue}</strong>
                        </span>
                    </div>
                    <div className="typerift-mode-list">
                        {modes.map((mode, index) => (
                            <button
                                key={mode.id}
                                className={`typerift-mode-row typerift-mode-row--${mode.tone}`}
                                type="button"
                                onClick={() => onStart(mode.id)}
                                autoFocus={index === 0}
                            >
                                <span className="typerift-mode-row__icon">
                                    <mode.icon aria-hidden="true" size={22} strokeWidth={2.1} />
                                </span>
                                <span className="typerift-mode-row__copy">
                                    <small>{mode.meta}</small>
                                    <strong>{mode.title}</strong>
                                    <span>{mode.body}</span>
                                </span>
                                <span className="typerift-mode-row__meta">
                                    <span>{mode.stats}</span>
                                    <ChevronRight aria-hidden="true" size={17} strokeWidth={2.2} />
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
