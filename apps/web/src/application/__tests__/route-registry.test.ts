import { describe, expect, it } from 'vitest';
import { getRouteForPath, getVisibleShellRoutes } from '../route-registry';

describe('route registry', () => {
    it('keeps /raid as the TypeRift immersive game route', () => {
        const route = getRouteForPath('/raid');

        expect(route.id).toBe('raid');
        expect(route.labelKey).toBe('raid');
        expect(route.fallbackLabel).toBe('TypeRift');
        expect(route.layout).toBe('immersiveGame');
    });

    it('shows TypeRift, missions, practice, and insights in shell navigation', () => {
        const routes = getVisibleShellRoutes().map((route) => route.id);

        expect(routes).toEqual(['today', 'raid', 'practice', 'missions', 'insights']);
    });
});
