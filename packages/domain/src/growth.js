/**
 * Growth & Progression System
 *
 * Session-to-session progression: XP, ranks, and daily challenges.
 * Apple philosophy: progress should feel earned and visible,
 * with clear milestones that motivate continued play.
 */

// ---------------------------------------------------------------------------
// XP calculation
// ---------------------------------------------------------------------------

/**
 * Calculate XP earned from a game result.
 * Factors: waves cleared, enemies killed, combo, perfect waves, performance.
 */
export function calculateXp(result) {
    if (!result) return 0;

    let xp = 0;

    // Base XP: 50 per wave cleared
    xp += (result.wave || 0) * 50;

    // XP per enemy killed: 10 each
    xp += (result.enemiesDefeated || 0) * 10;

    // Combo bonus: max combo * 5
    xp += (result.maxCombo || 0) * 5;

    // Perfect wave bonus: 100 each
    xp += (result.perfectWaves || 0) * 100;

    // Performance multiplier based on accuracy and WPM
    const accuracy = result.accuracy || 0;
    const wpm = result.wpm || 0;
    let perfMultiplier = 1.0;
    if (accuracy >= 0.95 && wpm >= 40) perfMultiplier = 1.5;
    else if (accuracy >= 0.90 && wpm >= 30) perfMultiplier = 1.25;
    else if (accuracy >= 0.80) perfMultiplier = 1.1;

    xp = Math.round(xp * perfMultiplier);

    // Minimum XP for playing
    return Math.max(10, xp);
}

// ---------------------------------------------------------------------------
// Rank system
// ---------------------------------------------------------------------------

export const RANKS = [
    { id: 'bronze',   name: 'Bronze',   nameZh: '��ͭ', xpRequired: 0,     color: '#cd7f32', icon: 'I' },
    { id: 'silver',   name: 'Silver',   nameZh: '����', xpRequired: 500,   color: '#c0c0c0', icon: 'II' },
    { id: 'gold',     name: 'Gold',     nameZh: '�ƽ�', xpRequired: 2000,  color: '#ffd700', icon: 'III' },
    { id: 'platinum', name: 'Platinum', nameZh: '����', xpRequired: 5000,  color: '#00d4ff', icon: 'IV' },
    { id: 'diamond',  name: 'Diamond',  nameZh: '��ʯ', xpRequired: 10000, color: '#bf5af2', icon: 'V' },
];

/**
 * Get rank for a given total XP.
 */
export function getRank(totalXp) {
    let rank = RANKS[0];
    for (const r of RANKS) {
        if (totalXp >= r.xpRequired) rank = r;
    }
    return rank;
}

/**
 * Get the next rank (if any) and progress toward it.
 */
export function getRankProgress(totalXp) {
    const currentRank = getRank(totalXp);
    const currentIdx = RANKS.indexOf(currentRank);
    if (currentIdx >= RANKS.length - 1) {
        return { current: currentRank, next: null, progress: 1, xpToNext: 0 };
    }
    const next = RANKS[currentIdx + 1];
    const xpInRank = totalXp - currentRank.xpRequired;
    const xpRange = next.xpRequired - currentRank.xpRequired;
    return {
        current: currentRank,
        next,
        progress: Math.min(1, xpInRank / xpRange),
        xpToNext: next.xpRequired - totalXp,
    };
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

const XP_STORAGE_KEY = 'typing-raid-xp';

export function loadTotalXp() {
    try {
        const raw = localStorage.getItem(XP_STORAGE_KEY);
        if (raw) return parseInt(raw, 10) || 0;
    } catch {}
    return 0;
}

export function saveTotalXp(xp) {
    try {
        localStorage.setItem(XP_STORAGE_KEY, String(xp));
    } catch {}
}

export function addXp(amount) {
    const current = loadTotalXp();
    const newXp = current + amount;
    saveTotalXp(newXp);
    return newXp;
}
