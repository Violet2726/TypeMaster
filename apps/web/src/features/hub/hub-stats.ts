import type { LocalRun } from '../../lib/storage';

/**
 * Pure derivations for the hub. Keeping them out of the component makes the home hierarchy
 * testable, which matters because every number here is a claim shown to the player.
 */

const RECENT_WINDOW = 10;

function localDayKey(iso: string) {
    const date = new Date(iso);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
}

/** Keys the player keeps missing, most frequent first. */
export function aggregateWeakKeys(runs: LocalRun[], limit = 3): string[] {
    const counts = new Map<string, number>();
    for (const run of runs.slice(0, RECENT_WINDOW)) {
        for (const key of run.result.weakChars) counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([key]) => key);
}

export function metricAverage(runs: LocalRun[], metric: 'accuracy' | 'wpm'): number | null {
    if (!runs.length) return null;
    const total = runs.reduce((sum, run) => sum + run.result[metric], 0);
    return Math.round((total / runs.length) * 10) / 10;
}

/** Change between the recent window and the window before it. Null until both exist. */
export function metricDelta(runs: LocalRun[], metric: 'accuracy' | 'wpm'): number | null {
    const recent = runs.slice(0, RECENT_WINDOW);
    const previous = runs.slice(RECENT_WINDOW, RECENT_WINDOW * 2);
    const current = metricAverage(recent, metric);
    const before = metricAverage(previous, metric);
    if (current === null || before === null) return null;
    return Math.round((current - before) * 10) / 10;
}

/** Consecutive days with at least one run, counting back from today or yesterday. */
export function activeStreak(runs: LocalRun[], now: Date): number {
    if (!runs.length) return 0;
    const days = new Set(runs.map((run) => localDayKey(run.completedAt)));
    const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (!days.has(localDayKey(cursor.toISOString()))) cursor.setDate(cursor.getDate() - 1);
    let streak = 0;
    while (days.has(localDayKey(cursor.toISOString()))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

/** One meaningful line for the third layer of the home page. */
export function weeklyInsight(runs: LocalRun[], t: (key: string) => string): string {
    const week = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const thisWeek = runs.filter((run) => now - new Date(run.completedAt).getTime() <= week);
    const lastWeek = runs.filter((run) => {
        const age = now - new Date(run.completedAt).getTime();
        return age > week && age <= week * 2;
    });
    const current = metricAverage(thisWeek, 'accuracy');
    const before = metricAverage(lastWeek, 'accuracy');
    if (current !== null && before !== null) {
        const delta = Math.round((current - before) * 10) / 10;
        if (delta > 0.5) return t('hub.insightImproved').replace('{delta}', String(delta));
        if (delta < -0.5) return t('hub.insightDeclined').replace('{delta}', String(Math.abs(delta)));
        return t('hub.insightSteady');
    }
    const weak = aggregateWeakKeys(runs);
    if (weak.length) return t('hub.insightWeak').replace('{keys}', weak.join(' · '));
    return t('hub.insightStart');
}
