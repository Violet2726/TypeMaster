import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

describe('v1 API client', () => {
    afterEach(() => vi.unstubAllGlobals());
    it('requests the single /api/me snapshot', async () => {
        const payload = { player: { id: 'p1' }, progress: {}, missions: [] };
        const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200, headers: { 'content-type': 'application/json' } }));
        vi.stubGlobal('fetch', fetchMock);
        await expect(api.me()).resolves.toEqual(payload);
        expect(fetchMock).toHaveBeenCalledWith('/api/me', expect.objectContaining({ credentials: 'include' }));
    });
    it('surfaces strict server error codes', async () => {
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValue(
                    new Response(JSON.stringify({ error: { code: 'verification_failed' } }), { status: 422, headers: { 'content-type': 'application/json' } })
                )
        );
        await expect(api.runs()).rejects.toEqual(expect.objectContaining({ status: 422, code: 'verification_failed' }));
    });

    it('exposes every v1 endpoint through the shared request boundary', async () => {
        const fetchMock = vi
            .fn()
            .mockImplementation(() => Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })));
        vi.stubGlobal('fetch', fetchMock);

        await api.updatePlayer({ callSign: 'Nova' });
        await api.startRun({} as never);
        await api.completeRun('run/one', {} as never);
        await api.missions();
        await api.leaderboard();
        await api.coach('run/two');

        expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
            '/api/player',
            '/api/runs/start',
            '/api/runs/run%2Fone/complete',
            '/api/missions',
            '/api/leaderboards/daily',
            '/api/coach-reports/run%2Ftwo'
        ]);
    });
});
