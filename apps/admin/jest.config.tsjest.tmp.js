// Config TEMPORAL de verificación (ts-jest) para correr los tests de admin sin SWC.
/** @type {import('jest').Config} */
module.exports = {
  displayName: '@vps/admin-tsjest',
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^.+\\.(jpg|jpeg|png|gif|webp|svg|ico)$': '<rootDir>/../web/__mocks__/fileMock.js',
    '^.+\\.(css|scss|sass)$': '<rootDir>/../web/__mocks__/styleMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@vps/database$': '<rootDir>/../../packages/database/src/index.ts',
    '^@vps/ui$': '<rootDir>/../../packages/ui/src/index.ts',
    '^jose(/.*)?$': '<rootDir>/__mocks__/esm-stub.js',
    '^export-to-csv$': '<rootDir>/__mocks__/esm-stub.js',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: { jsx: 'react-jsx', esModuleInterop: true } }],
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
}
