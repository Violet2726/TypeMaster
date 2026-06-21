/**
 * Challenge Modes - Special challenge gameplay
 * 
 * Apple philosophy: challenges should test specific skills.
 * Each challenge has unique rules and objectives.
 */

export const CHALLENGE_MODES = {
  speedRun: {
    id: 'speedRun',
    name: 'Speed Run',
    nameZh: '速通挑战',
    description: 'Clear 10 waves as fast as possible',
    descriptionZh: '尽快清除10波敌人',
    icon: '\u26A1',
    color: '#ff9f0a',
    objective: 'Clear 10 waves',
    objectiveZh: '清除10波',
    targetWaves: 10,
    settings: {
      lives: 3,
      maxLives: 3,
      waveLimit: 10,
      timeLimit: Infinity,
      enemySpeedMultiplier: 1.3,
      spawnRateMultiplier: 1.5,
      scoreMultiplier: 1.0,
      enemiesReachBottom: true,
      bossWaves: false,
      winCondition: 'waves',
    }
  },
  
  survival: {
    id: 'survival',
    name: 'Survival',
    nameZh: '生存挑战',
    description: 'Survive as long as possible with 1 life',
    descriptionZh: '只有1条命，尽可能存活',
    icon: '\u2764\uFE0F',
    color: '#ff3b5c',
    objective: 'Survive',
    objectiveZh: '存活',
    targetWaves: Infinity,
    settings: {
      lives: 1,
      maxLives: 1,
      waveLimit: Infinity,
      timeLimit: Infinity,
      enemySpeedMultiplier: 0.9,
      spawnRateMultiplier: 1.0,
      scoreMultiplier: 2.0,
      enemiesReachBottom: true,
      bossWaves: true,
      winCondition: 'survive',
    }
  },
  
  accuracy: {
    id: 'accuracy',
    name: 'Accuracy Test',
    nameZh: '精准测试',
    description: 'Complete 5 waves with 90%+ accuracy',
    descriptionZh: '以90%+准确度完成5波',
    icon: '\uD83C\uDFAF',
    color: '#34c759',
    objective: '90% accuracy',
    objectiveZh: '90%准确度',
    targetWaves: 5,
    settings: {
      lives: 5,
      maxLives: 5,
      waveLimit: 5,
      timeLimit: Infinity,
      enemySpeedMultiplier: 0.7,
      spawnRateMultiplier: 0.8,
      scoreMultiplier: 1.5,
      enemiesReachBottom: true,
      bossWaves: false,
      winCondition: 'accuracy',
      targetAccuracy: 90,
    }
  },
  
  combo: {
    id: 'combo',
    name: 'Combo Master',
    nameZh: '连击大师',
    description: 'Reach 30 combo in a single wave',
    descriptionZh: '在单波中达到30连击',
    icon: '\uD83D\uDD25',
    color: '#bf5af2',
    objective: '30 combo',
    objectiveZh: '30连击',
    targetWaves: Infinity,
    settings: {
      lives: 5,
      maxLives: 5,
      waveLimit: Infinity,
      timeLimit: 180000,
      enemySpeedMultiplier: 0.8,
      spawnRateMultiplier: 1.2,
      scoreMultiplier: 1.0,
      enemiesReachBottom: true,
      bossWaves: false,
      winCondition: 'combo',
      targetCombo: 30,
    }
  },
  
  boss: {
    id: 'boss',
    name: 'Boss Rush',
    nameZh: 'Boss连战',
    description: 'Defeat 5 bosses in a row',
    descriptionZh: '连续击败5个Boss',
    icon: '\uD83D\uDC80',
    color: '#ffd700',
    objective: '5 bosses',
    objectiveZh: '5个Boss',
    targetWaves: 5,
    settings: {
      lives: 3,
      maxLives: 3,
      waveLimit: 5,
      timeLimit: Infinity,
      enemySpeedMultiplier: 1.0,
      spawnRateMultiplier: 1.0,
      scoreMultiplier: 2.0,
      enemiesReachBottom: true,
      bossWaves: true,
      winCondition: 'bosses',
      targetBosses: 5,
    }
  },
};

export function getChallengeMode(modeId) {
  return CHALLENGE_MODES[modeId] || null;
}

export function getAllChallengeModes() {
  return Object.values(CHALLENGE_MODES);
}

export function createChallengeState(modeId, options = {}) {
  const mode = getChallengeMode(modeId);
  if (!mode) return null;
  
  const settings = mode.settings;
  
  return {
    mode: 'idle',
    gameMode: modeId,
    challengeMode: true,
    score: 0,
    wave: 0,
    combo: 0,
    kps: 0,
    keyTimestamps: [],
    maxCombo: 0,
    enemiesTotal: 0,
    enemiesDefeated: 0,
    enemiesLeaked: 0,
    lives: settings.lives === Infinity ? 999 : settings.lives,
    maxLives: settings.maxLives === Infinity ? 999 : settings.maxLives,
    enemies: [],
    activeEnemyId: null,
    typedInput: '',
    totalCharsTyped: 0,
    totalCharsCorrect: 0,
    startTime: null,
    endTime: null,
    waveStartTime: null,
    spawnTimer: 0,
    nextSpawnIndex: 0,
    waveQueue: [],
    perfectWaves: 0,
    timeRemaining: settings.timeLimit === Infinity ? null : settings.timeLimit,
    challengeTarget: mode.objective,
    challengeTargetZh: mode.objectiveZh,
    ...options,
  };
}

export function checkChallengeWin(state) {
  const mode = getChallengeMode(state.gameMode);
  if (!mode) return false;
  
  const settings = mode.settings;
  
  switch (settings.winCondition) {
    case 'waves':
      return state.wave >= settings.waveLimit;
    case 'accuracy':
      const accuracy = state.totalCharsTyped > 0 
        ? (state.totalCharsCorrect / state.totalCharsTyped) * 100 
        : 0;
      return state.wave >= settings.waveLimit && accuracy >= settings.targetAccuracy;
    case 'combo':
      return state.maxCombo >= settings.targetCombo;
    case 'bosses':
      return state.enemiesDefeated >= settings.targetBosses;
    case 'survive':
      return false;
    default:
      return false;
  }
}

export function getChallengeProgress(state) {
  const mode = getChallengeMode(state.gameMode);
  if (!mode) return { progress: 0, target: 0 };
  
  const settings = mode.settings;
  
  switch (settings.winCondition) {
    case 'waves':
      return { progress: state.wave, target: settings.waveLimit };
    case 'accuracy':
      const accuracy = state.totalCharsTyped > 0 
        ? (state.totalCharsCorrect / state.totalCharsTyped) * 100 
        : 0;
      return { progress: Math.round(accuracy), target: settings.targetAccuracy };
    case 'combo':
      return { progress: state.maxCombo, target: settings.targetCombo };
    case 'bosses':
      return { progress: state.enemiesDefeated, target: settings.targetBosses };
    case 'survive':
      return { progress: state.wave, target: Infinity };
    default:
      return { progress: 0, target: 0 };
  }
}
