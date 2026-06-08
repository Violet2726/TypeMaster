const CLOUD_STATE_KEY = 'typemaster:v4:cloud-store';
const CLOUD_API_BASE = '/api/cloud';
const REMOTE_CLOUD_FLAG = '1';
const CHALLENGE_TEXT_BY_LANGUAGE = {
    'zh-CN': 'steady focus clear rhythm numbers 2048 calm punctuation smooth control steady finish daily challenge mode active',
    'en-US': 'steady focus clear rhythm numbers 2048 calm punctuation smooth control steady finish daily challenge mode active'
};

function getLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return null;
    }

    return window.localStorage;
}

function readCloudState() {
    const storage = getLocalStorage();
    if (!storage) {
        return {
            currentUserId: null,
            users: {},
            challenges: {}
        };
    }

    try {
        const raw = storage.getItem(CLOUD_STATE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;

        return {
            currentUserId: parsed?.currentUserId || null,
            users: parsed?.users || {},
            challenges: parsed?.challenges || {}
        };
    } catch {
        return {
            currentUserId: null,
            users: {},
            challenges: {}
        };
    }
}

function writeCloudState(state) {
    const storage = getLocalStorage();
    if (!storage) {
        return;
    }

    storage.setItem(CLOUD_STATE_KEY, JSON.stringify(state));
}

function createId(prefix) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return `${prefix}-${crypto.randomUUID()}`;
    }

    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function slugify(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function getCurrentUserRecord(state) {
    if (!state.currentUserId) {
        return null;
    }

    return state.users[state.currentUserId] || null;
}

function buildPublicUser(record) {
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

function ensureChallengeForToday(state, language = 'en-US') {
    const dateKey = new Date().toISOString().slice(0, 10);
    const challengeId = `daily-${dateKey}`;

    if (!state.challenges[challengeId]) {
        state.challenges[challengeId] = {
            id: challengeId,
            dateKey,
            title: language === 'zh-CN' ? '今日挑战' : 'Daily challenge',
            summary: language === 'zh-CN'
                ? '用一轮统一文本比拼稳定输出和准确率。'
                : 'Use one shared text to compare stability and accuracy.',
            text: CHALLENGE_TEXT_BY_LANGUAGE[language] || CHALLENGE_TEXT_BY_LANGUAGE['en-US'],
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
        writeCloudState(state);
    }

    return state.challenges[challengeId];
}

function getUserHeader() {
    const record = getCurrentUserRecord(readCloudState());
    return record?.id || '';
}

function shouldUseRemoteCloudApi() {
    return import.meta.env?.VITE_TYPEMASTER_REMOTE_CLOUD === REMOTE_CLOUD_FLAG;
}

async function requestJson(pathname, options = {}) {
    if (!shouldUseRemoteCloudApi()) {
        throw new Error('remote cloud api disabled');
    }

    if (typeof fetch !== 'function') {
        throw new Error('fetch unavailable');
    }

    const response = await fetch(`${CLOUD_API_BASE}${pathname}`, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            'x-typemaster-user': getUserHeader(),
            ...(options.headers || {})
        },
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
        throw new Error(`cloud request failed: ${response.status}`);
    }

    return response.json();
}

export class AuthGateway {
    async getCurrentUser() {
        try {
            const payload = await requestJson('/auth/current');
            return buildPublicUser(payload.user);
        } catch {
            const state = readCloudState();
            return buildPublicUser(getCurrentUserRecord(state));
        }
    }

    async signIn({ displayName }) {
        const safeName = String(displayName || '').trim();
        if (!safeName) {
            throw new Error('Display name is required.');
        }

        try {
            const payload = await requestJson('/auth/sign-in', {
                method: 'POST',
                body: { displayName: safeName }
            });
            const state = readCloudState();
            state.currentUserId = payload.user.id;
            state.users[payload.user.id] = {
                ...(state.users[payload.user.id] || {}),
                ...payload.user
            };
            writeCloudState(state);
            return buildPublicUser(payload.user);
        } catch {
            const state = readCloudState();
            const existing = Object.values(state.users).find((user) => user.displayName.toLowerCase() === safeName.toLowerCase());
            const record = existing || {
                id: createId(slugify(safeName) || 'user'),
                displayName: safeName,
                createdAt: new Date().toISOString(),
                lastSyncedAt: null,
                sessions: [],
                trainingPlan: null,
                skillProfile: null,
                challengeResults: {},
                userProfile: {
                    displayName: safeName
                },
                achievements: [],
                streakState: null
            };

            state.users[record.id] = record;
            state.currentUserId = record.id;
            writeCloudState(state);
            return buildPublicUser(record);
        }
    }

    async signOut() {
        const state = readCloudState();
        state.currentUserId = null;
        writeCloudState(state);
        return true;
    }
}

export class SessionSyncGateway {
    async syncSession(session) {
        try {
            const payload = await requestJson('/sessions', {
                method: 'POST',
                body: { session }
            });
            return { status: 'synced', total: payload.sessions.length };
        } catch {
            const state = readCloudState();
            const currentUser = getCurrentUserRecord(state);

            if (!currentUser) {
                return { status: 'skipped' };
            }

            currentUser.sessions = [session, ...(currentUser.sessions || []).filter((item) => item.id !== session.id)].slice(0, 200);
            currentUser.lastSyncedAt = new Date().toISOString();
            writeCloudState(state);

            return { status: 'synced', total: currentUser.sessions.length };
        }
    }

    async pullSessions() {
        try {
            const payload = await requestJson('/sessions');
            return payload.sessions || [];
        } catch {
            const state = readCloudState();
            const currentUser = getCurrentUserRecord(state);
            return currentUser?.sessions || [];
        }
    }
}

export class PlanSyncGateway {
    async syncTrainingPlan(trainingPlan) {
        try {
            await requestJson('/plan', {
                method: 'POST',
                body: { trainingPlan }
            });
            return { status: 'synced' };
        } catch {
            const state = readCloudState();
            const currentUser = getCurrentUserRecord(state);
            if (!currentUser) {
                return { status: 'skipped' };
            }

            currentUser.trainingPlan = trainingPlan;
            currentUser.lastSyncedAt = new Date().toISOString();
            writeCloudState(state);
            return { status: 'synced' };
        }
    }

    async pullTrainingPlan() {
        try {
            const payload = await requestJson('/plan');
            return payload.trainingPlan || null;
        } catch {
            const state = readCloudState();
            const currentUser = getCurrentUserRecord(state);
            return currentUser?.trainingPlan || null;
        }
    }

    async syncSkillProfile(skillProfile, extras = {}) {
        try {
            await requestJson('/profile', {
                method: 'POST',
                body: {
                    skillProfile,
                    achievements: extras.achievements,
                    streakState: extras.streakState
                }
            });
            return { status: 'synced' };
        } catch {
            const state = readCloudState();
            const currentUser = getCurrentUserRecord(state);
            if (!currentUser) {
                return { status: 'skipped' };
            }

            currentUser.skillProfile = skillProfile;
            currentUser.achievements = extras.achievements || currentUser.achievements || [];
            currentUser.streakState = extras.streakState || currentUser.streakState || null;
            currentUser.lastSyncedAt = new Date().toISOString();
            writeCloudState(state);
            return { status: 'synced' };
        }
    }

    async pullSkillProfile() {
        try {
            const payload = await requestJson('/profile');
            return payload.skillProfile || null;
        } catch {
            const state = readCloudState();
            const currentUser = getCurrentUserRecord(state);
            return currentUser?.skillProfile || null;
        }
    }
}

export class ChallengeGateway {
    async createChallenge(options = {}) {
        return this.getDailyChallenge(options.language || 'en-US');
    }

    async getDailyChallenge(language = 'en-US') {
        try {
            const payload = await requestJson(`/challenge/daily?language=${encodeURIComponent(language)}`);
            return payload.challenge;
        } catch {
            const state = readCloudState();
            return ensureChallengeForToday(state, language);
        }
    }

    async submitChallengeResult({ challengeId, result, sessionId }) {
        try {
            const payload = await requestJson('/challenge/result', {
                method: 'POST',
                body: { challengeId, result, sessionId }
            });
            return payload.entry;
        } catch {
            const state = readCloudState();
            const challenge = state.challenges[challengeId] || ensureChallengeForToday(state);
            const currentUser = getCurrentUserRecord(state);
            const entry = {
                id: createId('challenge-result'),
                sessionId,
                displayName: currentUser?.displayName || 'Guest',
                userId: currentUser?.id || null,
                levelId: currentUser?.skillProfile?.level?.id || null,
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

            if (currentUser) {
                currentUser.challengeResults = {
                    ...(currentUser.challengeResults || {}),
                    [challengeId]: entry
                };
            }

            writeCloudState(state);
            return entry;
        }
    }

    async getChallengeLeaderboard(challengeId, language = 'en-US') {
        try {
            const payload = await requestJson(`/challenge/leaderboard?challengeId=${encodeURIComponent(challengeId)}`);
            return payload.leaderboard || [];
        } catch {
            const state = readCloudState();
            const challenge = state.challenges[challengeId] || ensureChallengeForToday(state, language);
            return challenge.leaderboard || [];
        }
    }
}

export const authGateway = new AuthGateway();
export const sessionSyncGateway = new SessionSyncGateway();
export const planSyncGateway = new PlanSyncGateway();
export const challengeGateway = new ChallengeGateway();
