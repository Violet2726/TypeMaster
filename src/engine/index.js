/**
 * 练习引擎统一出口。
 *
 * 外部模块只需要从 `src/engine` 导入，
 * 不必关心具体逻辑被拆到了哪个细分文件中。
 */

export * from './config';
export * from './draft';
export * from './rendering';
export * from './metrics';
export * from './coach';
export * from './insights';
export * from './session-machine';
