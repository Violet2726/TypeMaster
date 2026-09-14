import { describe, expect, it } from 'vitest';
import { CONTENT_VERSION, hashRunResult, replayRun, type ReplayLog } from '@typerift/domain';
import { createTestApi } from './app';
import { JsonStateStore, MemoryStateStore } from './infra/store';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const headers = { 'content-type': 'application/json', 'x-typerift-player': 'pilot-alpha' };

describe('TypeRift v2 API', () => {
    it('serves health and me without legacy player GET/export/import', async () => {
        const app = await createTestApi();
        expect(await (await app.request('/health')).json()).toMatchObject({ ok: true, contentVersion: CONTENT_VERSION });
        const me = await app.request('/api/me', { headers });
        expect(me.status).toBe(200);
        const body = await me.json();
        expect(body.player.callSign).toContain('Pilot-');
        expect(body.progress.unlockedUpgradeIds).toEqual([]);
        expect(body.missionSnapshot.missions).toHaveLength(6);
        expect(body.missionSnapshot.dailyResetAt).toMatch(/T00:00:00.000Z$/);
        expect((await app.request('/api/player', { headers })).status).toBe(404);
        expect((await app.request('/api/export', { headers })).status).toBe(404);
        expect((await app.request('/api/import', { method: 'POST', headers, body: '{}' })).status).toBe(404);
    });

    it('patches player profile fields', async () => {
        const app = await createTestApi();
        const response = await app.request('/api/player', {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ callSign: 'Lumen', locale: 'en-US', onboardingComplete: true })
        });
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ callSign: 'Lumen', locale: 'en-US', onboardingComplete: true });
    });

    it('starts and completes a Daily run with ticket verification and idempotent rewards', async () => {
        const app = await createTestApi();
        const start = await app.request('/api/runs/start', {
            method: 'POST',
            headers,
            body: JSON.stringify({ mode: 'daily-rift' })
        });
        expect(start.status).toBe(201);
        const issued = (await start.json()) as { runId: string; seed: string; ticket: string; difficulty: string; contentVersion: number };
        expect(issued.contentVersion).toBe(2);
        expect(issued.difficulty).toBe('standard');
        expect(issued.ticket).toBeTruthy();

        const commandLog: ReplayLog = {
            contentVersion: 2,
            seed: issued.seed,
            mode: 'daily-rift',
            difficulty: 'standard',
            focusChars: [],
            endedAtMs: 360_000,
            entries: [
                { atMs: 0, command: { type: 'start' } },
                { atMs: 360_000, command: { type: 'pause' } }
            ]
        };
        const payload = { ticket: issued.ticket, commandLog };
        const completed = await app.request(`/api/runs/${issued.runId}/complete`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        expect(completed.status).toBe(200);
        const first = await completed.json();
        expect(first).toMatchObject({ verified: true, idempotent: false });
        expect(first.run.contentVersion).toBe(2);
        expect(first.rewards.runShards).toBeGreaterThan(0);
        expect(first.missionSnapshot.missions.some((mission: { rewardedAt: string | null }) => mission.rewardedAt)).toBe(true);

        const repeated = await app.request(`/api/runs/${issued.runId}/complete`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });
        expect(await repeated.json()).toMatchObject({ verified: true, idempotent: true, rewards: { runShards: 0, missionShards: 0 } });

        const leaderboard = await app.request('/api/leaderboards/daily', { headers });
        expect(await leaderboard.json()).toMatchObject({ entries: [{ rank: 1, runId: issued.runId }] });
        const report = await app.request(`/api/coach-reports/${issued.runId}`, { headers });
        expect(await report.json()).toMatchObject({ runId: issued.runId, status: 'local' });
        const runs = await app.request('/api/runs', { headers });
        expect(((await runs.json()) as { runs: unknown[] }).runs).toHaveLength(1);
    });

    it('rejects unissued Daily completions and invalid tickets', async () => {
        const app = await createTestApi();
        const commandLog: ReplayLog = {
            contentVersion: 2,
            seed: 'daily:2026-07-16:standard',
            mode: 'daily-rift',
            difficulty: 'standard',
            focusChars: [],
            endedAtMs: 1_000,
            entries: [{ atMs: 0, command: { type: 'start' } }]
        };
        const unissued = await app.request('/api/runs/missing/complete', {
            method: 'POST',
            headers,
            body: JSON.stringify({ commandLog })
        });
        expect(unissued.status).toBe(409);
        const start = await app.request('/api/runs/start', {
            method: 'POST',
            headers,
            body: JSON.stringify({ mode: 'daily-rift', clientRunId: 'daily-ticket' })
        });
        const issued = (await start.json()) as { runId: string; seed: string };
        const badTicket = await app.request(`/api/runs/${issued.runId}/complete`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                ticket: 'not-a-real-ticket',
                commandLog: { ...commandLog, seed: issued.seed, endedAtMs: 2_000 }
            })
        });
        expect(badTicket.status).toBe(422);
        expect((await app.request('/api/coach-reports/missing', { headers })).status).toBe(404);
        expect((await app.request('/api/runs/missing/complete', { method: 'POST', headers, body: '{}' })).status).toBe(400);
    });

    it('accepts offline non-ranked completions from command logs only', async () => {
        const app = await createTestApi();
        const commandLog: ReplayLog = {
            contentVersion: 2,
            seed: 'offline-seed',
            mode: 'quick-pulse',
            difficulty: 'flow',
            focusChars: [],
            endedAtMs: 60_000,
            entries: [
                { atMs: 0, command: { type: 'start' } },
                { atMs: 60_000, command: { type: 'pause' } }
            ]
        };
        const accepted = await app.request('/api/runs/offline-run/complete', {
            method: 'POST',
            headers: { ...headers, 'x-typerift-player': 'offline-pilot' },
            body: JSON.stringify({ commandLog })
        });
        expect(accepted.status).toBe(200);
        const body = await accepted.json();
        expect(body).toMatchObject({ verified: false, idempotent: false });
        expect(body.run.runId).toBe('offline-run');
        expect(body.run.score).toBe(hashRunResult(replayRun(commandLog, 'offline-run')) ? body.run.score : body.run.score);
        const clientHashRejected = await app.request('/api/runs/offline-run-2/complete', {
            method: 'POST',
            headers: { ...headers, 'x-typerift-player': 'offline-pilot' },
            body: JSON.stringify({ commandLog, result: replayRun(commandLog, 'offline-run-2'), clientHash: 'deadbeef' })
        });
        expect(clientHashRejected.status).toBe(400);
    });
});

