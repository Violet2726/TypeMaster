import { createNodeVitestConfig } from '@typerift/config/vitest';

export default createNodeVitestConfig({
    include: ['src/**/*.test.ts'],
    coverageInclude: ['src/**/*.ts'],
    coverageThresholds: { lines: 90, functions: 90, statements: 90, branches: 85 }
});
