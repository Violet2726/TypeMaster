export type StoreUpdater<T> = T | ((current: T) => T);

export function resolveStoreUpdater<T>(current: T, next: StoreUpdater<T>): T {
    return typeof next === 'function'
        ? (next as (current: T) => T)(current)
        : next;
}
