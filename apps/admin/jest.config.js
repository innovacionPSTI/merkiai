const nextJest = require('next/jest.js')

const createJestConfig = nextJest({ dir: './' })

/** @type {import('jest').Config} */
const config = {
  displayName: '@merkiai/admin',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Fuerza una sola copia de React (los paquetes del workspace, p. ej.
    // @merkiai/ui, traen su propio react; sin esto jsx-runtime diverge y
    // React se queja de "múltiples copias"). Debe ir primero.
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    '^react/(.*)$': '<rootDir>/node_modules/react/$1',
    '^react-dom/(.*)$': '<rootDir>/node_modules/react-dom/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@merkiai/database$': '<rootDir>/../../packages/database/src/index.ts',
    '^@merkiai/ui$': '<rootDir>/../../packages/ui/src/index.ts',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/**/layout.tsx',
  ],
}

module.exports = createJestConfig(config)
