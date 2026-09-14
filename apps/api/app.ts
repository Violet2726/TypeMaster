import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { Redis } from '@upstash/redis';
import { buildCoachPolishPayload } from '@typerift/ai';
import {
    CompleteRunRequestSchema,
    PlayerSchema,
    SettingsSchema,
    StartRunRequestSchema,
    type PlayerProgressContract
} from '@typerift/contracts';
import {
    CONTENT_VERSION,
    EMPTY_PLAYER_PROGRESS,
    advanceMissions,
    applyRunProgress,
    buildMissionSet,
    buildMissionSnapshot,
    grantMissionRewards,
    hashRunResult,
    replayRun,
    type Mission,
    type PlayerProgress,
    type RunResult
} from '@typerift/domain';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { Inngest } from 'inngest';
import { serve as serveInngest } from 'inngest/hono';
import { z } from 'zod';
import { AuthError, resolvePlayerId } from './lib/auth';
import { MemoryStateStore, createStateStore, type CoachReport, type RunRecord, type StateStore } from './infra/store';

type AppOptions = {
    store?: StateStore;
    signingSecret?: string;
    now?: () => Date;
    captureException?: (error: unknown, context: { requestId: string; path: string }) => void;
};

const PlayerPatchSchema = z
    .object({
        locale: z.enum(['zh-CN', 'en-US']).optional(),
        callSign: z.string().trim().min(1).max(24).optional(),
        difficulty: z.enum(['flow', 'standard', 'surge']).optional(),
        onboardingComplete: z.boolean().optional()
    })
    .strict();

const DEFAULT_SETTINGS = SettingsSchema.parse({
    theme: 'light',
    locale: 'zh-CN',
    reduceMotion: false,
    reduceTransparency: false,
    reduceEffects: false,
    enhancedContrast: false,
    colorSafe: false,
    noFlash: false,
    reactionAssist: false,
    music: true,
    effects: true,
    voice: false,
    textScale: 1
});

function dateKey(date: Date) {
    return date.toISOString().slice(0, 10);
}

