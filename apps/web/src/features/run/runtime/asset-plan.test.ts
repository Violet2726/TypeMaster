import { describe, expect, it } from 'vitest';
import { AREAS, BOSSES, ENEMY_ARCHETYPES } from '@typerift/domain';
import { AUDIO, getIdleAssets, getCriticalAssets, getWarmAssets, planAssets } from './asset-plan';

describe('asset plan', () => {
    it('keeps the critical set small enough to start in one interaction budget', () => {
        const critical = getCriticalAssets(0);
        expect(critical).toHaveLength(1 + ENEMY_ARCHETYPES.length + 2);
        expect(critical).toContainEqual(expect.objectContaining({ src: AREAS[0].asset }));
        expect(critical).toContainEqual(AUDIO.hit);
        expect(critical).toContainEqual(AUDIO.error);
    });

    it('defers the current boss and the upgrade pool to the warm tier', () => {
        const warm = getWarmAssets('expedition', 1);
        expect(warm).toContainEqual(expect.objectContaining({ src: `/game/v1/bosses/${BOSSES[1].id}.png` }));
        expect(warm.some((asset) => asset.kind === 'upgrade')).toBe(true);
        expect(warm.some((asset) => asset.kind === 'background')).toBe(false);
    });

    it('sends the remaining areas, bosses and ambient audio to idle', () => {
        const idle = getIdleAssets('expedition', 0);
        const backgroundIds = idle.filter((asset) => asset.kind === 'background').map((asset) => asset.id);
        expect(backgroundIds).toEqual([AREAS[1].id, AREAS[2].id]);
        expect(idle).toContainEqual(AUDIO.ambient);
    });

    it('never loads the same asset in two tiers', () => {
        const plan = planAssets('expedition', 2);
        const seen = new Set<string>();
        for (const asset of [...plan.critical, ...plan.warm, ...plan.idle]) {
            const key = `${asset.kind}:${asset.src}`;
            expect(seen.has(key)).toBe(false);
            seen.add(key);
        }
        expect(seen.size).toBe(plan.critical.length + plan.warm.length + plan.idle.length);
    });

    it('defers upgrade icons for the shortest mode', () => {
        expect(getWarmAssets('quick-pulse', 0).some((asset) => asset.kind === 'upgrade')).toBe(false);
        expect(getIdleAssets('quick-pulse', 0).some((asset) => asset.kind === 'upgrade')).toBe(true);
    });
});
