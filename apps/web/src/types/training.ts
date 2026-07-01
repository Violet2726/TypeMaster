import type { GameResult } from './game';

export type CountStat = {
    label?: string;
    count?: number;
};

export type SkillProfile = {
    topErrorChars?: string[];
    weakZones?: Array<{ label?: string }>;
};

export type TrainingSessionResult = Partial<GameResult> & {
    completedAt?: string;
    durationSeconds?: number;
    errorCharStats?: CountStat[];
    topErrorChars?: string[];
};

export type TrainingSessionMeta = {
    type?: string;
    surface?: string;
    title?: string;
    focusChars?: string[];
    score?: number;
    depth?: number;
    areaIndex?: number;
    endReason?: string;
    durationSeconds?: number;
    maxCombo?: number;
    weakestChars?: string[];
};

export type TrainingSession = {
    id?: string;
    kind?: string;
    completedAt?: string;
    durationSeconds?: number;
    result?: TrainingSessionResult;
    gameMeta?: TrainingSessionMeta;
    trainingMeta?: TrainingSessionMeta;
};
