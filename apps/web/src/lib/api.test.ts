import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';

const ME_PAYLOAD = {
    player: {
        id: 'p1',
        callSign: 'Nova',
        locale: 'zh-CN',
        difficulty: 'standard',
        onboardingComplete: true,
        createdAt: '2026-07-16T08:00:00.000Z',
        updatedAt: '2026-07-16T08:00:00.000Z'
    },
    progress: {
        resonanceLevel: 1,
        resonanceXp: 0,
        shards: 0,
        unlockedUpgradeIds: [],
        codexIds: [],
        achievementIds: [],
        activeDays: 1,
        lastActiveDate: '2026-07-16'
    },
    missionSnapshot: {
        serverNow: '2026-07-16T08:00:00.000Z',
        dailyResetAt: '2026-07-17T00:00:00.000Z',
        weeklyResetAt: '2026-07-20T00:00:00.000Z',
        missions: []
    }
};

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

describe('v1 API client', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('requests the single /api/me snapshot with credentials', async () => {
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse(ME_PAYLOAD));
        vi.stubGlobal('fetch', fetchMock);
        await expect(api.me()).resolves.toEqual(ME_PAYLOAD);
        expect(fetchMock).toHaveBeenCalledWith('/api/me', expect.objectContaining({ credentials: 'include' }));
    });

    it('surfaces strict server error codes', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: { code: 'verification_failed', messageKey: 'api.error.verify' } }, 422)));
        await expect(api.runs()).rejects.toEqual(expect.objectContaining({ status: 422, code: 'verification_failed' }));
    });

    it('exposes every v1 endpoint through the shared request boundary', async () => {
        const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({})));
        vi.stubGlobal('fetch', fetchMock);

        await api.patchPlayer({ callSign: 'Nova' }).catch(() => undefined);
        await api.startRun({ mode: 'expedition' } as never).catch(() => undefined);
        await api
            .completeRun('run/one', {
                commandLog: { contentVersion: 2, seed: 'seed', mode: 'expedition', difficulty: 'standard', focusChars: [], endedAtMs: 0, entries: [] }
            })
            .catch(() => undefined);
        await api.missions().catch(() => undefined);
        await api.leaderboard().catch(() => undefined);
        await api.coach('run/two').catch(() => undefined);

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
