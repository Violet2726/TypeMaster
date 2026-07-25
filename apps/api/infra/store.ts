import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
    MissionSchema,
    PlayerProgressSchema,
    PlayerSchema,
    RunResultSchema,
    type MissionContract,
    type PlayerContract,
    type PlayerProgressContract,
    type RunResultContract
} from '@typerift/contracts';
import { z } from 'zod';

export type CoachReport = {
    runId: string;
    status: 'local' | 'pending' | 'ready';
    summaryKey: string;
    focusKeys: string[];
    polishedText: string | null;
};

export type RunRecord = {
    id: string;
    playerId: string;
    mode: string;
    difficulty: string;
    seed: string;
    contentVersion: number;
    expiresAt: string;
    signature: string;
    result: RunResultContract | null;
    verified: boolean;
    completedAt: string | null;
};

export type StateSnapshot = {
    players: Record<string, PlayerContract>;
    progress: Record<string, PlayerProgressContract>;
    missions: Record<string, MissionContract[]>;
    runs: Record<string, RunRecord>;
    coachReports: Record<string, CoachReport & { playerId: string }>;
};

export type DailyLeaderboardEntry = {
    id: string;
    callSign: string;
    verified: boolean;
    result: RunResultContract | null;
};

export type StateStore = {
    getPlayer(id: string): Promise<PlayerContract | null>;
    savePlayer(player: PlayerContract): Promise<void>;
    getProgress(id: string): Promise<PlayerProgressContract | null>;
    saveProgress(id: string, progress: PlayerProgressContract): Promise<void>;
    getMissions(id: string): Promise<MissionContract[] | null>;
    saveMissions(id: string, missions: MissionContract[]): Promise<void>;
    getRun(id: string): Promise<RunRecord | null>;
    saveRun(run: RunRecord): Promise<void>;
    listRuns(playerId: string): Promise<RunRecord[]>;
    listDailyLeaderboard(dateKey: string): Promise<DailyLeaderboardEntry[]>;
    getCoachReport(runId: string): Promise<(CoachReport & { playerId: string }) | null>;
    saveCoachReport(playerId: string, report: CoachReport): Promise<void>;
    replaceAll(snapshot: StateSnapshot): Promise<void>;
    withTransaction<T>(work: (store: StateStore) => Promise<T>): Promise<T>;
};

const emptyState = (): StateSnapshot => ({
    players: {},
    progress: {},
    missions: {},
    runs: {},
    coachReports: {}
});

const RunRecordSchema = z
    .object({
        id: z.string().min(1).max(100),
        playerId: z.string().min(1).max(100),
        mode: z.string().min(1).max(40),
        difficulty: z.string().min(1).max(40),
        seed: z.string().min(1).max(120),
        contentVersion: z.number().int(),
        expiresAt: z.string().datetime(),
        signature: z.string().min(1).max(2_048),
        result: RunResultSchema.nullable(),
        verified: z.boolean(),
        completedAt: z.string().datetime().nullable()
    })
    .strict();

const CoachReportSchema = z
    .object({
        runId: z.string().min(1).max(100),
        playerId: z.string().min(1).max(100),
        status: z.enum(['local', 'pending', 'ready']),
        summaryKey: z.string().min(1).max(160),
        focusKeys: z.array(z.string().min(1).max(160)).max(3),
        polishedText: z.string().max(1_200).nullable()
    })
    .strict();

export class MemoryStateStore implements StateStore {
    protected state: StateSnapshot;
    private queue: Promise<unknown> = Promise.resolve();

    constructor(initial?: StateSnapshot) {
        this.state = initial ?? emptyState();
    }

    protected async persist() {}

    private enqueue<T>(work: () => Promise<T>): Promise<T> {
        const run = this.queue.then(work, work);
        this.queue = run.then(
            () => undefined,
            () => undefined
        );
        return run;
    }

    async withTransaction<T>(work: (store: StateStore) => Promise<T>): Promise<T> {
        return this.enqueue(() => work(this));
    }

