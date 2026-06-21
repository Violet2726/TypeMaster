/**
 * Game Modes - Multiple ways to play
 * 
 * Apple philosophy: choice empowers users.
 * Different game modes for varied experiences:
 * 1. Classic - Standard wave progression
 * 2. Endless - Survive as long as possible
 * 3. Time Attack - Score as much as possible in limited time
 * 4. Zen - Practice without pressure
 */

export const GAME_MODES = {
  classic: {
    id: 'classic',
    name: 'Classic',
    nameZh: '经典模式',
    description: 'Standard wave progression',
    descriptionZh: '标准波次推进',
    icon: '\u2694\uFE0F',
    color: '#3b9eff',
  },
  endless: {
    id: 'endless',
    name: 'Endless',
    nameZh: '无尽模式',
    description: 'Survive as long as possible',
    descriptionZh: '尽可能存活',
    icon: '\u221E',
    color: '#ff9f0a',
  },
  timeAttack: {
    id: 'timeAttack',
    name: 'Time Attack',
    nameZh: '限时挑战',
    description: 'Score as much as possible in 2 minutes',
    descriptionZh: '在2分钟内获得尽可能高的分数',
    icon: '\u23F1\uFE0F',
    color: '#ff3b5c',
  },
  zen: {
    id: 'zen',
    name: 'Zen',
    nameZh: '禅模式',
    description: 'Practice without pressure',
    descriptionZh: '无压力练习',
    icon: '\uD83E\uDDD8',
    color: '#34c759',
  },
};

export function getGameMode(modeId) {
  return GAME_MODES[modeId] || GAME_MODES.classic;
}

export function getAllGameModes() {
  return Object.values(GAME_MODES);
}
