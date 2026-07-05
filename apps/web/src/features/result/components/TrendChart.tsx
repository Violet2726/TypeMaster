import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDurationLabel } from '../../../i18n';
import {
    average,
    buildAreaPath,
    buildLinePath,
    buildPoints,
    buildTicks,
    buildXTicks,
    clamp,
    getErrorDelta,
    getNearestIndex,
    getNiceMax,
    normalizeReplay
} from './trend-chart-helpers';

export function TrendChart({ copy, language = 'zh-CN', timeline }) {
    const svgRef = useRef(null);
    const interactionRef = useRef({
        dragging: false,
        pointerType: 'mouse'
    });
    const width = 860;
    const height = 340;
    const frame = {
        left: 44,
        right: 24,
        top: 26,
        bottom: 234,
        width: 860 - 44 - 24,
        height: 234 - 26
    };
    const rail = {
        centerY: 280,
        labelY: 322
    };

    const { samples, pauseMoments } = useMemo(() => normalizeReplay(timeline), [timeline]);
    const [visibleSeries, setVisibleSeries] = useState({
        wpm: true,
        raw: true,
        accuracy: true,
        burst: true
    });
    const [activeIndex, setActiveIndex] = useState(null);

    useEffect(() => {
        const hasAccuracy = samples.some((sample) => sample.accuracy != null);
        if (!hasAccuracy) {
            setVisibleSeries((previous) => ({
                ...previous,
                accuracy: false
            }));
        }
    }, [samples]);

    if (!samples.length) {
        return (
            <div className="panel chart-empty">
                <p>{copy.result.trendEmpty}</p>
            </div>
        );
    }

    const hasAccuracy = samples.some((sample) => sample.accuracy != null);
    const speedMax = getNiceMax(Math.max(
        10,
        ...samples.map((sample) => Math.max(sample.wpm, sample.raw, sample.burst))
    ));
    const accuracyMax = 100;
    const wpmPoints = buildPoints(samples, 'wpm', frame, speedMax);
    const rawPoints = buildPoints(samples, 'raw', frame, speedMax);
    const burstPoints = buildPoints(samples, 'burst', frame, speedMax);
    const accuracyPoints = hasAccuracy ? buildPoints(samples, 'accuracy', frame, accuracyMax) : [];
    const yTicks = buildTicks(speedMax);
    const xTicks = buildXTicks(samples);
    const activeSample = activeIndex == null ? null : samples[activeIndex];
    const activeX = activeIndex == null
        ? null
        : wpmPoints[activeIndex]?.x ?? rawPoints[activeIndex]?.x ?? burstPoints[activeIndex]?.x ?? null;
    const activeY = activeIndex == null
        ? null
        : Math.min(
            wpmPoints[activeIndex]?.y ?? frame.bottom,
            rawPoints[activeIndex]?.y ?? frame.bottom,
            accuracyPoints[activeIndex]?.y ?? frame.bottom,
            burstPoints[activeIndex]?.y ?? frame.bottom
        );
    const tooltipLeft = activeX == null ? 0 : clamp((activeX / width) * 100, 10, 90);
    const tooltipTop = activeY == null ? 0 : clamp(((activeY - 28) / height) * 100, 8, 66);
    const averageWpm = average(samples.map((sample) => sample.wpm));
    const averageRaw = average(samples.map((sample) => sample.raw));
    const averageAccuracy = average(samples.map((sample) => sample.accuracy).filter((value) => value != null));
    const peakBurst = Math.max(...samples.map((sample) => sample.burst), 0);
    const totalErrorSpikes = samples.reduce((sum, _sample, index) => sum + (getErrorDelta(samples, index) > 0 ? 1 : 0), 0);
    const pauseSet = new Set(pauseMoments);

    const inspectAt = (clientX) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        setActiveIndex(getNearestIndex(clientX, rect, frame, width, samples.length));
    };

    const handlePointerDown = (event) => {
        interactionRef.current = {
            dragging: true,
            pointerType: event.pointerType || 'mouse'
        };
        event.currentTarget.setPointerCapture?.(event.pointerId);
        inspectAt(event.clientX);
    };

    const handlePointerMove = (event) => {
        if (event.pointerType === 'mouse' || interactionRef.current.dragging) {
            inspectAt(event.clientX);
        }
    };

    const handlePointerEnter = (event) => {
        if (event.pointerType === 'mouse') {
            inspectAt(event.clientX);
        }
    };

    const clearInspection = () => {
        interactionRef.current.dragging = false;
        setActiveIndex(null);
    };

    const handlePointerUp = (event) => {
        event.currentTarget.releasePointerCapture?.(event.pointerId);
        const pointerType = interactionRef.current.pointerType;
        interactionRef.current.dragging = false;
        if (pointerType !== 'mouse') {
            setActiveIndex(null);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            setActiveIndex((previous) => {
                const next = previous == null ? samples.length - 1 : previous - 1;
                return clamp(next, 0, samples.length - 1);
            });
        } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            setActiveIndex((previous) => {
                const next = previous == null ? samples.length - 1 : previous + 1;
                return clamp(next, 0, samples.length - 1);
            });
        } else if (event.key === 'Home') {
            event.preventDefault();
            setActiveIndex(0);
        } else if (event.key === 'End') {
            event.preventDefault();
            setActiveIndex(samples.length - 1);
        }
    };

    const toggleSeries = (key) => {
        setVisibleSeries((previous) => {
            const nextValue = !previous[key];
            const currentlyVisible = Object.values(previous).filter(Boolean).length;
            if (!nextValue && currentlyVisible === 1) {
                return previous;
            }

            return {
                ...previous,
                [key]: nextValue
            };
        });
    };

    const legendItems = [
        { key: 'wpm', label: copy.common.wpm, swatchClass: 'swatch-main' },
        { key: 'raw', label: copy.chart.rawLabel, swatchClass: 'swatch-raw' },
        { key: 'accuracy', label: copy.common.accuracy, swatchClass: 'swatch-accuracy', disabled: !hasAccuracy },
        { key: 'burst', label: copy.chart.burstLabel, swatchClass: 'swatch-burst' }
    ];

    return (
        <section className="panel chart-panel replay-panel replay-panel--merged">
            <div className="replay-header">
                <div className="replay-header__left">
                    <p className="panel-kicker">{copy.chart.kicker}</p>
                    <h2>{copy.chart.title}</h2>
                    <div className="replay-legend" role="toolbar" aria-label={copy.chart.title}>
                        {legendItems.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                className={`replay-legend__chip replay-legend__chip--${item.key} ${visibleSeries[item.key] ? 'is-active' : 'is-muted'}`}
                                onClick={() => toggleSeries(item.key)}
                                disabled={item.disabled}
                                aria-pressed={visibleSeries[item.key]}
                            >
                                <i className={`swatch ${item.swatchClass}`} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <aside className="replay-summary-card">
                    <span className="summary-label">{copy.chart.summaryTitle}</span>
                    <div className="replay-summary-card__grid">
                        <div className="replay-summary-card__item">
                            <span>{copy.chart.avgWpm}</span>
                            <strong>{averageWpm}</strong>
                        </div>
                        <div className="replay-summary-card__item">
                            <span>{copy.chart.avgRaw}</span>
                            <strong>{averageRaw}</strong>
                        </div>
                        <div className="replay-summary-card__item">
                            <span>{copy.chart.avgAccuracy}</span>
                            <strong>{hasAccuracy ? `${averageAccuracy}%` : copy.common.emptyValue}</strong>
                        </div>
                        <div className="replay-summary-card__item">
                            <span>{copy.chart.peakBurst}</span>
                            <strong>{peakBurst}</strong>
                        </div>
                    </div>
                    <p className="replay-summary-card__note">
                        {copy.chart.dataNote.replace('{samples}', String(samples.length)).replace('{errors}', String(totalErrorSpikes))}
                    </p>
                </aside>
            </div>

            <div className="chart-canvas replay-canvas replay-canvas--merged">
                {activeSample && (
                    <div className="replay-floating-inspect" style={{ left: `${tooltipLeft}%`, top: `${tooltipTop}%` }}>
                        <strong>{formatDurationLabel(activeSample.time, language)}</strong>
                        <span>{copy.common.wpm} {activeSample.wpm}</span>
                        <span>{copy.chart.rawLabel} {activeSample.raw}</span>
                        <span>{copy.chart.burstLabel} {activeSample.burst}</span>
                        <span>{copy.common.accuracy} {activeSample.accuracy == null ? copy.common.emptyValue : `${activeSample.accuracy}%`}</span>
                    </div>
                )}

                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${width} ${height}`}
                    className="result-chart replay-chart replay-chart--merged"
                    aria-label={copy.chart.title}
                >
                    <defs>
                        <linearGradient id="mergedReplayAreaGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#69c9ff" stopOpacity="0.24" />
                            <stop offset="100%" stopColor="#69c9ff" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    <rect
                        x={frame.left}
                        y={frame.top}
                        width={frame.width}
                        height={frame.height}
                        rx="22"
                        className="chart-plot-bg"
                    />

                    {yTicks.map((tick) => {
                        const y = frame.bottom - ((tick / Math.max(speedMax, 1)) * frame.height);
                        return (
                            <g key={`ytick-${tick}`}>
                                <line x1={frame.left} x2={frame.left + frame.width} y1={y} y2={y} className="replay-grid-line" />
                                <text x={frame.left - 12} y={y + 4} textAnchor="end" className="replay-axis-label">
                                    {tick}
                                </text>
                            </g>
                        );
                    })}

                    {visibleSeries.accuracy && hasAccuracy && (
                        <>
                            <rect
                                x={frame.left}
                                y={frame.top}
                                width={frame.width}
                                height={frame.height * 0.12}
                                className="replay-accuracy-band"
                            />
                            <line
                                x1={frame.left}
                                x2={frame.left + frame.width}
                                y1={frame.bottom - ((95 / 100) * frame.height)}
                                y2={frame.bottom - ((95 / 100) * frame.height)}
                                className="replay-accuracy-threshold"
                            />
                            <text
                                x={frame.left + frame.width + 12}
                                y={frame.bottom - ((95 / 100) * frame.height) + 4}
                                textAnchor="start"
                                className="replay-axis-label replay-axis-label--accuracy"
                            >
                                95
                            </text>
                            <text x={frame.left + frame.width + 12} y={frame.top + 4} textAnchor="start" className="replay-axis-label replay-axis-label--accuracy">
                                100
                            </text>
                            <text x={frame.left + frame.width + 12} y={frame.bottom + 4} textAnchor="start" className="replay-axis-label replay-axis-label--accuracy">
                                0
                            </text>
                        </>
                    )}

                    {xTicks.map((tick) => {
                        const x = frame.left + (tick.index * (frame.width / Math.max(samples.length - 1, 1)));
                        return (
                            <text
                                key={`xtick-${tick.index}`}
                                x={x}
                                y={rail.labelY}
                                textAnchor={tick.index === 0 ? 'start' : tick.index === samples.length - 1 ? 'end' : 'middle'}
                                className="replay-axis-label replay-axis-label--x"
                            >
                                {formatDurationLabel(tick.time, language)}
                            </text>
                        );
                    })}

                    {visibleSeries.wpm && (
                        <path d={buildAreaPath(wpmPoints, frame.bottom)} className="replay-main-area" />
                    )}

                    {visibleSeries.burst && burstPoints.map((point) => (
                        <line
                            key={`burst-${point.index}`}
                            x1={point.x}
                            x2={point.x}
                            y1={frame.bottom}
                            y2={point.y ?? frame.bottom}
                            className="replay-burst-bar"
                        />
                    ))}

                    {visibleSeries.raw && (
                        <path d={buildLinePath(rawPoints)} className="replay-secondary-line" />
                    )}

                    {visibleSeries.accuracy && hasAccuracy && (
                        <path d={buildLinePath(accuracyPoints)} className="replay-accuracy-line" />
                    )}

                    {visibleSeries.wpm && (
                        <path d={buildLinePath(wpmPoints)} className="replay-main-line" />
                    )}

                    {activeIndex != null && activeX != null && (
                        <line
                            x1={activeX}
                            x2={activeX}
                            y1={frame.top}
                            y2={rail.centerY}
                            className="replay-guide-line"
                        />
                    )}

                    {activeIndex != null && visibleSeries.wpm && wpmPoints[activeIndex]?.y != null && (
                        <circle
                            cx={wpmPoints[activeIndex].x}
                            cy={wpmPoints[activeIndex].y}
                            r="5.5"
                            className="replay-focus-point"
                        />
                    )}

                    {activeIndex != null && visibleSeries.raw && rawPoints[activeIndex]?.y != null && (
                        <circle
                            cx={rawPoints[activeIndex].x}
                            cy={rawPoints[activeIndex].y}
                            r="4"
                            className="replay-focus-point replay-focus-point--secondary"
                        />
                    )}

                    {activeIndex != null && visibleSeries.accuracy && hasAccuracy && accuracyPoints[activeIndex]?.y != null && (
                        <circle
                            cx={accuracyPoints[activeIndex].x}
                            cy={accuracyPoints[activeIndex].y}
                            r="4"
                            className="replay-focus-point replay-focus-point--accuracy"
                        />
                    )}

                    <line
                        x1={frame.left}
                        x2={frame.left + frame.width}
                        y1={rail.centerY}
                        y2={rail.centerY}
                        className="replay-rail-line"
                    />

                    {samples.map((sample, index) => {
                        const x = frame.left + (index * (frame.width / Math.max(samples.length - 1, 1)));
                        const secondErrors = getErrorDelta(samples, index);
                        const pausedHere = pauseSet.has(sample.time);
                        return (
                            <g key={`rail-${index}`}>
                                {secondErrors > 0 && (
                                    <line
                                        x1={x}
                                        x2={x}
                                        y1={rail.centerY - 4}
                                        y2={rail.centerY - (8 + Math.min(secondErrors, 4) * 6)}
                                        className="replay-rail-error"
                                    />
                                )}
                                {pausedHere && (
                                    <circle
                                        cx={x}
                                        cy={rail.centerY}
                                        r="5"
                                        className="replay-rail-pause"
                                    />
                                )}
                                <circle
                                    cx={x}
                                    cy={rail.centerY}
                                    r={index === activeIndex ? 4.8 : 2.3}
                                    className={`replay-rail-tick ${index === activeIndex ? 'is-active' : ''}`}
                                />
                            </g>
                        );
                    })}

                    <rect
                        x={frame.left}
                        y={frame.top}
                        width={frame.width}
                        height={rail.centerY - frame.top + 14}
                        rx="22"
                        className="replay-hit-area"
                        tabIndex={0}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerEnter={handlePointerEnter}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={clearInspection}
                        onPointerLeave={() => {
                            if (!interactionRef.current.dragging) {
                                clearInspection();
                            }
                        }}
                        onBlur={clearInspection}
                        onKeyDown={handleKeyDown}
                    />
                </svg>
            </div>
        </section>
    );
}
