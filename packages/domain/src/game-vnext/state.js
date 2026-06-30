import { AREAS, DAILY_ANOMALIES, GAME_MODE_DEFINITIONS, GAME_PHASES, GAME_VERSION, getGameCopy, normalizeGameMode, sanitizeWordPool } from './content.js';
import { seededRandom } from './rng.js';

function todayKey() {
    return new Date().toISOString().slice(0, 10);
}

export function getDailyAnomaly(dateKey = todayKey()) {
    const rng = seededRandom(`daily-anomaly-${dateKey}`);
    return DAILY_ANOMALIES[Math.floor(rng() * DAILY_ANOMALIES.length) % DAILY_ANOMALIES.length];
}

export function createEmptyCounters() {
    return {
        typed: 0,
        correct: 0,
        errors: 0,
        kills: 0,
        elites: 0,
        bosses: 0,
        leaked: 0,
        upgrades: 0,
        perfectClears: 0
    };
}

export function createGameState(options = {}) {
    const mode = normalizeGameMode(options.mode || options.gameMode);
    const modeDefinition = GAME_MODE_DEFINITIONS[mode];
    const language = options.language || 'zh-CN';
    const seed = String(options.seed || `${mode}-${todayKey()}`);
    const anomaly = mode === 'daily-anomaly' ? getDailyAnomaly(options.dateKey) : null;

    return {
        version: GAME_VERSION,
        phase: GAME_PHASES.idle,
        mode,
        language,
        seed,
        anomaly,
        wordPool: sanitizeWordPool(options.wordPool),
        focusChars: Array.isArray(options.focusChars) ? options.focusChars.slice(0, 6) : [],
        elapsed: 0,
        durationSeconds: modeDefinition.durationSeconds,
        areaIndex: 0,
        area: AREAS[0],
        depth: 1,
        lives: 5,
        maxLives: 5,
        heat: anomaly?.heatBonus || 0,
        score: 0,
        combo: 0,
        maxCombo: 0,
        energy: 0,
        xp: 0,
        level: 1,
        nextUpgradeXp: 90,
        spawnTimer: 0.4,
        spawnIndex: 0,
        currentTargetId: null,
        enemies: [],
        upgrades: [],
        upgradeChoices: null,
        bossSpawnedAreas: [],
        bossDefeated: [],
        codexSeen: {},
        errorCounts: {},
        counters: createEmptyCounters(),
        feedback: null,
        liveMessage: getGameCopy(language).title,
        endedAt: null,
        endReason: null,
        extractReason: null,
        lastStandUsed: false,
        areaErrorBuffer: {}
    };
}

export function startGameState(previous, options = {}) {
    return {
        ...createGameState({
            ...previous,
            ...options,
            gameMode: options.mode || options.gameMode || previous?.mode,
            seed: options.seed || previous?.seed,
            language: options.language || previous?.language,
            focusChars: options.focusChars || previous?.focusChars,
            wordPool: options.wordPool || previous?.wordPool
        }),
        phase: GAME_PHASES.playing,
        liveMessage: getGameCopy(options.language || previous?.language).title
    };
}

