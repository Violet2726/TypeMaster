/**
 * Achievement Rewards - Unlockable content through achievements
 * 
 * Apple philosophy: rewards should feel earned and meaningful.
 * Each reward enhances the gameplay experience.
 */

export const ACHIEVEMENT_REWARDS = {
  // Theme unlocks
  'boss-nodamage': {
    type: 'theme',
    id: 'gold',
    name: 'Gold Edition Theme',
    nameZh: '金色主题',
    description: 'Unlock by killing a boss without losing a life',
    descriptionZh: '无伤击杀Boss解锁',
  },
  'highscore-10000': {
    type: 'theme',
    id: 'purple',
    name: 'Neon Purple Theme',
    nameZh: '霓虹紫色主题',
    description: 'Unlock by scoring 10000+ in a single game',
    descriptionZh: '单局得分10000+解锁',
  },
  'wpm-100': {
    type: 'trail',
    id: 'lightning',
    name: 'Lightning Trail',
    nameZh: '闪电轨迹',
    description: 'Unlock by reaching 100 WPM',
    descriptionZh: '达到100 WPM解锁',
  },
  
  // XP bonuses
  'first-blood': {
    type: 'xp',
    amount: 10,
    name: 'First Kill Bonus',
    nameZh: '首次击杀奖励',
  },
  'combo-10': {
    type: 'xp',
    amount: 20,
    name: 'Combo Starter Bonus',
    nameZh: '连击入门奖励',
  },
  'wave-5': {
    type: 'xp',
    amount: 30,
    name: 'Wave 5 Bonus',
    nameZh: '波次5奖励',
  },
  'boss-kill': {
    type: 'xp',
    amount: 50,
    name: 'Boss Slayer Bonus',
    nameZh: 'Boss杀手奖励',
  },
  
  // Title unlocks
  'hunter-500': {
    type: 'title',
    id: 'destroyer',
    name: 'Destroyer',
    nameZh: '毁灭者',
    description: 'Kill 500 enemies',
    descriptionZh: '击杀500个敌人',
  },
  'combo-50': {
    type: 'title',
    id: 'unstoppable',
    name: 'Unstoppable',
    nameZh: '势不可挡',
    description: 'Reach 50 combo',
    descriptionZh: '达到50连击',
  },
  'wave-30': {
    type: 'title',
    id: 'legendary',
    name: 'Legendary',
    nameZh: '传奇',
    description: 'Reach wave 30',
    descriptionZh: '到达波次30',
  },
  'wpm-100': {
    type: 'title',
    id: 'typing-god',
    name: 'Typing God',
    nameZh: '打字之神',
    description: 'Reach 100 WPM',
    descriptionZh: '达到100 WPM',
  },
};

export function getReward(achievementId) {
  return ACHIEVEMENT_REWARDS[achievementId] || null;
}

export function getAllRewards() {
  return Object.entries(ACHIEVEMENT_REWARDS).map(([id, reward]) => ({
    achievementId: id,
    ...reward,
  }));
}

export function getRewardsByType(type) {
  return Object.entries(ACHIEVEMENT_REWARDS)
    .filter(([_, reward]) => reward.type === type)
    .map(([id, reward]) => ({
      achievementId: id,
      ...reward,
    }));
}

export function getUnlockedRewards(achievementState) {
  const rewards = [];
  
  for (const [achievementId, reward] of Object.entries(ACHIEVEMENT_REWARDS)) {
    if (achievementState[achievementId] && achievementState[achievementId].unlocked) {
      rewards.push({
        achievementId,
        ...reward,
      });
    }
  }
  
  return rewards;
}

export function getLockedRewards(achievementState) {
  const rewards = [];
  
  for (const [achievementId, reward] of Object.entries(ACHIEVEMENT_REWARDS)) {
    if (!achievementState[achievementId] || !achievementState[achievementId].unlocked) {
      rewards.push({
        achievementId,
        ...reward,
      });
    }
  }
  
  return rewards;
}

export function getRewardProgress(achievementState) {
  const total = Object.keys(ACHIEVEMENT_REWARDS).length;
  const unlocked = getUnlockedRewards(achievementState).length;
  
  return {
    unlocked,
    total,
    percentage: Math.round((unlocked / total) * 100),
  };
}
