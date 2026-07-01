'use client';

import { DoorOpen, Home, Play, RotateCcw } from 'lucide-react';
import type { getCopy } from '../../../i18n';
import type { GameHudSnapshot } from '../../../types/game';
import './dialogs.css';

type GameCopy = ReturnType<typeof getCopy>;

export default function PauseOverlay({ stats, copy, onAction }: { stats: GameHudSnapshot, copy: GameCopy, onAction: (action: string) => void }) {
    const gameCopy = copy.game;

    return (
        <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label={gameCopy.pauseDialog.aria}>
            <section className="typerift-panel">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>{gameCopy.pauseDialog.kicker}</span>
                        <h2>{gameCopy.pauseDialog.title}</h2>
                    </div>
                    <div className="typerift-stats">
                        <div><span>{gameCopy.pauseDialog.score}</span><strong>{Math.round(stats?.score || 0).toLocaleString()}</strong></div>
                        <div><span>{gameCopy.pauseDialog.area}</span><strong>{stats?.areaNameZh || stats?.areaName}</strong></div>
                        <div><span>{gameCopy.pauseDialog.combo}</span><strong>{stats?.combo || 0}</strong></div>
                    </div>
                    <div className="typerift-actions">
                        <button className="typerift-action typerift-action--primary" type="button" onClick={() => onAction('resume')} autoFocus>
                            <Play aria-hidden="true" size={18} strokeWidth={2.2} />
                            {gameCopy.resume}
                        </button>
                        <button className="typerift-action" type="button" onClick={() => onAction('retry')}>
                            <RotateCcw aria-hidden="true" size={18} strokeWidth={2.2} />
                            {gameCopy.retry}
                        </button>
                        <button className="typerift-action typerift-action--extract" type="button" onClick={() => onAction('extract')} disabled={!stats?.extractAvailable}>
                            <DoorOpen aria-hidden="true" size={18} strokeWidth={2.2} />
                            {gameCopy.extract}
                        </button>
                        <button className="typerift-action" type="button" onClick={() => onAction('quit')}>
                            <Home aria-hidden="true" size={18} strokeWidth={2.2} />
                            {gameCopy.exit}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
