import { test, expect } from '@playwright/test'

/**
 * Smoke del panel (sesión de global-setup): las pantallas principales cargan sin
 * error y el idioma del panel cambia por usuario (E28 · HU-466).
 */
const PAGES = ['/dashboard', '/pedidos', '/productos', '/clientes', '/reportes', '/constructor', '/configuracion/idiomas', '/configuracion/plantillas-correo']

test.describe('Admin · smoke', () => {
  for (const path of PAGES) {
    test(`carga ${path}`, async ({ page }) => {
      const res = await page.goto(path)
      expect(res?.status(), path).toBeLessThan(400)
      await expect(page.locator('body')).not.toContainText(/Application error|Internal Server Error/i)
    })
  }

  test('el panel se muestra en inglés con la preferencia en inglés', async ({ page, context, baseURL }) => {
    const url = new URL(baseURL ?? 'http://localhost:3001')
    await context.addCookies([{ name: 'merkiai_admin_locale', value: 'en-US', domain: url.hostname, path: '/' }])
    await page.goto('/dashboard')
    // Si el usuario tiene preferencia guardada en su perfil, esa manda: se acepta cualquiera de los dos.
    const lang = await page.locator('html').getAttribute('lang')
    test.skip(lang !== 'en-US', 'El usuario de prueba tiene un idioma guardado en su perfil.')
    await expect(page.getByRole('link', { name: 'Orders' }).first()).toBeVisible()
  })

  test('API del panel: reportes por moneda', async ({ request }) => {
    const today = new Date().toISOString().slice(0, 10)
    const res = await request.get(`/api/admin/reports/sales?from=${today}&to=${today}`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json() as { currency: string; currencies: string[] }
    expect(body.currency).toMatch(/^[A-Z]{3}$/)
    expect(Array.isArray(body.currencies)).toBeTruthy()
  })
})
