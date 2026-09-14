import {
    CoachReportSchema,
    CompleteRunRequestSchema,
    CompleteRunResponseSchema,
    LeaderboardEntrySchema,
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

/** Typed transport failure so callers can branch on `code` instead of parsing strings. */
export class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly requestId?: string;

    constructor(input: { status: number; code: string; messageKey: string; requestId?: string }) {
        super(input.messageKey);
        this.name = 'ApiError';
        this.status = input.status;
        this.code = input.code;
        this.requestId = input.requestId;
    }
}

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

const RunsSchema = z.object({ runs: z.array(StoredRunSchema) }).strict();
const LeaderboardSchema = z.object({ date: z.string(), entries: z.array(LeaderboardEntrySchema) }).strict();

async function request<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>): Promise<T> {
    const response = await fetch(path, {
        credentials: 'include',
        ...init,
        headers: {
            'content-type': 'application/json',
            ...(init?.headers ?? {})
        }
    });
    const json: unknown = await response.json().catch(() => null);
    if (!response.ok) {
        const error = (json as { error?: { code?: string; messageKey?: string; requestId?: string } } | null)?.error;
        throw new ApiError({
            status: response.status,
            code: error?.code ?? 'request_failed',
            messageKey: error?.messageKey ?? `Request failed: ${response.status}`,
            requestId: error?.requestId
        });
    }
    return schema ? schema.parse(json) : (json as T);
}

export const api = {
    me() {
        return request('/api/me', undefined, MeSchema);
    },
    patchPlayer(patch: Partial<Pick<PlayerContract, 'locale' | 'callSign' | 'difficulty' | 'onboardingComplete'>>) {
        return request('/api/player', { method: 'PATCH', body: JSON.stringify(patch) }, PlayerSchema);
    },
    startRun(body: StartRunRequest, signal?: AbortSignal) {
        return request('/api/runs/start', { method: 'POST', body: JSON.stringify(StartRunRequestSchema.parse(body)), signal }, StartRunResponseSchema);
    },
    completeRun(runId: string, body: CompleteRunRequest) {
        return request(
            `/api/runs/${encodeURIComponent(runId)}/complete`,
            { method: 'POST', body: JSON.stringify(CompleteRunRequestSchema.parse(body)) },
            CompleteRunResponseSchema
        );
    },
    runs() {
        return request('/api/runs', undefined, RunsSchema);
    },
    missions() {
        return request('/api/missions', undefined, MissionSnapshotSchema);
    },
    leaderboard() {
        return request('/api/leaderboards/daily', undefined, LeaderboardSchema);
    },
    coach(runId: string) {
        return request(`/api/coach-reports/${encodeURIComponent(runId)}`, undefined, CoachReportSchema);
    }
};

export type MeResponse = z.infer<typeof MeSchema>;
export type { CompleteRunResponse, MissionContract, PlayerContract, PlayerProgressContract, SettingsContract };
