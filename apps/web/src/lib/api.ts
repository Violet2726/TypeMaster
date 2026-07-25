import {
    CompleteRunRequestSchema,
    CompleteRunResponseSchema,
    MissionSnapshotSchema,
    PlayerSchema,
    StartRunRequestSchema,
    StartRunResponseSchema,
    StoredRunSchema,
    type CompleteRunRequest,
    type CompleteRunResponse,
    type MissionContract,
    type PlayerContract,
    type PlayerProgressContract,
    type SettingsContract,
    type StartRunRequest
} from '@typerift/contracts';
import { z } from 'zod';

const MeSchema = z
    .object({
        player: PlayerSchema,
        progress: z.object({
            resonanceLevel: z.number(),
            resonanceXp: z.number(),
            shards: z.number(),
            unlockedUpgradeIds: z.array(z.string()),
            codexIds: z.array(z.string()),
            achievementIds: z.array(z.string()),
            activeDays: z.number(),
            lastActiveDate: z.string().nullable()
        }),
        missionSnapshot: MissionSnapshotSchema,
        settings: z.record(z.unknown()).optional()
    })
    .strict();

async function request<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>): Promise<T> {
    const response = await fetch(path, {
        ...init,
        headers: {
            'content-type': 'application/json',
            ...(init?.headers ?? {})
        }
    });
    if (!response.ok) {
        let message = `Request failed: ${response.status}`;
        try {
            const body = (await response.json()) as { error?: { messageKey?: string } };
            if (body.error?.messageKey) message = body.error.messageKey;
        } catch {
            // ignore parse failures
        }
        throw new Error(message);
    }
    const json = await response.json();
    return schema ? schema.parse(json) : (json as T);
}

export const api = {
    me() {
        return request('/api/me', undefined, MeSchema);
    },
    patchPlayer(patch: Partial<Pick<PlayerContract, 'locale' | 'callSign' | 'difficulty' | 'onboardingComplete'>>) {
        return request('/api/player', { method: 'PATCH', body: JSON.stringify(patch) }, PlayerSchema);
    },
    startRun(body: StartRunRequest) {
        return request('/api/runs/start', { method: 'POST', body: JSON.stringify(StartRunRequestSchema.parse(body)) }, StartRunResponseSchema);
    },
    completeRun(runId: string, body: CompleteRunRequest) {
        return request(
            `/api/runs/${runId}/complete`,
            { method: 'POST', body: JSON.stringify(CompleteRunRequestSchema.parse(body)) },
            CompleteRunResponseSchema
        );
    },
    listRuns() {
        return request('/api/runs', undefined, z.object({ runs: z.array(StoredRunSchema) }).strict());
    },
    missions() {
        return request('/api/missions', undefined, MissionSnapshotSchema);
    },
    dailyLeaderboard() {
        return request(
            '/api/leaderboards/daily',
            undefined,
            z
                .object({
                    date: z.string(),
                    entries: z.array(
                        z.object({
                            rank: z.number(),
                            callSign: z.string(),
                            score: z.number(),
                            accuracy: z.number(),
                            runId: z.string()
                        })
                    )
                })
                .strict()
        );
    },
    coachReport(runId: string) {
        return request(
            `/api/coach-reports/${runId}`,
            undefined,
            z
                .object({
                    runId: z.string(),
                    status: z.enum(['local', 'pending', 'ready']),
                    summaryKey: z.string(),
                    focusKeys: z.array(z.string()),
                    polishedText: z.string().nullable()
                })
                .strict()
        );
    }
};

export type MeResponse = z.infer<typeof MeSchema>;
export type { CompleteRunResponse, MissionContract, PlayerContract, PlayerProgressContract, SettingsContract };