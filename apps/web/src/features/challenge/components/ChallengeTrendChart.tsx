import { useEffect, useMemo, useState } from 'react';
import { getChallengePointFocusState, getChallengeTrendState } from '@typemaster/domain';
import { getChallengeFocusNote } from '../../../training/challenge-focus';
import {
    buildAreaPath,
    buildLinePath,
    buildPoints,
    buildTicks,
    clamp,
    fillTemplate,
    formatSigned,
    getNiceMax
} from './challenge-trend-chart-helpers';

function getTrendNote(trainingCopy, trend) {
    const state = getChallengeTrendState(trend);

    if (state === 'idle') {
        return trainingCopy.challenge.trendEmpty;
    }

    if (state === 'warm') {
        return trainingCopy.challenge.trendWarm;
    }

    if (state === 'improving') {
        return trainingCopy.challenge.trendImproving;
    }

    if (state === 'cooling') {
        return trainingCopy.challenge.trendCooling;
    }

    return trainingCopy.challenge.trendSteady;
}

function getAttemptLabel(trainingCopy, point, index, total) {
    if (index === 0) {
        return trainingCopy.challenge.trendFirstLabel;
    }

    if (index === total - 1) {
        return trainingCopy.challenge.trendLatestLabel;
    }

    return fillTemplate(trainingCopy.challenge.trendRunLabel, String(point.attempt));
}

