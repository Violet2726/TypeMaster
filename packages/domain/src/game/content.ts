import type { Difficulty, RunMode, UpgradeCategory, UpgradeRarity } from './types';

export const CONTENT_VERSION = 2 as const;

export const MODE_DURATION_MS: Record<RunMode, number> = {
    'first-rift': 240_000,
    expedition: 660_000,
    'daily-rift': 360_000,
    'repair-trial': 90_000,
    'quick-pulse': 60_000
};

export const DIFFICULTY_SPEED: Record<Difficulty, number> = {
    flow: 0.85,
    standard: 1,
    surge: 1.15
};

export const AREAS = [
    { id: 'prism-harbor', titleKey: 'area.prismHarbor', asset: '/game/v2/backgrounds/prism-harbor.webp' },
    { id: 'quiet-forge', titleKey: 'area.quietForge', asset: '/game/v2/backgrounds/quiet-forge.webp' },
    { id: 'black-core', titleKey: 'area.blackCore', asset: '/game/v2/backgrounds/black-core.webp' }
] as const;

export const ENEMY_ARCHETYPES = [
    { id: 'drift', speed: 0.000028, hp: 1, wordMin: 3, wordMax: 5 },
    { id: 'flare', speed: 0.000034, hp: 1, wordMin: 2, wordMax: 4 },
    { id: 'veil', speed: 0.000024, hp: 2, wordMin: 4, wordMax: 6 },
    { id: 'hinge', speed: 0.000021, hp: 2, wordMin: 5, wordMax: 7 },
    { id: 'choir', speed: 0.00003, hp: 1, wordMin: 4, wordMax: 7 },
    { id: 'lattice', speed: 0.000019, hp: 3, wordMin: 6, wordMax: 8 },
    { id: 'cipher', speed: 0.000027, hp: 2, wordMin: 4, wordMax: 8 },
    { id: 'warden', speed: 0.000018, hp: 4, wordMin: 7, wordMax: 10 },
    { id: 'echo', speed: 0.000032, hp: 1, wordMin: 3, wordMax: 6 }
] as const;

export const BOSSES = [
    { id: 'harbor-mind', hp: 6 },
    { id: 'still-engine', hp: 8 },
    { id: 'terminal-sun', hp: 10 }
] as const;

export const WORDS = [
    'arc',
    'calm',
    'drift',
    'echo',
    'flow',
    'glass',
    'harbor',
    'lumen',
    'orbit',
    'prism',
    'quiet',
    'signal',
    'trace',
    'vector',
    'wave',
    'focus',
    'rhythm',
    'steady',
    'bright',
    'cipher',
    'anchor',
    'pulse',
    'forge',
    'silver',
    'motion',
    'clear',
    'thread',
    'frame',
    'shift',
    'resonance',
    'control',
    'system',
    'energy',
    'future',
    'gentle',
    'horizon',
    'kernel',
    'lattice',
    'memory',
    'terminal'
];

export type UpgradeDefinition = {
    id: string;
    category: UpgradeCategory;
    rarity: UpgradeRarity;
    maxStacks: number;
    titleKey: string;
    descriptionKey: string;
};

const stackLimit: Record<UpgradeRarity, number> = { common: 3, rare: 2, epic: 1 };
const upgrade = (id: string, category: UpgradeCategory, rarity: UpgradeRarity): UpgradeDefinition => ({
    id,
    category,
    rarity,
    maxStacks: stackLimit[rarity],
    titleKey: `upgrade.${id}.title`,
    descriptionKey: `upgrade.${id}.description`
});

export const UPGRADES: UpgradeDefinition[] = [
    upgrade('clean-strike', 'weapon', 'common'),
    upgrade('echo-lance', 'weapon', 'common'),
    upgrade('prism-arc', 'weapon', 'common'),
    upgrade('quiet-blade', 'weapon', 'common'),
    upgrade('signal-ray', 'weapon', 'rare'),
    upgrade('orbit-burst', 'weapon', 'rare'),
    upgrade('terminal-wave', 'weapon', 'rare'),
    upgrade('lumen-cascade', 'weapon', 'epic'),
    upgrade('calm-buffer', 'relic', 'common'),
    upgrade('steady-heart', 'relic', 'common'),
    upgrade('glass-memory', 'relic', 'common'),
    upgrade('soft-landing', 'relic', 'common'),
    upgrade('shard-vault', 'relic', 'rare'),
    upgrade('resonance-loop', 'relic', 'rare'),
    upgrade('deep-breath', 'relic', 'rare'),
    upgrade('second-light', 'relic', 'epic'),
    upgrade('focus-glyph', 'glyph', 'common'),
    upgrade('number-glyph', 'glyph', 'common'),
    upgrade('punctuation-glyph', 'glyph', 'common'),
    upgrade('mirror-glyph', 'glyph', 'common'),
    upgrade('velocity-glyph', 'glyph', 'rare'),
    upgrade('fracture-glyph', 'glyph', 'rare'),
    upgrade('boss-glyph', 'glyph', 'rare'),
    upgrade('black-core-key', 'glyph', 'epic')
];

export const ACCEPTED_INPUT = /^[a-z0-9?!-]$/;
