/** @type {import('jest').Config} */
const config = {
  displayName: '@merkiai/i18n',
  testEnvironment: 'node',
  preset: 'ts-jest',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.d.ts'],
}

module.exports = config
