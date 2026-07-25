import { createNodeVitestConfig } from '@typerift/config/vitest';

export default createNodeVitestConfig({
    include: ['**/*.test.ts'],
    fileParallelism: false,
    coverageInclude: ['app.ts', 'lib/**/*.ts', 'infra/**/*.ts'],
    coverageExclude: ['infra/postgres-store.ts', 'infra/db/**/*.ts'],
    coverageThresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70
    }
});
