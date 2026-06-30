function clampSessions(sessions, limit) {
    return Array.isArray(sessions) ? sessions.slice(0, limit) : [];
}

function average(values) {
    if (!values.length) return 0;
    return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function getSessionDate(session) {
    return new Date(session?.result?.completedAt || session?.sourceTextMeta?.createdAt || Date.now());
}

function buildCounter(items) {
    const counts = new Map();
    items.forEach((item) => {
        if (!item) return;
        counts.set(item, (counts.get(item) || 0) + 1);
    });
    return counts;
}

const KEYBOARD_ZONE_ORDER = [
    'leftTop',
    'leftHome',
    'leftBottom',
    'rightTop',
    'rightHome',
    'rightBottom',
    'numberRow',
    'symbolLayer',
    'other'
];

const KEYBOARD_LAYOUT_ZONE_CHARS = {
    qwerty: {
        leftTop: 'qwert',
        leftHome: 'asdfg',
        leftBottom: 'zxcvb',
        rightTop: 'yuiop',
        rightHome: 'hjkl',
        rightBottom: 'nm'
    },
    colemak: {
        leftTop: 'qwfpb',
        leftHome: 'arstg',
        leftBottom: 'zxcvd',
        rightTop: 'jluy',
        rightHome: 'hneio',
        rightBottom: 'km'
    },
    dvorak: {
        leftTop: 'py',
        leftHome: 'aoeui',
        leftBottom: 'qjkx',
        rightTop: 'fgcrl',
        rightHome: 'dhtns',
        rightBottom: 'bmwvz'
    }
};

const SYMBOL_CHARS = new Set(['`', '~', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '=', '+', '[', ']', '{', '}', '\\', '|', ';', ':', "'", '"', ',', '<', '.', '>', '/', '?']);

function normalizeKeyboardLayout(layout) {
    const normalized = String(layout || 'qwerty').toLowerCase();
    return KEYBOARD_LAYOUT_ZONE_CHARS[normalized] ? normalized : 'qwerty';
}

function createZoneLookup(layout) {
    const zones = KEYBOARD_LAYOUT_ZONE_CHARS[normalizeKeyboardLayout(layout)];
    const lookup = new Map();

    Object.entries(zones).forEach(([zone, chars]) => {
        chars.split('').forEach((char) => {
            lookup.set(char, zone);
        });
    });

    return lookup;
}

function resolveKeyboardZone(char, lookup) {
    const value = String(char || '').trim().toLowerCase();
    const firstChar = value[0] || '';

    if (!firstChar) {
        return null;
    }

    if (/\d/.test(firstChar)) {
        return 'numberRow';
    }

    if (SYMBOL_CHARS.has(firstChar)) {
        return 'symbolLayer';
    }

    return lookup.get(firstChar) || 'other';
}

function sortZoneCounts(left, right) {
    if (right.count !== left.count) {
        return right.count - left.count;
    }

    return KEYBOARD_ZONE_ORDER.indexOf(left.id) - KEYBOARD_ZONE_ORDER.indexOf(right.id);
}

function buildKeyboardHotspotsFromCounter(counter, options = {}) {
    const lookup = createZoneLookup(options.keyboardLayout);
    const zoneMap = new Map();

    [...counter.entries()].forEach(([char, count]) => {
        const zone = resolveKeyboardZone(char, lookup);
        if (!zone) return;

        const existing = zoneMap.get(zone) || {
            id: zone,
            count: 0,
            chars: new Map()
        };

        const safeCount = Math.max(0, Number(count || 0));
        existing.count += safeCount;
        existing.chars.set(char, (existing.chars.get(char) || 0) + safeCount);
        zoneMap.set(zone, existing);
    });

    const total = [...zoneMap.values()].reduce((sum, item) => sum + item.count, 0);
    const zones = [...zoneMap.values()]
        .map((zone) => ({
            id: zone.id,
            count: zone.count,
            share: total ? Math.round((zone.count / total) * 100) : 0,
            chars: topCounts(zone.chars, 4)
        }))
        .sort(sortZoneCounts);

    return {
        layout: normalizeKeyboardLayout(options.keyboardLayout),
        total,
        primaryZone: zones[0] || null,
        zones
    };
}

export function buildKeyboardHotspots(chars, options = {}) {
    const safeChars = Array.isArray(chars) ? chars : [];
    const counter = buildCounter(safeChars);

    return buildKeyboardHotspotsFromCounter(counter, options);
}

export function buildKeyboardHotspotsFromStats(charStats, options = {}) {
    const counter = new Map();

    (Array.isArray(charStats) ? charStats : []).forEach((item) => {
        const label = String(item?.label || '').trim();
        const count = Math.max(0, Number(item?.count || 0));
        if (!label || count <= 0) {
            return;
        }

        counter.set(label, (counter.get(label) || 0) + count);
    });

    return buildKeyboardHotspotsFromCounter(counter, options);
}

function topCounts(counts, limit = 5) {
    return [...counts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, limit)
        .map(([label, count]) => ({ label, count }));
}

function summarizeSlice(sessions) {
    const slice = Array.isArray(sessions) ? sessions : [];
    const aiCount = slice.filter((session) => session.config?.source === 'ai').length;

    return {
        count: slice.length,
        avgWpm: average(slice.map((session) => session.result?.wpm || 0)),
        avgAccuracy: average(slice.map((session) => session.result?.accuracy || 0)),
        bestWpm: slice.length ? Math.max(...slice.map((session) => session.result?.wpm || 0)) : 0,
        aiShare: slice.length ? Math.round((aiCount / slice.length) * 100) : 0
    };
}

function resolveSessionSurface(session) {
    const explicit = session?.trainingMeta?.surface;
    if (explicit) return explicit;

    const type = session?.trainingMeta?.type;
    if (type === 'raid') return 'raid';
    if (type === 'challenge') return 'challenge';
    if (type === 'plan') return 'plan';
    if (type === 'diagnostic') return 'diagnostic';

    return 'practice';
}

function buildSurfaceBreakdown(sessions) {
    const counts = {
        practice: 0,
        diagnostic: 0,
        plan: 0,
        challenge: 0,
        raid: 0
    };

    sessions.forEach((session) => {
        const surface = resolveSessionSurface(session);
        if (Object.prototype.hasOwnProperty.call(counts, surface)) {
            counts[surface] += 1;
        }
    });

    return {
        counts,
        dominant: Object.entries(counts)
            .sort((left, right) => right[1] - left[1])
            .find(([, count]) => count > 0)?.[0] || 'practice'
    };
}

function buildRaidSummary(sessions) {
    const raidSessions = sessions.filter((session) => resolveSessionSurface(session) === 'raid');

    if (!raidSessions.length) {
        return {
            count: 0,
            bestScore: 0,
            maxCombo: 0,
            highestThreatLevel: 0,
            longestDurationSeconds: 0,
            extractionRate: 0,
            perfectWaves: 0,
            focusChars: []
        };
    }

    const focusChars = topCounts(buildCounter(
        raidSessions.flatMap((session) => session?.trainingMeta?.focusChars || session?.result?.topErrorChars || [])
    ), 5).map((item) => item.label);

    const extractCount = raidSessions.filter((session) => session?.trainingMeta?.endReason === 'extract').length;

    return {
        count: raidSessions.length,
        bestScore: Math.max(...raidSessions.map((session) => session?.trainingMeta?.score || session?.result?.score || 0)),
        maxCombo: Math.max(...raidSessions.map((session) => session?.trainingMeta?.maxCombo || 0)),
        highestThreatLevel: Math.max(...raidSessions.map((session) => session?.trainingMeta?.riftLayer || session?.trainingMeta?.threatLevel || session?.trainingMeta?.wave || 0)),
        longestDurationSeconds: Math.max(...raidSessions.map((session) => session?.trainingMeta?.durationSeconds || session?.result?.durationSeconds || 0)),
        extractionRate: Math.round((extractCount / raidSessions.length) * 100),
        perfectWaves: raidSessions.reduce((sum, session) => sum + Number(session?.trainingMeta?.perfectWaves || 0), 0),
        focusChars
    };
}

function buildDailySeries(sessions, days = 7) {
    const now = new Date();
    const slots = Array.from({ length: days }, (_, index) => {
        const date = new Date(now);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - (days - index - 1));
        const key = date.toISOString().slice(0, 10);
        return {
            key,
            date,
            count: 0,
            avgWpm: 0,
            avgAccuracy: 0
        };
    });

    const grouped = new Map(slots.map((slot) => [slot.key, []]));
    sessions.forEach((session) => {
        const key = getSessionDate(session).toISOString().slice(0, 10);
        if (grouped.has(key)) {
            grouped.get(key).push(session);
        }
    });

    return slots.map((slot) => {
        const bucket = grouped.get(slot.key) || [];
        return {
            ...slot,
            count: bucket.length,
            avgWpm: average(bucket.map((session) => session.result?.wpm || 0)),
            avgAccuracy: average(bucket.map((session) => session.result?.accuracy || 0))
        };
    });
}

