/** @type {import('jest').Config} */
const config = {
  displayName: '@merkiai/console',
  testEnvironment: 'node',
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  collectCoverageFrom: ['src/lib/**/*.ts'],
}

module.exports = config
