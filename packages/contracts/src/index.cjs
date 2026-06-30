const API_FALLBACK_CACHE_KEY = 'typemaster:v7:api-fallback-cache';
const API_BASE = '/api';
const REMOTE_API_FLAG = '1';
const SESSION_LIMIT = 50;

const STORAGE_KEYS = {
    install: 'typemaster:v7:install',
    settings: 'typemaster:v7:settings',
    sessions: 'typemaster:v7:sessions',
    coachAdvices: 'typemaster:v7:coach-advice-cache',
    skillProfile: 'typemaster:v7:skill-profile-cache',
    trainingPlan: 'typemaster:v7:missions-cache',
    achievements: 'typemaster:v7:achievements-cache',
    diagnosticJourney: 'typemaster:v7:baseline-mission-cache',
    activeSessionContext: 'typemaster:v7:active-mission-context'
};

const OBSOLETE_STORAGE_KEYS = [
    'typemaster:v6:install',
    'typemaster:v6:settings',
    'typemaster:v6:sessions',
    'typemaster:v6:coach-advice-cache',
    'typemaster:v6:skill-profile-cache',
    'typemaster:v6:missions-cache',
    'typemaster:v6:achievements-cache',
    'typemaster:v6:baseline-mission-cache',
    'typemaster:v6:active-mission-context',
    'typemaster:v6:api-fallback-cache',
    'typemaster:v5:preferences',
    'typemaster:v5:sessions-cache',
    'typemaster:v5:coach-cache',
    'typemaster:v5:skill-profile-cache',
    'typemaster:v5:training-plan-cache',
    'typemaster:v5:diagnostic-resume',
    'typemaster:v5:active-session-context',
    'typemaster:v5:api-fallback-cache',
    'typemaster-stats',
    'typing-raid-history',
    'typing-raid-settings',
    'typing-raid-profile',
    'typing-raid-achievements'
];

const CHALLENGE_TEXT_BY_LANGUAGE = {
    'zh-CN': 'steady focus clear rhythm numbers 2048 calm punctuation smooth control steady finish daily challenge mode active',
    'en-US': 'steady focus clear rhythm numbers 2048 calm punctuation smooth control steady finish daily challenge mode active'
};

const CHALLENGE_SUMMARY_BY_LANGUAGE = {
    'zh-CN': '\u7528\u4e00\u8f6e\u7edf\u4e00\u6587\u672c\u6bd4\u8f83\u7a33\u5b9a\u8f93\u51fa\u548c\u51c6\u786e\u7387\u3002',
    'en-US': 'Use one shared text to compare stability and accuracy.'
};

const CHALLENGE_TITLE_BY_LANGUAGE = {
    'zh-CN': '\u4eca\u65e5\u4efb\u52a1',
    'en-US': 'Daily mission'
};

const DEFAULT_DAILY_CHALLENGE_CONFIG = {
    source: 'builtin',
    mode: 'time',
    durationSeconds: 45,
    wordCount: 25,
    includeNumbers: true,
    includePunctuation: true,
    aiTemplate: 'daily',
    difficulty: 'medium'
};

function getTodayDateKey(now = new Date()) {
    return now.toISOString().slice(0, 10);
}

function getDailyChallengeId(dateKey = getTodayDateKey()) {
    return `daily-${dateKey}`;
}

function createEmptyServerState() {
    return {
        currentUserId: null,
        users: {},
        challenges: {}
    };
}

function createAccountRecord({ id, displayName, createdAt = new Date().toISOString(), lastSyncedAt = null }) {
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

function createDailyChallenge({ language = 'en-US', dateKey = getTodayDateKey() } = {}) {
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

module.exports = {
    API_BASE,
    API_FALLBACK_CACHE_KEY,
    CHALLENGE_SUMMARY_BY_LANGUAGE,
    CHALLENGE_TEXT_BY_LANGUAGE,
    CHALLENGE_TITLE_BY_LANGUAGE,
    DEFAULT_DAILY_CHALLENGE_CONFIG,
    OBSOLETE_STORAGE_KEYS,
    REMOTE_API_FLAG,
    SESSION_LIMIT,
    STORAGE_KEYS,
    createAccountRecord,
    createDailyChallenge,
    createEmptyServerState,
    getDailyChallengeId,
    getTodayDateKey
};
