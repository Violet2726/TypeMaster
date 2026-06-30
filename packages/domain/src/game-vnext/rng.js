export function hashSeed(seed) {
    const text = String(seed || 'typerift');
    let hash = 2166136261;
    for (let index = 0; index < text.length; index += 1) {
        hash ^= text.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

export function createRng(seed) {
    let value = hashSeed(seed);
    return function rng() {
        value += 0x6D2B79F5;
        let next = Math.imul(value ^ (value >>> 15), 1 | value);
        next ^= next + Math.imul(next ^ (next >>> 7), 61 | next);
        return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
    };
}

export function seededRandom(seed, salt = '') {
    return createRng(`${seed}:${salt}`);
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function pick(rng, items) {
    return items[Math.floor(rng() * items.length) % items.length];
}

export function weightedPick(rng, weights) {
    const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
    const total = entries.reduce((sum, [, weight]) => sum + Number(weight || 0), 0);
    let roll = rng() * total;

    for (const [id, weight] of entries) {
        roll -= weight;
        if (roll <= 0) return id;
    }

    return entries[0]?.[0] || null;
}
