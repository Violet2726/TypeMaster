export type GameMode = 'expedition' | 'daily-anomaly' | 'first-descent';
export type GamePhase = 'idle' | 'playing' | 'paused' | 'gameover';

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
    upgradeBuild?: Array<Record<string, unknown>>;
    anomalyId?: string | null;
    anomaly?: Record<string, unknown> | null;
    livesRemaining?: number;
    heat?: number;
    codexProgress?: GameCodexProgress | null;
    recommendation?: string;
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
    area?: {
        id?: string;
        name?: string;
        nameZh?: string;
        palette?: string[];
    };
    hud: Record<string, any>;
    arena: {
        safeLineY?: number;
        feedback?: unknown;
        profile?: unknown;
        enemies: GameEnemySnapshot[];
    };
    upgradeChoices?: Array<Record<string, any>>;
    activeUpgrades?: Array<Record<string, any>>;
    codexProgress?: GameCodexProgress;
    overlay?: {
        type: string;
        result?: GameResult;
        isVictory?: boolean;
        choices?: Array<Record<string, any>>;
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
    gameMeta?: Record<string, any>;
    trainingMeta?: Record<string, any>;
};

export type Insight = {
    totalSessions: number;
    latestSession: GameSession | null;
    recent7: Record<string, any>;
    recent30: Record<string, any>;
    gameSummary?: Record<string, any>;
    [key: string]: any;
};

export type GameCodexProgress = {
    discovered: number;
    total: number;
    enemies?: Array<Record<string, unknown>>;
    bosses?: Array<Record<string, unknown>>;
    upgrades?: Array<Record<string, unknown>>;
};
