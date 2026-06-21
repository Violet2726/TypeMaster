/**
 * Achievement Chains - Sequential achievements that build on each other.
 * 
 * Apple philosophy: progression should feel rewarding.
 * Each chain has 3-5 achievements that unlock in sequence.
 */

export const ACHIEVEMENT_CHAINS = [
  {
    id: 'hunter-chain',
    name: 'Hunter Chain',
    nameZh: '猎人链',
    description: 'Kill enemies to unlock rewards',
    descriptionZh: '击杀敌人解锁奖励',
    color: '#ff3b5c',
    achievements: [
      { id: 'first-blood', target: 1, reward: 'First kill!' },
      { id: 'hunter-50', target: 50, reward: '50 kills!' },
      { id: 'hunter-200', target: 200, reward: '200 kills!' },
      { id: 'hunter-500', target: 500, reward: '500 kills!' },
    ]
  },
  {
    id: 'combo-chain',
    name: 'Combo Chain',
    nameZh: '连击链',
    description: 'Build combos to unlock rewards',
    descriptionZh: '建立连击解锁奖励',
    color: '#3b9eff',
    achievements: [
      { id: 'combo-10', target: 10, reward: '10 combo!' },
      { id: 'combo-20', target: 20, reward: '20 combo!' },
      { id: 'combo-50', target: 50, reward: '50 combo!' },
    ]
  },
  {
    id: 'wave-chain',
    name: 'Wave Chain',
    nameZh: '波次链',
    description: 'Reach waves to unlock rewards',
    descriptionZh: '到达波次解锁奖励',
    color: '#34c759',
    achievements: [
      { id: 'wave-5', target: 5, reward: 'Wave 5!' },
      { id: 'wave-10', target: 10, reward: 'Wave 10!' },
      { id: 'wave-20', target: 20, reward: 'Wave 20!' },
      { id: 'wave-30', target: 30, reward: 'Wave 30!' },
    ]
  },
  {
    id: 'boss-chain',
    name: 'Boss Chain',
    nameZh: 'Boss链',
    description: 'Kill bosses to unlock rewards',
    descriptionZh: '击杀Boss解锁奖励',
    color: '#bf5af2',
    achievements: [
      { id: 'boss-kill', target: 1, reward: 'First boss!' },
      { id: 'boss-5', target: 5, reward: '5 bosses!' },
      { id: 'boss-10', target: 10, reward: '10 bosses!' },
    ]
  },
  {
    id: 'speed-chain',
    name: 'Speed Chain',
    nameZh: '速度链',
    description: 'Improve typing speed to unlock rewards',
    descriptionZh: '提升打字速度解锁奖励',
    color: '#ff9f0a',
    achievements: [
      { id: 'wpm-60', target: 60, reward: '60 WPM!' },
      { id: 'wpm-100', target: 100, reward: '100 WPM!' },
      { id: 'wpm-150', target: 150, reward: '150 WPM!' },
    ]
  },
  {
    id: 'score-chain',
    name: 'Score Chain',
    nameZh: '分数链',
    description: 'Achieve high scores to unlock rewards',
    descriptionZh: '获得高分解锁奖励',
    color: '#ffd700',
    achievements: [
      { id: 'highscore-3000', target: 3000, reward: '3000 score!' },
      { id: 'highscore-10000', target: 10000, reward: '10000 score!' },
      { id: 'highscore-50000', target: 50000, reward: '50000 score!' },
    ]
  },
];

export function getAchievementChain(chainId) {
  return ACHIEVEMENT_CHAINS.find(c => c.id === chainId);
}

export function getAllChains() {
  return ACHIEVEMENT_CHAINS;
}

export function getChainProgress(chainId, achievementState) {
  const chain = getAchievementChain(chainId);
  if (!chain) return { completed: 0, total: 0, progress: 0 };
  
  const completed = chain.achievements.filter(a => 
    achievementState[a.id] && achievementState[a.id].unlocked
  ).length;
  
  return {
    completed,
    total: chain.achievements.length,
    progress: completed / chain.achievements.length,
    current: chain.achievements[completed] || null,
    next: chain.achievements[completed + 1] || null,
  };
}

export function getNextAchievementInChain(chainId, achievementState) {
  const chain = getAchievementChain(chainId);
  if (!chain) return null;
  
  return chain.achievements.find(a => 
    !achievementState[a.id] || !achievementState[a.id].unlocked
  );
}

export function isChainComplete(chainId, achievementState) {
  const chain = getAchievementChain(chainId);
  if (!chain) return false;
  
  return chain.achievements.every(a => 
    achievementState[a.id] && achievementState[a.id].unlocked
  );
}

export function getChainCompletionPercentage(chainId, achievementState) {
  const progress = getChainProgress(chainId, achievementState);
  return Math.round(progress.progress * 100);
}
