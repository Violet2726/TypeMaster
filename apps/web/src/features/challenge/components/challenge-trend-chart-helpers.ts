export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function getNiceMax(value) {
    if (value <= 10) return 10;

    const magnitude = 10 ** Math.floor(Math.log10(value));
    const normalized = value / magnitude;

    if (normalized <= 1.5) return 1.5 * magnitude;
    if (normalized <= 2) return 2 * magnitude;
    if (normalized <= 3) return 3 * magnitude;
    if (normalized <= 5) return 5 * magnitude;
    return 10 * magnitude;
}

export function buildPoints(points, metric, frame, maxValue) {
    return points.map((point, index) => ({
        index,
        value: point[metric],
        x: frame.left + (index * (frame.width / Math.max(points.length - 1, 1))),
        y: frame.bottom - ((point[metric] / Math.max(maxValue, 1)) * frame.height)
    }));
}

export function buildLinePath(points) {
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

export function buildAreaPath(points, baselineY) {
    if (!points.length) return '';

    const linePath = buildLinePath(points);
    const first = points[0];
    const last = points[points.length - 1];

    return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
}

export function buildTicks(maxValue, count = 4) {
    return Array.from({ length: count }, (_, index) => {
        const ratio = index / Math.max(count - 1, 1);
        return Math.round(maxValue - (maxValue * ratio));
    });
}

export function formatSigned(value, suffix = '') {
    const safe = Number(value || 0);
    const sign = safe > 0 ? '+' : '';
    return `${sign}${safe}${suffix}`;
}

export function fillTemplate(template, value) {
    return String(template || '').replace('{value}', value);
}
