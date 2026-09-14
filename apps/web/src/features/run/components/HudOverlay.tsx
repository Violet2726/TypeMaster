'use client';

import type { RunState } from '@typerift/domain';
import { Heart, Pause, Zap } from 'lucide-react';
import './hud.css';

/**
 * Transient feedback (tier 2). Rendered once, then removed. Never persistent chrome.
 */
export type HudFeedback = {
    id: number;
    kind: 'combo' | 'combo-lost' | 'level-up' | 'area' | 'perfect' | 'extract' | 'surge';
    label: string;
    detail?: string;
};

const STABILITY_SEGMENTS = 3;
const HEAT_SEGMENTS = 5;

/** Survival is the inverse of Fracture, expressed as three segments instead of a raw number. */
export function stabilitySegments(fracture: number) {
    const remaining = Math.max(0, 100 - Math.max(0, Math.min(100, fracture)));
    return Math.max(0, Math.min(STABILITY_SEGMENTS, Math.ceil((remaining / 100) * STABILITY_SEGMENTS)));
}

/** Heat is Fracture made legible: five segments, amber below the danger line, red above it. */
export function heatSegments(fracture: number) {
    const clamped = Math.max(0, Math.min(100, fracture));
    return Math.max(0, Math.min(HEAT_SEGMENTS, Math.round((clamped / 100) * HEAT_SEGMENTS)));
}

/** The word the player should read: the locked target, or the highest-pressure candidate. */
export function targetOf(state: RunState): { enemy: RunState['enemies'][number]; locked: boolean } | null {
    if (state.currentTargetId) {
        const locked = state.enemies.find((enemy) => enemy.id === state.currentTargetId);
        if (locked) return { enemy: locked, locked: true };
    }
    const candidate = [...state.enemies].sort((a, b) => b.pressure - a.pressure)[0];
    return candidate ? { enemy: candidate, locked: false } : null;
}

function runProgress(state: RunState) {
    if (state.durationMs <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((state.elapsedMs / state.durationMs) * 100)));
}

export function HudOverlay({
    state,
    modeLabel,
    areaLabel,
    t,
    feedback,
    onPause,
    onSurge
}: {
    state: RunState;
    modeLabel: string;
    areaLabel: string;
    t: (key: string) => string;
    feedback: HudFeedback | null;
    onPause: () => void;
    onSurge: () => void;
}) {
    const target = targetOf(state);
    const stability = stabilitySegments(state.fracture);
    const heat = heatSegments(state.fracture);
    const heatLevel = state.fracture >= 75 ? 'critical' : state.fracture >= 40 ? 'warn' : 'calm';
    const surgeReady = state.energy >= 100;

    return (
        <div className="hud">
            <div className="hud__top">
                <p className="hud__area">
                    <span className="hud__area-name">{areaLabel}</span>
                    <span className="hud__area-value">
                        {t('play.area')} {state.areaIndex + 1}
                        <span aria-hidden="true"> · </span>
                        {runProgress(state)}%
                    </span>
                    <span className="sr-only">
                        {t('play.wave')} {state.wave}
                    </span>
                </p>
                <div className="hud__survival">
                    <span className="sr-only">
                        {t('play.stability')} {stability}/{STABILITY_SEGMENTS}
                    </span>
                    <span className="hud__hearts" aria-hidden="true">
                        {Array.from({ length: STABILITY_SEGMENTS }, (_, index) => (
                            <Heart key={index} size={18} className={index < stability ? 'is-full' : 'is-empty'} strokeWidth={2.2} />
                        ))}
                    </span>
                </div>
                <button type="button" className="hud__pause" aria-label={t('play.pauseAction')} onClick={onPause}>
                    <Pause size={18} />
                </button>
            </div>

            <div className="hud__center">
                {feedback ? (
                    <p key={feedback.id} className={`hud__signal hud__signal--${feedback.kind}`} role="status">
                        <strong>{feedback.label}</strong>
                        {feedback.detail ? <span>{feedback.detail}</span> : null}
                    </p>
                ) : null}
                <div className="hud__target">
                    <p className="hud__target-label">{target?.locked ? t('play.target') : t('play.next')}</p>
                    {target ? (
                        <p className="hud__word" data-word={target.enemy.word}>
                            <span className="hud__word-typed">{target.enemy.typed}</span>
                            <span className="hud__word-rest">{target.enemy.word.slice(target.enemy.typed.length)}</span>
                        </p>
                    ) : (
                        <p className="hud__word hud__word--calm">{t('play.awaiting')}</p>
                    )}
                </div>
                {/* Announces only when the word itself changes, never per keystroke. */}
                <p className="sr-only" aria-live="polite">
                    {target ? `${target.locked ? t('play.target') : t('play.next')}: ${target.enemy.word}` : t('play.awaiting')}
                </p>
            </div>

            <div className="hud__bottom">
                <div className={`hud__heat is-${heatLevel}`} aria-hidden="true">
                    <span className="hud__heat-label">{t('play.heat')}</span>
                    <span className="hud__heat-track">
                        {Array.from({ length: HEAT_SEGMENTS }, (_, index) => (
                            <i key={index} className={index < heat ? 'is-on' : ''} />
                        ))}
                    </span>
                </div>
                <span className="sr-only">
                    {t('play.heat')} {Math.round(state.fracture)}%
                </span>
                <button
                    type="button"
                    className={`hud__surge${surgeReady ? ' is-ready' : ''}`}
                    disabled={!surgeReady}
                    aria-label={t('play.surge')}
                    onClick={onSurge}
                >
                    <Zap size={18} />
                    <span>{t('play.surge')}</span>
                    <kbd aria-hidden="true">Space</kbd>
                </button>
            </div>

            <p className="sr-only" aria-label={t('play.modeLabel')}>
                {modeLabel} · {areaLabel}
            </p>
        </div>
    );
}
