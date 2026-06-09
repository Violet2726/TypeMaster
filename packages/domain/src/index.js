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
export * from './insights.js';
export * from './session-machine.js';
export * from './training.js';
export * from './achievements.js';
export * from './challenge.js';
