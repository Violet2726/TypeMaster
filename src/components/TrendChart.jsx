function buildPoints(values, width, height, padding, maxValue) {
    if (!values.length) return '';

    return values.map((value, index) => {
        const x = padding + (index * ((width - padding * 2) / Math.max(values.length - 1, 1)));
        const y = height - padding - ((value / Math.max(maxValue, 1)) * (height - padding * 2));
        return `${x},${y}`;
    }).join(' ');
}

export function TrendChart({ copy, timeline }) {
    const width = 820;
    const height = 260;
    const padding = 28;
    const values = [...timeline.wpm, ...timeline.raw, ...timeline.burst];
    const maxValue = Math.max(...values, 10);

    if (!timeline.wpm.length) {
        return (
            <div className="panel chart-empty">
                <p>{copy.result.trendEmpty}</p>
            </div>
        );
    }

    const wpmPoints = buildPoints(timeline.wpm, width, height, padding, maxValue);
    const rawPoints = buildPoints(timeline.raw, width, height, padding, maxValue);
    const burstPoints = buildPoints(timeline.burst, width, height, padding, maxValue);

    return (
        <div className="panel chart-panel">
            <div className="panel-head">
                <div>
                    <p className="panel-kicker">{copy.chart.kicker}</p>
                    <h2>{copy.chart.title}</h2>
                </div>
                <div className="chart-legend">
                    <span><i className="swatch swatch-main" />{copy.chart.wpm}</span>
                    <span><i className="swatch swatch-raw" />{copy.chart.raw}</span>
                    <span><i className="swatch swatch-burst" />{copy.chart.burst}</span>
                </div>
            </div>

            <svg viewBox={`0 0 ${width} ${height}`} className="result-chart" aria-label={copy.chart.title}>
                {[0, 1, 2, 3].map((line) => {
                    const y = padding + (line * ((height - padding * 2) / 3));
                    return <line key={y} x1={padding} x2={width - padding} y1={y} y2={y} className="grid-line" />;
                })}
                <polyline points={burstPoints} className="chart-line burst" />
                <polyline points={rawPoints} className="chart-line raw" />
                <polyline points={wpmPoints} className="chart-line wpm" />
            </svg>
        </div>
    );
}

