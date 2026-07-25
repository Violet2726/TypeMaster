export function hashSeed(value: string): number {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

export function randomAt(seed: string, index: number): number {
    let value = (hashSeed(seed) + Math.imul(index + 1, 0x9e3779b1)) >>> 0;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4_294_967_296;
}

export function stableId(prefix: string, seed: string, index: number): string {
    return `${prefix}-${hashSeed(`${seed}:${index}`).toString(36)}`;
}
