/**
 * Game Modes - Multiple ways to play
 * 
 * Different game modes for varied experiences:
 * 1. Classic - Standard wave-based gameplay
 * 2. Endless - No wave limits, play until you die
 * 3. Time Attack - Score as much as possible in limited time
 * 4. Zen Mode - Relaxed mode with no enemies reaching bottom
 */

export const GAME_MODES = {
  classic: {
    id: 'classic',
    name: 'Classic',
    nameZh: '经典模式',
    description: 'Standard wave-based gameplay',
    descriptionZh: '标准波次玩法',
    icon: '??',
    color: '#0a84ff',
    settings: {
      lives: 5,
      maxLives: 5,
      waveLimit: Infinity,
      timeLimit: Infinity,
      enemySpeedMultiplier: 1.0,
      spawnRateMultiplier: 1.0,
      scoreMultiplier: 1.0,
      enemiesReachBottom: true,
      bossWaves: true,
    }
  },
  
  endless: {
    id: 'endless',
    name: 'Endless',
    nameZh: '无尽模式',
    description: 'Play until you die, no wave limits',
    descriptionZh: '玩到死为止，无波次限制',
    icon: '??',
    color: '#34c759',
    settings: {
      lives: 3,
      maxLives: 3,
      waveLimit: Infinity,
      timeLimit: Infinity,
      enemySpeedMultiplier: 1.2,
      spawnRateMultiplier: 1.3,
      scoreMultiplier: 1.5,
      enemiesReachBottom: true,
      bossWaves: true,
    }
  },
  
  timeAttack: {
    id: 'timeAttack',
    name: 'Time Attack',
    nameZh: '限时挑战',
    description: 'Score as much as possible in 2 minutes',
    descriptionZh: '2分钟内尽可能多得分',
    icon: '??',
    color: '#ff9f0a',
    settings: {
      lives: Infinity,
      maxLives: Infinity,
      waveLimit: Infinity,
      timeLimit: 120000, // 2 minutes in ms
      enemySpeedMultiplier: 0.8,
      spawnRateMultiplier: 1.5,
      scoreMultiplier: 2.0,
      enemiesReachBottom: false,
      bossWaves: false,
    }
  },
  
  zen: {
    id: 'zen',
    name: 'Zen Mode',
    nameZh: '禅模式',
    description: 'Relaxed mode, enemies don\'t reach bottom',
    descriptionZh: '放松模式，敌人不会到达底部',
    icon: '??',
    color: '#bf5af2',
    settings: {
      lives: Infinity,
      maxLives: Infinity,
      waveLimit: 10,
      timeLimit: Infinity,
      enemySpeedMultiplier: 0.6,
      spawnRateMultiplier: 0.7,
      scoreMultiplier: 0.5,
      enemiesReachBottom: false,
      bossWaves: false,
    }
  }
};

export function getGameMode(modeId) {
  return GAME_MODES[modeId] || GAME_MODES.classic;
}

export function getAllGameModes() {
  return Object.values(GAME_MODES);
}

export function createGameStateWithMode(modeId, options = {}) {
  const mode = getGameMode(modeId);
  const settings = mode.settings;
  
  return {
    mode: 'idle',
    gameMode: modeId,
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
    ...options
  };
}

export function isTimeAttackMode(state) {
  return state.gameMode === 'timeAttack';
}

export function isEndlessMode(state) {
  return state.gameMode === 'endless';
}

export function isZenMode(state) {
  return state.gameMode === 'zen';
}

export function getModeSettings(modeId) {
  const mode = getGameMode(modeId);
  return mode.settings;
}

export function getTimeRemaining(state) {
  if (!state.timeRemaining) return null;
  return Math.max(0, state.timeRemaining);
}

export function updateTimeRemaining(state, dt) {
  if (!state.timeRemaining) return state;
  const newTime = state.timeRemaining - dt * 1000;
  if (newTime <= 0) {
    return { ...state, timeRemaining: 0, mode: 'gameover' };
  }
  return { ...state, timeRemaining: newTime };
}
