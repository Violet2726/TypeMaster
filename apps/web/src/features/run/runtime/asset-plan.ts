import { AREAS, BOSSES, ENEMY_ARCHETYPES, UPGRADES, type RunMode } from '@typerift/domain';

/**
 * Three-tier asset plan (guidance §12).
 *
 *   Critical — the first seconds of a run cannot render without these.
 *   Warm     — needed soon after start, loaded in the background while the player types.
 *   Idle     — everything else, fetched when the browser is free.
 *
 * The renderer already falls back to procedural shapes, so a missing warm/idle asset is
 * never a reason to keep the player waiting.
 */

export type AssetKind = 'background' | 'enemy' | 'boss' | 'upgrade' | 'audio';

export type GameAsset = {
    id: string;
    kind: AssetKind;
    src: string;
};

export type AssetPlan = {
    critical: GameAsset[];
    warm: GameAsset[];
    idle: GameAsset[];
};

export const AUDIO: Record<'hit' | 'error' | 'surge' | 'upgrade' | 'ambient', GameAsset> = {
    hit: { id: 'hit', kind: 'audio', src: '/game/v1/audio/hit.wav' },
    error: { id: 'error', kind: 'audio', src: '/game/v1/audio/error.wav' },
    surge: { id: 'surge', kind: 'audio', src: '/game/v1/audio/surge.wav' },
    upgrade: { id: 'upgrade', kind: 'audio', src: '/game/v1/audio/upgrade.wav' },
    ambient: { id: 'ambient', kind: 'audio', src: '/game/v1/audio/ambient-loop.wav' }
};

const background = (index: number): GameAsset => {
    const area = AREAS[index] ?? AREAS[0];
    return { id: area.id, kind: 'background', src: area.asset };
};
const enemySprite = (id: string): GameAsset => ({ id, kind: 'enemy', src: `/game/v1/enemies/${id}.png` });
const bossSprite = (index: number): GameAsset => {
    const definition = BOSSES[index] ?? BOSSES[0];
    return { id: definition.id, kind: 'boss', src: `/game/v1/bosses/${definition.id}.png` };
};
const upgradeIcon = (id: string): GameAsset => ({ id, kind: 'upgrade', src: `/game/v1/upgrades/${id}.png` });

/**
 * Short modes end before a build can grow, so their upgrade icons are not worth loading early.
 * Every other mode can open an upgrade prompt within the first minute.
 */
function upgradesMatterEarly(mode: RunMode) {
    return mode !== 'quick-pulse';
}

/** Enough to make the first frame and the first keystroke feel finished. */
export function getCriticalAssets(areaIndex = 0): GameAsset[] {
    return [background(areaIndex), ...ENEMY_ARCHETYPES.map((archetype) => enemySprite(archetype.id)), AUDIO.hit, AUDIO.error];
}

/** Loaded while the player is already playing. */
export function getWarmAssets(mode: RunMode, areaIndex = 0): GameAsset[] {
    return [bossSprite(areaIndex), AUDIO.surge, ...(upgradesMatterEarly(mode) ? UPGRADES.map((upgrade) => upgradeIcon(upgrade.id)) : [])];
}

/** Everything else, deferred to browser idle time. */
export function getIdleAssets(mode: RunMode, areaIndex = 0): GameAsset[] {
    const otherAreas = AREAS.map((_, index) => index).filter((index) => index !== areaIndex).map(background);
    const otherBosses = BOSSES.map((_, index) => index).filter((index) => index !== areaIndex).map(bossSprite);
    const deferredUpgrades = upgradesMatterEarly(mode) ? [] : UPGRADES.map((upgrade) => upgradeIcon(upgrade.id));
    return [...otherAreas, ...otherBosses, ...deferredUpgrades, AUDIO.upgrade, AUDIO.ambient];
}

export function planAssets(mode: RunMode, areaIndex = 0): AssetPlan {
    return {
        critical: getCriticalAssets(areaIndex),
        warm: getWarmAssets(mode, areaIndex),
        idle: getIdleAssets(mode, areaIndex)
    };
}
