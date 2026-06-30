export type GameAssetManifest = {
    version?: number,
    backgrounds?: Record<string, string>,
    enemies?: Record<string, string>,
    bosses?: Record<string, string>,
    relics?: Record<string, string>,
    ui?: Record<string, string>,
};

type AssetBucket = Exclude<keyof GameAssetManifest, 'version'>;

export type LoadedGameAssets = {
    manifest: GameAssetManifest,
    images: Map<string, HTMLImageElement>,
    ready: boolean,
    missing: string[],
};

const MANIFEST_URL = '/game/typerift/manifest.json';
const ASSET_BUCKETS: AssetBucket[] = ['backgrounds', 'enemies', 'bosses', 'relics', 'ui'];
const REQUIRED_COUNTS: Partial<Record<AssetBucket, number>> = {
    backgrounds: 5,
    enemies: 12,
    bosses: 5,
    relics: 24
};

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
        const missing: string[] = [];
        const entries = ASSET_BUCKETS.flatMap((bucket) => (
            Object.entries(manifest[bucket] || {}).map(([id, src]) => ({ bucket, id, src }))
        ));
        const images = new Map<string, HTMLImageElement>();

        ASSET_BUCKETS.forEach((bucket) => {
            const required = REQUIRED_COUNTS[bucket] || 0;
            const actual = Object.keys(manifest[bucket] || {}).length;
            if (actual < required) missing.push(`${bucket}:expected-${required}:actual-${actual}`);
        });

        await Promise.all(entries.map(async (entry) => {
            try {
                images.set(assetKey(entry.bucket, entry.id), await loadImage(entry.src));
            } catch {
                missing.push(assetKey(entry.bucket, entry.id));
            }
        }));

        return { manifest, images, ready: missing.length === 0, missing };
    } catch {
        return { manifest: {}, images: new Map(), ready: false, missing: ['manifest'] };
    }
}

export function getAssetImage(assets: LoadedGameAssets | null, bucket: AssetBucket, id: string) {
    return assets?.images.get(assetKey(bucket, id)) || null;
}
