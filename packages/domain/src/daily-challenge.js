/**
 * Daily Challenge System
 *
 * Deterministic daily challenges based on date seed.
 * Each day offers a unique challenge with specific modifiers
 * and a global leaderboard-style score.
 *
 * Apple philosophy: daily rituals create habit loops.
 * Simple, rewarding, and worth coming back for.
 */

// ---------------------------------------------------------------------------
// Seed-based challenge generation
// ---------------------------------------------------------------------------

/**
 * Generate a deterministic seed from a date string (YYYY-MM-DD).
 */
export function dateToSeed(dateStr) {
    let hash = 0;
    for (let i = 0; i < dateStr.length; i++) {
        const ch = dateStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + ch;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Simple seeded PRNG (mulberry32).
 */
export function seededRandom(seed) {
    let t = seed + 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Get today's date string in YYYY-MM-DD format.
 */
export function getTodayString() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

// ---------------------------------------------------------------------------
// Challenge modifiers
// ---------------------------------------------------------------------------

const CHALLENGE_TYPES = [
    { id: 'speed_run',     name: 'Speed Run',     nameZh: '���ٳ��', desc: '�����ٶ�+30%, score x2',   speedMod: 1.3, scoreMod: 2.0, wordFilter: null },
    { id: 'precision',     name: 'Precision',     nameZh: '��׼���', desc: 'ֻ��tank��boss, accuracyҪ��', speedMod: 0.8, scoreMod: 1.5, wordFilter: 'long' },
    { id: 'swarm',         name: 'Swarm',         nameZh: '��Ⱥ��Ϯ', desc: '����normal����, score x1.5', speedMod: 1.1, scoreMod: 1.5, wordFilter: 'short' },
    { id: 'boss_rush',     name: 'Boss Rush',     nameZh: 'Boss��ս', desc: 'ֻ��boss, score x3',         speedMod: 1.0, scoreMod: 3.0, wordFilter: 'boss' },
    { id: 'no_powerups',   name: 'No Power-ups',  nameZh: '��˫ģʽ', desc: '�޵���, ������, score x2.5', speedMod: 1.0, scoreMod: 2.5, wordFilter: null },
    { id: 'long_words',    name: 'Long Words',    nameZh: '������ս', desc: '���е���8+��ĸ, score x2',   speedMod: 0.9, scoreMod: 2.0, wordFilter: 'long' },
    { id: 'marathon',      name: 'Marathon',      nameZh: '������',   desc: '20��, score x1.5',           speedMod: 1.0, scoreMod: 1.5, wordFilter: null },
];

/**
 * Get today's daily challenge configuration.
 * Deterministic: same day = same challenge.
 */
export function getDailyChallenge(dateStr) {
    const seed = dateToSeed(dateStr || getTodayString());
    const typeIdx = seed % CHALLENGE_TYPES.length;
    const type = CHALLENGE_TYPES[typeIdx];

    // Additional modifiers based on seed
    const rng = seededRandom(seed);
    const extraSpeedMod = 0.9 + rng * 0.2; // 0.9 - 1.1

    return {
        id: 'daily-' + (dateStr || getTodayString()),
        date: dateStr || getTodayString(),
        type: type.id,
        name: type.name,
        nameZh: type.nameZh,
        desc: type.desc,
        speedMod: type.speedMod * extraSpeedMod,
        scoreMod: type.scoreMod,
        wordFilter: type.wordFilter,
        seed,
    };
}

/**
 * Check if a word matches the daily challenge filter.
 */
export function filterWordForChallenge(word, filter) {
    if (!filter) return true;
    if (filter === 'short') return word.length <= 4;
    if (filter === 'long') return word.length >= 6;
    if (filter === 'boss') return word.length >= 6;
    return true;
}

// ---------------------------------------------------------------------------
// Daily challenge score storage
// ---------------------------------------------------------------------------

const DAILY_SCORE_KEY = 'typing-raid-daily-scores';

export function loadDailyScores() {
    try {
        const raw = localStorage.getItem(DAILY_SCORE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return {};
}

export function saveDailyScore(dateStr, score) {
    const scores = loadDailyScores();
    const existing = scores[dateStr] || 0;
    if (score > existing) {
        scores[dateStr] = score;
        try {
            localStorage.setItem(DAILY_SCORE_KEY, JSON.stringify(scores));
        } catch {}
    }
    return scores[dateStr];
}

export function getDailyBestScore(dateStr) {
    const scores = loadDailyScores();
    return scores[dateStr] || 0;
}
