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
const CLEANUP_KEY = 'typemaster-studio:v1:legacy-cleaned';
const LEGACY_PREFIXES = ['typemaster:', 'typing-raid:', 'typingraid:', 'typerift:', 'pulsefield:'];
const LEGACY_DATABASES = [
    'typemaster',
    'typemaster-db',
    'typing-raid',
    'typing-raid-v7',
    'typingraid',
    'typerift',
    'typerift-v1',
    'typerift-v2',
    'typerift-v6',
    'typerift-v7'
];
const MAX_RUNS = 20;
let cleanupInFlight: Promise<boolean> | null = null;

export function removeLegacyLocalStorage(storage: Pick<Storage, 'length' | 'key' | 'removeItem'>) {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter((key): key is string => key !== null);
    for (const key of keys) {
        const normalized = key.toLowerCase();
        if (LEGACY_PREFIXES.some((prefix) => normalized.startsWith(prefix))) {
            storage.removeItem(key);
        }
    }
}

export function deleteLegacyDatabase(databaseFactory: IDBFactory, name: string, timeoutMs = 1_500): Promise<boolean> {
    return new Promise((resolve) => {
        let settled = false;
        const finish = (removed: boolean) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            resolve(removed);
        };
        const timeout = window.setTimeout(() => finish(false), timeoutMs);
        try {
            const request = databaseFactory.deleteDatabase(name);
            request.onsuccess = () => finish(true);
            request.onerror = () => finish(false);
            request.onblocked = () => finish(false);
        } catch {
            finish(false);
        }
    });
}

async function clearLegacyStorage(): Promise<boolean> {
    let localStorageReady = false;
    try {
        if (localStorage.getItem(CLEANUP_KEY) === 'done') return true;
        removeLegacyLocalStorage(localStorage);
        localStorageReady = true;
    } catch {
        // If browser storage is disabled, no local game data is accessible to migrate.
    }
    try {
        const outcomes = await Promise.all(LEGACY_DATABASES.map((name) => deleteLegacyDatabase(indexedDB, name)));
        if (outcomes.some((removed) => !removed)) return false;
        if (localStorageReady) localStorage.setItem(CLEANUP_KEY, 'done');
        return true;
    } catch {
        return false;
    }
}

export function initializeStorage(): Promise<boolean> {
    if (typeof window === 'undefined') return Promise.resolve(true);
    if (!cleanupInFlight) {
        cleanupInFlight = clearLegacyStorage().finally(() => {
            cleanupInFlight = null;
        });
    }
    return cleanupInFlight;
}

function parseSettings(value: unknown): Settings {
    if (!value || typeof value !== 'object') return DEFAULT_SETTINGS;
    const candidate = value as Partial<Settings>;
    const scale = [1, 1.25, 1.5, 1.75, 2].includes(candidate.textScale ?? 1) ? (candidate.textScale ?? 1) : 1;
    return {
        locale: candidate.locale === 'en-US' ? 'en-US' : 'zh-CN',
        durationMs: candidate.durationMs === 30_000 || candidate.durationMs === 120_000 ? candidate.durationMs : 60_000,
        reduceMotion: typeof candidate.reduceMotion === 'boolean' ? candidate.reduceMotion : false,
        enhancedContrast: typeof candidate.enhancedContrast === 'boolean' ? candidate.enhancedContrast : false,
        textScale: scale
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
        // Storage can be disabled by the browser; the current session remains playable.
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
        // Keep the result visible even when persistence is unavailable.
    }
    return run;
}
