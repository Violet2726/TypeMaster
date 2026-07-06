'use client';

import { Activity, Crosshair, DoorOpen, Flame, Heart, RadioTower, Timer, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { getCopy } from '../../../i18n';
import type { GameHudSnapshot } from '../../../types/game';
import './hud.css';

type GameCopy = ReturnType<typeof getCopy>;

function formatDuration(seconds = 0) {
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function HudMetric({ icon: Icon, label, value, unit, ready = false }: { icon: LucideIcon, label: string, value: string | number, unit?: string, ready?: boolean }) {
    return (
        <span className={`typerift-hud__metric${ready ? ' is-ready' : ''}`} aria-label={label}>
            <Icon aria-hidden="true" size={15} strokeWidth={2.2} />
            <span>
                <small>{label}</small>
                <strong>{value}{unit ? <em>{unit}</em> : null}</strong>
            </span>
        </span>
    );
}

export default function HudOverlay({ data, copy, onSurge }: { data: GameHudSnapshot, copy: GameCopy, onSurge?: () => void }) {
    const hudCopy = copy.game.hud;
    const progress = `${Math.min(100, Math.round((data.progress || 0) * 100))}%`;
    const xpProgress = `${Math.min(100, Math.round(((data.xp || 0) / Math.max(1, data.nextUpgradeXp || 1)) * 100))}%`;
    const energyProgress = `${Math.min(100, Math.round(data.energy || 0))}%`;
    const areaName = data.areaNameZh || data.areaName;
    const levelLabel = data.extractAvailable ? hudCopy.extractReady : hudCopy.level;
    const levelValue = data.extractAvailable ? hudCopy.extractReady : `Lv ${data.level}`;

    return (
        <header className="typerift-hud" aria-label="TypeRift status">
            <section className="typerift-hud__primary" aria-label={`${hudCopy.score} ${Math.round(data.score || 0).toLocaleString()}`}>
                <div className="typerift-hud__score">
                    <Activity aria-hidden="true" size={18} strokeWidth={2.2} />
                    <span>
                        <small>{hudCopy.score}</small>
                        <strong>{Math.round(data.score || 0).toLocaleString()}</strong>
                    </span>
                </div>
                <div className="typerift-hud__area" aria-label={hudCopy.area}>
                    <small>{hudCopy.area}</small>
                    <strong>{areaName}</strong>
                </div>
                <div className="typerift-hud__meter" aria-hidden="true">
                    <span style={{ width: progress }} />
                </div>
            </section>

            <section className="typerift-hud__target" aria-label={`${hudCopy.target} ${data.targetWord || hudCopy.noTarget}`}>
                <span>{hudCopy.target}</span>
                <strong>
                    {data.targetTyped ? <mark>{data.targetTyped}</mark> : null}
                    {data.targetWord ? data.targetWord.slice((data.targetTyped || '').length) : hudCopy.noTarget}
                </strong>
            </section>

            <section className="typerift-hud__rail" aria-label="TypeRift run details">
                <div className="typerift-hud__stats">
                    <HudMetric icon={Timer} label={hudCopy.time} value={formatDuration(data.elapsedSeconds)} />
                    <HudMetric icon={Zap} label={hudCopy.combo} value={data.combo} />
                    <HudMetric icon={Crosshair} label={hudCopy.speed} value={data.wpm} unit="WPM" />
                    <HudMetric icon={Flame} label={hudCopy.heat} value={data.heat} />
                    <HudMetric icon={DoorOpen} label={levelLabel} value={levelValue} ready={data.extractAvailable} />
                </div>
                <button
                    className={`typerift-hud__surge${data.surgeReady ? ' is-ready' : ''}`}
                    type="button"
                    onClick={onSurge}
                    aria-label={hudCopy.surge}
                    title={hudCopy.surgeHint}
                >
                    <RadioTower aria-hidden="true" size={16} strokeWidth={2.2} />
                    <span>
                        <small>{hudCopy.surge}</small>
                        <strong>{data.surgeReady ? hudCopy.surgeReady : `${Math.round(data.energy || 0)}%`}</strong>
                    </span>
                    <i aria-hidden="true"><b style={{ width: energyProgress }} /></i>
                </button>
                <div className="typerift-hud__meter typerift-hud__meter--xp" aria-hidden="true">
                    <span style={{ width: xpProgress }} />
                </div>
                <div className="typerift-hud__lives" aria-label={`${hudCopy.lives} ${data.lives}`}>
                    <Heart aria-hidden="true" size={16} strokeWidth={2.2} />
                    {Array.from({ length: data.maxLives }).map((_, index) => (
                        <span key={index} className={index >= data.lives ? 'is-empty' : ''} />
                    ))}
                </div>
            </section>
        </header>
    );
}
