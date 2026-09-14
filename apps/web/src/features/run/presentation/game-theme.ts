/**
 * The renderer never decides what a brand colour is.
 *
 * Presentation resolves a `GameVisualTheme` from the user's accessibility settings and injects
 * it into the canvas, so Dark / High Contrast / Reduced Effects can share one renderer while
 * the domain stays completely unaware that colour exists.
 */

export type GameVisualTheme = {
    /** Radial vignette drawn behind the arena. */
    background: string;
    backgroundEdge: string;
    foreground: string;
    muted: string;
    accent: string;
    danger: string;
    warning: string;
    success: string;
    rare: string;
    enemyNormal: string;
    enemyTargeted: string;
    enemyDamaged: string;
    enemyBoss: string;
    particleCorrect: string;
    particleWrong: string;
    particleSurge: string;
};

/** Default TypeRift look: cold black, terminal runes, restrained cyan. */
export const BATTLE_THEME: GameVisualTheme = {
    background: 'rgba(126, 214, 255, 0.18)',
    backgroundEdge: 'rgba(8, 12, 24, 0)',
    foreground: '#f8fbff',
    muted: '#b8c4dc',
    accent: '#86e3ff',
    danger: '#ff453a',
    warning: '#ffc36e',
    success: '#32d74b',
    rare: '#9b79ff',
    enemyNormal: 'rgba(143, 223, 255, 0.75)',
    enemyTargeted: 'rgba(134, 227, 255, 1)',
    enemyDamaged: 'rgba(255, 69, 58, 0.9)',
    enemyBoss: 'rgba(255, 195, 113, 0.9)',
    particleCorrect: 'rgba(50, 215, 75, 0.9)',
    particleWrong: 'rgba(255, 69, 58, 0.9)',
    particleSurge: 'rgba(155, 121, 255, 0.9)'
};

/**
 * High contrast: no translucent strokes, no gradient wash. Every mark is fully opaque so it
 * survives a low-quality panel or a bright room.
 */
export const HIGH_CONTRAST_THEME: GameVisualTheme = {
    ...BATTLE_THEME,
    background: 'rgba(0, 0, 0, 0)',
    backgroundEdge: 'rgba(0, 0, 0, 0)',
    foreground: '#ffffff',
    muted: '#d8dee9',
    accent: '#7ef0ff',
    danger: '#ff6b60',
    warning: '#ffd479',
    success: '#4ce36a',
    rare: '#c3a6ff',
    enemyNormal: '#d8dee9',
    enemyTargeted: '#ffffff',
    enemyDamaged: '#ff6b60',
    enemyBoss: '#ffd479'
};

export type GameA11ySettings = {
    enhancedContrast: boolean;
    reduceEffects: boolean;
};

/** Accessibility is a game mode, not a last-minute ARIA pass (guidance §5). */
export function resolveGameTheme({ enhancedContrast, reduceEffects }: GameA11ySettings): GameVisualTheme {
    if (enhancedContrast) return HIGH_CONTRAST_THEME;
    if (reduceEffects) return { ...BATTLE_THEME, background: 'rgba(0, 0, 0, 0)', backgroundEdge: 'rgba(0, 0, 0, 0)' };
    return BATTLE_THEME;
}

/** Ambient motion the renderer is allowed to spend frames on. */
export function allowsAmbientMotion({ reduceEffects }: Pick<GameA11ySettings, 'reduceEffects'>) {
    return !reduceEffects;
}
