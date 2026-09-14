import { SettingsSchema, type CompleteRunRequest, type PlayerProgressContract, type RunResultContract, type SettingsContract } from '@typerift/contracts';

const DATABASE = 'typerift-v2';
const DATABASE_VERSION = 1;
const RESET_MARKER = 'typerift:v2:reset-complete';
const SETTINGS_KEY = 'typerift:v2:settings';
const SNAPSHOT_KEY = 'snapshot';
const LEGACY_PREFIXES = ['typemaster:', 'typing-raid:', 'typingraid:', 'typerift:v7:', 'typerift:v6:', 'typerift:v1:', 'typerift:v1'];
const LEGACY_DATABASES = ['typemaster', 'typemaster-db', 'typing-raid', 'typing-raid-v7', 'typerift-v7', 'typerift-v1'];

export const DEFAULT_SETTINGS: SettingsContract = {
    theme: 'light',
    locale: 'zh-CN',
    reduceMotion: false,
    reduceTransparency: false,
    reduceEffects: false,
    enhancedContrast: false,
    colorSafe: false,
    noFlash: false,
    reactionAssist: false,
    music: true,
    effects: true,
    voice: false,
    textScale: 1
};

export type LocalRun = {
    id: string;
    result: RunResultContract;
    completedAt: string;
    verified: boolean;
};

export type LocalSnapshot = {
    progress: PlayerProgressContract;
    pendingSyncCount: number;
    updatedAt: string;
};

function requestPromise<T>(request: IDBRequest<T>) {
    return new Promise<T>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function openDatabase() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DATABASE, DATABASE_VERSION);
        request.onupgradeneeded = () => {
            const database = request.result;
            if (!database.objectStoreNames.contains('runs')) database.createObjectStore('runs', { keyPath: 'id' });
            if (!database.objectStoreNames.contains('snapshot')) database.createObjectStore('snapshot', { keyPath: 'id' });
            if (!database.objectStoreNames.contains('outbox')) database.createObjectStore('outbox', { keyPath: 'runId' });
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function initializeV2Storage() {
    if (typeof window === 'undefined' || localStorage.getItem(RESET_MARKER)) return;
    const ownedKeys = Array.from({ length: localStorage.length }, (_, index) => localStorage.key(index)).filter((key): key is string => Boolean(key));
    for (const key of ownedKeys) {
        if (LEGACY_PREFIXES.some((prefix) => key.toLowerCase().startsWith(prefix.toLowerCase()))) {
            localStorage.removeItem(key);
        }
    }
    await Promise.all(
        LEGACY_DATABASES.map(
            (name) =>
                new Promise<void>((resolve) => {
                    const request = indexedDB.deleteDatabase(name);
                    request.onsuccess = request.onerror = request.onblocked = () => resolve();
                })
        )
    );
    localStorage.setItem(RESET_MARKER, new Date().toISOString());
}

/** @deprecated use initializeV2Storage */
export const initializeV1Storage = initializeV2Storage;

export function readSettings(): SettingsContract {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
        return SettingsSchema.parse(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null'));
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function writeSettings(settings: SettingsContract) {
    if (typeof window !== 'undefined') localStorage.setItem(SETTINGS_KEY, JSON.stringify(SettingsSchema.parse(settings)));
}

export async function saveLocalRun(run: LocalRun) {
    const database = await openDatabase();
    const transaction = database.transaction('runs', 'readwrite');
    transaction.objectStore('runs').put(run);
    await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
    database.close();
}

export async function getLocalRun(id: string) {
    const database = await openDatabase();
    const transaction = database.transaction('runs', 'readonly');
    const value = (await requestPromise(transaction.objectStore('runs').get(id))) as LocalRun | undefined;
    database.close();
    return value ?? null;
}

export async function listLocalRuns() {
    const database = await openDatabase();
    const transaction = database.transaction('runs', 'readonly');
    const values = (await requestPromise(transaction.objectStore('runs').getAll())) as LocalRun[];
    database.close();
    return values.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export async function saveLocalSnapshot(snapshot: LocalSnapshot) {
    const database = await openDatabase();
    const transaction = database.transaction('snapshot', 'readwrite');
    transaction.objectStore('snapshot').put({ id: SNAPSHOT_KEY, ...snapshot });
    await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
    database.close();
}

export async function getLocalSnapshot() {
    const database = await openDatabase();
    const transaction = database.transaction('snapshot', 'readonly');
    const value = (await requestPromise(transaction.objectStore('snapshot').get(SNAPSHOT_KEY))) as (LocalSnapshot & { id: string }) | undefined;
    database.close();
    if (!value) return null;
    const snapshot: LocalSnapshot = {
        progress: value.progress,
        pendingSyncCount: value.pendingSyncCount,
        updatedAt: value.updatedAt
    };
    return snapshot;
}

export async function queueCompletion(runId: string, payload: CompleteRunRequest) {
    const database = await openDatabase();
    const transaction = database.transaction('outbox', 'readwrite');
    transaction.objectStore('outbox').put({ runId, payload, queuedAt: new Date().toISOString() });
    await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
    database.close();
}

export async function countOutbox() {
    const database = await openDatabase();
    const transaction = database.transaction('outbox', 'readonly');
    const count = await requestPromise(transaction.objectStore('outbox').count());
    database.close();
    return count;
}

export async function flushOutbox(submit: (runId: string, payload: CompleteRunRequest) => Promise<unknown>) {
    const database = await openDatabase();
    const read = database.transaction('outbox', 'readonly');
    const queued = (await requestPromise(read.objectStore('outbox').getAll())) as Array<{ runId: string; payload: CompleteRunRequest }>;
    database.close();
    for (const item of queued.sort((a, b) => a.runId.localeCompare(b.runId))) {
        try {
            await submit(item.runId, item.payload);
            const active = await openDatabase();
            active.transaction('outbox', 'readwrite').objectStore('outbox').delete(item.runId);
            active.close();
        } catch {
            break;
        }
    }
}
