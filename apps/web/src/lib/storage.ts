import type { RunResult } from '@typemaster/domain';

export type Settings = {
    locale: 'zh-CN' | 'en-US';
    durationMs: 30_000 | 60_000 | 120_000;
    reduceMotion: boolean;
    enhancedContrast: boolean;
    textScale: number;
};

export type StoredRun = {
    id: string;
    completedAt: string;
    result: RunResult;
};

export const DEFAULT_SETTINGS: Settings = {
    locale: 'zh-CN',
    durationMs: 60_000,
    reduceMotion: false,
    enhancedContrast: false,
    textScale: 1
};

const SETTINGS_KEY = 'typemaster-studio:v1:settings';
const RUNS_KEY = 'typemaster-studio:v1:sessions';
const MAX_RUNS = 20;

function parseSettings(value: unknown): Settings {
    if (!value || typeof value !== 'object') return DEFAULT_SETTINGS;
    const candidate = value as Partial<Settings>;
    const textScale = [1, 1.25, 1.5, 1.75, 2].includes(candidate.textScale ?? 1) ? (candidate.textScale ?? 1) : 1;
    return {
        locale: candidate.locale === 'en-US' ? 'en-US' : 'zh-CN',
        durationMs: candidate.durationMs === 30_000 || candidate.durationMs === 120_000 ? candidate.durationMs : 60_000,
        reduceMotion: typeof candidate.reduceMotion === 'boolean' ? candidate.reduceMotion : false,
        enhancedContrast: typeof candidate.enhancedContrast === 'boolean' ? candidate.enhancedContrast : false,
        textScale
    };
}

export function loadSettings(): Settings {
    try {
        return parseSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null'));
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(settings: Settings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(parseSettings(settings)));
    } catch {
        // The current session remains usable when browser storage is unavailable.
    }
}

function isStoredRun(value: unknown): value is StoredRun {
    if (!value || typeof value !== 'object') return false;
    const run = value as Partial<StoredRun>;
    return (
        typeof run.id === 'string' &&
        typeof run.completedAt === 'string' &&
        Boolean(run.result && typeof run.result === 'object' && typeof run.result.wpm === 'number' && typeof run.result.accuracy === 'number')
    );
}

export function loadRuns(): StoredRun[] {
    try {
        const parsed: unknown = JSON.parse(localStorage.getItem(RUNS_KEY) ?? '[]');
        return Array.isArray(parsed) ? parsed.filter(isStoredRun).slice(0, MAX_RUNS) : [];
    } catch {
        return [];
    }
}

export function saveRun(result: RunResult): StoredRun {
    const run: StoredRun = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        completedAt: new Date().toISOString(),
        result
    };
    try {
        localStorage.setItem(RUNS_KEY, JSON.stringify([run, ...loadRuns()].slice(0, MAX_RUNS)));
    } catch {
        // Keep the completed result available to the current session.
    }
    return run;
}
