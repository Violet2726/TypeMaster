/**
 * Achievement Definitions - 30+ achievements across 7 categories.
 *
 * Each achievement has: id, name, description, icon, category, condition, and reward.
 * Apple philosophy: achievements should feel earned, not grindy.
 */

export const ACHIEVEMENTS = [
    // === COMBAT ===
    { id: 'first-blood', name: 'First Blood', nameZh: '��һ��Ѫ', desc: 'Kill your first enemy', icon: 'I', target: 1, unit: 'kills', category: 'combat', color: '#ff3b5c' },
    { id: 'hunter-50', name: 'Hunter', nameZh: '����', desc: 'Kill 50 enemies', icon: 'L', target: 50, unit: 'kills', category: 'combat', color: '#ff7b2e' },
    { id: 'hunter-200', name: 'Elite Hunter', nameZh: '��Ӣ����', desc: 'Kill 200 enemies', icon: 'C', target: 200, unit: 'kills', category: 'combat', color: '#ff3b5c' },
    { id: 'hunter-500', name: 'Destroyer', nameZh: '������', desc: 'Kill 500 enemies', icon: 'D', target: 500, unit: 'kills', category: 'combat', color: '#bf5af2' },
    { id: 'speed-kill', name: 'Quick Draw', nameZh: '��ǹ��', desc: 'Kill 5 enemies in 3 seconds', icon: 'S', target: 5, unit: 'speedkill', category: 'combat', color: '#ffcc02' },

    // === COMBO ===
    { id: 'combo-10', name: 'Combo Starter', nameZh: '��������', desc: 'Reach 10 combo', icon: 'X', target: 10, unit: 'combo', category: 'combo', color: '#3b9eff' },
    { id: 'combo-20', name: 'Combo Master', nameZh: '������ʦ', desc: 'Reach 20 combo', icon: 'X', target: 20, unit: 'combo', category: 'combo', color: '#bf5af2' },
    { id: 'combo-50', name: 'Unstoppable', nameZh: '�Ʋ��ɵ�', desc: 'Reach 50 combo', icon: 'X', target: 50, unit: 'combo', category: 'combo', color: '#ff3b5c' },
    { id: 'chain-5', name: 'Chain Reaction', nameZh: '������Ӧ', desc: 'Get a 5x chain kill', icon: 'Z', target: 5, unit: 'chain', category: 'combo', color: '#bf5af2' },
    { id: 'chain-10', name: 'Domino Effect', nameZh: '����ŵЧӦ', desc: 'Get a 10x chain kill', icon: 'Z', target: 10, unit: 'chain', category: 'combo', color: '#ff3b5c' },

    // === WAVE ===
    { id: 'wave-5', name: 'Veteran', nameZh: '�ϱ�', desc: 'Reach wave 5', icon: 'V', target: 5, unit: 'wave', category: 'wave', color: '#34c759' },
    { id: 'wave-10', name: 'Warrior', nameZh: 'սʿ', desc: 'Reach wave 10', icon: 'W', target: 10, unit: 'wave', category: 'wave', color: '#3b9eff' },
    { id: 'wave-20', name: 'Champion', nameZh: '�ھ�', desc: 'Reach wave 20', icon: 'C', target: 20, unit: 'wave', category: 'wave', color: '#bf5af2' },
    { id: 'wave-30', name: 'Legendary', nameZh: '����', desc: 'Reach wave 30', icon: 'L', target: 30, unit: 'wave', category: 'wave', color: '#ffd700' },
    { id: 'perfect-3', name: 'Perfectionist', nameZh: '����������', desc: 'Get 3 perfect waves in one game', icon: 'P', target: 3, unit: 'perfect', category: 'wave', color: '#ffcc02' },
    { id: 'perfect-10', name: 'Flawless', nameZh: '���', desc: 'Get 10 perfect waves in one game', icon: 'P', target: 10, unit: 'perfect', category: 'wave', color: '#ffd700' },

    // === BOSS ===
    { id: 'boss-kill', name: 'Boss Slayer', nameZh: 'Bossɱ��', desc: 'Kill your first boss', icon: 'B', target: 1, unit: 'bossKills', category: 'boss', color: '#ff3b5c' },
    { id: 'boss-5', name: 'Boss Hunter', nameZh: 'Boss����', desc: 'Kill 5 bosses', icon: 'B', target: 5, unit: 'bossKills', category: 'boss', color: '#bf5af2' },
    { id: 'boss-phase', name: 'Phase Breaker', nameZh: '�ƽ׶���', desc: 'Trigger a boss phase transition', icon: '!', target: 1, unit: 'bossPhases', category: 'boss', color: '#ffcc02' },
    { id: 'boss-nodamage', name: 'Untouchable', nameZh: '����ͨ��', desc: 'Kill a boss without losing a life', icon: 'U', target: 1, unit: 'bossNoDamage', category: 'boss', color: '#ffd700', reward: 'Unlock: Gold theme' },

    // === DAILY ===
    { id: 'daily-first', name: 'Daily Player', nameZh: 'ÿ�����', desc: 'Complete your first daily challenge', icon: 'D', target: 1, unit: 'dailyCompleted', category: 'daily', color: '#34c759' },
    { id: 'daily-7', name: 'Weekly Warrior', nameZh: '��սʿ', desc: 'Complete 7 daily challenges', icon: 'W', target: 7, unit: 'dailyCompleted', category: 'daily', color: '#3b9eff' },
    { id: 'daily-30', name: 'Monthly Master', nameZh: '�¶ȴ�ʦ', desc: 'Complete 30 daily challenges', icon: 'M', target: 30, unit: 'dailyCompleted', category: 'daily', color: '#bf5af2' },
    { id: 'daily-score-5000', name: 'Daily Champion', nameZh: 'ÿ�չھ�', desc: 'Score 5000+ in a daily challenge', icon: 'S', target: 5000, unit: 'dailyScore', category: 'daily', color: '#ffd700' },

    // === PROGRESSION ===
    { id: 'rank-silver', name: 'Silver Rank', nameZh: '������λ', desc: 'Reach Silver rank', icon: 'II', target: 500, unit: 'totalXp', category: 'progression', color: '#c0c0c0' },
    { id: 'rank-gold', name: 'Gold Rank', nameZh: '�ƽ��λ', desc: 'Reach Gold rank', icon: 'III', target: 2000, unit: 'totalXp', category: 'progression', color: '#ffd700' },
    { id: 'rank-platinum', name: 'Platinum Rank', nameZh: '�����λ', desc: 'Reach Platinum rank', icon: 'IV', target: 5000, unit: 'totalXp', category: 'progression', color: '#00d4ff' },
    { id: 'rank-diamond', name: 'Diamond Rank', nameZh: '��ʯ��λ', desc: 'Reach Diamond rank', icon: 'V', target: 10000, unit: 'totalXp', category: 'progression', color: '#bf5af2' },
    { id: 'games-10', name: 'Dedicated', nameZh: 'רע��', desc: 'Play 10 games', icon: 'G', target: 10, unit: 'gamesPlayed', category: 'progression', color: '#34c759' },
    { id: 'games-50', name: 'Addicted', nameZh: '������', desc: 'Play 50 games', icon: 'G', target: 50, unit: 'gamesPlayed', category: 'progression', color: '#bf5af2' },

    // === SPECIAL ===
    { id: 'highscore-3000', name: 'Score Master', nameZh: '�÷ִ�ʦ', desc: 'Score 3000+ in a single game', icon: 'H', target: 3000, unit: 'score', category: 'special', color: '#ffd700' },
    { id: 'highscore-10000', name: 'Score Legend', nameZh: '�÷ִ���', desc: 'Score 10000+ in a single game', icon: 'H', target: 10000, unit: 'score', category: 'special', color: '#bf5af2', reward: 'Unlock: Purple theme' },
    { id: 'wpm-60', name: 'Speed Demon', nameZh: '�ٶȶ�ħ', desc: 'Reach 60 WPM', icon: 'F', target: 60, unit: 'wpm', category: 'special', color: '#ff3b5c' },
    { id: 'wpm-100', name: 'Typing God', nameZh: '����֮��', desc: 'Reach 100 WPM', icon: 'F', target: 100, unit: 'wpm', category: 'special', color: '#ffd700', reward: 'Unlock: Lightning trail' },
];

export function getAchievement(id) {
    return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory() {
    const groups = {};
    ACHIEVEMENTS.forEach(a => {
        if (!groups[a.category]) groups[a.category] = [];
        groups[a.category].push(a);
    });
    return groups;
}

// ---------------------------------------------------------------------------
// Achievement progress storage
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'typing-raid-achievements';

export function loadAchievementState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch {}
    return {};
}

export function saveAchievementState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
}

export function unlockAchievement(id) {
    const state = loadAchievementState();
    if (state[id] && state[id].unlocked) return false;
    state[id] = { unlocked: true, unlockedAt: Date.now() };
    saveAchievementState(state);
    return true;
}

export function isAchievementUnlocked(id) {
    const state = loadAchievementState();
    return !!(state[id] && state[id].unlocked);
}

export function getUnlockedCount() {
    const state = loadAchievementState();
    return Object.values(state).filter(s => s.unlocked).length;
}

export function getTotalCount() {
    return ACHIEVEMENTS.length;
}
