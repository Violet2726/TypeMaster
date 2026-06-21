/**
 * Game Save System - Persistent game progress and replay data.
 *
 * Apple philosophy: progress should never be lost.
 * Every achievement, every high score, every preference persists
 * across sessions. The game remembers your journey.
 *
 * Storage structure (localStorage with typing-raid-* prefix):
 *   typing-raid-progress     - Player level, XP, rank, total games
 *   typing-raid-best         - Best scores per mode
 *   typing-raid-achievements - Unlocked achievements
 *   typing-raid-replays      - Last 5 game replay snapshots
 *   typing-raid-settings     - User preferences
 *   typing-raid-daily        - Daily challenge streak and history
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PlayerProgress {
    totalXp: number;
    level: number;
    rankId: string;
    totalGames: number;
    totalKills: number;
    totalWaves: number;
    bestCombo: number;
    bestScore: number;
    bestWpm: number;
    totalPlayTime: number; // seconds
    lastPlayedAt: string;
}

export interface GameReplay {
    id: string;
    date: string;
    score: number;
    wave: number;
    wpm: number;
    accuracy: number;
    maxCombo: number;
    enemiesDefeated: number;
    enemiesLeaked: number;
    duration: number; // seconds
    mode: string;
    rating: string;
    // Key moments for replay visualization
    peakCombo: number;
    peakComboWave: number;
    perfectWaves: number;
}

export interface DailyChallengeState {
    currentStreak: number;
    bestStreak: number;
    lastPlayedDate: string;
    todayCompleted: boolean;
    todayBestScore: number;
    history: { date: string; score: number; wave: number }[];
}

export interface GameSettings {
    volume: number;
    musicEnabled: boolean;
    sfxEnabled: boolean;
    difficulty: 'easy' | 'normal' | 'hard';
    theme: string;
    highContrast: boolean;
    screenShake: boolean;
}

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------

const PREFIX = 'typing-raid-';
const KEYS = {
    progress: PREFIX + 'progress',
    best: PREFIX + 'best',
    achievements: PREFIX + 'achievements',
    replays: PREFIX + 'replays',
    settings: PREFIX + 'settings',
    daily: PREFIX + 'daily',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function load<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (raw) return JSON.parse(raw) as T;
    } catch {}
    return fallback;
}

function save(key: string, data: unknown): void {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch {}
}

// ---------------------------------------------------------------------------
// Player Progress
// ---------------------------------------------------------------------------

const DEFAULT_PROGRESS: PlayerProgress = {
    totalXp: 0, level: 1, rankId: 'bronze-1', totalGames: 0,
    totalKills: 0, totalWaves: 0, bestCombo: 0, bestScore: 0, bestWpm: 0,
    totalPlayTime: 0, lastPlayedAt: '',
};

export function loadProgress(): PlayerProgress {
    return load<PlayerProgress>(KEYS.progress, DEFAULT_PROGRESS);
}

export function saveProgress(partial: Partial<PlayerProgress>): PlayerProgress {
    const current = loadProgress();
    const updated = { ...current, ...partial, lastPlayedAt: new Date().toISOString() };
    save(KEYS.progress, updated);
    return updated;
}

export function addGameResult(result: {
    score: number; wave: number; wpm: number; maxCombo: number;
    enemiesDefeated: number; duration: number; accuracy: number;
}): PlayerProgress {
    const p = loadProgress();
    return saveProgress({
        totalGames: p.totalGames + 1,
        totalKills: p.totalKills + result.enemiesDefeated,
        totalWaves: p.totalWaves + result.wave,
        bestCombo: Math.max(p.bestCombo, result.maxCombo),
        bestScore: Math.max(p.bestScore, result.score),
        bestWpm: Math.max(p.bestWpm, result.wpm),
        totalPlayTime: p.totalPlayTime + result.duration,
    });
}

// ---------------------------------------------------------------------------
// Replay System
// ---------------------------------------------------------------------------

const MAX_REPLAYS = 5;

export function saveReplay(replay: GameReplay): GameReplay[] {
    const replays = load<GameReplay[]>(KEYS.replays, []);
    replays.unshift(replay);
    if (replays.length > MAX_REPLAYS) replays.length = MAX_REPLAYS;
    save(KEYS.replays, replays);
    return replays;
}

export function loadReplays(): GameReplay[] {
    return load<GameReplay[]>(KEYS.replays, []);
}

// ---------------------------------------------------------------------------
// Daily Challenge
// ---------------------------------------------------------------------------

const DEFAULT_DAILY: DailyChallengeState = {
    currentStreak: 0, bestStreak: 0, lastPlayedDate: '',
    todayCompleted: false, todayBestScore: 0, history: [],
};

export function loadDaily(): DailyChallengeState {
    const daily = load<DailyChallengeState>(KEYS.daily, DEFAULT_DAILY);
    // Reset today state if it's a new day
    const today = new Date().toISOString().slice(0, 10);
    if (daily.lastPlayedDate !== today) {
        daily.todayCompleted = false;
        daily.todayBestScore = 0;
    }
    return daily;
}

export function saveDailyResult(score: number, wave: number): DailyChallengeState {
    const daily = loadDaily();
    const today = new Date().toISOString().slice(0, 10);
    const isToday = daily.lastPlayedDate === today;

    const updated: DailyChallengeState = {
        currentStreak: isToday ? daily.currentStreak : daily.currentStreak + 1,
        bestStreak: Math.max(daily.bestStreak, isToday ? daily.currentStreak : daily.currentStreak + 1),
        lastPlayedDate: today,
        todayCompleted: true,
        todayBestScore: Math.max(daily.todayBestScore, score),
        history: [...daily.history, { date: today, score, wave }].slice(-30),
    };
    save(KEYS.daily, updated);
    return updated;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: GameSettings = {
    volume: 50, musicEnabled: true, sfxEnabled: true,
    difficulty: 'normal', theme: 'default', highContrast: false, screenShake: true,
};

export function loadSettings(): GameSettings {
    return load<GameSettings>(KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: Partial<GameSettings>): GameSettings {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    save(KEYS.settings, updated);
    return updated;
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

export function loadAchievements(): string[] {
    return load<string[]>(KEYS.achievements, []);
}

export function unlockAchievement(id: string): string[] {
    const achievements = loadAchievements();
    if (!achievements.includes(id)) {
        achievements.push(id);
        save(KEYS.achievements, achievements);
    }
    return achievements;
}

// ---------------------------------------------------------------------------
// Export/Import (for cloud sync)
// ---------------------------------------------------------------------------

export function exportSaveData(): string {
    return JSON.stringify({
        version: 1,
        progress: loadProgress(),
        replays: loadReplays(),
        daily: loadDaily(),
        settings: loadSettings(),
        achievements: loadAchievements(),
        exportedAt: new Date().toISOString(),
    }, null, 2);
}

export function importSaveData(json: string): boolean {
    try {
        const data = JSON.parse(json);
        if (data.version !== 1) return false;
        if (data.progress) save(KEYS.progress, data.progress);
        if (data.replays) save(KEYS.replays, data.replays);
        if (data.daily) save(KEYS.daily, data.daily);
        if (data.settings) save(KEYS.settings, data.settings);
        if (data.achievements) save(KEYS.achievements, data.achievements);
        return true;
    } catch {
        return false;
    }
}
