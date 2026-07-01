import { describe, expect, it } from 'vitest';
import { getRouteForPath, getVisibleShellRoutes } from '../route-registry';

describe('route registry', () => {
    it('keeps TypeRift inside the command center route', () => {
        const route = getVisibleShellRoutes().find((item) => item.id === 'typerift');

        expect(route?.href).toBe('/#typerift');
        expect(route?.labelKey).toBe('typerift');
        expect(route?.fallbackLabel).toBe('TypeRift');
        expect(route?.layout).toBe('standard');
        expect(getRouteForPath('/').id).toBe('today');
    });

    it('shows TypeRift, missions, practice, and insights in shell navigation', () => {
        const routes = getVisibleShellRoutes().map((route) => route.id);

        expect(routes).toEqual(['today', 'typerift', 'practice', 'missions', 'insights']);
    });
});
