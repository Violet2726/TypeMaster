'use client';

import { CalendarClock, Compass, GraduationCap, Trophy } from 'lucide-react';
import { AppCard, MetricCard } from '../../../components/app/AppPrimitives';
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
    const modes = [
        {
            id: 'expedition',
            icon: Compass,
            title: gameCopy.modes.expedition.title,
            meta: gameCopy.modes.expedition.meta,
            body: gameCopy.modes.expedition.body,
            tone: 'primary'
        },
        {
            id: 'daily-anomaly',
            icon: CalendarClock,
            title: gameCopy.modes.daily.title,
            meta: gameCopy.modes.daily.meta,
            body: gameCopy.modes.daily.body,
            tone: 'default'
        },
        {
            id: 'first-descent',
            icon: GraduationCap,
            title: gameCopy.modes.first.title,
            meta: gameCopy.modes.first.meta,
            body: gameCopy.modes.first.body,
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
                            <AppCard
                                key={mode.id}
                                className="typerift-mode-card"
                            icon={mode.icon}
                            kicker={mode.meta}
                            title={mode.title}
                            body={mode.body}
                                tone={mode.tone}
                            onClick={() => onStart(mode.id)}
                            autoFocus={index === 0}
                        />
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
