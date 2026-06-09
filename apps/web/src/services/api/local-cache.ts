import {
    API_FALLBACK_CACHE_KEY,
    createAccountRecord,
    getDailyChallengeId,
    getTodayDateKey
} from '@typemaster/contracts';
import {
    createLocalizedDailyChallenge,
    mergeDailyChallengeSnapshot,
    normalizeServerState
} from '@typemaster/contracts/server-state';
import { readClientCache, writeClientCache } from '../storage';

const ServerStateCacheSchema = {
    parse: normalizeServerState
};

export function readApiFallbackCache() {
    return readClientCache(API_FALLBACK_CACHE_KEY, normalizeServerState(null), ServerStateCacheSchema);
}

export function writeApiFallbackCache(state) {
    writeClientCache(API_FALLBACK_CACHE_KEY, state, ServerStateCacheSchema);
}

export function createId(prefix) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function slugify(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function getCurrentUserRecord(state) {
    if (!state.currentUserId) {
        return null;
    }

    return state.users[state.currentUserId] || null;
}

export function buildPublicUser(record) {
    if (!record) {
        return null;
    }

    return {
        id: record.id,
        displayName: record.displayName,
        createdAt: record.createdAt,
        lastSyncedAt: record.lastSyncedAt || null
    };
}

export function createFallbackAccountRecord(displayName) {
    return createAccountRecord({
        id: createId(slugify(displayName) || 'user'),
        displayName
    });
}

export function ensureChallengeForToday(state, language = 'en-US') {
    const dateKey = getTodayDateKey();
    const challengeId = getDailyChallengeId(dateKey);
    const localizedChallenge = createLocalizedDailyChallenge(language, dateKey);

    if (!state.challenges[challengeId]) {
        state.challenges[challengeId] = mergeDailyChallengeSnapshot(null, localizedChallenge);
        writeApiFallbackCache(state);
        return state.challenges[challengeId];
    }

    state.challenges[challengeId] = mergeDailyChallengeSnapshot(state.challenges[challengeId], localizedChallenge);

    return state.challenges[challengeId];
}
