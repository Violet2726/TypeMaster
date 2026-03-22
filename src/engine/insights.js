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

export function buildInsights(sessions) {
    const safeSessions = Array.isArray(sessions) ? sessions : [];
    const recent7 = clampSessions(safeSessions, 7);
    const recent30 = clampSessions(safeSessions, 30);

    const charCounter = buildCounter(
        recent30.flatMap((session) => session.result?.topErrorChars || [])
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
        daily7: buildDailySeries(recent30, 7),
        daily30: buildDailySeries(recent30, 30)
    };
}

