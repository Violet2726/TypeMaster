/**
 * Hidden Achievements - Secret achievements that are revealed only when unlocked.
 * 
 * Apple philosophy: discovery creates delight.
 */

export const HIDDEN_ACHIEVEMENTS = [
  { id: 'secret-perfect', name: 'Perfect Run', nameZh: '完美通关', description: 'Complete 10 waves without missing a word', descriptionZh: '不漏一个字完成10波', icon: '\u2728', rarity: 'legendary' },
  { id: 'secret-speed', name: 'Lightning Fingers', nameZh: '闪电手指', description: 'Type 100+ WPM for 30 seconds', descriptionZh: '保持100+ WPM 30秒', icon: '\u26A1', rarity: 'epic' },
  { id: 'secret-combo', name: 'Combo King', nameZh: '连击之王', description: 'Reach 50 combo', descriptionZh: '达到50连击', icon: '\uD83D\uDD10', rarity: 'epic' },
  { id: 'secret-survivor', name: 'Last Stand', nameZh: '背水一战', description: 'Survive with 1 HP for 5 waves', descriptionZh: '以1HP存活5波', icon: '\uD83D\uDEE1\uFE0F', rarity: 'rare' },
  { id: 'secret-boss-slayer', name: 'Boss Slayer', nameZh: 'Boss杀手', description: 'Defeat 10 bosses in Classic mode', descriptionZh: '在经典模式击败10个Boss', icon: '\uD83D\uDC80', rarity: 'epic' },
  { id: 'secret-daily', name: 'Daily Devotee', nameZh: '每日挑战者', description: 'Complete 7 daily challenges in a row', descriptionZh: '连续完成7个每日挑战', icon: '\uD83D\uDD25', rarity: 'legendary' },
  { id: 'secret-accuracy', name: 'Sharpshooter', nameZh: '神枪手', description: 'Finish a wave with 100% accuracy', descriptionZh: '以100%准确度完成一波', icon: '\uD83C\uDFAF', rarity: 'rare' },
  { id: 'secret-veteran', name: 'Veteran', nameZh: '老兵', description: 'Play 100 games total', descriptionZh: '总共玩100局', icon: '\uD83C\uDFC6', rarity: 'rare' },
  { id: 'secret-speedrun', name: 'Speedrun Master', nameZh: '速通大师', description: 'Complete Classic mode in under 5 minutes', descriptionZh: '5分钟内完成经典模式', icon: '\u23F0', rarity: 'legendary' },
  { id: 'secret-night-owl', name: 'Night Owl', nameZh: '夜猫子', description: 'Play between midnight and 5 AM', descriptionZh: '在凌晨0-5点游玩', icon: '\uD83E\uDD89', rarity: 'common' },
  { id: 'secret-high-scorer', name: 'High Scorer', nameZh: '高分达人', description: 'Score over 50,000 points', descriptionZh: '获得超过50,000分', icon: '\uD83C\uDF1F', rarity: 'epic' },
  { id: 'secret-typing-master', name: 'Typing Master', nameZh: '打字大师', description: 'Type 2000 characters in a single game', descriptionZh: '单局输入2000字符', icon: '\u2328\uFE0F', rarity: 'rare' },
];

export function getHiddenAchievement(id) {
  return HIDDEN_ACHIEVEMENTS.find(a => a.id === id) || null;
}

export function checkHiddenAchievement(id, stats) {
  const achievement = getHiddenAchievement(id);
  if (!achievement) return false;
  
  switch (id) {
    case 'secret-perfect':
      return stats.perfectWaves >= 10;
    case 'secret-speed':
      return stats.maxWpm >= 100 && stats.wpmDuration >= 30;
    case 'secret-combo':
      return stats.maxCombo >= 50;
    case 'secret-survivor':
      return stats.livesAtOneHp >= 5;
    case 'secret-boss-slayer':
      return stats.bossesDefeated >= 10;
    case 'secret-daily':
      return stats.consecutiveDailyChallenges >= 7;
    case 'secret-accuracy':
      return stats.perfectWaveExists === true;
    case 'secret-veteran':
      return stats.totalGames >= 100;
    case 'secret-speedrun':
      return stats.fastestClassicWin <= 300;
    case 'secret-night-owl':
      return stats.playedAtNight === true;
    case 'secret-high-scorer':
      return stats.highScore >= 50000;
    case 'secret-typing-master':
      return stats.charsInSingleGame >= 2000;
    default:
      return false;
  }
}
