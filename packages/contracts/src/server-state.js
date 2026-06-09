import { z } from 'zod';
import { AccountRecordSchema, ChallengeEntrySchema, DailyChallengeSchema } from './api.js';
import { createDailyChallenge, createEmptyServerState } from './index.js';

export const ServerStateSchema = z.object({
    currentUserId: z.string().nullable(),
    users: z.record(AccountRecordSchema),
    challenges: z.record(DailyChallengeSchema)
});

function normalizeRecordMap(record, schema) {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(record).flatMap(([key, value]) => {
            const parsed = schema.safeParse(value);
            return parsed.success ? [[key, parsed.data]] : [];
        })
    );
}

export function parseServerState(value) {
    return ServerStateSchema.parse(value);
}

export function normalizeServerState(value) {
    const source =
        value && typeof value === 'object' && !Array.isArray(value)
            ? value
            : createEmptyServerState();

    const users = normalizeRecordMap(source.users, AccountRecordSchema);
    const challenges = normalizeRecordMap(source.challenges, DailyChallengeSchema);
    const currentUserId =
        typeof source.currentUserId === 'string' && users[source.currentUserId]
            ? source.currentUserId
            : null;

    return ServerStateSchema.parse({
        currentUserId,
        users,
        challenges
    });
}

export function mergeDailyChallengeSnapshot(existingChallenge, localizedChallenge) {
    const parsedExisting = DailyChallengeSchema.safeParse(existingChallenge);
    const currentChallenge = parsedExisting.success ? parsedExisting.data : null;

    return DailyChallengeSchema.parse({
        id: localizedChallenge.id,
        dateKey: localizedChallenge.dateKey,
        title: localizedChallenge.title,
        summary: localizedChallenge.summary,
        text: localizedChallenge.text,
        config: {
            ...localizedChallenge.config,
            ...(currentChallenge?.config || {})
        },
        leaderboard: currentChallenge?.leaderboard || []
    });
}

export function createLocalizedDailyChallenge(language = 'en-US', dateKey) {
    return createDailyChallenge(
        typeof dateKey === 'string'
            ? { language, dateKey }
            : { language }
    );
}

export function createChallengeEntry({
    id,
    challengeId,
    userId = null,
    displayName = 'Guest',
    levelId = null,
    sessionId,
    result,
    createdAt = new Date().toISOString()
}) {
    return ChallengeEntrySchema.parse({
        id,
        challengeId,
        userId,
        displayName,
        levelId,
        sessionId,
        wpm: result?.wpm || 0,
        accuracy: result?.accuracy || 0,
        createdAt
    });
}
