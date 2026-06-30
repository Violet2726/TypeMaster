'use client';

import { BookOpen, DoorOpen, Home, RotateCcw, Trophy } from 'lucide-react';
import './dialogs.css';

function formatDuration(seconds = 0) {
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function verdict(data: any) {
    if (data.endReason === 'victory') return '终端关闭';
    if (data.endReason === 'extract') return '成功撤离';
    if (data.accuracy < 90) return '命中失稳';
    return '边界失守';
}

export default function RunResultOverlay({ data, onAction }: { data: any, onAction: (action: string) => void }) {
    const build = data.upgradeBuild || [];

    return (
        <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label="TypeRift result">
            <section className="typerift-panel">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>{verdict(data)}</span>
                        <h2>{Math.round(data.score || 0).toLocaleString()}</h2>
                        {data.isBest ? <p><Trophy aria-hidden="true" size={14} strokeWidth={2.2} /> New best</p> : null}
                    </div>
                    <div className="typerift-stats">
                        <div><span>Duration</span><strong>{formatDuration(data.durationSeconds)}</strong></div>
                        <div><span>Area</span><strong>{data.areaNameZh || data.areaName}</strong></div>
                        <div><span>Defeated</span><strong>{data.enemiesDefeated}</strong></div>
                        <div><span>Boss</span><strong>{data.bossesDefeated}</strong></div>
                        <div><span>Speed</span><strong>{data.wpm}<small> WPM</small></strong></div>
                        <div><span>Accuracy</span><strong>{data.accuracy}%</strong></div>
                    </div>
                    <div className="typerift-build">
                        <span>Build</span>
                        <div className="typerift-pills">
                            {build.length ? build.map((upgrade: any) => (
                                <b key={upgrade.id}>{upgrade.nameZh || upgrade.name} x{upgrade.stack || 1}</b>
                            )) : <b>No upgrades</b>}
                        </div>
                    </div>
                    <div className="typerift-insight">
                        <span>Next run</span>
                        <strong>{data.recommendation}</strong>
                    </div>
                    <div className="typerift-actions">
                        <button className="typerift-action typerift-action--primary" type="button" onClick={() => onAction('retry')} autoFocus>
                            <RotateCcw aria-hidden="true" size={18} strokeWidth={2.2} />
                            再次远征
                        </button>
                        <button className="typerift-action" type="button" onClick={() => onAction('codex')}>
                            <BookOpen aria-hidden="true" size={18} strokeWidth={2.2} />
                            图鉴
                        </button>
                        <button className="typerift-action" type="button" onClick={() => onAction('menu')}>
                            <Home aria-hidden="true" size={18} strokeWidth={2.2} />
                            返回
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

