'use client';

import { Activity, Crosshair, DoorOpen, Flame, Heart, Layers, RadioTower, Timer, Zap } from 'lucide-react';
import type { getCopy } from '../../../i18n';
import type { GameHudSnapshot } from '../../../types/game';
import './hud.css';

type GameCopy = ReturnType<typeof getCopy>;

function formatDuration(seconds = 0) {
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${minutes}:${String(rest).padStart(2, '0')}`;
}

export default function HudOverlay({ data, copy, onSurge }: { data: GameHudSnapshot, copy: GameCopy, onSurge?: () => void }) {
    const hudCopy = copy.game.hud;
    const progress = `${Math.min(100, Math.round((data.progress || 0) * 100))}%`;
    const xpProgress = `${Math.min(100, Math.round(((data.xp || 0) / Math.max(1, data.nextUpgradeXp || 1)) * 100))}%`;
    const energyProgress = `${Math.min(100, Math.round(data.energy || 0))}%`;

    return (
        <header className="typerift-hud" aria-label="TypeRift status">
            <div className="typerift-hud__cluster">
                <div className="typerift-hud__metric typerift-hud__metric--score" aria-label={hudCopy.score}>
                    <Activity aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{Math.round(data.score || 0).toLocaleString()}</span>
                </div>
                <div className="typerift-hud__metric" aria-label={hudCopy.area}>
                    <Layers aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{data.areaNameZh || data.areaName}</span>
                </div>
                <div className="typerift-hud__progress" aria-hidden="true">
                    <span style={{ width: progress }} />
                </div>
            </div>

            <div className="typerift-hud__target" aria-label={`${hudCopy.target} ${data.targetWord || hudCopy.noTarget}`}>
                <span>{hudCopy.target}</span>
                <strong>
                    {data.targetTyped ? <mark>{data.targetTyped}</mark> : null}
                    {data.targetWord ? data.targetWord.slice((data.targetTyped || '').length) : hudCopy.noTarget}
                </strong>
            </div>

            <div className="typerift-hud__cluster typerift-hud__cluster--secondary">
                <div className="typerift-hud__metric" aria-label={hudCopy.time}>
                    <Timer aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{formatDuration(data.elapsedSeconds)}</span>
                </div>
                <div className="typerift-hud__metric" aria-label={hudCopy.combo}>
                    <Zap aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{data.combo}</span>
                </div>
                <div className="typerift-hud__metric" aria-label={hudCopy.speed}>
                    <Crosshair aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{data.wpm}</span>
                    <small>WPM</small>
                </div>
                <div className="typerift-hud__metric" aria-label={hudCopy.heat}>
                    <Flame aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{data.heat}</span>
                </div>
                <button
                    className={`typerift-hud__surge${data.surgeReady ? ' is-ready' : ''}`}
                    type="button"
                    onClick={onSurge}
                    aria-label={hudCopy.surge}
                    title={hudCopy.surgeHint}
                >
                    <RadioTower aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{data.surgeReady ? hudCopy.surgeReady : hudCopy.surge}</span>
                    <i aria-hidden="true"><b style={{ width: energyProgress }} /></i>
                </button>
                <div className={`typerift-hud__metric${data.extractAvailable ? ' is-ready' : ''}`} aria-label={data.extractAvailable ? hudCopy.extractReady : hudCopy.level}>
                    <DoorOpen aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>{data.extractAvailable ? hudCopy.extractReady : `Lv ${data.level}`}</span>
                </div>
                <div className="typerift-hud__progress" aria-hidden="true">
                    <span style={{ width: xpProgress }} />
                </div>
                <div className="typerift-hud__lives" aria-label={`${hudCopy.lives} ${data.lives}`}>
                    <Heart aria-hidden="true" size={16} strokeWidth={2.2} />
                    {Array.from({ length: data.maxLives }).map((_, index) => (
                        <span key={index} className={index >= data.lives ? 'is-empty' : ''} />
                    ))}
                </div>
            </div>
        </header>
    );
}
