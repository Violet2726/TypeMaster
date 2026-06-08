function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function getNiceMax(value) {
    if (value <= 10) return 10;

    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;

    if (normalized <= 1.5) return 1.5 * magnitude;
    if (normalized <= 2) return 2 * magnitude;
    if (normalized <= 3) return 3 * magnitude;
    if (normalized <= 5) return 5 * magnitude;
    return 10 * magnitude;
}

function buildPoints(points, metric, frame, maxValue) {
    return points.map((point, index) => ({
        index,
        value: point[metric],
        x: frame.left + (index * (frame.width / Math.max(points.length - 1, 1))),
        y: frame.bottom - ((point[metric] / Math.max(maxValue, 1)) * frame.height)
    }));
}

function buildLinePath(points) {
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function buildAreaPath(points, baselineY) {
    if (!points.length) return '';

    const linePath = buildLinePath(points);
    const first = points[0];
    const last = points[points.length - 1];

    return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

function buildTicks(maxValue, count = 4) {
    return Array.from({ length: count }, (_, index) => {
        const ratio = index / Math.max(count - 1, 1);
        return Math.round(maxValue - (maxValue * ratio));
    });
}

function formatSigned(value, suffix = '') {
    const safe = Number(value || 0);
    const sign = safe > 0 ? '+' : '';
    return `${sign}${safe}${suffix}`;
}

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
    const bestAttemptIndex = trend.best
        ? trend.points.findIndex((point) => point.id === trend.best.id)
        : -1;

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
                                r={index === bestAttemptIndex ? 5.5 : 4}
                                className="replay-focus-point"
                            />
                            <circle
                                cx={accuracyPoints[index].x}
                                cy={accuracyPoints[index].y}
                                r={3.6}
                                className="replay-focus-point replay-focus-point--accuracy"
                            />
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}
import { getChallengeTrendState } from '../engine';
