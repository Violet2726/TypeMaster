import type { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { createAccountRecord } from '@typemaster/contracts';
import {
    AccountRecordSchema,
    ChallengeAttemptResultSchema,
    ChallengeEntrySchema,
    DailyChallengeSchema
} from '@typemaster/contracts/api';
import {
    AchievementSchema,
    CoachAdviceRecordSchema,
    SessionRecordSchema,
    SkillProfileSchema,
    StreakStateSchema,
    TrainingPlanSchema
} from '@typemaster/contracts/training-state';
import {
    createChallengeEntry,
    createLocalizedDailyChallenge
} from '@typemaster/contracts/server-state';
import { getDatabase, isPostgresConfigured } from '../infra/db/client';
import {
    challengeAttempts,
    coachFeedback,
    dailyChallenges,
    planSteps,
    skillProfiles,
    trainingPlans,
    typingSessions,
    users
} from '../infra/db/schema';
import { createStoreId, readStore, writeStore } from '../state/server-state-file';
import * as localState from '../state/server-state-use-cases';

type AccountRecord = z.infer<typeof AccountRecordSchema>;
type ChallengeAttemptResult = z.infer<typeof ChallengeAttemptResultSchema>;
type ChallengeEntry = z.infer<typeof ChallengeEntrySchema>;
type CoachAdviceRecord = z.infer<typeof CoachAdviceRecordSchema>;
type DailyChallenge = z.infer<typeof DailyChallengeSchema>;
type SessionRecord = z.infer<typeof SessionRecordSchema>;
type SkillProfile = z.infer<typeof SkillProfileSchema>;
type TrainingPlan = z.infer<typeof TrainingPlanSchema>;

export type RepositoryIdentity = {
    provider: 'clerk' | 'local-dev' | 'anonymous',
    providerUserId?: string | null,
    displayName?: string | null,
    email?: string | null,
};

type SubmitChallengeAttemptPayload = {
    challengeId: string,
    userId?: string,
    displayName?: string,
    sessionId: string,
    result?: ChallengeAttemptResult,
};

type UserProfilePayload = {
    achievements?: z.infer<typeof AchievementSchema>[],
    challengeResults?: Record<string, ChallengeEntry>,
    streakState?: z.infer<typeof StreakStateSchema> | null,
    userProfile?: {
        displayName?: string,
    },
};

type AccountIdentityRecord = AccountRecord & {
    authIdentity?: {
        provider: 'clerk' | 'local-dev',
        providerUserId: string,
    },
    email?: string | null,
};

export type TrainingRepository = {
    getUser: (userId: string | undefined) => Promise<AccountRecord | null>,
    getUserForIdentity: (identity: RepositoryIdentity) => Promise<AccountRecord | null>,
    signInUser: (displayName: string) => Promise<AccountRecord>,
    listSessions: (userId: string | undefined) => Promise<SessionRecord[]>,
    saveSession: (userId: string | undefined, session: SessionRecord) => Promise<SessionRecord[]>,
    loadTrainingPlan: (userId: string | undefined) => Promise<TrainingPlan | null>,
    saveTrainingPlan: (userId: string | undefined, trainingPlan: TrainingPlan | null) => Promise<TrainingPlan | null>,
    loadSkillProfile: (userId: string | undefined) => Promise<{
        skillProfile: SkillProfile | null,
        achievements: z.infer<typeof AchievementSchema>[],
        streakState: z.infer<typeof StreakStateSchema> | null,
    }>,
    saveSkillProfile: (userId: string | undefined, snapshot: {
        skillProfile: SkillProfile | null,
        achievements: z.infer<typeof AchievementSchema>[],
        streakState: z.infer<typeof StreakStateSchema> | null,
    }) => Promise<{
        skillProfile: SkillProfile | null,
        achievements: z.infer<typeof AchievementSchema>[],
        streakState: z.infer<typeof StreakStateSchema> | null,
    }>,
    listCoachAdvices: (userId: string | undefined, sessionId?: string) => Promise<CoachAdviceRecord[]>,
    saveCoachAdvice: (userId: string | undefined, record: CoachAdviceRecord) => Promise<CoachAdviceRecord | null>,
    getDailyChallenge: (language?: string) => Promise<DailyChallenge>,
    getChallengeLeaderboard: (challengeId?: string) => Promise<ChallengeEntry[]>,
    submitChallengeAttempt: (payload: SubmitChallengeAttemptPayload) => Promise<ChallengeEntry>,
};

function parseUserProfile(value: unknown): UserProfilePayload {
    return value && typeof value === 'object' && !Array.isArray(value) ? value as UserProfilePayload : {};
}

function getUserProfilePayload(user: { profile: unknown, displayName: string }) {
    const profile = parseUserProfile(user.profile);

    return {
        achievements: Array.isArray(profile.achievements) ? profile.achievements : [],
        challengeResults: profile.challengeResults || {},
        streakState: profile.streakState || null,
        userProfile: {
            displayName: profile.userProfile?.displayName || user.displayName
        }
    };
}

function createProfilePayload(
    user: { profile: unknown, displayName: string },
    patch: Partial<UserProfilePayload>
): UserProfilePayload {
    return {
        ...getUserProfilePayload(user),
        ...patch
    };
}

function parseJsonObject(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function resolveIdentityDisplayName(identity: RepositoryIdentity) {
    const displayName = stringField(identity.displayName).trim();
    const email = stringField(identity.email).trim();

    return displayName || email || 'TypeMaster User';
}

function createIdentityProfile(displayName: string, email?: string | null) {
    return {
        achievements: [],
        challengeResults: {},
        streakState: null,
        userProfile: {
            displayName,
            ...(email ? { email } : {})
        }
    };
}

function stringField(value: unknown, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}

function nullableStringField(value: unknown) {
    return typeof value === 'string' && value ? value : null;
}

function trainingPlanStatus(value: unknown) {
    return value === 'complete' ? 'complete' : 'active';
}

function trainingStepStatus(value: unknown) {
    return value === 'complete' ? 'complete' : 'pending';
}

function sessionFromRow(row: typeof typingSessions.$inferSelect): SessionRecord {
    return SessionRecordSchema.parse({
        id: row.id,
        config: parseJsonObject(row.configSnapshot),
        result: parseJsonObject(row.result),
        timeline: parseJsonObject(row.timeline),
        sourceTextMeta: parseJsonObject(row.draftMeta),
        trainingMeta: row.trainingContext || null,
        challengeContext: row.challengeContext || null
    });
}

function challengeEntryFromRow(row: typeof challengeAttempts.$inferSelect): ChallengeEntry {
    return ChallengeEntrySchema.parse({
        id: row.id,
        challengeId: row.challengeId,
        userId: row.userId || null,
        displayName: row.displayName,
        levelId: row.levelId || null,
        sessionId: row.sessionId,
        wpm: row.wpm,
        accuracy: row.accuracy,
        createdAt: row.createdAt.toISOString()
    });
}

function challengeFromRow(row: typeof dailyChallenges.$inferSelect, leaderboard: ChallengeEntry[] = []): DailyChallenge {
    const draft = parseJsonObject(row.draft) as { text?: string };

    return DailyChallengeSchema.parse({
        id: row.id,
        dateKey: row.dateKey,
        title: row.title,
        summary: row.summary,
        text: draft.text || '',
        config: parseJsonObject(row.config),
        leaderboard
    });
}

function coachAdviceFromRow(row: typeof coachFeedback.$inferSelect): CoachAdviceRecord {
    const providerMeta = parseJsonObject(row.providerMeta) as {
        source?: 'ai' | 'fallback',
        fallbackReasonCode?: string,
        fallbackReasonMessage?: string,
    };

    return CoachAdviceRecordSchema.parse({
        id: row.id,
        sessionId: row.sessionId,
        status: row.status,
        source: providerMeta.source,
        headline: row.headline || undefined,
        summary: row.summary || undefined,
        strengths: Array.isArray(row.strengths) ? row.strengths : [],
        weaknesses: Array.isArray(row.weaknesses) ? row.weaknesses : [],
        nextDrill: row.nextDrill || undefined,
        comparison: row.comparison || undefined,
        providerMeta,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        fallbackReasonCode: providerMeta.fallbackReasonCode,
        fallbackReasonMessage: providerMeta.fallbackReasonMessage
    });
}

function normalizeCoachAdviceRecord(record: CoachAdviceRecord): CoachAdviceRecord {
    return CoachAdviceRecordSchema.parse({
        ...record,
        id: record.id || createStoreId('coach'),
        status: record.status || 'complete',
        strengths: record.strengths || [],
        weaknesses: record.weaknesses || [],
        providerMeta: record.providerMeta || {}
    });
}

function createLocalRepository(): TrainingRepository {
    function getLocalUserForIdentity(identity: RepositoryIdentity) {
        const providerUserId = stringField(identity.providerUserId).trim();
        if (!providerUserId || identity.provider === 'anonymous') {
            return null;
        }

        if (identity.provider === 'local-dev') {
            return localState.getUser(providerUserId);
        }

        const store = readStore();
        const existing = Object.values(store.users).find((user) => {
            const account = user as AccountIdentityRecord;
            return account.authIdentity?.provider === identity.provider
                && account.authIdentity.providerUserId === providerUserId;
        });

        if (existing) {
            const account = existing as AccountIdentityRecord;
            const displayName = resolveIdentityDisplayName(identity);
            const email = identity.email || null;

            if (account.displayName !== displayName || account.email !== email) {
                store.users[account.id] = AccountRecordSchema.parse({
                    ...account,
                    displayName,
                    email,
                    lastSyncedAt: new Date().toISOString(),
                    userProfile: {
                        ...(account.userProfile || {}),
                        displayName,
                        ...(email ? { email } : {})
                    }
                });
                writeStore(store);
                return store.users[account.id];
            }

            return existing;
        }

        const displayName = resolveIdentityDisplayName(identity);
        const account = AccountRecordSchema.parse({
            ...createAccountRecord({
                id: createStoreId('user'),
                displayName
            }),
            authIdentity: {
                provider: identity.provider,
                providerUserId
            },
            email: identity.email || null,
            userProfile: {
                displayName,
                ...(identity.email ? { email: identity.email } : {})
            }
        });

        store.users[account.id] = account;
        store.currentUserId = account.id;
        writeStore(store);

        return account;
    }

    return {
        async getUser(userId) {
            return localState.getUser(userId);
        },
        async getUserForIdentity(identity) {
            return getLocalUserForIdentity(identity);
        },
        async signInUser(displayName) {
            return localState.normalizeUser(displayName);
        },
        async listSessions(userId) {
            return localState.getUser(userId)?.sessions || [];
        },
        async saveSession(userId, session) {
            const user = localState.updateUser(userId, (current) => ({
                ...current,
                sessions: [session, ...(current.sessions || []).filter((item: SessionRecord) => item.id !== session.id)].slice(0, 200),
                lastSyncedAt: new Date().toISOString()
            }));

            return user?.sessions || [];
        },
        async loadTrainingPlan(userId) {
            return localState.getUser(userId)?.trainingPlan || null;
        },
        async saveTrainingPlan(userId, trainingPlan) {
            const user = localState.updateUser(userId, (current) => ({
                ...current,
                trainingPlan,
                lastSyncedAt: new Date().toISOString()
            }));

            return user?.trainingPlan || null;
        },
        async loadSkillProfile(userId) {
            const user = localState.getUser(userId);

            return {
                skillProfile: user?.skillProfile || null,
                achievements: user?.achievements || [],
                streakState: user?.streakState || null
            };
        },
        async saveSkillProfile(userId, { skillProfile, achievements, streakState }) {
            const user = localState.updateUser(userId, (current) => ({
                ...current,
                skillProfile,
                achievements: achievements || current.achievements || [],
                streakState: streakState || current.streakState || null,
                lastSyncedAt: new Date().toISOString()
            }));

            return {
                skillProfile: user?.skillProfile || null,
                achievements: user?.achievements || [],
                streakState: user?.streakState || null
            };
        },
        async listCoachAdvices(userId, sessionId) {
            const records = localState.getUser(userId)?.coachAdvices || [];
            return sessionId
                ? records.filter((record: CoachAdviceRecord) => record.sessionId === sessionId)
                : records;
        },
        async saveCoachAdvice(userId, record) {
            if (!userId) {
                return null;
            }

            const nextRecord = normalizeCoachAdviceRecord(record);
            const user = localState.updateUser(userId, (current) => ({
                ...current,
                coachAdvices: [
                    nextRecord,
                    ...(current.coachAdvices || []).filter((item: CoachAdviceRecord) => (
                        item.sessionId !== nextRecord.sessionId
                    ))
                ].slice(0, 200),
                lastSyncedAt: new Date().toISOString()
            }));

            return user?.coachAdvices?.find((item: CoachAdviceRecord) => item.sessionId === nextRecord.sessionId) || null;
        },
        async getDailyChallenge(language = 'en-US') {
            return localState.getDailyChallenge(language);
        },
        async getChallengeLeaderboard(challengeId) {
            const dailyChallenge = localState.getDailyChallenge();
            const id = challengeId || dailyChallenge.id;
            return (readStore().challenges[id] || dailyChallenge).leaderboard || [];
        },
        async submitChallengeAttempt(payload) {
            return localState.submitChallengeResult(payload);
        }
    };
}

function createPostgresRepository(): TrainingRepository {
    async function getDb() {
        const db = getDatabase();
        if (!db) {
            throw new Error('DATABASE_URL is not configured.');
        }
        return db;
    }

    async function listUserSessions(userId: string | undefined) {
        if (!userId) {
            return [];
        }

        const db = await getDb();
        const rows = await db
            .select()
            .from(typingSessions)
            .where(eq(typingSessions.userId, userId))
            .orderBy(desc(typingSessions.createdAt))
            .limit(200);

        return rows.map(sessionFromRow);
    }

    async function loadLatestSkillProfile(userId: string | undefined) {
        if (!userId) {
            return null;
        }

        const db = await getDb();
        const [profile] = await db
            .select()
            .from(skillProfiles)
            .where(eq(skillProfiles.userId, userId))
            .orderBy(desc(skillProfiles.generatedAt))
            .limit(1);

        return profile
            ? SkillProfileSchema.parse({
                id: profile.id,
                createdAt: profile.generatedAt.toISOString(),
                level: profile.level,
                metrics: profile.metrics,
                weakZones: profile.weakZones,
                summary: profile.summary || ''
            })
            : null;
    }

    async function loadUserTrainingPlan(userId: string | undefined) {
        if (!userId) {
            return null;
        }

        const db = await getDb();
        const [plan] = await db
            .select()
            .from(trainingPlans)
            .where(eq(trainingPlans.userId, userId))
            .orderBy(desc(trainingPlans.updatedAt))
            .limit(1);

        if (!plan) {
            return null;
        }

        const steps = await db
            .select()
            .from(planSteps)
            .where(eq(planSteps.planId, plan.id))
            .orderBy(planSteps.order);

        return TrainingPlanSchema.parse({
            id: plan.id,
            version: plan.version,
            title: plan.title,
            summary: plan.summary,
            status: plan.status,
            updatedAt: plan.updatedAt.toISOString(),
            generatedAt: plan.generatedAt.toISOString(),
            steps: steps.map((step) => ({
                id: step.id,
                order: step.order,
                title: step.title,
                summary: step.summary,
                config: step.config,
                status: step.status,
                text: step.text || undefined,
                completedSessionId: step.completedSessionId || null
            }))
        });
    }

    async function listUserCoachAdvices(userId: string | undefined, sessionId?: string) {
        if (!userId) {
            return [];
        }

        const db = await getDb();
        const rows = await db
            .select()
            .from(coachFeedback)
            .where(sessionId
                ? and(eq(coachFeedback.userId, userId), eq(coachFeedback.sessionId, sessionId))
                : eq(coachFeedback.userId, userId))
            .orderBy(desc(coachFeedback.createdAt))
            .limit(200);

        return rows.map(coachAdviceFromRow);
    }

    async function upsertUserCoachAdvice(userId: string | undefined, record: CoachAdviceRecord) {
        if (!userId) {
            return null;
        }

        const nextRecord = normalizeCoachAdviceRecord(record);
        const providerMeta = {
            ...(nextRecord.providerMeta || {}),
            ...(nextRecord.source ? { source: nextRecord.source } : {}),
            ...(nextRecord.fallbackReasonCode ? { fallbackReasonCode: nextRecord.fallbackReasonCode } : {}),
            ...(nextRecord.fallbackReasonMessage ? { fallbackReasonMessage: nextRecord.fallbackReasonMessage } : {})
        };
        const createdAt = nextRecord.createdAt ? new Date(nextRecord.createdAt) : new Date();
        const updatedAt = nextRecord.updatedAt ? new Date(nextRecord.updatedAt) : new Date();

        const db = await getDb();
        await db
            .insert(coachFeedback)
            .values({
                id: nextRecord.id || createStoreId('coach'),
                userId,
                sessionId: nextRecord.sessionId,
                status: nextRecord.status || 'complete',
                headline: nextRecord.headline || null,
                summary: nextRecord.summary || null,
                strengths: nextRecord.strengths || [],
                weaknesses: nextRecord.weaknesses || [],
                nextDrill: nextRecord.nextDrill || null,
                comparison: nextRecord.comparison || null,
                providerMeta,
                createdAt,
                updatedAt
            })
            .onConflictDoUpdate({
                target: coachFeedback.sessionId,
                set: {
                    status: nextRecord.status || 'complete',
                    headline: nextRecord.headline || null,
                    summary: nextRecord.summary || null,
                    strengths: nextRecord.strengths || [],
                    weaknesses: nextRecord.weaknesses || [],
                    nextDrill: nextRecord.nextDrill || null,
                    comparison: nextRecord.comparison || null,
                    providerMeta,
                    updatedAt
                }
            });

        const [saved] = await listUserCoachAdvices(userId, nextRecord.sessionId);
        return saved || null;
    }

    async function accountFromUserRow(row: typeof users.$inferSelect): Promise<AccountRecord> {
        const profile = getUserProfilePayload(row);

        return AccountRecordSchema.parse({
            ...createAccountRecord({
                id: row.id,
                displayName: row.displayName,
                createdAt: row.createdAt.toISOString(),
                lastSyncedAt: row.updatedAt.toISOString()
            }),
            sessions: await listUserSessions(row.id),
            trainingPlan: await loadUserTrainingPlan(row.id),
            skillProfile: await loadLatestSkillProfile(row.id),
            achievements: profile.achievements,
            streakState: profile.streakState,
            coachAdvices: await listUserCoachAdvices(row.id),
            userProfile: profile.userProfile,
            challengeResults: profile.challengeResults
        });
    }

    async function getUserByInternalId(userId: string | undefined) {
        if (!userId) {
            return null;
        }

        const db = await getDb();
        const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

        return row ? accountFromUserRow(row) : null;
    }

    async function getOrCreateUserForIdentity(identity: RepositoryIdentity) {
        const providerUserId = stringField(identity.providerUserId).trim();
        if (!providerUserId || identity.provider === 'anonymous') {
            return null;
        }

        if (identity.provider === 'local-dev') {
            return getUserByInternalId(providerUserId);
        }

        const db = await getDb();
        const [existing] = await db
            .select()
            .from(users)
            .where(eq(users.clerkUserId, providerUserId))
            .limit(1);
        const displayName = resolveIdentityDisplayName(identity);
        const email = nullableStringField(identity.email);

        if (existing) {
            if (existing.displayName !== displayName || existing.email !== email) {
                const [updated] = await db
                    .update(users)
                    .set({
                        displayName,
                        email,
                        profile: createProfilePayload(existing, {
                            userProfile: {
                                displayName,
                                ...(email ? { email } : {})
                            }
                        }),
                        updatedAt: new Date()
                    })
                    .where(eq(users.id, existing.id))
                    .returning();

                return accountFromUserRow(updated);
            }

            return accountFromUserRow(existing);
        }

        const id = createStoreId('user');
        const [created] = await db
            .insert(users)
            .values({
                id,
                clerkUserId: providerUserId,
                displayName,
                email,
                profile: createIdentityProfile(displayName, email)
            })
            .returning();

        return accountFromUserRow(created);
    }

    async function ensureDailyChallenge(challengeId?: string, language = 'en-US') {
        const db = await getDb();
        const dailyChallenge = challengeId
            ? createLocalizedDailyChallenge(language, challengeId.startsWith('daily-') ? challengeId.slice(6) : undefined)
            : createLocalizedDailyChallenge(language);
        const id = challengeId || dailyChallenge.id;
        const [existing] = await db
            .select()
            .from(dailyChallenges)
            .where(eq(dailyChallenges.id, id))
            .limit(1);

        if (existing) {
            return existing;
        }

        const [created] = await db
            .insert(dailyChallenges)
            .values({
                id,
                dateKey: dailyChallenge.dateKey,
                title: dailyChallenge.title,
                summary: dailyChallenge.summary,
                draft: {
                    text: dailyChallenge.text
                },
                config: dailyChallenge.config,
                leaderboardMeta: {}
            })
            .returning();

        return created;
    }

    async function listChallengeEntries(challengeId: string | undefined) {
        if (!challengeId) {
            return [];
        }

        const db = await getDb();
        const rows = await db
            .select()
            .from(challengeAttempts)
            .where(eq(challengeAttempts.challengeId, challengeId))
            .orderBy(desc(challengeAttempts.wpm), desc(challengeAttempts.accuracy))
            .limit(20);

        return rows.map(challengeEntryFromRow);
    }

    return {
        async getUser(userId) {
            return getUserByInternalId(userId);
        },
        async getUserForIdentity(identity) {
            return getOrCreateUserForIdentity(identity);
        },
        async signInUser(displayName) {
            const safeName = String(displayName || '').trim();
            if (!safeName) {
                throw new Error('Display name is required.');
            }

            const db = await getDb();
            const [existing] = await db.select().from(users).where(eq(users.displayName, safeName)).limit(1);

            if (existing) {
                return accountFromUserRow(existing);
            }

            const id = createStoreId('user');
            const [created] = await db
                .insert(users)
                .values({
                    id,
                    clerkUserId: id,
                    displayName: safeName,
                    profile: createIdentityProfile(safeName)
                })
                .returning();

            return accountFromUserRow(created);
        },
        listSessions: listUserSessions,
        async saveSession(userId, session) {
            if (!userId) {
                return [];
            }

            const db = await getDb();
            await db
                .insert(typingSessions)
                .values({
                    id: session.id,
                    userId,
                    draftMeta: session.sourceTextMeta || {},
                    configSnapshot: session.config || {},
                    result: session.result || {},
                    timeline: session.timeline || {},
                    trainingContext: session.trainingMeta || null,
                    challengeContext: session.challengeContext || null
                })
                .onConflictDoUpdate({
                    target: typingSessions.id,
                    set: {
                        draftMeta: session.sourceTextMeta || {},
                        configSnapshot: session.config || {},
                        result: session.result || {},
                        timeline: session.timeline || {},
                        trainingContext: session.trainingMeta || null,
                        challengeContext: session.challengeContext || null
                    }
                });

            return listUserSessions(userId);
        },
        loadTrainingPlan: loadUserTrainingPlan,
        async saveTrainingPlan(userId, trainingPlan) {
            if (!userId || !trainingPlan) {
                return null;
            }

            const db = await getDb();
            const planId = stringField(trainingPlan.id, createStoreId('plan'));
            await db
                .insert(trainingPlans)
                .values({
                    id: planId,
                    userId,
                    version: Number(trainingPlan.version || 1),
                    status: trainingPlanStatus(trainingPlan.status),
                    title: stringField(trainingPlan.title),
                    summary: stringField(trainingPlan.summary),
                    progress: trainingPlan.progress || {},
                    generatedFromProfileId: nullableStringField(trainingPlan.generatedFromProfileId)
                })
                .onConflictDoUpdate({
                    target: trainingPlans.id,
                    set: {
                        status: trainingPlanStatus(trainingPlan.status),
                        title: stringField(trainingPlan.title),
                        summary: stringField(trainingPlan.summary),
                        progress: trainingPlan.progress || {},
                        updatedAt: new Date()
                    }
                });

            await db.delete(planSteps).where(eq(planSteps.planId, planId));

            if (trainingPlan.steps.length) {
                await db.insert(planSteps).values(trainingPlan.steps.map((step, index) => ({
                    id: stringField(step.id, createStoreId('step')),
                    planId,
                    order: Number(step.order ?? index + 1),
                    title: stringField(step.title),
                    summary: stringField(step.summary),
                    config: step.config || {},
                    status: trainingStepStatus(step.status),
                    text: nullableStringField(step.text),
                    completedSessionId: nullableStringField(step.completedSessionId)
                })));
            }

            return loadUserTrainingPlan(userId);
        },
        async loadSkillProfile(userId) {
            if (!userId) {
                return {
                    skillProfile: null,
                    achievements: [],
                    streakState: null
                };
            }

            const db = await getDb();
            const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
            const profile = user ? getUserProfilePayload(user) : null;

            return {
                skillProfile: await loadLatestSkillProfile(userId),
                achievements: profile?.achievements || [],
                streakState: profile?.streakState || null
            };
        },
        async saveSkillProfile(userId, snapshot) {
            if (!userId) {
                return {
                    skillProfile: null,
                    achievements: [],
                    streakState: null
                };
            }

            const db = await getDb();
            const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

            if (!user) {
                return {
                    skillProfile: null,
                    achievements: [],
                    streakState: null
                };
            }

            if (snapshot.skillProfile) {
                await db
                    .insert(skillProfiles)
                    .values({
                        id: snapshot.skillProfile.id || createStoreId('profile'),
                        userId,
                        level: snapshot.skillProfile.level || {},
                        metrics: snapshot.skillProfile.metrics || {},
                        weakZones: snapshot.skillProfile.weakZones || [],
                        summary: snapshot.skillProfile.summary || null
                    })
                    .onConflictDoUpdate({
                        target: skillProfiles.id,
                        set: {
                            level: snapshot.skillProfile.level || {},
                            metrics: snapshot.skillProfile.metrics || {},
                            weakZones: snapshot.skillProfile.weakZones || [],
                            summary: snapshot.skillProfile.summary || null
                        }
                    });
            }

            await db
                .update(users)
                .set({
                    profile: createProfilePayload(user, {
                        achievements: snapshot.achievements,
                        streakState: snapshot.streakState
                    }),
                    updatedAt: new Date()
                })
                .where(eq(users.id, userId));

            return {
                skillProfile: await loadLatestSkillProfile(userId),
                achievements: snapshot.achievements || [],
                streakState: snapshot.streakState || null
            };
        },
        listCoachAdvices: listUserCoachAdvices,
        saveCoachAdvice: upsertUserCoachAdvice,
        async getDailyChallenge(language = 'en-US') {
            const challenge = await ensureDailyChallenge(undefined, language);
            const leaderboard = await listChallengeEntries(challenge.id);

            return challengeFromRow(challenge, leaderboard);
        },
        async getChallengeLeaderboard(challengeId) {
            const challenge = await ensureDailyChallenge(challengeId);
            return listChallengeEntries(challenge.id);
        },
        async submitChallengeAttempt({ challengeId, userId, displayName, sessionId, result }) {
            const db = await getDb();
            const challenge = await ensureDailyChallenge(challengeId);
            const [user] = userId
                ? await db.select().from(users).where(eq(users.id, userId)).limit(1)
                : [];
            const [profile] = userId
                ? await db
                    .select()
                    .from(skillProfiles)
                    .where(eq(skillProfiles.userId, userId))
                    .orderBy(desc(skillProfiles.generatedAt))
                    .limit(1)
                : [];
            const entry = createChallengeEntry({
                id: createStoreId('challenge'),
                challengeId: challenge.id,
                userId: userId || null,
                displayName: user?.displayName || displayName || 'Guest',
                levelId: (parseJsonObject(profile?.level) as { id?: string }).id || null,
                sessionId,
                result,
                createdAt: new Date().toISOString()
            });

            await db.insert(challengeAttempts).values({
                id: entry.id,
                challengeId: entry.challengeId,
                userId: entry.userId,
                sessionId: entry.sessionId,
                displayName: entry.displayName,
                levelId: entry.levelId,
                wpm: entry.wpm,
                accuracy: entry.accuracy,
                createdAt: new Date(entry.createdAt)
            });

            if (user) {
                const profilePayload = getUserProfilePayload(user);
                await db
                    .update(users)
                    .set({
                        profile: {
                            ...profilePayload,
                            challengeResults: {
                                ...(profilePayload.challengeResults || {}),
                                [challenge.id]: entry
                            }
                        },
                        updatedAt: new Date()
                    })
                    .where(eq(users.id, user.id));
            }

            return entry;
        }
    };
}

export function getTrainingRepository(): TrainingRepository {
    return isPostgresConfigured() ? createPostgresRepository() : createLocalRepository();
}
