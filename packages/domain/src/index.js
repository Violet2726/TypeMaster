/**
 * Unified training-domain entry point.
 *
 * Feature code imports pure typing, training, insight, challenge, and TypeRift
 * rules from here without depending on page or storage implementation details.
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
export * from './result-prescription.js';
export * from './achievements.js';
export * from './challenge.js';
export * from './game-vnext/index.js';
export { commonWords } from './data/words.js';
