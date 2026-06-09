import fs from 'node:fs';
import path from 'node:path';
import { readStore } from '../state/server-state-file';
import {
    getDailyChallenge,
    getUser,
    normalizeUser,
    submitChallengeResult,
    updateUser
} from '../state/server-state-use-cases';

const dataDir = path.join(__dirname, '../data');
const storePath = path.join(dataDir, 'server-state.json');

describe('local state fallback', () => {
    beforeEach(() => {
        if (fs.existsSync(storePath)) {
            fs.unlinkSync(storePath);
        }

        if (fs.existsSync(dataDir)) {
            fs.rmSync(dataDir, { recursive: true, force: true });
        }
    });

    test('creates and restores a normalized user', () => {
        const user = normalizeUser('Alice');
        const restored = getUser(user.id);

        expect(restored).toMatchObject({
            id: user.id,
            displayName: 'Alice',
            sessions: [],
            trainingPlan: null,
            skillProfile: null,
            achievements: [],
            challengeResults: {}
        });
    });

    test('creates a daily challenge snapshot', () => {
        const challenge = getDailyChallenge('en-US');

        expect(challenge.id).toMatch(/^daily-/);
        expect(challenge.title).toBe('Daily challenge');
        expect(challenge.summary).toBe('Use one shared text to compare stability and accuracy.');
        expect(challenge.leaderboard).toEqual([]);
    });

    test('updates user sessions and challenge results', () => {
        const user = normalizeUser('Alice');
        updateUser(user.id, (current) => ({
            ...current,
            sessions: [{ id: 'session-1', result: { wpm: 88 } }]
        }));

        const challenge = getDailyChallenge('en-US');
        const entry = submitChallengeResult({
            challengeId: challenge.id,
            userId: user.id,
            displayName: 'Alice',
            sessionId: 'session-1',
            result: { wpm: 88, accuracy: 97 }
        });

        const store = readStore();
        expect(store.users[user.id].sessions).toHaveLength(1);
        expect(store.users[user.id].challengeResults[challenge.id]).toMatchObject({
            sessionId: 'session-1',
            wpm: 88,
            accuracy: 97
        });
        expect(store.challenges[challenge.id].leaderboard[0]).toMatchObject({
            id: entry.id,
            sessionId: 'session-1'
        });
    });

    test('normalizes corrupted server state records on read', () => {
        fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(storePath, JSON.stringify({
            currentUserId: 'broken-user',
            users: {
                'broken-user': {
                    displayName: 'Broken'
                }
            },
            challenges: {
                'daily-broken': {
                    title: 'Broken challenge'
                }
            }
        }, null, 2));

        const store = readStore();

        expect(store.currentUserId).toBeNull();
        expect(store.users).toEqual({});
        expect(store.challenges).toEqual({});
    });
});
