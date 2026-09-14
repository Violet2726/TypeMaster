import { AUDIO, planAssets, type AssetPlan, type GameAsset } from './asset-plan';
import type { RunMode } from '@typerift/domain';

/**
 * Asset loader with a synchronous accessor.
 *
 * The canvas renderer draws inside a requestAnimationFrame loop and cannot await, so every
 * loaded image stays in a module cache and is read back synchronously with `getImage`.
 * Loading never rejects: a failed asset simply keeps its procedural fallback.
 */

const images = new Map<string, HTMLImageElement>();
const pending = new Map<string, Promise<void>>();
const audioPools = new Map<string, HTMLAudioElement[]>();
const audioCursor = new Map<string, number>();

const EFFECT_POOL_SIZE = 3;

export function getImage(src: string): HTMLImageElement {
    const cached = images.get(src);
    if (cached) return cached;
    const image = new Image();
    image.decoding = 'async';
    image.src = src;
    images.set(src, image);
    return image;
}

function loadImage(src: string): Promise<void> {
    if (pending.has(src)) return pending.get(src)!;
    const task = new Promise<void>((resolve) => {
        const image = getImage(src);
        if (image.complete) {
            resolve();
            return;
        }
        image.addEventListener('load', () => resolve(), { once: true });
        image.addEventListener('error', () => resolve(), { once: true });
    });
    pending.set(src, task);
    return task;
}

function getAudio(src: string, poolSize = EFFECT_POOL_SIZE): HTMLAudioElement[] {
    const cached = audioPools.get(src);
    if (cached) return cached;
    const pool = Array.from({ length: poolSize }, () => {
        const element = new Audio(src);
        element.preload = 'auto';
        return element;
    });
    audioPools.set(src, pool);
    audioCursor.set(src, 0);
    return pool;
}

/** Plays a preloaded effect. Reusing a small pool avoids the first-hit decode delay. */
export function playSound(src: string, volume: number) {
    const pool = getAudio(src);
    const cursor = audioCursor.get(src) ?? 0;
    const element = pool[cursor % pool.length]!;
    audioCursor.set(src, cursor + 1);
    element.volume = volume;
    element.currentTime = 0;
    void element.play().catch(() => undefined);
}

export function getAmbientLoop(volume: number) {
    const [element] = getAudio(AUDIO.ambient.src, 1);
    if (!element) return null;
    element.loop = true;
    element.volume = volume;
    return element;
}

function loadAsset(asset: GameAsset): Promise<void> {
    if (asset.kind === 'audio') {
        getAudio(asset.src, asset.src === AUDIO.ambient.src ? 1 : EFFECT_POOL_SIZE);
        return Promise.resolve();
    }
    return loadImage(asset.src);
}

/** Resolves when every asset has loaded or failed. Never rejects. */
export function loadAssets(assets: GameAsset[]): Promise<void> {
    return Promise.all(assets.map((asset) => loadAsset(asset))).then(() => undefined);
}

/**
 * Blocks the run start. Once this resolves the first frame and the first keystroke are ready,
 * which is what keeps "press start → playable" under the interaction budget.
 */
export async function loadCriticalAssets(mode: RunMode, areaIndex = 0): Promise<void> {
    await loadAssets(planAssets(mode, areaIndex).critical);
}

/** Fire-and-forget: the player is already typing by the time this finishes. */
export function loadWarmAssets(plan: AssetPlan): void {
    void loadAssets(plan.warm);
}

type IdleWindow = Window & {
    requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
};

/** Deferred to idle time so it never competes with gameplay frames. */
export function loadIdleAssets(plan: AssetPlan): () => void {
    const idle = window as IdleWindow;
    if (typeof idle.requestIdleCallback === 'function') {
        const handle = idle.requestIdleCallback(() => void loadAssets(plan.idle), { timeout: 4_000 });
        return () => (window as unknown as { cancelIdleCallback?: (handle: number) => void }).cancelIdleCallback?.(handle);
    }
    const handle = window.setTimeout(() => void loadAssets(plan.idle), 2_500);
    return () => window.clearTimeout(handle);
}