function weekKey(date: Date) {
    const copy = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const day = copy.getUTCDay() || 7;
    copy.setUTCDate(copy.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(copy.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((copy.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
    return `${copy.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function message(error: unknown) {
    return error instanceof Error ? error.message : 'Unknown error';
}

function safeEqual(left: string, right: string) {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
}

export async function createApi(options: AppOptions = {}) {
    const store = options.store ?? (await createStateStore());
    const now = options.now ?? (() => new Date());
    const signingSecret =
        options.signingSecret ?? process.env.RUN_SIGNING_SECRET ?? (process.env.NODE_ENV === 'production' ? '' : 'typerift-local-signing-key');
    if (!signingSecret) throw new Error('RUN_SIGNING_SECRET is required in production.');
    const redis =
        process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
            ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })
            : null;
    const aiEnabled = process.env.AI_COACH_ENABLED === 'true' && Boolean(process.env.AI_API_URL) && Boolean(process.env.AI_API_KEY);
    const inngest = new Inngest({ id: 'typerift-v2' });
    const coachFunction = inngest.createFunction({ id: 'polish-coach-report', triggers: [{ event: 'typerift/coach.requested' }] }, async ({ event, step }) => {
        const data = z
            .object({ runId: z.string().min(1).max(100), playerId: z.string().min(1).max(100), locale: z.enum(['zh-CN', 'en-US']) })
            .strict()
            .parse(event.data);
        const run = await store.getRun(data.runId);
        if (!run?.result || run.playerId !== data.playerId) throw new Error('Coach run is unavailable.');
        const runResult = run.result;
        const polishedText = await step.run('polish-aggregate-report', async () => {
            const response = await fetch(process.env.AI_API_URL!, {
                method: 'POST',
                headers: { authorization: `Bearer ${process.env.AI_API_KEY}`, 'content-type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: 'Polish this aggregate typing-game report into at most four concise coaching sentences. Do not infer or request raw input.'
                        },
                        { role: 'user', content: JSON.stringify(buildCoachPolishPayload(runResult, data.locale)) }
                    ],
                    temperature: 0.25
                })
            });
            if (!response.ok) throw new Error(`AI coach provider returned ${response.status}.`);
            const payload = z
                .object({ choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1) })
                .parse(await response.json());
            return payload.choices[0]!.message.content.slice(0, 1_200);
        });
        await store.saveCoachReport(data.playerId, {
            runId: data.runId,
            status: 'ready',
            summaryKey: runResult.accuracy >= 96 ? 'coach.summary.stable' : 'coach.summary.repair',
            focusKeys: runResult.weakChars.slice(0, 3).map((char) => `coach.focus.${char}`),
            polishedText
        });
        return { ok: true };
    });
    const inngestHandler = serveInngest({ client: inngest, functions: [coachFunction] });

    const app = new Hono<{ Variables: { requestId: string } }>();
    app.use(
        '*',
        cors({
            origin: process.env.CORS_ORIGIN?.split(',').map((value) => value.trim()) ?? ['http://localhost:5173', 'http://127.0.0.1:5173'],
            allowHeaders: ['content-type', 'authorization', 'x-request-id', 'x-typerift-player'],
            allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS']
        })
    );
    app.use('*', secureHeaders());
    app.use(
        '/api/*',
        bodyLimit({
            maxSize: 1024 * 1024,
            onError: (context) =>
                context.json({ error: { code: 'payload_too_large', messageKey: 'api.error.payloadTooLarge', requestId: context.get('requestId') } }, 413)
        })
    );
    app.use('/api/*', async (context, next) => {
        const requestId = context.req.header('x-request-id') ?? randomUUID();
        context.set('requestId', requestId);
        context.header('x-request-id', requestId);
        const started = Date.now();
        try {
            await next();
            console.info(JSON.stringify({ level: 'info', requestId, path: context.req.path, status: context.res.status, durationMs: Date.now() - started }));
        } catch (error) {
            options.captureException?.(error, { requestId, path: context.req.path });
            console.error(JSON.stringify({ level: 'error', requestId, path: context.req.path, error: message(error) }));
            if (error instanceof AuthError) {
                return context.json({ error: { code: 'auth_error', messageKey: 'api.error.auth', requestId } }, error.status);
            }
            return context.json({ error: { code: 'internal_error', messageKey: 'api.error.internal', requestId } }, 500);
        }
    });
    app.on(['GET', 'POST', 'PUT'], '/api/inngest', (context) => inngestHandler(context));

    async function ensurePlayer(playerId: string) {
        let player = await store.getPlayer(playerId);
        if (!player) {
            const timestamp = now().toISOString();
            player = PlayerSchema.parse({
                id: playerId,
                locale: DEFAULT_SETTINGS.locale,
                callSign: `Pilot-${playerId.slice(-4)}`,
                difficulty: 'standard',
                onboardingComplete: false,
                createdAt: timestamp,
                updatedAt: timestamp
            });
            await store.savePlayer(player);
        }
        let progress = (await store.getProgress(playerId)) as PlayerProgressContract | null;
        if (!progress) {
            progress = EMPTY_PLAYER_PROGRESS;
            await store.saveProgress(playerId, progress);
        }
        const current = now();
        const day = dateKey(current);
        const week = weekKey(current);
        let missions = ((await store.getMissions(playerId)) as Mission[] | null) ?? [];
        const hasCurrentDaily = missions.some((mission) => mission.cadence === 'daily' && mission.periodKey === day);
        const hasCurrentWeekly = missions.some((mission) => mission.cadence === 'weekly' && mission.periodKey === week);
        if (!hasCurrentDaily || !hasCurrentWeekly) {
            const fresh = buildMissionSet(day, week);
            missions = [
                ...(hasCurrentDaily ? missions.filter((mission) => mission.cadence === 'daily') : fresh.filter((mission) => mission.cadence === 'daily')),
                ...(hasCurrentWeekly ? missions.filter((mission) => mission.cadence === 'weekly') : fresh.filter((mission) => mission.cadence === 'weekly'))
            ];
            await store.saveMissions(playerId, missions);
        }
        return { player, progress, missions, missionSnapshot: buildMissionSnapshot(missions, current) };
    }

    async function identity(context: { req: { raw: Request } }) {
        return resolvePlayerId(context.req.raw);
    }

    function signTicket(payload: {
        playerId: string;
        runId: string;
        mode: string;
        difficulty: string;
        seed: string;
        expiresAt: string;
    }) {
        const body = [
            payload.playerId,
            payload.runId,
            payload.mode,
            payload.difficulty,
            payload.seed,
            payload.expiresAt,
            String(CONTENT_VERSION)
        ].join('|');
        return createHmac('sha256', signingSecret).update(body).digest('base64url');
    }

    function verifyTicket(
        ticket: string,
        payload: { playerId: string; runId: string; mode: string; difficulty: string; seed: string; expiresAt: string }
    ) {
        return safeEqual(ticket, signTicket(payload));
    }

    function startPayload(run: RunRecord, playerId: string) {
        const ticket = signTicket({
            playerId,
            runId: run.id,
            mode: run.mode,
            difficulty: run.difficulty,
            seed: run.seed,
            expiresAt: run.expiresAt
        });
        return {
            runId: run.id,
            mode: run.mode,
            difficulty: run.difficulty,
            seed: run.seed,
            contentVersion: CONTENT_VERSION,
            expiresAt: run.expiresAt,
            ticket
        };
    }

    function completePayload(args: {
        run: RunResult;
        verified: boolean;
        progression: PlayerProgressContract;
        missionSnapshot: ReturnType<typeof buildMissionSnapshot>;
        rewards: {
            runXp: number;
            runShards: number;
            missionShards: number;
            newCodexIds: string[];
            newAchievementIds: string[];
            completedMissionIds: string[];
        };
        idempotent: boolean;
    }) {
        return {
            run: args.run,
            verified: args.verified,
            progression: args.progression,
            missionSnapshot: args.missionSnapshot,
            rewards: args.rewards,
            idempotent: args.idempotent
        };
    }

    app.get('/health', (context) => context.json({ ok: true, service: 'typerift-api', contentVersion: CONTENT_VERSION }));
    app.get('/api/me', async (context) => {
        const playerId = await identity(context);
        const snapshot = await ensurePlayer(playerId);
        return context.json({
            player: snapshot.player,
            progress: snapshot.progress,
            missionSnapshot: snapshot.missionSnapshot,
            settings: DEFAULT_SETTINGS
        });
    });
    app.patch('/api/player', async (context) => {
        const playerId = await identity(context);
        const parsed = PlayerPatchSchema.safeParse(await context.req.json());
        if (!parsed.success) {
            return context.json({ error: { code: 'invalid_player', messageKey: 'api.error.invalidPlayer', requestId: context.get('requestId') } }, 400);
        }
        const current = (await ensurePlayer(playerId)).player;
        const player = PlayerSchema.parse({ ...current, ...parsed.data, updatedAt: now().toISOString() });
        await store.savePlayer(player);
        return context.json(player);
    });
    app.post('/api/runs/start', async (context) => {
        const playerId = await identity(context);
        await ensurePlayer(playerId);
        const parsed = StartRunRequestSchema.safeParse(await context.req.json());
        if (!parsed.success) {
            return context.json({ error: { code: 'invalid_run', messageKey: 'api.error.invalidRun', requestId: context.get('requestId') } }, 400);
        }
        if (parsed.data.mode === 'daily-rift' && !context.req.header('authorization') && process.env.NODE_ENV === 'production') {
            return context.json({ error: { code: 'daily_online_required', messageKey: 'api.error.dailyOnlineRequired', requestId: context.get('requestId') } }, 409);
        }
        const id = parsed.data.clientRunId ?? randomUUID();
        const existing = await store.getRun(id);
        if (existing) {
            if (existing.playerId !== playerId) {
                return context.json({ error: { code: 'forbidden', messageKey: 'api.error.forbidden', requestId: context.get('requestId') } }, 403);
            }
            return context.json(startPayload(existing, playerId));
        }
        const timestamp = now();
        const expiresAt = new Date(timestamp.getTime() + 30 * 60_000).toISOString();
        const seed = parsed.data.mode === 'daily-rift' ? `daily:${dateKey(timestamp)}:standard` : randomBytes(16).toString('hex');
        const difficulty = parsed.data.mode === 'daily-rift' ? 'standard' : (parsed.data.difficulty ?? 'standard');
        const signature = signTicket({ playerId, runId: id, mode: parsed.data.mode, difficulty, seed, expiresAt });
        const run: RunRecord = {
            id,
            playerId,
            mode: parsed.data.mode,
            difficulty,
            seed,
            contentVersion: CONTENT_VERSION,
            expiresAt,
            signature,
            result: null,
            verified: false,
            completedAt: null
        };
        await store.saveRun(run);
        return context.json(startPayload(run, playerId), 201);
    });
    app.post('/api/runs/:id/complete', async (context) => {
        const playerId = await identity(context);
        const parsed = CompleteRunRequestSchema.safeParse(await context.req.json());
        if (!parsed.success) {
            return context.json(
                { error: { code: 'invalid_completion', messageKey: 'api.error.invalidCompletion', requestId: context.get('requestId') } },
                400
            );
        }
        const id = context.req.param('id');
        const commandLog = parsed.data.commandLog;
        if (commandLog.contentVersion !== CONTENT_VERSION) {
            return context.json(
                { error: { code: 'content_version_mismatch', messageKey: 'api.error.contentVersion', requestId: context.get('requestId') } },
                422
            );
        }

        return store.withTransaction(async (tx) => {
            let run = await tx.getRun(id);
            if (run && run.playerId !== playerId) {
                return context.json({ error: { code: 'forbidden', messageKey: 'api.error.forbidden', requestId: context.get('requestId') } }, 403);
            }
            const snapshot = await ensurePlayer(playerId);
            if (run?.result) {
                const emptyRewards = {
                    runXp: 0,
                    runShards: 0,
                    missionShards: 0,
                    newCodexIds: [] as string[],
                    newAchievementIds: [] as string[],
                    completedMissionIds: [] as string[]
                };
                return context.json(
                    completePayload({
                        run: run.result,
                        verified: run.verified,
                        progression: snapshot.progress,
                        missionSnapshot: snapshot.missionSnapshot,
                        rewards: emptyRewards,
                        idempotent: true
                    })
                );
            }

            const isDaily = commandLog.mode === 'daily-rift' || run?.mode === 'daily-rift';
            if (!run) {
                if (isDaily) {
                    return context.json(
                        { error: { code: 'daily_start_required', messageKey: 'api.error.dailyStartRequired', requestId: context.get('requestId') } },
                        409
                    );
                }
                run = {
                    id,
                    playerId,
                    mode: commandLog.mode,
                    difficulty: commandLog.difficulty,
                    seed: commandLog.seed,
                    contentVersion: CONTENT_VERSION,
                    expiresAt: now().toISOString(),
                    signature: 'offline-sync',
                    result: null,
                    verified: false,
                    completedAt: null
                };
            }

            const metadataValid =
                commandLog.seed === run.seed &&
                commandLog.mode === run.mode &&
                commandLog.difficulty === run.difficulty &&
                commandLog.contentVersion === CONTENT_VERSION;
            if (!metadataValid) {
                return context.json(
                    { error: { code: 'verification_failed', messageKey: 'api.error.verificationFailed', requestId: context.get('requestId') } },
                    422
                );
            }

            let verified = false;
            if (run.mode === 'daily-rift') {
                if (!parsed.data.ticket || !verifyTicket(parsed.data.ticket, {
                    playerId,
                    runId: run.id,
                    mode: run.mode,
                    difficulty: run.difficulty,
                    seed: run.seed,
                    expiresAt: run.expiresAt
                })) {
                    return context.json(
                        { error: { code: 'invalid_ticket', messageKey: 'api.error.invalidTicket', requestId: context.get('requestId') } },
                        422
                    );
                }
                if (now().toISOString() > run.expiresAt) {
                    return context.json(
                        { error: { code: 'ticket_expired', messageKey: 'api.error.ticketExpired', requestId: context.get('requestId') } },
                        422
                    );
                }
                verified = true;
            } else if (parsed.data.ticket) {
                verified = verifyTicket(parsed.data.ticket, {
                    playerId,
                    runId: run.id,
                    mode: run.mode,
                    difficulty: run.difficulty,
                    seed: run.seed,
                    expiresAt: run.expiresAt
                });
            }

            const accepted = replayRun(commandLog, id) as RunResult;
            if (run.mode === 'daily-rift') {
                const expectedHash = hashRunResult(accepted);
                if (!expectedHash) {
                    return context.json(
                        { error: { code: 'daily_replay_failed', messageKey: 'api.error.dailyReplayFailed', requestId: context.get('requestId') } },
                        422
                    );
                }
            }

            const completedAt = now().toISOString();
            const activeDate = dateKey(now());
            const advancedMissions = advanceMissions(snapshot.missions as Mission[], accepted, completedAt);
            const rewarded = grantMissionRewards(advancedMissions, completedAt);
            const progressed = applyRunProgress(snapshot.progress as PlayerProgress, accepted, activeDate, rewarded.missionShards);
            const completed: RunRecord = { ...run, result: accepted, verified, completedAt };
            const report: CoachReport = {
                runId: id,
                status: aiEnabled ? 'pending' : 'local',
                summaryKey: accepted.accuracy >= 96 ? 'coach.summary.stable' : 'coach.summary.repair',
                focusKeys: accepted.weakChars.slice(0, 3).map((char) => `coach.focus.${char}`),
                polishedText: null
            };

            await Promise.all([
                tx.saveRun(completed),
                tx.saveProgress(playerId, progressed.progress),
                tx.saveMissions(playerId, rewarded.missions),
                tx.saveCoachReport(playerId, report),
                redis?.del(`typerift:v2:leaderboard:${activeDate}`)
            ]);
            if (aiEnabled) {
                await inngest.send({ name: 'typerift/coach.requested', data: { runId: id, playerId, locale: snapshot.player.locale } });
            }

            return context.json(
                completePayload({
                    run: accepted,
                    verified,
                    progression: progressed.progress,
                    missionSnapshot: buildMissionSnapshot(rewarded.missions, now()),
                    rewards: {
                        runXp: progressed.delta.runXp,
                        runShards: progressed.delta.runShards,
                        missionShards: rewarded.missionShards,
                        newCodexIds: progressed.delta.newCodexIds,
                        newAchievementIds: progressed.delta.newAchievementIds,
                        completedMissionIds: rewarded.completedMissionIds
                    },
                    idempotent: false
                })
            );
        });
    });
    app.get('/api/runs', async (context) => {
        const playerId = await identity(context);
        const runs = (await store.listRuns(playerId))
            .filter((run) => run.result)
            .map((run) => ({ id: run.id, playerId, result: run.result, verified: run.verified, completedAt: run.completedAt }));
        return context.json({ runs });
    });
    app.get('/api/missions', async (context) => {
        const playerId = await identity(context);
        const snapshot = await ensurePlayer(playerId);
        return context.json(snapshot.missionSnapshot);
    });
    app.get('/api/leaderboards/daily', async (context) => {
        const activeDate = dateKey(now());
        const cacheKey = `typerift:v2:leaderboard:${activeDate}`;
        if (redis) {
            const cached = await redis.get(cacheKey);
            if (cached) return context.json(cached);
        }
        const entries = (await store.listDailyLeaderboard(activeDate))
            .filter((entry) => entry.verified && entry.result?.mode === 'daily-rift')
            .sort((left, right) => (right.result?.score ?? 0) - (left.result?.score ?? 0))
            .slice(0, 20)
            .map((entry, index) => ({
                rank: index + 1,
                callSign: entry.callSign,
                score: entry.result?.score ?? 0,
                accuracy: entry.result?.accuracy ?? 0,
                runId: entry.id
            }));
        const payload = { date: activeDate, entries };
        if (redis) await redis.set(cacheKey, payload, { ex: 30 });
        return context.json(payload);
    });
    app.get('/api/coach-reports/:runId', async (context) => {
        const playerId = await identity(context);
        const report = await store.getCoachReport(context.req.param('runId'));
        if (!report || report.playerId !== playerId) {
            return context.json({ error: { code: 'not_found', messageKey: 'api.error.notFound', requestId: context.get('requestId') } }, 404);
        }
        const payload: Omit<typeof report, 'playerId'> = { ...report };
        delete (payload as { playerId?: string }).playerId;
        return context.json(payload);
    });

    app.notFound((context) =>
        context.json({ error: { code: 'not_found', messageKey: 'api.error.notFound', requestId: context.get('requestId') ?? randomUUID() } }, 404)
    );
    return app;
}

export const createTestApi = () =>
    createApi({ store: new MemoryStateStore(), signingSecret: 'test-secret', now: () => new Date('2026-07-16T08:00:00.000Z') });