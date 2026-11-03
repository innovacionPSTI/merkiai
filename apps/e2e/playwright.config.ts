import { defineConfig, devices } from '@playwright/test'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '.env') })

const ADMIN_URL = process.env.E2E_ADMIN_URL ?? 'http://localhost:3001'
const WEB_URL = process.env.E2E_WEB_URL ?? 'http://tienda-test.localhost:3000'

/** Estado de sesión admin (lo genera global-setup.ts). */
export const ADMIN_STORAGE = path.resolve(__dirname, '.auth/admin.json')

export default defineConfig({
  testDir: './tests',
  // Siembra tenant + inicia sesión admin una vez y guarda el storageState.
  globalSetup: require.resolve('./global-setup'),
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      // Flujos del panel admin (autenticados).
      name: 'admin',
      testMatch: /.*\.admin\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: ADMIN_URL, storageState: ADMIN_STORAGE },
    },
    {
      // Flujos del storefront (anónimos).
      name: 'storefront',
      testMatch: /.*\.store\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], baseURL: WEB_URL },
    },
  ],
})
