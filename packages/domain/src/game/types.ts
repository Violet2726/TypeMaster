export type RunMode = 'first-rift' | 'expedition' | 'daily-rift' | 'repair-trial' | 'quick-pulse';
export type Difficulty = 'flow' | 'standard' | 'surge';
export type RunPhase = 'idle' | 'running' | 'upgrade' | 'paused' | 'complete';
export type RunEndReason = 'victory' | 'fracture' | 'timeout' | 'extracted';
export type UpgradeCategory = 'weapon' | 'relic' | 'glyph';
export type UpgradeRarity = 'common' | 'rare' | 'epic';

export type RunEnemy = {
    id: string;
    archetypeId: string;
    word: string;
    typed: string;
    lane: number;
    pressure: number;
    speed: number;
    hp: number;
    maxHp: number;
    boss: boolean;
};

export type RunUpgrade = {
    id: string;
    category: UpgradeCategory;
    rarity: UpgradeRarity;
    titleKey: string;
    descriptionKey: string;
    stack: number;
    maxStacks: number;
};

export type RunCounters = {
    typed: number;
    correct: number;
    errors: number;
    defeated: number;
    bosses: number;
    cleanStreak: number;
};

export type RunState = {
    contentVersion: 2;
    id: string;
    mode: RunMode;
    difficulty: Difficulty;
    phase: RunPhase;
    seed: string;
    elapsedMs: number;
    durationMs: number;
    areaIndex: number;
    wave: number;
    bossesSpawned: number;
    spawnIndex: number;
    spawnCooldownMs: number;
    score: number;
    combo: number;
    maxCombo: number;
    fracture: number;
    energy: number;
    xp: number;
    level: number;
    nextUpgradeXp: number;
    currentTargetId: string | null;
    currentTargetHadError: boolean;
    focusChars: string[];
    enemies: RunEnemy[];
    upgrades: RunUpgrade[];
    upgradeChoices: RunUpgrade[];
    counters: RunCounters;
    weakCounts: Record<string, number>;
    encounteredIds: string[];
    defeatedBossIds: string[];
    areaErrorBuffersUsed: number;
    areaLeakMemoriesUsed: number;
    secondLightUsed: boolean;
    lumenMilestone: number;
    eventIndex: number;
    endReason: RunEndReason | null;
};

export type RunCommand =
    | { type: 'start' }
    | { type: 'pause' }
    | { type: 'resume' }
    | { type: 'type'; char: string }
    | { type: 'surge' }
    | { type: 'choose-upgrade'; upgradeId: string }
    | { type: 'extract' };

export type RunEvent = {
    id: number;
    type:
        | 'started'
        | 'paused'
        | 'resumed'
        | 'spawned'
        | 'typed'
        | 'error'
        | 'defeated'
        | 'leaked'
        | 'upgrade-ready'
        | 'upgrade-chosen'
        | 'surge'
        | 'area-changed'
        | 'second-light'
        | 'lumen-cascade'
        | 'completed';
    enemyId?: string;
    value?: number | string;
};

export type ReplayEntry = {
    atMs: number;
    command: RunCommand;
};

export type ReplayLog = {
    contentVersion: 2;
    seed: string;
    mode: RunMode;
    difficulty: Difficulty;
    focusChars: string[];
    endedAtMs: number;
    entries: ReplayEntry[];
};

export type RunSnapshot = {
    contentVersion: 2;
    id: string;
    mode: RunMode;
    difficulty: Difficulty;
    phase: RunPhase;
    elapsedMs: number;
    durationMs: number;
    areaIndex: number;
    areaId: string;
    wave: number;
    score: number;
    combo: number;
    fracture: number;
    energy: number;
    level: number;
    xp: number;
    nextUpgradeXp: number;
    enemies: RunEnemy[];
    upgrades: RunUpgrade[];
    upgradeChoices: RunUpgrade[];
    endReason: RunEndReason | null;
    accuracy: number;
    wpm: number;
};

export type RunResult = {
    contentVersion: 2;
    runId: string;
    mode: RunMode;
    difficulty: Difficulty;
    seed: string;
    score: number;
    accuracy: number;
    wpm: number;
    maxCombo: number;
    durationMs: number;
    areaIndex: number;
    endReason: RunEndReason;
    defeated: number;
    bosses: number;
    weakChars: string[];
    upgradeIds: string[];
    encounteredIds: string[];
    defeatedBossIds: string[];
};

export type CreateRunOptions = {
    id: string;
    mode: RunMode;
    difficulty?: Difficulty;
    seed: string;
    focusChars?: string[];
};
