'use client';

import { CalendarClock, Compass, GraduationCap, Trophy } from 'lucide-react';
import './dialogs.css';

export default function ModeSelectOverlay({
    bestScore,
    codexProgress,
    onStart
}: {
    bestScore: number,
    codexProgress?: { discovered?: number, total?: number } | null,
    onStart: (mode: 'expedition' | 'daily-anomaly' | 'first-descent') => void,
}) {
    return (
        <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label="TypeRift mode select">
            <section className="typerift-panel typerift-panel--wide">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>Roguelite Typing Survival</span>
                        <h1>TypeRift: Echo Siege</h1>
                        <p>输入敌人词条、升级武器与符文，在五个发光区域里守住边界线。v7 会从零建立新的游戏图鉴和成绩。</p>
                    </div>
                    <div className="typerift-mode-grid">
                        <button className="typerift-card" type="button" onClick={() => onStart('expedition')} autoFocus>
                            <Compass aria-hidden="true" size={22} strokeWidth={2.2} />
                            <strong>Expedition</strong>
                            <small>12-18 min</small>
                            <span>完整远征，区域 Boss、构筑升级和撤离抉择全部开放。</span>
                        </button>
                        <button className="typerift-card" type="button" onClick={() => onStart('daily-anomaly')}>
                            <CalendarClock aria-hidden="true" size={22} strokeWidth={2.2} />
                            <strong>Daily Anomaly</strong>
                            <small>Fixed seed</small>
                            <span>每日固定异象，适合比较构筑路线和稳定性。</span>
                        </button>
                        <button className="typerift-card" type="button" onClick={() => onStart('first-descent')}>
                            <GraduationCap aria-hidden="true" size={22} strokeWidth={2.2} />
                            <strong>First Descent</strong>
                            <small>6 min</small>
                            <span>短流程引导局，快速解锁第一份 TypeRift 样本。</span>
                        </button>
                    </div>
                    <div className="typerift-actions">
                        <span className="typerift-action" aria-label="TypeRift best score">
                            <Trophy aria-hidden="true" size={17} strokeWidth={2.2} />
                            Best {Math.round(bestScore || 0).toLocaleString()}
                        </span>
                        <span className="typerift-action" aria-label="TypeRift codex progress">
                            Codex {codexProgress?.discovered || 0}/{codexProgress?.total || 33}
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );
}

