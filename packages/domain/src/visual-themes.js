/**
 * Visual Theme System - Unlockable themes that change the game's appearance.
 *
 * Each theme defines: color palette, particle effects, and UI styling.
 * Themes are unlocked through achievements and can be switched in settings.
 *
 * Apple philosophy: themes should feel like different "editions" of the same product,
 * each with its own personality but sharing the same core experience.
 */

const STORAGE_KEY = 'typing-raid-active-theme';
const UNLOCKED_KEY = 'typing-raid-unlocked-themes';

export const VISUAL_THEMES = {
    default: {
        id: 'default',
        name: 'Classic',
        nameZh: '����',
        desc: 'The original Typing Raid experience',
        unlockCondition: null, // Always available
        colors: {
            bg: '#000000',
            bgGradientStart: '#08080f',
            bgGradientEnd: '#12121f',
            normal: '#3b9eff',
            fast: '#ffcc02',
            tank: '#ff7b2e',
            boss: '#ff3b5c',
            success: '#34c759',
            error: '#ff3b5c',
            text: '#ffffff',
        },
        particleStyle: 'default',
    },
    gold: {
        id: 'gold',
        name: 'Gold Edition',
        nameZh: '��ɫ��',
        desc: 'Unlock by killing a boss without losing a life',
        unlockCondition: 'boss-nodamage',
        colors: {
            bg: '#0a0800',
            bgGradientStart: '#1a1500',
            bgGradientEnd: '#0d0a00',
            normal: '#ffd700',
            fast: '#ffec80',
            tank: '#ff9500',
            boss: '#ff6b35',
            success: '#ffd700',
            error: '#ff4444',
            text: '#fff8e1',
        },
        particleStyle: 'sparkle',
    },
    purple: {
        id: 'purple',
        name: 'Neon Purple',
        nameZh: '�޺���',
        desc: 'Unlock by scoring 10000+ in a single game',
        unlockCondition: 'highscore-10000',
        colors: {
            bg: '#0a0014',
            bgGradientStart: '#1a002e',
            bgGradientEnd: '#0a0014',
            normal: '#bf5af2',
            fast: '#e040fb',
            tank: '#9c27b0',
            boss: '#ff4081',
            success: '#69f0ae',
            error: '#ff5252',
            text: '#f3e5f5',
        },
        particleStyle: 'neon',
    },
    midnight: {
        id: 'midnight',
        name: 'Midnight Blue',
        nameZh: '��ҹ��',
        desc: 'Unlock by reaching 100 WPM',
        unlockCondition: 'wpm-100',
        colors: {
            bg: '#000014',
            bgGradientStart: '#0a0a2e',
            bgGradientEnd: '#000014',
            normal: '#448aff',
            fast: '#82b1ff',
            tank: '#2962ff',
            boss: '#ff6e40',
            success: '#69f0ae',
            error: '#ff5252',
            text: '#e3f2fd',
        },
        particleStyle: 'aurora',
    },
    crimson: {
        id: 'crimson',
        name: 'Crimson Tide',
        nameZh: '��쳱ϫ',
        desc: 'Unlock by reaching Diamond rank',
        unlockCondition: 'rank-diamond',
        colors: {
            bg: '#140000',
            bgGradientStart: '#2e0a0a',
            bgGradientEnd: '#140000',
            normal: '#ff5252',
            fast: '#ff8a80',
            tank: '#d32f2f',
            boss: '#ff1744',
            success: '#69f0ae',
            error: '#ff1744',
            text: '#ffebee',
        },
        particleStyle: 'ember',
    },
};

/**
 * Get the currently active visual theme.
 */
export function getActiveTheme() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw && VISUAL_THEMES[raw]) return VISUAL_THEMES[raw];
    } catch {}
    return VISUAL_THEMES.default;
}

/**
 * Set the active visual theme.
 */
export function setActiveTheme(themeId) {
    if (!VISUAL_THEMES[themeId]) return;
    try {
        localStorage.setItem(STORAGE_KEY, themeId);
    } catch {}
}

/**
 * Get all unlocked theme IDs.
 */
export function getUnlockedThemes() {
    try {
        const raw = localStorage.getItem(UNLOCKED_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return ['default']; // Default is always unlocked
}

/**
 * Unlock a theme (called when achievement is earned).
 */
export function unlockTheme(themeId) {
    const unlocked = getUnlockedThemes();
    if (unlocked.includes(themeId)) return false;
    unlocked.push(themeId);
    try {
        localStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked));
    } catch {}
    return true;
}

/**
 * Check if a theme is unlocked.
 */
export function isThemeUnlocked(themeId) {
    return getUnlockedThemes().includes(themeId);
}

/**
 * Get theme colors with current theme override.
 * Falls back to default theme colors if theme not found.
 */
export function getThemeColors() {
    const theme = getActiveTheme();
    return theme.colors;
}

/**
 * Get particle style for current theme.
 */
export function getParticleStyle() {
    const theme = getActiveTheme();
    return theme.particleStyle || 'default';
}
