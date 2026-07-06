'use client';

import { ChevronRight, DoorOpen, Home, Play, RotateCcw } from 'lucide-react';
import { createPortal } from 'react-dom';
import type { getCopy } from '../../../i18n';
import type { GameHudSnapshot } from '../../../types/game';
import './dialogs.css';

type GameCopy = ReturnType<typeof getCopy>;

export default function PauseOverlay({ stats, copy, onAction }: { stats: GameHudSnapshot, copy: GameCopy, onAction: (action: string) => void }) {
    const gameCopy = copy.game;
    const overlay = (
        <div className="typerift-overlay typerift-overlay--sheet" role="dialog" aria-modal="true" aria-label={gameCopy.pauseDialog.aria}>
            <section className="typerift-sheet typerift-sheet--pause">
                <div className="typerift-sheet__inner">
                    <div className="typerift-sheet__grabber" aria-hidden="true" />
                    <div className="typerift-sheet__header">
                        <span>{gameCopy.pauseDialog.kicker}</span>
                        <h2>{gameCopy.pauseDialog.title}</h2>
                    </div>
                    <div className="typerift-run-summary typerift-sheet__summary" aria-label={gameCopy.pauseDialog.aria}>
                        <span>
                            <small>{gameCopy.pauseDialog.score}</small>
                            <strong>{Math.round(stats?.score || 0).toLocaleString()}</strong>
                        </span>
                        <span>
                            <small>{gameCopy.pauseDialog.area}</small>
                            <strong>{stats?.areaNameZh || stats?.areaName}</strong>
                        </span>
                        <span>
                            <small>{gameCopy.pauseDialog.combo}</small>
                            <strong>{stats?.combo || 0}</strong>
                        </span>
                    </div>
                    <div className="typerift-action-list typerift-sheet__actions">
                        <button className="typerift-action-row typerift-action-row--primary" type="button" onClick={() => onAction('resume')} autoFocus>
                            <span>
                                <Play aria-hidden="true" size={18} strokeWidth={2.2} />
                                <strong>{gameCopy.resume}</strong>
                            </span>
                            <ChevronRight aria-hidden="true" size={17} strokeWidth={2.2} />
                        </button>
                        <button className="typerift-action-row" type="button" onClick={() => onAction('retry')}>
                            <span>
                                <RotateCcw aria-hidden="true" size={18} strokeWidth={2.2} />
                                <strong>{gameCopy.retry}</strong>
                            </span>
                            <ChevronRight aria-hidden="true" size={17} strokeWidth={2.2} />
                        </button>
                        <button className="typerift-action-row typerift-action-row--extract" type="button" onClick={() => onAction('extract')} disabled={!stats?.extractAvailable}>
                            <span>
                                <DoorOpen aria-hidden="true" size={18} strokeWidth={2.2} />
                                <strong>{gameCopy.extract}</strong>
                            </span>
                            <ChevronRight aria-hidden="true" size={17} strokeWidth={2.2} />
                        </button>
                        <button className="typerift-action-row" type="button" onClick={() => onAction('quit')}>
                            <span>
                                <Home aria-hidden="true" size={18} strokeWidth={2.2} />
                                <strong>{gameCopy.exit}</strong>
                            </span>
                            <ChevronRight aria-hidden="true" size={17} strokeWidth={2.2} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );

    return typeof document === 'undefined' ? overlay : createPortal(overlay, document.body);
}
