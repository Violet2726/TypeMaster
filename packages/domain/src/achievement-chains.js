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
    nameZh: '猎人之路',
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
    nameZh: '连击之路',
    description: 'Build combos to unlock rewards',
    descriptionZh: '建立连击解锁奖励',
    color: '#3b9eff',
    achievements: [
      { id: 'combo-10', target: 10, reward: '10 combo!' },
      { id: 'combo-25', target: 25, reward: '25 combo!' },
      { id: 'combo-50', target: 50, reward: '50 combo!' },
    ]
  },
  {
    id: 'wave-chain',
    name: 'Wave Chain',
    nameZh: '波次之路',
    description: 'Clear waves to unlock rewards',
    descriptionZh: '清除波次解锁奖励',
    color: '#34c759',
    achievements: [
      { id: 'wave-5', target: 5, reward: '5 waves!' },
      { id: 'wave-15', target: 15, reward: '15 waves!' },
      { id: 'wave-30', target: 30, reward: '30 waves!' },
    ]
  },
  {
    id: 'boss-chain',
    name: 'Boss Chain',
    nameZh: 'Boss之路',
    description: 'Defeat bosses to unlock rewards',
    descriptionZh: '击败Boss解锁奖励',
    color: '#ffd700',
    achievements: [
      { id: 'boss-1', target: 1, reward: 'First boss!' },
      { id: 'boss-10', target: 10, reward: '10 bosses!' },
      { id: 'boss-25', target: 25, reward: '25 bosses!' },
    ]
  },
  {
    id: 'speed-chain',
    name: 'Speed Chain',
    nameZh: '速度之路',
    description: 'Reach typing speed milestones',
    descriptionZh: '达到打字速度里程碑',
    color: '#ff9f0a',
    achievements: [
      { id: 'wpm-40', target: 40, reward: '40 WPM!' },
      { id: 'wpm-60', target: 60, reward: '60 WPM!' },
      { id: 'wpm-80', target: 80, reward: '80 WPM!' },
    ]
  },
  {
    id: 'score-chain',
    name: 'Score Chain',
    nameZh: '分数之路',
    description: 'Achieve high scores',
    descriptionZh: '获得高分',
    color: '#bf5af2',
    achievements: [
      { id: 'score-5k', target: 5000, reward: '5,000 points!' },
      { id: 'score-15k', target: 15000, reward: '15,000 points!' },
      { id: 'score-30k', target: 30000, reward: '30,000 points!' },
    ]
  }
];

export function getChainProgress(chainId, currentValue) {
  const chain = ACHIEVEMENT_CHAINS.find(c => c.id === chainId);
  if (!chain) return null;
  
  const completedCount = chain.achievements.filter(a => currentValue >= a.target).length;
  return {
    chain,
    completedCount,
    total: chain.achievements.length,
    nextAchievement: chain.achievements[completedCount] || null,
    progress: completedCount / chain.achievements.length
  };
}

export function checkChainUnlocks(chainId, oldValue, newValue) {
  const chain = ACHIEVEMENT_CHAINS.find(c => c.id === chainId);
  if (!chain) return [];
  
  return chain.achievements.filter(a => oldValue < a.target && newValue >= a.target);
}
