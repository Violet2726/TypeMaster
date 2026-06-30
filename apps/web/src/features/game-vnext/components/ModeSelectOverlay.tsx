'use client';

import { CalendarClock, Compass, GraduationCap, Trophy } from 'lucide-react';
import './dialogs.css';

export default function ModeSelectOverlay({
    bestScore,
    codexProgress,
    copy,
    onStart
}: {
    bestScore: number,
    codexProgress?: { discovered?: number, total?: number } | null,
    copy: any,
    onStart: (mode: 'expedition' | 'daily-anomaly' | 'first-descent') => void,
}) {
    const gameCopy = copy.game;

    return (
        <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label={gameCopy.modeAria}>
            <section className="typerift-panel typerift-panel--wide">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>{gameCopy.modeKicker}</span>
                        <h1>{gameCopy.modeTitle}</h1>
                        <p>{gameCopy.modeBody}</p>
                    </div>
                    <div className="typerift-mode-grid">
                        <button className="typerift-card" type="button" onClick={() => onStart('expedition')} autoFocus>
                            <Compass aria-hidden="true" size={22} strokeWidth={2.2} />
                            <strong>{gameCopy.modes.expedition.title}</strong>
                            <small>{gameCopy.modes.expedition.meta}</small>
                            <span>{gameCopy.modes.expedition.body}</span>
                        </button>
                        <button className="typerift-card" type="button" onClick={() => onStart('daily-anomaly')}>
                            <CalendarClock aria-hidden="true" size={22} strokeWidth={2.2} />
                            <strong>{gameCopy.modes.daily.title}</strong>
                            <small>{gameCopy.modes.daily.meta}</small>
                            <span>{gameCopy.modes.daily.body}</span>
                        </button>
                        <button className="typerift-card" type="button" onClick={() => onStart('first-descent')}>
                            <GraduationCap aria-hidden="true" size={22} strokeWidth={2.2} />
                            <strong>{gameCopy.modes.first.title}</strong>
                            <small>{gameCopy.modes.first.meta}</small>
                            <span>{gameCopy.modes.first.body}</span>
                        </button>
                    </div>
                    <div className="typerift-actions">
                        <span className="typerift-action" aria-label={gameCopy.bestScoreAria}>
                            <Trophy aria-hidden="true" size={17} strokeWidth={2.2} />
                            {gameCopy.best} {Math.round(bestScore || 0).toLocaleString()}
                        </span>
                        <span className="typerift-action" aria-label={gameCopy.codexProgressAria}>
                            {gameCopy.codex} {codexProgress?.discovered || 0}/{codexProgress?.total || 33}
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );
}
