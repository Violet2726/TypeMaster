const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const STORE_PATH = path.join(DATA_DIR, 'cloud-store.json');

function ensureStoreFile() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(STORE_PATH)) {
        fs.writeFileSync(STORE_PATH, JSON.stringify({
            users: {},
            challenges: {}
        }, null, 2));
    }
}

function readStore() {
    ensureStoreFile();

    try {
        return JSON.parse(fs.readFileSync(STORE_PATH, 'utf-8'));
    } catch {
        return {
            users: {},
            challenges: {}
        };
    }
}

function writeStore(store) {
    ensureStoreFile();
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
}

function createId(prefix) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeUser(displayName) {
    const safeName = String(displayName || '').trim();
    if (!safeName) {
        throw new Error('Display name is required.');
    }

    const store = readStore();
    const existing = Object.values(store.users).find((user) => user.displayName.toLowerCase() === safeName.toLowerCase());
    const user = existing || {
        id: createId('user'),
        displayName: safeName,
        createdAt: new Date().toISOString(),
        lastSyncedAt: null,
        sessions: [],
        trainingPlan: null,
        skillProfile: null,
        achievements: [],
        streakState: null,
        userProfile: {
            displayName: safeName
        },
        challengeResults: {}
    };

    store.users[user.id] = user;
    writeStore(store);
    return user;
}

function getUser(userId) {
    if (!userId) {
        return null;
    }

    const store = readStore();
    return store.users[userId] || null;
}

function updateUser(userId, updater) {
    const store = readStore();
    const current = store.users[userId];
    if (!current) {
        return null;
    }

    store.users[userId] = updater(current);
    writeStore(store);
    return store.users[userId];
}

function getDailyChallenge(language = 'en-US') {
    const store = readStore();
    const dateKey = new Date().toISOString().slice(0, 10);
    const challengeId = `daily-${dateKey}`;

    if (!store.challenges[challengeId]) {
        store.challenges[challengeId] = {
            id: challengeId,
            dateKey,
            title: language === 'zh-CN' ? '今日挑战' : 'Daily challenge',
            summary: language === 'zh-CN'
                ? '用一轮统一文本比拼稳定输出和准确率。'
                : 'Use one shared text to compare stability and accuracy.',
            text: language === 'zh-CN'
                ? 'steady focus clear rhythm numbers 2048 calm punctuation smooth control steady finish daily challenge mode active'
                : 'steady focus clear rhythm numbers 2048 calm punctuation smooth control steady finish daily challenge mode active',
            config: {
                source: 'builtin',
                mode: 'time',
                durationSeconds: 45,
                wordCount: 25,
                includeNumbers: true,
                includePunctuation: true,
                aiTemplate: 'daily',
                difficulty: 'medium'
            },
            leaderboard: []
        };
        writeStore(store);
    }

    return store.challenges[challengeId];
}

function submitChallengeResult({ challengeId, userId, displayName, sessionId, result }) {
    const store = readStore();
    const challenge = store.challenges[challengeId] || getDailyChallenge();
    const user = userId ? store.users[userId] : null;
    const entry = {
        id: createId('challenge'),
        challengeId,
        userId: userId || null,
        displayName: displayName || 'Guest',
        levelId: user?.skillProfile?.level?.id || null,
        sessionId,
        wpm: result?.wpm || 0,
        accuracy: result?.accuracy || 0,
        createdAt: new Date().toISOString()
    };

    challenge.leaderboard = [entry, ...(challenge.leaderboard || [])]
        .sort((left, right) => {
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

module.exports = {
    getDailyChallenge,
    getUser,
    normalizeUser,
    readStore,
    submitChallengeResult,
    updateUser,
    writeStore
};
