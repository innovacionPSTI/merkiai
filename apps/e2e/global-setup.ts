/**
 * global-setup — se ejecuta UNA vez antes de toda la suite:
 *   1. (opcional, E2E_SEED=1) siembra el tenant de prueba vía endpoint interno,
 *   2. inicia sesión en el admin con el usuario de prueba (Stack Auth) y guarda
 *      el `storageState` para reutilizar la sesión en las specs del proyecto admin,
 *   3. ejecuta el backfill del saldo de apertura con esa sesión autenticada.
 *
 * Si el login del admin cambia (selectores de Stack Auth), ajusta SOLO el paso de
 * login marcado abajo. Todo lo demás es estable.
 */
import { chromium, request, type FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'
import { ADMIN_STORAGE } from './playwright.config'
import { seedTestTenant } from './lib/seed'

export default async function globalSetup(_config: FullConfig) {
  const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:3001'
  const tenantId = process.env.E2E_TENANT_ID ?? ''
  const email = process.env.E2E_ADMIN_EMAIL ?? ''
  const password = process.env.E2E_ADMIN_PASSWORD ?? ''

  // 1) Seed del tenant (idempotente) ------------------------------------------
  if (process.env.E2E_SEED === '1') {
    await seedTestTenant({ adminUrl, tenantId, internalSecret: process.env.E2E_INTERNAL_SECRET ?? '' })
  }

  // 2) Login admin → storageState ---------------------------------------------
  fs.mkdirSync(path.dirname(ADMIN_STORAGE), { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage()
  try {
    await page.goto(`${adminUrl}/handler/sign-in`)
    // ▼▼▼ AJUSTAR si cambian los selectores de Stack Auth ▼▼▼
    await page.getByLabel(/correo|email/i).fill(email)
    await page.getByLabel(/contraseña|password/i).fill(password)
    await page.getByRole('button', { name: /iniciar sesión|sign in|continuar/i }).click()
    // ▲▲▲
    await page.waitForURL((url: URL) => !url.pathname.includes('sign-in'), { timeout: 30_000 })
    await page.context().storageState({ path: ADMIN_STORAGE })
  } finally {
    await browser.close()
  }

  // 3) Backfill del saldo de apertura (sesión autenticada) ---------------------
  const ctx = await request.newContext({ storageState: ADMIN_STORAGE })
  const res = await ctx.post(`${adminUrl}/api/admin/inventory/backfill-stock`)
  if (!res.ok() && res.status() !== 402) {
    // 402 = plan sin `inventory`; cualquier otro error sí importa.
    throw new Error(`Backfill falló: ${res.status()} ${await res.text()}`)
  }
  await ctx.dispose()
}
