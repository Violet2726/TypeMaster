import type { z } from 'zod';
import { createAccountRecord } from '@typemaster/contracts';
import {
    AccountRecordSchema,
    ChallengeAttemptResultSchema,
    ChallengeEntrySchema
} from '@typemaster/contracts/api';
import {
    createChallengeEntry,
    createLocalizedDailyChallenge,
    mergeDailyChallengeSnapshot
} from '@typemaster/contracts/server-state';
import { createStoreId, readStore, writeStore, type ServerState } from './server-state-file';

type AccountRecord = z.infer<typeof AccountRecordSchema>;
type ChallengeEntry = z.infer<typeof ChallengeEntrySchema>;
type ChallengeAttemptResult = z.infer<typeof ChallengeAttemptResultSchema>;

type SubmitChallengeResultPayload = {
    challengeId: string,
    userId?: string,
    displayName?: string,
    sessionId: string,
    result?: ChallengeAttemptResult,
};

function mergeDailyChallengeIntoStore(store: ServerState, language = 'en-US') {
    const challenge = createLocalizedDailyChallenge(language);
    store.challenges[challenge.id] = mergeDailyChallengeSnapshot(store.challenges[challenge.id] || null, challenge);
    return store.challenges[challenge.id];
}

export function normalizeUser(displayName: string) {
    const safeName = String(displayName || '').trim();
    if (!safeName) {
        throw new Error('Display name is required.');
    }

    const store = readStore();
    const existing = Object.values(store.users).find((user: AccountRecord) => (
        user.displayName.toLowerCase() === safeName.toLowerCase()
    ));
    const user = existing || AccountRecordSchema.parse(createAccountRecord({
        id: createStoreId('user'),
        displayName: safeName
    }));

    store.users[user.id] = user;
    writeStore(store);
    return user;
}

export function getUser(userId: string | undefined) {
    if (!userId) {
        return null;
    }

    const store = readStore();
    return store.users[userId] || null;
}

export function updateUser(userId: string | undefined, updater: (current: AccountRecord) => AccountRecord) {
    const store = readStore();
    const current = userId ? store.users[userId] : null;
    if (!current || !userId) {
        return null;
    }

    store.users[userId] = updater(current);
    writeStore(store);
    return store.users[userId];
}

export function getDailyChallenge(language = 'en-US') {
    const store = readStore();
    const challenge = mergeDailyChallengeIntoStore(store, language);
    writeStore(store);

    return challenge;
}

export function submitChallengeResult({ challengeId, userId, displayName, sessionId, result }: SubmitChallengeResultPayload) {
    const store = readStore();
    const challenge = store.challenges[challengeId] || mergeDailyChallengeIntoStore(store);
    const user = userId ? store.users[userId] : null;
    const levelId = user?.skillProfile?.level?.id || null;
    const entry = createChallengeEntry({
        id: createStoreId('challenge'),
        challengeId,
        userId: userId || null,
        displayName: displayName || 'Guest',
        levelId,
        sessionId,
        result,
        createdAt: new Date().toISOString()
    });

    challenge.leaderboard = [entry, ...(challenge.leaderboard || [])]
        .sort((left: ChallengeEntry, right: ChallengeEntry) => {
            if (right.wpm !== left.wpm) {
                return right.wpm - left.wpm;
            }

            return right.accuracy - left.accuracy;
        })
        .slice(0, 20);

    store.challenges[challengeId] = challenge;

    if (userId && store.users[userId]) {
        store.users[userId].challengeResults = {
            ...(store.users[userId].challengeResults || {}),
            [challengeId]: entry
        };
    }

    writeStore(store);
    return entry;
}
