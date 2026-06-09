export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function toNumber(value, fallback = 0) {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
}

export function average(values) {
    if (!values.length) return 0;
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
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

export function normalizeReplay(timeline) {
    const labels = Array.isArray(timeline?.labels) ? timeline.labels : [];
    const wpm = Array.isArray(timeline?.wpm) ? timeline.wpm : [];
    const raw = Array.isArray(timeline?.raw) ? timeline.raw : [];
    const burst = Array.isArray(timeline?.burst) ? timeline.burst : [];
    const accuracy = Array.isArray(timeline?.accuracy) ? timeline.accuracy : [];
    const errors = Array.isArray(timeline?.errors) ? timeline.errors : [];
    const samples = Array.isArray(timeline?.samples) && timeline.samples.length
        ? timeline.samples.map((sample, index) => ({
            index,
            time: toNumber(sample?.time, index),
            wpm: toNumber(sample?.wpm),
            raw: toNumber(sample?.raw),
            burst: toNumber(sample?.burst),
            accuracy: sample?.accuracy == null ? null : toNumber(sample.accuracy),
            errors: toNumber(sample?.errors)
        }))
        : Array.from({ length: Math.min(labels.length, wpm.length, raw.length, burst.length) }, (_, index) => ({
            index,
            time: toNumber(labels[index], index),
            wpm: toNumber(wpm[index]),
            raw: toNumber(raw[index]),
            burst: toNumber(burst[index]),
            accuracy: accuracy[index] == null ? null : toNumber(accuracy[index]),
            errors: toNumber(errors[index])
        }));

    const pauseMoments = [...new Set((Array.isArray(timeline?.pauseMoments) ? timeline.pauseMoments : [])
        .map((value) => toNumber(value))
        .filter((value) => value >= 0))];

    return {
        pauseMoments,
        samples
    };
}

export function buildPoints(samples, metric, frame, maxValue) {
    return samples.map((sample, index) => ({
        index,
        value: sample[metric],
        x: frame.left + (index * (frame.width / Math.max(samples.length - 1, 1))),
        y: sample[metric] == null
            ? null
            : frame.bottom - ((sample[metric] / Math.max(maxValue, 1)) * frame.height)
    }));
}

export function buildLinePath(points) {
    let path = '';
    let segmentOpen = false;

    points.forEach((point) => {
        if (point.y == null) {
            segmentOpen = false;
            return;
        }

        path += `${segmentOpen ? ' L' : ' M'} ${point.x} ${point.y}`;
        segmentOpen = true;
    });

    return path.trim();
}

export function buildAreaPath(points, baselineY) {
    const validPoints = points.filter((point) => point.y != null);
    if (!validPoints.length) return '';

    const linePath = buildLinePath(validPoints);
    const firstPoint = validPoints[0];
    const lastPoint = validPoints[validPoints.length - 1];

    return `${linePath} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;
}

export function buildTicks(maxValue, count = 4) {
    return Array.from({ length: count }, (_, index) => {
        const ratio = index / Math.max(count - 1, 1);
        return Math.round(maxValue - (maxValue * ratio));
    });
}

export function buildXTicks(samples) {
    const lastIndex = Math.max(samples.length - 1, 0);
    const anchors = [0, Math.floor(lastIndex / 2), lastIndex];

    return [...new Set(anchors)]
        .filter((index) => samples[index])
        .map((index) => ({
            index,
            time: samples[index].time
        }));
}

export function getNearestIndex(clientX, rect, frame, width, length) {
    const plotLeft = rect.left + ((frame.left / width) * rect.width);
    const plotWidth = rect.width * (frame.width / width);
    const relative = clamp(clientX - plotLeft, 0, plotWidth);
    const ratio = plotWidth === 0 ? 0 : relative / plotWidth;
    return clamp(Math.round(ratio * Math.max(length - 1, 0)), 0, Math.max(length - 1, 0));
}

export function getErrorDelta(samples, index) {
    if (!samples[index]) return 0;
    if (index === 0) return samples[index].errors;
    return Math.max(0, samples[index].errors - samples[index - 1].errors);
}
