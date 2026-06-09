const { defineConfig } = require('vitest/config');

const defaultThresholds = {
    lines: 70,
    functions: 70,
    statements: 70,
    branches: 50
};

function createNodeVitestConfig({
    include,
    coverageInclude,
    coverageThresholds = defaultThresholds,
    fileParallelism = true
}) {
    return defineConfig({
        test: {
            globals: true,
            environment: 'node',
            include,
            fileParallelism,
            coverage: {
                provider: 'v8',
                reporter: ['text-summary', 'html'],
                include: coverageInclude,
                thresholds: coverageThresholds
            }
        }
    });
}

module.exports = {
    createNodeVitestConfig
};
