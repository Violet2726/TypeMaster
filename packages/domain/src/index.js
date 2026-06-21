/**
 * 练习引擎统一出口。
 *
 * 外部模块只需要从 `@typemaster/domain` 导入，
 * 不必关心具体逻辑被拆到了哪个细分文件中。
 */

export * from './config.js';
export * from './draft.js';
export * from './rendering.js';
export * from './metrics.js';
export * from './coach.js';
export * from './drill-feedback.js';
export * from './insights.js';
export * from './session-machine.js';
export * from './training.js';
export * from './achievements.js';
export * from './challenge.js';
export * from './game.js';
export * from './word-chains.js';
export * from './growth.js';
export * from './daily-challenge.js';
export * from './achievements-system.js';
export * from './hidden-achievements.js';
export * from './achievement-chains.js';
export * from './achievement-rewards.js';
export * from './visual-themes.js';
export * from './custom-themes.js';
export * from './game-modes.js';
export * from './challenge-modes.js';
export { commonWords } from './data/words.js';