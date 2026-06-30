'use client';

import { Activity, Crosshair, DoorOpen, Flame, Heart, Layers, Timer, Zap } from 'lucide-react';
import './hud.css';

function formatDuration(seconds = 0) {
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export default function HudOverlay({ data }: { data: any }) {
    const progress = `${Math.min(100, Math.round((data.progress || 0) * 100))}%`;
    const xpProgress = `${Math.min(100, Math.round(((data.xp || 0) / Math.max(1, data.nextUpgradeXp || 1)) * 100))}%`;

    return (
        <header className="typerift-hud" aria-label="TypeRift status">
            <div className="typerift-hud__cluster">
                <div className="typerift-hud__metric typerift-hud__metric--score">
                    <Activity aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{Math.round(data.score || 0).toLocaleString()}</span>
                </div>
                <div className="typerift-hud__metric">
                    <Layers aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{data.areaNameZh || data.areaName}</span>
                </div>
                <div className="typerift-hud__progress" aria-hidden="true">
                    <span style={{ width: progress }} />
                </div>
            </div>

            <div className="typerift-hud__target" aria-label={`Current target ${data.targetWord || 'none'}`}>
                <span>Target</span>
                <strong>
                    {data.targetTyped ? <mark>{data.targetTyped}</mark> : null}
                    {data.targetWord ? data.targetWord.slice((data.targetTyped || '').length) : '...'}
                </strong>
            </div>

            <div className="typerift-hud__cluster typerift-hud__cluster--secondary">
                <div className="typerift-hud__metric">
                    <Timer aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{formatDuration(data.elapsedSeconds)}</span>
                </div>
                <div className="typerift-hud__metric">
                    <Zap aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{data.combo}</span>
                </div>
                <div className="typerift-hud__metric">
                    <Crosshair aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{data.wpm}</span>
                    <small>WPM</small>
                </div>
                <div className="typerift-hud__metric">
                    <Flame aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{data.heat}</span>
                </div>
                <div className={`typerift-hud__metric${data.extractAvailable ? ' is-ready' : ''}`}>
                    <DoorOpen aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{data.extractAvailable ? 'Extract' : `Lv ${data.level}`}</span>
                </div>
                <div className="typerift-hud__progress" aria-hidden="true">
                    <span style={{ width: xpProgress }} />
                </div>
                <div className="typerift-hud__lives" aria-label={`${data.lives} lives remaining`}>
                    <Heart aria-hidden="true" size={16} strokeWidth={2.2} />
                    {Array.from({ length: data.maxLives }).map((_, index) => (
                        <span key={index} className={index >= data.lives ? 'is-empty' : ''} />
                    ))}
                </div>
            </div>
        </header>
    );
}

