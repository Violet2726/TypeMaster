'use client';

import { BookOpen, ChevronRight, Home, RotateCcw, Trophy } from 'lucide-react';
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
            <section className="typerift-panel typerift-panel--result">
                <div className="typerift-panel__inner">
                    <div className="typerift-heading">
                        <span>{verdict(data, resultCopy)}</span>
                        <h2>{Math.round(data.score || 0).toLocaleString()}</h2>
                        {data.isBest ? <p><Trophy aria-hidden="true" size={14} strokeWidth={2.2} /> {resultCopy.newBest}</p> : null}
                    </div>
                    <div className="typerift-run-summary typerift-run-summary--result" aria-label={resultCopy.aria}>
                        <span>
                            <small>{resultCopy.duration}</small>
                            <strong>{formatDuration(data.durationSeconds)}</strong>
                        </span>
                        <span>
                            <small>{resultCopy.area}</small>
                            <strong>{data.areaNameZh || data.areaName}</strong>
                        </span>
                        <span>
                            <small>{resultCopy.accuracy}</small>
                            <strong>{data.accuracy}%</strong>
                        </span>
                    </div>
                    <div className="typerift-result-section">
                        <div className="typerift-result-metrics">
                            <span>
                                <small>{resultCopy.defeatedLabel}</small>
                                <strong>{data.enemiesDefeated || 0}</strong>
                            </span>
                            <span>
                                <small>{resultCopy.boss}</small>
                                <strong>{data.bossesDefeated || 0}</strong>
                            </span>
                            <span>
                                <small>{resultCopy.speed}</small>
                                <strong>{data.wpm}<small> WPM</small></strong>
                            </span>
                        </div>
                    </div>
                    <section className="typerift-result-section" aria-label={resultCopy.build}>
                        <span className="typerift-result-section__label">{resultCopy.build}</span>
                        <div className="typerift-result-build-list">
                            {build.length ? build.map((upgrade) => (
                                <span key={upgrade.id}>
                                    <strong>{upgrade.nameZh || upgrade.name}</strong>
                                    <small>x{upgrade.stack || 1}</small>
                                </span>
                            )) : (
                                <span>
                                    <strong>{resultCopy.noUpgrades}</strong>
                                </span>
                            )}
                        </div>
                    </section>
                    <section className="typerift-result-section typerift-result-section--insight" aria-label={resultCopy.nextRun}>
                        <span className="typerift-result-section__label">{resultCopy.nextRun}</span>
                        <strong>{data.recommendation}</strong>
                    </section>
                    <div className="typerift-action-list">
                        <button className="typerift-action-row typerift-action-row--primary" type="button" onClick={() => onAction('retry')} autoFocus>
                            <span>
                                <RotateCcw aria-hidden="true" size={18} strokeWidth={2.2} />
                                <strong>{resultCopy.retry}</strong>
                            </span>
                            <ChevronRight aria-hidden="true" size={17} strokeWidth={2.2} />
                        </button>
                        <button className="typerift-action-row" type="button" onClick={() => onAction('codex')}>
                            <span>
                                <BookOpen aria-hidden="true" size={18} strokeWidth={2.2} />
                                <strong>{resultCopy.codex}</strong>
                            </span>
                            <ChevronRight aria-hidden="true" size={17} strokeWidth={2.2} />
                        </button>
                        <button className="typerift-action-row" type="button" onClick={() => onAction('menu')}>
                            <span>
                                <Home aria-hidden="true" size={18} strokeWidth={2.2} />
                                <strong>{resultCopy.back}</strong>
                            </span>
                            <ChevronRight aria-hidden="true" size={17} strokeWidth={2.2} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
