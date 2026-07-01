export type GameMode = 'expedition' | 'daily-anomaly' | 'first-descent';
export type GamePhase = 'idle' | 'playing' | 'paused' | 'gameover';
export type GameRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type GameUpgradeCategory = 'weapon' | 'relic' | 'glyph';

export type GameAreaSnapshot = {
    id?: string;
    name?: string;
    nameZh?: string;
    palette?: string[];
};

export type GameUpgradeSnapshot = {
    id: string;
    category: GameUpgradeCategory | string;
    rarity: GameRarity | string;
    name: string;
    nameZh?: string;
    summary: string;
    stack?: number;
    effect?: Record<string, unknown>;
};

export type GameHudSnapshot = {
    score: number;
    areaIndex: number;
    areaName?: string;
    areaNameZh?: string;
    depth?: number;
    combo: number;
    maxCombo: number;
    lives: number;
    maxLives: number;
    heat: number;
    energy: number;
    surgeReady: boolean;
    level: number;
    xp: number;
    nextUpgradeXp: number;
    accuracy: number;
    wpm: number;
    targetWord: string;
    targetTyped: string;
    progress: number;
    elapsedSeconds: number;
    durationSeconds: number;
    extractAvailable: boolean;
    upgradeCount: number;
};

export type GameCodexEntry = {
    id: string;
    name?: string;
    nameZh?: string;
    category?: string;
    defeated?: boolean;
};

export type GameEvent = {
    type: string;
    enemyId?: string;
    enemy?: Partial<GameEnemySnapshot>;
    hp?: number;
    count?: number;
    mode?: GameMode;
    endReason?: string;
    char?: string;
    expected?: string;
    upgrade?: GameUpgradeSnapshot;
};

export type GameRuntimeState = {
    phase: GamePhase;
    mode?: GameMode;
    upgradeChoices?: GameUpgradeSnapshot[] | null;
    [key: string]: unknown;
};

export type GameResult = {
    version?: string;
    mode?: GameMode;
    score: number;
    wpm: number;
    accuracy: number;
    maxCombo: number;
    areaIndex?: number;
    areaId?: string;
    areaName?: string;
    areaNameZh?: string;
    depth?: number;
    durationSeconds: number;
    enemiesDefeated?: number;
    eliteDefeated?: number;
    bossesDefeated?: number;
    enemiesLeaked?: number;
    totalCharsTyped?: number;
    totalCharsCorrect?: number;
    focusChars?: string[];
    weakestChars?: string[];
    endReason?: string | null;
    extractReason?: string | null;
    upgradeBuild?: GameUpgradeSnapshot[];
    anomalyId?: string | null;
    anomaly?: Record<string, unknown> | null;
    livesRemaining?: number;
    heat?: number;
    codexProgress?: GameCodexProgress | null;
    recommendation?: string;
    isVictory?: boolean;
    isBest?: boolean;
};

export type GameEnemySnapshot = {
    id: string;
    type: string;
    archetype?: string;
    label?: string;
    labelZh?: string;
    role?: string;
    color?: string;
    word: string;
    typed: string;
    xRatio: number;
    y: number;
    hp: number;
    maxHp: number;
    shield?: number;
    isTarget?: boolean;
    elite?: boolean;
    boss?: boolean;
    bossId?: string;
};

export type GameSnapshot = {
    version?: string;
    phase: GamePhase;
    mode?: GameMode;
    anomaly?: Record<string, unknown> | null;
    area?: GameAreaSnapshot;
    hud: GameHudSnapshot;
    arena: {
        safeLineY?: number;
        feedback?: unknown;
        profile?: unknown;
        enemies: GameEnemySnapshot[];
    };
    upgradeChoices?: GameUpgradeSnapshot[];
    activeUpgrades?: GameUpgradeSnapshot[];
    codexProgress?: GameCodexProgress;
    overlay?: {
        type: 'result' | 'mode-select' | 'upgrade-choice';
        result?: GameResult;
        isVictory?: boolean;
        choices?: GameUpgradeSnapshot[];
    } | null;
    liveMessage?: string;
};

export type GameSession = {
    id?: string;
    kind?: string;
    completedAt?: string;
    durationSeconds?: number;
    result?: Partial<GameResult> & {
        completedAt?: string;
        topErrorChars?: string[];
    };
    gameMeta?: Record<string, unknown>;
    trainingMeta?: Record<string, unknown>;
};

export type Insight = {
    totalSessions: number;
    latestSession: GameSession | null;
    recent7: Record<string, unknown>;
    recent30: Record<string, unknown>;
    gameSummary?: Record<string, unknown>;
    [key: string]: unknown;
};

export type GameCodexProgress = {
    discovered: number;
    total: number;
    enemies?: GameCodexEntry[];
    bosses?: GameCodexEntry[];
    upgrades?: GameCodexEntry[];
};
