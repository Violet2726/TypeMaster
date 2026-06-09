export const API_FALLBACK_CACHE_KEY = 'typemaster:v5:api-fallback-cache';
export const API_BASE = '/api';
export const REMOTE_API_FLAG = '1';
export const SESSION_LIMIT = 50;

export const STORAGE_KEYS = {
    settings: 'typemaster:v5:preferences',
    sessions: 'typemaster:v5:sessions-cache',
    coachAdvices: 'typemaster:v5:coach-cache',
    skillProfile: 'typemaster:v5:skill-profile-cache',
    trainingPlan: 'typemaster:v5:training-plan-cache',
    diagnosticJourney: 'typemaster:v5:diagnostic-resume',
    activeSessionContext: 'typemaster:v5:active-session-context'
};

export const CHALLENGE_TEXT_BY_LANGUAGE = {
    'zh-CN': 'steady focus clear rhythm numbers 2048 calm punctuation smooth control steady finish daily challenge mode active',
    'en-US': 'steady focus clear rhythm numbers 2048 calm punctuation smooth control steady finish daily challenge mode active'
};

export const CHALLENGE_SUMMARY_BY_LANGUAGE = {
    'zh-CN': '\u7528\u4e00\u8f6e\u7edf\u4e00\u6587\u672c\u6bd4\u8f83\u7a33\u5b9a\u8f93\u51fa\u548c\u51c6\u786e\u7387\u3002',
    'en-US': 'Use one shared text to compare stability and accuracy.'
};

export const CHALLENGE_TITLE_BY_LANGUAGE = {
    'zh-CN': '\u4eca\u65e5\u6311\u6218',
    'en-US': 'Daily challenge'
};

export const DEFAULT_DAILY_CHALLENGE_CONFIG = {
    source: 'builtin',
    mode: 'time',
    durationSeconds: 45,
    wordCount: 25,
    includeNumbers: true,
    includePunctuation: true,
    aiTemplate: 'daily',
    difficulty: 'medium'
};

export function getTodayDateKey(now = new Date()) {
    return now.toISOString().slice(0, 10);
}

export function getDailyChallengeId(dateKey = getTodayDateKey()) {
    return `daily-${dateKey}`;
}

export function createEmptyServerState() {
    return {
        currentUserId: null,
        users: {},
        challenges: {}
    };
}

export function createAccountRecord({ id, displayName, createdAt = new Date().toISOString(), lastSyncedAt = null }) {
    return {
        id,
        displayName,
        createdAt,
        lastSyncedAt,
        sessions: [],
        trainingPlan: null,
        skillProfile: null,
        achievements: [],
        streakState: null,
        coachAdvices: [],
        userProfile: {
            displayName
        },
        challengeResults: {}
    };
}

export function createDailyChallenge({ language = 'en-US', dateKey = getTodayDateKey() } = {}) {
    return {
        id: getDailyChallengeId(dateKey),
        dateKey,
        title: CHALLENGE_TITLE_BY_LANGUAGE[language] || CHALLENGE_TITLE_BY_LANGUAGE['en-US'],
        summary: CHALLENGE_SUMMARY_BY_LANGUAGE[language] || CHALLENGE_SUMMARY_BY_LANGUAGE['en-US'],
        text: CHALLENGE_TEXT_BY_LANGUAGE[language] || CHALLENGE_TEXT_BY_LANGUAGE['en-US'],
        config: {
            ...DEFAULT_DAILY_CHALLENGE_CONFIG
        },
        leaderboard: []
    };
}
