import { Redis } from '@upstash/redis';
import { ChallengeEntrySchema } from '@typemaster/contracts/api';

type ChallengeEntry = typeof ChallengeEntrySchema._type;

let redis: Redis | null = null;

function isRedisConfigured() {
    return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function getRedis() {
    if (!isRedisConfigured()) {
        return null;
    }

    if (!redis) {
        redis = Redis.fromEnv();
    }

    return redis;
}

function getLeaderboardKey(challengeId: string) {
    return `typemaster:challenge:${challengeId}:leaderboard`;
}

export async function readCachedChallengeLeaderboard(challengeId: string | undefined) {
    const client = challengeId ? getRedis() : null;
    if (!client || !challengeId) {
        return null;
    }

    const value = await client.get<unknown>(getLeaderboardKey(challengeId));
    const parsed = ChallengeEntrySchema.array().safeParse(value);

    return parsed.success ? parsed.data : null;
}

export async function cacheChallengeLeaderboard(challengeId: string | undefined, leaderboard: ChallengeEntry[]) {
    const client = challengeId ? getRedis() : null;
    if (!client || !challengeId) {
        return;
    }

    await client.set(getLeaderboardKey(challengeId), leaderboard, {
        ex: Number(process.env.CHALLENGE_LEADERBOARD_CACHE_SECONDS || 300)
    });
}

export function resetLeaderboardCacheForTests() {
    redis = null;
}
