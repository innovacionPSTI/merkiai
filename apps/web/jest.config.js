/** @type {import('jest').Config} */
const config = {
  displayName: '@merkiai/web',
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Static assets
    '^.+\\.(jpg|jpeg|png|gif|webp|svg|ico)$': '<rootDir>/__mocks__/fileMock.js',
    '^.+\\.(css|scss|sass)$': '<rootDir>/__mocks__/styleMock.js',
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@merkiai/database$': '<rootDir>/../../packages/database/src/index.ts',
    '^@merkiai/ui$': '<rootDir>/../../packages/ui/src/index.ts',
    // Dependencias ESM puras sin babel-jest → stub CJS genérico
    // (se cargan transitivamente vía @stackframe/stack, nunca se ejecutan en tests)
    '^jose(/.*)?$': '<rootDir>/__mocks__/esm-stub.js',
    '^export-to-csv$': '<rootDir>/__mocks__/esm-stub.js',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
      },
    }],
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/not-found.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}

module.exports = config
