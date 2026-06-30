'use client';

import { DoorOpen, Home, Play, RotateCcw } from 'lucide-react';
import './dialogs.css';

export default function PauseOverlay({ stats, onAction }: { stats: any, onAction: (action: string) => void }) {
    return (
        <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label="TypeRift paused">
            <section className="typerift-panel">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>Pause</span>
                        <h2>TypeRift</h2>
                    </div>
                    <div className="typerift-stats">
                        <div><span>Score</span><strong>{Math.round(stats?.score || 0).toLocaleString()}</strong></div>
                        <div><span>Area</span><strong>{stats?.areaNameZh || stats?.areaName}</strong></div>
                        <div><span>Combo</span><strong>{stats?.combo || 0}</strong></div>
                    </div>
                    <div className="typerift-actions">
                        <button className="typerift-action typerift-action--primary" type="button" onClick={() => onAction('resume')} autoFocus>
                            <Play aria-hidden="true" size={18} strokeWidth={2.2} />
                            Resume
                        </button>
                        <button className="typerift-action" type="button" onClick={() => onAction('retry')}>
                            <RotateCcw aria-hidden="true" size={18} strokeWidth={2.2} />
                            Retry
                        </button>
                        <button className="typerift-action typerift-action--extract" type="button" onClick={() => onAction('extract')} disabled={!stats?.extractAvailable}>
                            <DoorOpen aria-hidden="true" size={18} strokeWidth={2.2} />
                            Extract
                        </button>
                        <button className="typerift-action" type="button" onClick={() => onAction('quit')}>
                            <Home aria-hidden="true" size={18} strokeWidth={2.2} />
                            Exit
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