export function ChallengeTrendChart({ copy, trainingCopy, trend }) {
    const width = 760;
    const height = 300;
    const frame = {
        left: 46,
        right: 40,
        top: 24,
        bottom: 216,
        width: 760 - 46 - 40,
        height: 216 - 24
    };

    const speedMax = getNiceMax(Math.max(10, ...trend.points.map((point) => point.wpm), 0));
    const wpmPoints = buildPoints(trend.points, 'wpm', frame, speedMax);
    const accuracyPoints = buildPoints(trend.points, 'accuracy', frame, 100);
    const yTicks = buildTicks(speedMax);
    const note = getTrendNote(trainingCopy, trend);
    const averageAccuracy = trend.attempts
        ? Math.round(trend.points.reduce((sum, point) => sum + point.accuracy, 0) / trend.attempts)
        : 0;
    const [activeIndex, setActiveIndex] = useState(() => Math.max(0, trend.points.length - 1));

    useEffect(() => {
        setActiveIndex(Math.max(0, trend.points.length - 1));
    }, [trend.points.length]);

    const activePoint = trend.points[activeIndex] || null;
    const activePointLabel = useMemo(
        () => getAttemptLabel(trainingCopy, activePoint, activeIndex, trend.points.length),
        [activeIndex, activePoint, trainingCopy, trend.points.length]
    );
    const activeFocusState = useMemo(
        () => getChallengePointFocusState(activePoint),
        [activePoint]
    );
    const activeFocusNote = useMemo(
        () => getChallengeFocusNote(trainingCopy, activeFocusState),
        [activeFocusState, trainingCopy]
    );
    const activeStatuses = [
        activeIndex === trend.points.length - 1 ? trainingCopy.challenge.latestBadge : null,
        activePoint && activePoint.id === trend.best?.id ? trainingCopy.challenge.bestBadge : null
    ].filter(Boolean);

    return (
        <div className="chart-panel replay-panel replay-panel--merged">
            <div className="replay-header">
                <div className="replay-header__left">
                    <div className="chart-panel__intro">
                        <p className="panel-kicker">{trainingCopy.challenge.trendTitle}</p>
                        <h2>{trainingCopy.challenge.trendTitle}</h2>
                        <p className="muted-text">{trainingCopy.challenge.trendBody}</p>
                    </div>
                    <div className="replay-legend" aria-label={trainingCopy.challenge.trendTitle}>
                        <span className="replay-legend__chip is-active replay-legend__chip--wpm">
                            <i className="swatch swatch-main" />
                            <span>{copy.common.wpm}</span>
                        </span>
                        <span className="replay-legend__chip is-active replay-legend__chip--accuracy">
                            <i className="swatch swatch-accuracy" />
                            <span>{copy.common.accuracy}</span>
                        </span>
                    </div>
                </div>

                <aside className="replay-summary-card">
                    <span className="summary-label">{trainingCopy.challenge.trendTitle}</span>
                    <div className="replay-summary-card__grid">
                        <div className="replay-summary-card__item">
                            <span>{trainingCopy.challenge.trendFirstLabel}</span>
                            <strong>{trend.first ? `${trend.first.wpm} ${copy.common.wpm}` : copy.common.emptyValue}</strong>
                        </div>
                        <div className="replay-summary-card__item">
                            <span>{trainingCopy.challenge.trendLatestLabel}</span>
                            <strong>{trend.latest ? `${trend.latest.wpm} ${copy.common.wpm}` : copy.common.emptyValue}</strong>
                        </div>
                        <div className="replay-summary-card__item">
                            <span>{trainingCopy.challenge.trendSpeedChangeLabel}</span>
                            <strong>{formatSigned(trend.deltaWpm, ` ${copy.common.wpm}`)}</strong>
                        </div>
                        <div className="replay-summary-card__item">
                            <span>{trainingCopy.challenge.trendAccuracyChangeLabel}</span>
                            <strong>{formatSigned(trend.deltaAccuracy, '%')}</strong>
                        </div>
                    </div>
                    <p className="replay-summary-card__note">
                        {note} {trend.attempts ? `${copy.common.accuracy} ${averageAccuracy}%` : ''}
                    </p>
                </aside>
            </div>

            {trend.points.length > 0 && (
                <div className="replay-panel__head">
                    <div className="replay-mode-switch" role="tablist" aria-label={trainingCopy.challenge.trendFocusTitle}>
                        {trend.points.map((point, index) => (
                            <button
                                key={point.id}
                                type="button"
                                className={`replay-mode-btn ${index === activeIndex ? 'is-active' : ''}`}
                                onClick={() => setActiveIndex(index)}
                            >
                                {getAttemptLabel(trainingCopy, point, index, trend.points.length)}
                            </button>
                        ))}
                    </div>

                    <aside className="replay-inspect">
                        <div className="replay-inspect__header">
                            <span className="summary-label">{trainingCopy.challenge.trendFocusTitle}</span>
                            <strong>{activePointLabel}</strong>
                            {activeStatuses.length > 0 && (
                                <div className="history-metrics">
                                    {activeStatuses.map((status) => (
                                        <span key={status} className="panel-badge badge-ready">{status}</span>
                                    ))}
                                </div>
                            )}
                            <p className={`replay-inspect__state replay-inspect__state--${activeFocusState}`}>
                                {activeFocusNote}
                            </p>
                        </div>
                        <div className="replay-inspect__grid">
                            <div className="replay-inspect__metric">
                                <span>{copy.common.wpm}</span>
                                <strong>{activePoint ? `${activePoint.wpm}` : copy.common.emptyValue}</strong>
                            </div>
                            <div className="replay-inspect__metric">
                                <span>{copy.common.accuracy}</span>
                                <strong>{activePoint ? `${activePoint.accuracy}%` : copy.common.emptyValue}</strong>
                            </div>
                            <div className="replay-inspect__metric">
                                <span>{trainingCopy.challenge.trendPrevDeltaLabel}</span>
                                <strong>{activePoint ? formatSigned(activePoint.deltaWpm, ` ${copy.common.wpm}`) : copy.common.emptyValue}</strong>
                            </div>
                            <div className="replay-inspect__metric">
                                <span>{trainingCopy.challenge.trendAccuracyChangeLabel}</span>
                                <strong>{activePoint ? formatSigned(activePoint.deltaAccuracy, '%') : copy.common.emptyValue}</strong>
                            </div>
                        </div>
                    </aside>
                </div>
            )}

            <div className="chart-canvas replay-canvas replay-canvas--merged">
                <svg viewBox={`0 0 ${width} ${height}`} className="result-chart replay-chart replay-chart--merged" aria-label={trainingCopy.challenge.trendTitle}>
                    <defs>
                        <linearGradient id="challengeTrendAreaGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#69c9ff" stopOpacity="0.24" />
                            <stop offset="100%" stopColor="#69c9ff" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <rect x={frame.left} y={frame.top} width={frame.width} height={frame.height} rx="22" className="chart-plot-bg" />

                    {yTicks.map((tick) => {
                        const y = frame.bottom - ((tick / Math.max(speedMax, 1)) * frame.height);
                        return (
                            <g key={`speed-${tick}`}>
                                <line x1={frame.left} x2={frame.left + frame.width} y1={y} y2={y} className="replay-grid-line" />
                                <text x={frame.left - 12} y={y + 4} textAnchor="end" className="replay-axis-label">
                                    {tick}
                                </text>
                            </g>
                        );
                    })}

                    <text x={frame.left + frame.width + 12} y={frame.top + 4} textAnchor="start" className="replay-axis-label replay-axis-label--accuracy">
                        100
                    </text>
                    <text x={frame.left + frame.width + 12} y={frame.bottom + 4} textAnchor="start" className="replay-axis-label replay-axis-label--accuracy">
                        0
                    </text>

                    {trend.points.map((point, index) => {
                        const x = frame.left + (index * (frame.width / Math.max(trend.points.length - 1, 1)));
                        return (
                            <text
                                key={point.id}
                                x={clamp(x, frame.left + 8, frame.left + frame.width - 8)}
                                y={height - 24}
                                textAnchor="middle"
                                className="replay-axis-label replay-axis-label--x"
                            >
                                #{point.attempt}
                            </text>
                        );
                    })}

                    {wpmPoints.length > 1 && (
                        <path d={buildAreaPath(wpmPoints, frame.bottom)} style={{ fill: 'url(#challengeTrendAreaGradient)' }} />
                    )}

                    {wpmPoints.length > 1 && (
                        <path d={buildLinePath(wpmPoints)} className="replay-main-line" />
                    )}
                    {accuracyPoints.length > 1 && (
                        <path d={buildLinePath(accuracyPoints)} className="replay-accuracy-line" />
                    )}

                    {wpmPoints.map((point, index) => (
                        <g key={`point-${trend.points[index].id}`}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r={index === activeIndex ? 5.8 : index === trend.bestIndex ? 5 : 4}
                                className="replay-focus-point"
                            />
                            <circle
                                cx={accuracyPoints[index].x}
                                cy={accuracyPoints[index].y}
                                r={index === activeIndex ? 4.2 : 3.6}
                                className="replay-focus-point replay-focus-point--accuracy"
                            />
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}