export function buildInsights(sessions, options = {}) {
    const safeSessions = Array.isArray(sessions) ? sessions : [];
    const recent7 = clampSessions(safeSessions, 7);
    const recent30 = clampSessions(safeSessions, 30);
    const recent30ErrorChars = recent30.flatMap((session) => session.result?.topErrorChars || []);

    const charCounter = buildCounter(
        recent30ErrorChars
    );
    const wordCounter = buildCounter(
        recent30.flatMap((session) => session.result?.topErrorWords || [])
    );

    return {
        totalSessions: safeSessions.length,
        latestSession: safeSessions[0] || null,
        recent7: summarizeSlice(recent7),
        recent30: summarizeSlice(recent30),
        bestWpmOverall: safeSessions.length ? Math.max(...safeSessions.map((session) => session.result?.wpm || 0)) : 0,
        avgAccuracyOverall: average(safeSessions.map((session) => session.result?.accuracy || 0)),
        aiShareOverall: safeSessions.length
            ? Math.round((safeSessions.filter((session) => session.config?.source === 'ai').length / safeSessions.length) * 100)
            : 0,
        topErrorChars: topCounts(charCounter),
        topErrorWords: topCounts(wordCounter),
        keyboardHotspots: buildKeyboardHotspots(recent30ErrorChars, {
            keyboardLayout: options.keyboardLayout
        }),
        surfaceBreakdown: buildSurfaceBreakdown(recent30),
        raidSummary: buildRaidSummary(recent30),
        daily7: buildDailySeries(recent30, 7),
        daily30: buildDailySeries(recent30, 30)
    };
}
