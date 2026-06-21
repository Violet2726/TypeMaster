/**
 * Hidden Achievements - Secret achievements that are revealed only when unlocked.
 */

export const HIDDEN_ACHIEVEMENTS = [
    // === COMBAT HIDDEN ===
    { id: 'speed-kill-10', name: 'Lightning', nameZh: '闪电侠', desc: 'Kill 10 enemies in 5 seconds', icon: 'L', target: 10, unit: 'speedkill', category: 'combat', color: '#ffd700', hidden: true },
    { id: 'no-miss-25', name: 'Marksman', nameZh: '狙击手', desc: 'Kill 25 enemies without missing', icon: 'M', target: 25, unit: 'noMissStreak', category: 'combat', color: '#bf5af2', hidden: true },
    
    // === COMBO HIDDEN ===
    { id: 'combo-100', name: 'Combo Legend', nameZh: '连击传奇', desc: 'Reach 100 combo', icon: 'X', target: 100, unit: 'combo', category: 'combo', color: '#ffd700', hidden: true },
    { id: 'chain-20', name: 'Chain Master', nameZh: '连锁大师', desc: 'Get a 20x chain kill', icon: 'Z', target: 20, unit: 'chain', category: 'combo', color: '#ffd700', hidden: true },
    
    // === WAVE HIDDEN ===
    { id: 'wave-50', name: 'Mythic', nameZh: '神话', desc: 'Reach wave 50', icon: 'M', target: 50, unit: 'wave', category: 'wave', color: '#ff3b5c', hidden: true },
    { id: 'perfect-20', name: 'Perfection God', nameZh: '完美之神', desc: 'Get 20 perfect waves in one game', icon: 'P', target: 20, unit: 'perfect', category: 'wave', color: '#ff3b5c', hidden: true },
    
    // === BOSS HIDDEN ===
    { id: 'boss-10', name: 'Boss Master', nameZh: 'Boss大师', desc: 'Kill 10 bosses', icon: 'B', target: 10, unit: 'bossKills', category: 'boss', color: '#ffd700', hidden: true },
    { id: 'boss-speed', name: 'Boss Speedrun', nameZh: 'Boss速通', desc: 'Kill a boss in under 10 seconds', icon: 'S', target: 10, unit: 'bossKillTime', category: 'boss', color: '#ff3b5c', hidden: true },
    
    // === SPECIAL HIDDEN ===
    { id: 'highscore-50000', name: 'Score God', nameZh: '分数之神', desc: 'Score 50000+ in a single game', icon: 'H', target: 50000, unit: 'score', category: 'special', color: '#ff3b5c', hidden: true },
    { id: 'wpm-150', name: 'Typing Legend', nameZh: '打字传奇', desc: 'Reach 150 WPM', icon: 'F', target: 150, unit: 'wpm', category: 'special', color: '#ff3b5c', hidden: true },
    { id: 'accuracy-100', name: 'Perfect Accuracy', nameZh: '完美准确度', desc: 'Finish a game with 100% accuracy', icon: 'A', target: 100, unit: 'accuracy', category: 'special', color: '#34c759', hidden: true },
    { id: 'survivor', name: 'Survivor', nameZh: '幸存者', desc: 'Finish a game with 1 HP', icon: 'S', target: 1, unit: 'finalLives', category: 'special', color: '#ff3b5c', hidden: true },
];

export function getHiddenAchievement(id) {
    return HIDDEN_ACHIEVEMENTS.find(a => a.id === id);
}

export function isHiddenAchievement(id) {
    return HIDDEN_ACHIEVEMENTS.some(a => a.id === id);
}
