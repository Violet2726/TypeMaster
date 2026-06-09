import { createNodeVitestConfig } from '@typemaster/config/vitest';

export default createNodeVitestConfig({
    include: ['__tests__/**/*.test.ts'],
    fileParallelism: false,
    coverageInclude: ['state/**/*.ts', 'lib/**/*.ts', 'infra/**/*.ts', 'repositories/**/*.ts'],
    coverageThresholds: {
        lines: 45,
        functions: 65,
        statements: 45,
        branches: 50
    }
});