    async getPlayer(id: string) {
        return this.state.players[id] ?? null;
    }

    async savePlayer(player: PlayerContract) {
        this.state.players[player.id] = PlayerSchema.parse(player);
        await this.persist();
    }

    async getProgress(id: string) {
        return this.state.progress[id] ?? null;
    }

    async saveProgress(id: string, progress: PlayerProgressContract) {
        this.state.progress[id] = PlayerProgressSchema.parse(progress);
        await this.persist();
    }

    async getMissions(id: string) {
        return this.state.missions[id] ?? null;
    }

    async saveMissions(id: string, missions: MissionContract[]) {
        this.state.missions[id] = missions.map((mission) => MissionSchema.parse(mission));
        await this.persist();
    }

    async getRun(id: string) {
        return this.state.runs[id] ?? null;
    }

    async saveRun(run: RunRecord) {
        this.state.runs[run.id] = RunRecordSchema.parse(run) as RunRecord;
        await this.persist();
    }

    async listRuns(playerId: string) {
        return Object.values(this.state.runs)
            .filter((run) => run.playerId === playerId)
            .sort((left, right) => (right.completedAt ?? '').localeCompare(left.completedAt ?? ''));
    }

    async listDailyLeaderboard(dateKey: string) {
        return Object.values(this.state.runs)
            .filter((run) => run.result?.mode === 'daily-rift' && run.completedAt?.startsWith(dateKey))
            .map((run) => ({
                id: run.id,
                callSign: this.state.players[run.playerId]?.callSign ?? 'Pilot',
                verified: run.verified,
                result: run.result
            }));
    }

    async getCoachReport(runId: string) {
        return this.state.coachReports[runId] ?? null;
    }

    async saveCoachReport(playerId: string, report: CoachReport) {
        this.state.coachReports[report.runId] = CoachReportSchema.parse({ ...report, playerId });
        await this.persist();
    }

    async replaceAll(snapshot: StateSnapshot) {
        this.state = {
            players: Object.fromEntries(Object.entries(snapshot.players).map(([id, player]) => [id, PlayerSchema.parse(player)])),
            progress: Object.fromEntries(Object.entries(snapshot.progress).map(([id, progress]) => [id, PlayerProgressSchema.parse(progress)])),
            missions: Object.fromEntries(
                Object.entries(snapshot.missions).map(([id, missions]) => [id, missions.map((mission) => MissionSchema.parse(mission))])
            ),
            runs: Object.fromEntries(Object.entries(snapshot.runs).map(([id, run]) => [id, RunRecordSchema.parse(run) as RunRecord])),
            coachReports: Object.fromEntries(
                Object.entries(snapshot.coachReports).map(([id, report]) => [id, CoachReportSchema.parse(report)])
            )
        };
        await this.persist();
    }
}

export class JsonStateStore extends MemoryStateStore {
    private readonly filePath: string;

    private constructor(filePath: string, initial: StateSnapshot) {
        super(initial);
        this.filePath = filePath;
    }

    static async create(filePath = path.resolve(process.cwd(), '.data/typerift-v2.json')) {
        await mkdir(path.dirname(filePath), { recursive: true });
        let initial = emptyState();
        try {
            initial = JSON.parse(await readFile(filePath, 'utf8')) as StateSnapshot;
        } catch {
            // first boot
        }
        return new JsonStateStore(filePath, initial);
    }

    protected async persist() {
        const temporary = `${this.filePath}.tmp`;
        await writeFile(temporary, JSON.stringify(this.state, null, 2), 'utf8');
        await rename(temporary, this.filePath);
    }
}

export async function createStateStore(): Promise<StateStore> {
    if (process.env.DATABASE_URL) {
        const { createPostgresStateStore } = await import('./postgres-store');
        return createPostgresStateStore(process.env.DATABASE_URL);
    }
    return JsonStateStore.create();
}