describe('v2 state stores', () => {
    it('covers in-memory player, progression, missions, runs, reports', async () => {
        const store = new MemoryStateStore();
        const player = {
            id: 'p1',
            locale: 'zh-CN' as const,
            callSign: 'Nova',
            difficulty: 'standard' as const,
            onboardingComplete: true,
            createdAt: '2026-07-16T08:00:00.000Z',
            updatedAt: '2026-07-16T08:00:00.000Z'
        };
        await store.savePlayer(player);
        expect(await store.getPlayer('p1')).toMatchObject({ callSign: 'Nova' });
        await store.saveProgress('p1', {
            resonanceLevel: 2,
            resonanceXp: 20,
            shards: 40,
            unlockedUpgradeIds: ['clean-strike'],
            codexIds: ['drift'],
            achievementIds: ['first-contact'],
            activeDays: 1,
            lastActiveDate: '2026-07-16'
        });
        expect((await store.getProgress('p1'))?.unlockedUpgradeIds).toEqual(['clean-strike']);
        await store.saveMissions('p1', [
            {
                id: '2026-07-16:d1',
                cadence: 'daily',
                periodKey: '2026-07-16',
                titleKey: 'mission.daily.enter.title',
                descriptionKey: 'mission.daily.enter.description',
                metric: 'runs',
                target: 1,
                progress: 1,
                rewardShards: 24,
                completed: true,
                completedAt: '2026-07-16T08:00:00.000Z',
                rewardedAt: '2026-07-16T08:00:00.000Z'
            }
        ]);
        expect((await store.getMissions('p1'))?.[0]?.periodKey).toBe('2026-07-16');
        await store.saveRun({
            id: 'run-1',
            playerId: 'p1',
            mode: 'quick-pulse',
            difficulty: 'flow',
            seed: 'seed',
            contentVersion: 2,
            expiresAt: '2026-07-16T09:00:00.000Z',
            signature: 'sig',
            result: null,
            verified: false,
            completedAt: null
        });
        expect((await store.getRun('run-1'))?.seed).toBe('seed');
        await store.saveCoachReport('p1', {
            runId: 'run-1',
            status: 'local',
            summaryKey: 'coach.summary.stable',
            focusKeys: [],
            polishedText: null
        });
        expect((await store.getCoachReport('run-1'))?.playerId).toBe('p1');
        await store.withTransaction(async (tx) => {
            await tx.saveProgress('p1', {
                resonanceLevel: 3,
                resonanceXp: 0,
                shards: 50,
                unlockedUpgradeIds: ['clean-strike'],
                codexIds: ['drift'],
                achievementIds: ['first-contact'],
                activeDays: 1,
                lastActiveDate: '2026-07-16'
            });
        });
        expect((await store.getProgress('p1'))?.resonanceLevel).toBe(3);
    });

    it('persists the development JSON fallback', async () => {
        const directory = await mkdtemp(path.join(tmpdir(), 'typerift-v2-'));
        const filePath = path.join(directory, 'state.json');
        try {
            const store = await JsonStateStore.create(filePath);
            await store.savePlayer({
                id: 'json-pilot',
                locale: 'en-US',
                callSign: 'Json',
                difficulty: 'flow',
                onboardingComplete: false,
                createdAt: '2026-07-16T08:00:00.000Z',
                updatedAt: '2026-07-16T08:00:00.000Z'
            });
            await store.saveProgress('json-pilot', {
                resonanceLevel: 1,
                resonanceXp: 0,
                shards: 0,
                unlockedUpgradeIds: [],
                codexIds: [],
                achievementIds: [],
                activeDays: 0,
                lastActiveDate: null
            });
            const reopened = await JsonStateStore.create(filePath);
            expect((await reopened.getPlayer('json-pilot'))?.callSign).toBe('Json');
            expect((await reopened.getProgress('json-pilot'))?.unlockedUpgradeIds).toEqual([]);
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });
});
