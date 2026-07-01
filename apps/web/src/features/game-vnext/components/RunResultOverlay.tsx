'use client';

import { BookOpen, Home, RotateCcw, Trophy } from 'lucide-react';
import type { getCopy } from '../../../i18n';
import type { GameResult } from '../../../types/game';
import './dialogs.css';

type GameCopy = ReturnType<typeof getCopy>;

function formatDuration(seconds = 0) {
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function verdict(data: GameResult, resultCopy: GameCopy['game']['result']) {
    if (data.endReason === 'victory') return resultCopy.victory;
    if (data.endReason === 'extract') return resultCopy.extract;
    if (data.accuracy < 90) return resultCopy.unstable;
    return resultCopy.defeated;
}

export default function RunResultOverlay({ data, copy, onAction }: { data: GameResult, copy: GameCopy, onAction: (action: string) => void }) {
    const build = data.upgradeBuild || [];
    const resultCopy = copy.game.result;

    return (
        <div className="typerift-overlay" role="dialog" aria-modal="true" aria-label={resultCopy.aria}>
            <section className="typerift-panel">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>{verdict(data, resultCopy)}</span>
                        <h2>{Math.round(data.score || 0).toLocaleString()}</h2>
                        {data.isBest ? <p><Trophy aria-hidden="true" size={14} strokeWidth={2.2} /> {resultCopy.newBest}</p> : null}
                    </div>
                    <div className="typerift-stats">
                        <div><span>{resultCopy.duration}</span><strong>{formatDuration(data.durationSeconds)}</strong></div>
                        <div><span>{resultCopy.area}</span><strong>{data.areaNameZh || data.areaName}</strong></div>
                        <div><span>{resultCopy.defeatedLabel}</span><strong>{data.enemiesDefeated}</strong></div>
                        <div><span>{resultCopy.boss}</span><strong>{data.bossesDefeated}</strong></div>
                        <div><span>{resultCopy.speed}</span><strong>{data.wpm}<small> WPM</small></strong></div>
                        <div><span>{resultCopy.accuracy}</span><strong>{data.accuracy}%</strong></div>
                    </div>
                    <div className="typerift-build">
                        <span>{resultCopy.build}</span>
                        <div className="typerift-pills">
                            {build.length ? build.map((upgrade) => (
                                <b key={upgrade.id}>{upgrade.nameZh || upgrade.name} x{upgrade.stack || 1}</b>
                            )) : <b>{resultCopy.noUpgrades}</b>}
                        </div>
                    </div>
                    <div className="typerift-insight">
                        <span>{resultCopy.nextRun}</span>
                        <strong>{data.recommendation}</strong>
                    </div>
                    <div className="typerift-actions">
                        <button className="typerift-action typerift-action--primary" type="button" onClick={() => onAction('retry')} autoFocus>
                            <RotateCcw aria-hidden="true" size={18} strokeWidth={2.2} />
                            {resultCopy.retry}
                        </button>
                        <button className="typerift-action" type="button" onClick={() => onAction('codex')}>
                            <BookOpen aria-hidden="true" size={18} strokeWidth={2.2} />
                            {resultCopy.codex}
                        </button>
                        <button className="typerift-action" type="button" onClick={() => onAction('menu')}>
                            <Home aria-hidden="true" size={18} strokeWidth={2.2} />
                            {resultCopy.back}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
