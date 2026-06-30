export type GameAssetManifest = {
    backgrounds?: Record<string, string>,
    enemies?: Record<string, string>,
    bosses?: Record<string, string>,
    relics?: Record<string, string>,
    ui?: Record<string, string>,
};

type AssetBucket = keyof GameAssetManifest;

export type LoadedGameAssets = {
    manifest: GameAssetManifest,
    images: Map<string, HTMLImageElement>,
    ready: boolean,
};

const MANIFEST_URL = '/game/typerift/manifest.json';

function assetKey(bucket: AssetBucket, id: string) {
    return `${bucket}:${id}`;
}

async function loadImage(src: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Failed to load ${src}`));
        image.src = src;
    });
}

export async function loadGameAssets(): Promise<LoadedGameAssets> {
    try {
        const manifest = await fetch(MANIFEST_URL).then((response) => (
            response.ok ? response.json() : {}
        )) as GameAssetManifest;
        const entries = Object.entries(manifest).flatMap(([bucket, records]) => (
            Object.entries(records || {}).map(([id, src]) => ({ bucket: bucket as AssetBucket, id, src }))
        ));
        const images = new Map<string, HTMLImageElement>();

        await Promise.all(entries.map(async (entry) => {
            try {
                images.set(assetKey(entry.bucket, entry.id), await loadImage(entry.src));
            } catch {
                // The renderer has polished procedural fallbacks for missing assets.
            }
        }));

        return { manifest, images, ready: true };
    } catch {
        return { manifest: {}, images: new Map(), ready: false };
    }
}

export function getAssetImage(assets: LoadedGameAssets | null, bucket: AssetBucket, id: string) {
    return assets?.images.get(assetKey(bucket, id)) || null;
}

