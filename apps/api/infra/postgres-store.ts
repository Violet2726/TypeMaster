import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { MissionSchema, PlayerProgressSchema, PlayerSchema, type MissionContract } from '@typerift/contracts';
import * as schema from './db/schema';
import type { CoachReport, DailyLeaderboardEntry, RunRecord, StateSnapshot, StateStore } from './store';

export async function createPostgresStateStore(databaseUrl: string): Promise<StateStore> {
    const client = postgres(databaseUrl, { max: 5 });
    const db = drizzle(client, { schema });
    let queue: Promise<unknown> = Promise.resolve();

    const enqueue = <T>(work: () => Promise<T>) => {
        const run = queue.then(work, work);
        queue = run.then(
            () => undefined,
            () => undefined
        );
        return run;
    };

    const store: StateStore = {
        async withTransaction<T>(work: (inner: StateStore) => Promise<T>) {
            return enqueue(() => work(store));
        },
        async getPlayer(id) {
            const rows = await db.select().from(schema.players).where(eq(schema.players.id, id)).limit(1);
            return rows[0] ? PlayerSchema.parse(rows[0].data) : null;
        },
        async savePlayer(player) {
            const parsed = PlayerSchema.parse(player);
            await db
                .insert(schema.players)
                .values({ id: parsed.id, data: parsed, updatedAt: new Date() })
                .onConflictDoUpdate({ target: schema.players.id, set: { data: parsed, updatedAt: new Date() } });
        },
        async getProgress(id) {
            const rows = await db.select().from(schema.playerProgress).where(eq(schema.playerProgress.playerId, id)).limit(1);
            return rows[0] ? PlayerProgressSchema.parse(rows[0].data) : null;
        },
        async saveProgress(id, progress) {
            const parsed = PlayerProgressSchema.parse(progress);
            await db
                .insert(schema.playerProgress)
                .values({ playerId: id, data: parsed, updatedAt: new Date() })
                .onConflictDoUpdate({ target: schema.playerProgress.playerId, set: { data: parsed, updatedAt: new Date() } });
        },
        async getMissions(id) {
            const rows = await db.select().from(schema.missionProgress).where(eq(schema.missionProgress.playerId, id)).limit(1);
            return rows[0] ? (rows[0].data as MissionContract[]).map((mission) => MissionSchema.parse(mission)) : null;
        },
        async saveMissions(id, missions) {
            const parsed = missions.map((mission) => MissionSchema.parse(mission));
            await db
                .insert(schema.missionProgress)
                .values({ playerId: id, data: parsed, updatedAt: new Date() })
                .onConflictDoUpdate({ target: schema.missionProgress.playerId, set: { data: parsed, updatedAt: new Date() } });
        },
        async getRun(id) {
            const rows = await db.select().from(schema.runs).where(eq(schema.runs.id, id)).limit(1);
            if (!rows[0]) return null;
            const row = rows[0];
            return {
                id: row.id,
                playerId: row.playerId,
                mode: row.mode,
                difficulty: row.difficulty,
                seed: row.seed,
                contentVersion: row.contentVersion,
                expiresAt: row.expiresAt.toISOString(),
                signature: row.signature,
                result: row.result as RunRecord['result'],
                verified: row.verified,
                completedAt: row.completedAt?.toISOString() ?? null
            };
        },
        async saveRun(run) {
            await db
                .insert(schema.runs)
                .values({
                    id: run.id,
                    playerId: run.playerId,
                    mode: run.mode,
                    difficulty: run.difficulty,
                    seed: run.seed,
                    contentVersion: run.contentVersion,
                    expiresAt: new Date(run.expiresAt),
                    signature: run.signature,
                    status: run.result ? 'completed' : 'started',
                    result: run.result,
                    verified: run.verified,
                    completedAt: run.completedAt ? new Date(run.completedAt) : null
                })
                .onConflictDoUpdate({
                    target: schema.runs.id,
                    set: {
                        mode: run.mode,
                        difficulty: run.difficulty,
                        seed: run.seed,
                        contentVersion: run.contentVersion,
                        expiresAt: new Date(run.expiresAt),
                        signature: run.signature,
                        status: run.result ? 'completed' : 'started',
                        result: run.result,
                        verified: run.verified,
                        completedAt: run.completedAt ? new Date(run.completedAt) : null
                    }
                });
        },
        async listRuns(playerId) {
            const rows = await db.select().from(schema.runs).where(eq(schema.runs.playerId, playerId));
            return rows
                .map((row) => ({
                    id: row.id,
                    playerId: row.playerId,
                    mode: row.mode,
                    difficulty: row.difficulty,
                    seed: row.seed,
                    contentVersion: row.contentVersion,
                    expiresAt: row.expiresAt.toISOString(),
                    signature: row.signature,
                    result: row.result as RunRecord['result'],
                    verified: row.verified,
                    completedAt: row.completedAt?.toISOString() ?? null
                }))
                .sort((left, right) => (right.completedAt ?? '').localeCompare(left.completedAt ?? ''));
        },
        async listDailyLeaderboard(dateKey) {
            const rows = await db.select().from(schema.runs);
            const players = await db.select().from(schema.players);
            const callSigns = Object.fromEntries(players.map((player) => [player.id, PlayerSchema.parse(player.data).callSign]));
            return rows
                .filter((row) => row.completedAt?.toISOString().startsWith(dateKey))
                .map((row): DailyLeaderboardEntry => ({
                    id: row.id,
                    callSign: callSigns[row.playerId] ?? 'Pilot',
                    verified: row.verified,
                    result: row.result as RunRecord['result']
                }));
        },
        async getCoachReport(runId) {
            const rows = await db.select().from(schema.coachReports).where(eq(schema.coachReports.runId, runId)).limit(1);
            if (!rows[0]) return null;
            return { ...(rows[0].data as CoachReport), playerId: rows[0].playerId };
        },
        async saveCoachReport(playerId, report) {
            await db
                .insert(schema.coachReports)
                .values({ runId: report.runId, playerId, data: report, updatedAt: new Date() })
                .onConflictDoUpdate({
                    target: schema.coachReports.runId,
                    set: { playerId, data: report, updatedAt: new Date() }
                });
        },
        async replaceAll(snapshot: StateSnapshot) {
            await enqueue(async () => {
                for (const player of Object.values(snapshot.players)) await store.savePlayer(player);
                for (const [id, progress] of Object.entries(snapshot.progress)) await store.saveProgress(id, progress);
                for (const [id, missions] of Object.entries(snapshot.missions)) await store.saveMissions(id, missions);
                for (const run of Object.values(snapshot.runs)) await store.saveRun(run);
                for (const report of Object.values(snapshot.coachReports)) {
                    await store.saveCoachReport(report.playerId, report);
                }
            });
        }
    };

    return store;
}
