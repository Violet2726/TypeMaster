/**
 * Achievement Rewards - Unlockable content through achievements
 * 
 * Apple philosophy: rewards should feel meaningful and visual.
 */

export const REWARD_TYPES = {
  THEME: 'theme',
  TRAIL: 'trail',
  XP: 'xp',
  TITLE: 'title',
};

export const ACHIEVEMENT_REWARDS = {
  'first-blood': { type: REWARD_TYPES.XP, value: 50, name: '50 XP', nameZh: '50经验' },
  'hunter-50': { type: REWARD_TYPES.TITLE, value: 'Destroyer', name: 'Destroyer Title', nameZh: '毁灭者头衔' },
  'hunter-200': { type: REWARD_TYPES.TRAIL, value: 'lightning', name: 'Lightning Trail', nameZh: '闪电轨迹' },
  'hunter-500': { type: REWARD_TYPES.THEME, value: 'golden', name: 'Golden Theme', nameZh: '金色主题' },
  'combo-10': { type: REWARD_TYPES.XP, value: 100, name: '100 XP', nameZh: '100经验' },
  'combo-25': { type: REWARD_TYPES.TRAIL, value: 'neon', name: 'Neon Trail', nameZh: '霓虹轨迹' },
  'combo-50': { type: REWARD_TYPES.TITLE, value: 'Unstoppable', name: 'Unstoppable Title', nameZh: '势不可挡头衔' },
  'wave-5': { type: REWARD_TYPES.XP, value: 75, name: '75 XP', nameZh: '75经验' },
  'wave-15': { type: REWARD_TYPES.THEME, value: 'neon-purple', name: 'Neon Purple Theme', nameZh: '霓虹紫主题' },
  'wave-30': { type: REWARD_TYPES.TITLE, value: 'Legendary', name: 'Legendary Title', nameZh: '传奇头衔' },
  'boss-1': { type: REWARD_TYPES.XP, value: 150, name: '150 XP', nameZh: '150经验' },
  'boss-10': { type: REWARD_TYPES.TRAIL, value: 'fire', name: 'Fire Trail', nameZh: '火焰轨迹' },
  'boss-25': { type: REWARD_TYPES.TITLE, value: 'Typing God', name: 'Typing God Title', nameZh: '打字之神头衔' },
  'wpm-40': { type: REWARD_TYPES.XP, value: 100, name: '100 XP', nameZh: '100经验' },
  'wpm-60': { type: REWARD_TYPES.TRAIL, value: 'plasma', name: 'Plasma Trail', nameZh: '等离子轨迹' },
  'wpm-80': { type: REWARD_TYPES.TITLE, value: 'Speed Demon', name: 'Speed Demon Title', nameZh: '速度恶魔头衔' },
  'score-5k': { type: REWARD_TYPES.XP, value: 100, name: '100 XP', nameZh: '100经验' },
  'score-15k': { type: REWARD_TYPES.TRAIL, value: 'rainbow', name: 'Rainbow Trail', nameZh: '彩虹轨迹' },
  'score-30k': { type: REWARD_TYPES.TITLE, value: 'Typing God', name: 'Typing God Title', nameZh: '打字之神头衔' },
};

export function getReward(achievementId) {
  return ACHIEVEMENT_REWARDS[achievementId] || null;
}

export function getAllRewards() {
  return Object.entries(ACHIEVEMENT_REWARDS).map(([id, reward]) => ({
    id,
    ...reward
  }));
}
