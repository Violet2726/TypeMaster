import { API_FALLBACK_CACHE_KEY, OBSOLETE_STORAGE_KEYS, STORAGE_KEYS } from '@typemaster/contracts';

type SchemaLike<T = unknown> = {
    parse: (value: unknown) => T;
};

type ClientCacheEntry = {
    key: string,
    value: unknown,
};

const CLIENT_CACHE_DB_NAME = 'typemaster-client-cache';
const CLIENT_CACHE_STORE_NAME = 'entries';
const CLIENT_CACHE_VERSION = 1;
const CLIENT_CACHE_KEYS = [
    API_FALLBACK_CACHE_KEY,
    STORAGE_KEYS.install,
    STORAGE_KEYS.sessions,
    STORAGE_KEYS.coachAdvices,
    STORAGE_KEYS.skillProfile,
    STORAGE_KEYS.trainingPlan,
    STORAGE_KEYS.diagnosticJourney,
    STORAGE_KEYS.activeSessionContext
];
const V6_INSTALL_PAYLOAD = {
    version: 6,
    installedAt: new Date().toISOString()
};

const clientCacheMemory = new Map<string, unknown>();
let hydrationPromise: Promise<void> | null = null;

function getBrowserLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return null;
    }

    return window.localStorage;
}

function canUseIndexedDb() {
    return typeof indexedDB !== 'undefined';
}

function parseWithFallback<T>(value: unknown, fallback: T, schema?: SchemaLike<T>) {
    try {
        return schema ? schema.parse(value) : value as T;
    } catch (error) {
        console.warn('Failed to parse client cache entry', error);
        return fallback;
    }
}

function readLocalJson<T = unknown>(key: string, fallback: T, schema?: SchemaLike<T>) {
    const storage = getBrowserLocalStorage();
    if (!storage) {
        return fallback;
    }

    try {
        const raw = storage.getItem(key);
        const parsed = raw ? JSON.parse(raw) : fallback;
        return schema ? schema.parse(parsed) : parsed;
    } catch (error) {
        console.warn(`Failed to read ${key}`, error);
        return fallback;
    }
}

function writeLocalJson<T = unknown>(key: string, value: T, schema?: SchemaLike<T>) {
    const storage = getBrowserLocalStorage();
    if (!storage) {
        return;
    }

    try {
        const serialized = schema ? schema.parse(value) : value;
        storage.setItem(key, JSON.stringify(serialized));
    } catch (error) {
        console.warn(`Failed to write ${key}`, error);
    }
}

function removeObsoleteLocalCacheKeys() {
    const storage = getBrowserLocalStorage();
    if (!storage) {
        return;
    }

    OBSOLETE_STORAGE_KEYS.forEach((key) => {
        storage.removeItem(key);
    });
}

function markV6Install() {
    const storage = getBrowserLocalStorage();
    if (!storage) {
        return;
    }

    try {
        if (!storage.getItem(STORAGE_KEYS.install)) {
            storage.setItem(STORAGE_KEYS.install, JSON.stringify(V6_INSTALL_PAYLOAD));
        }
    } catch (error) {
        console.warn('Failed to mark TypeMaster v6 install', error);
    }
}

function openClientCacheDb() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(CLIENT_CACHE_DB_NAME, CLIENT_CACHE_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(CLIENT_CACHE_STORE_NAME)) {
                db.createObjectStore(CLIENT_CACHE_STORE_NAME, { keyPath: 'key' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('Failed to open client cache database'));
    });
}

function waitForTransaction(transaction: IDBTransaction) {
    return new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error('Client cache transaction failed'));
        transaction.onabort = () => reject(transaction.error || new Error('Client cache transaction aborted'));
    });
}

async function readIndexedDbEntries() {
    const db = await openClientCacheDb();
    try {
        const transaction = db.transaction(CLIENT_CACHE_STORE_NAME, 'readonly');
        const store = transaction.objectStore(CLIENT_CACHE_STORE_NAME);
        const entries = await new Promise<ClientCacheEntry[]>((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve((request.result || []) as ClientCacheEntry[]);
            request.onerror = () => reject(request.error || new Error('Failed to read client cache'));
        });
        await waitForTransaction(transaction);
        return entries;
    } finally {
        db.close();
    }
}

async function deleteIndexedDbEntries(keys: string[]) {
    const db = await openClientCacheDb();
    try {
        const transaction = db.transaction(CLIENT_CACHE_STORE_NAME, 'readwrite');
        const store = transaction.objectStore(CLIENT_CACHE_STORE_NAME);
        keys.forEach((key) => store.delete(key));
        await waitForTransaction(transaction);
    } finally {
        db.close();
    }
}

async function writeIndexedDbEntry(key: string, value: unknown) {
    const db = await openClientCacheDb();
    try {
        const transaction = db.transaction(CLIENT_CACHE_STORE_NAME, 'readwrite');
        transaction.objectStore(CLIENT_CACHE_STORE_NAME).put({ key, value });
        await waitForTransaction(transaction);
    } finally {
        db.close();
    }
}

function persistClientCacheEntry(key: string, value: unknown) {
    if (!canUseIndexedDb()) {
        return;
    }

    writeIndexedDbEntry(key, value)
        .catch((error) => {
            console.warn(`Failed to persist ${key}`, error);
        });
}

export function hydrateClientCache() {
    if (hydrationPromise) {
        return hydrationPromise;
    }

    hydrationPromise = (async () => {
        removeObsoleteLocalCacheKeys();
        markV6Install();

        if (canUseIndexedDb()) {
            await deleteIndexedDbEntries(OBSOLETE_STORAGE_KEYS);
            const entries = await readIndexedDbEntries();
            entries.forEach((entry) => {
                clientCacheMemory.set(entry.key, entry.value);
            });
        }
    })().catch((error) => {
        console.warn('Failed to hydrate client cache', error);
    });

    return hydrationPromise;
}

export function resetClientCacheForTests() {
    clientCacheMemory.clear();
    hydrationPromise = null;
}

export function readLocalPreference<T = unknown>(key: string, fallback: T, schema?: SchemaLike<T>) {
    return readLocalJson(key, fallback, schema);
}

export function writeLocalPreference<T = unknown>(key: string, value: T, schema?: SchemaLike<T>) {
    writeLocalJson(key, value, schema);
}

export function readClientCache<T = unknown>(key: string, fallback: T, schema?: SchemaLike<T>) {
    if (clientCacheMemory.has(key)) {
        return parseWithFallback(clientCacheMemory.get(key), fallback, schema);
    }

    void hydrateClientCache();
    return fallback;
}

export function writeClientCache<T = unknown>(key: string, value: T, schema?: SchemaLike<T>) {
    try {
        const serialized = schema ? schema.parse(value) : value;
        clientCacheMemory.set(key, serialized);
        persistClientCacheEntry(key, serialized);
    } catch (error) {
        console.warn(`Failed to write ${key}`, error);
    }
}
