import { defineConfig } from 'vitest/config';

const defaultThresholds = {
    lines: 70,
    functions: 70,
    statements: 70,
    branches: 50
};

export function createNodeVitestConfig({
    include,
    coverageInclude,
    coverageExclude = [],
    coverageThresholds = defaultThresholds,
    fileParallelism = true,
    environment = 'node'
}) {
    return defineConfig({
        test: {
            globals: true,
            environment,
            include,
            fileParallelism,
            coverage: {
                provider: 'v8',
                reporter: ['text-summary', 'html'],
                include: coverageInclude,
                exclude: coverageExclude,
                thresholds: coverageThresholds
            }
        }
    });
}
