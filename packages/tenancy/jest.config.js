/** @type {import('jest').Config} */
const config = {
  displayName: '@merkiai/tenancy',
  testEnvironment: 'node',
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@merkiai/tenancy$': '<rootDir>/src/index.ts',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
  coverageThreshold: {
    global: { branches: 70, functions: 80, lines: 80, statements: 80 },
  },
}

module.exports = config
