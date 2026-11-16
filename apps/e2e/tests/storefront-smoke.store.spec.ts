import { test, expect } from '@playwright/test'
import { SEEDED_PRODUCT } from '../lib/fixtures'

/**
 * Las pruebas marcadas `@smoke` no dependen de datos sembrados: son las que corre
 * `smoke.yml` contra producción después de cada despliegue (solo lectura).
 *
 * Smoke del storefront (anónimo): las páginas públicas responden, el catálogo
 * sembrado aparece y los artefactos de SEO existen. Barato y estable: sirve
 * también como verificación post-despliegue (ver `smoke.yml`).
 */
test.describe('Storefront · smoke', () => {
  test('home responde con <html lang> y título @smoke', async ({ page }) => {
    const res = await page.goto('/')
    expect(res?.status(), 'home').toBeLessThan(400)
    await expect(page.locator('html')).toHaveAttribute('lang', /^[a-z]{2}(-[A-Z]{2})?$/)
    await expect(page).toHaveTitle(/.+/)
  })

  test('catálogo y ficha del producto sembrado', async ({ page }) => {
    const shop = await page.goto('/shop')
    expect(shop?.status()).toBeLessThan(400)
    await expect(page.getByText(SEEDED_PRODUCT.name).first()).toBeVisible()

    const pdp = await page.goto(`/shop/${SEEDED_PRODUCT.slug}`)
    expect(pdp?.status(), 'ficha de producto').toBeLessThan(400)
    await expect(page.getByRole('heading', { name: SEEDED_PRODUCT.name })).toBeVisible()
  })

  test('carrito y checkout cargan (carrito vacío) @smoke', async ({ page }) => {
    expect((await page.goto('/cart'))?.status()).toBeLessThan(400)
    expect((await page.goto('/checkout'))?.status()).toBeLessThan(400)
  })

  test('robots.txt y sitemap.xml @smoke', async ({ request }) => {
    const robots = await request.get('/robots.txt')
    expect(robots.ok()).toBeTruthy()
    expect(await robots.text()).toMatch(/sitemap/i)
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.ok()).toBeTruthy()
    expect(await sitemap.text()).toContain('/shop')
  })

  test('una ruta inexistente responde 404 @smoke', async ({ request }) => {
    const res = await request.get('/esta-ruta-no-existe-e2e')
    expect(res.status()).toBe(404)
  })

  test('cabeceras de seguridad (CSP con nonce) @smoke', async ({ request }) => {
    const res = await request.get('/')
    const csp = res.headers()['content-security-policy'] ?? ''
    expect(csp, 'CSP presente').toContain("script-src")
    expect(csp).toMatch(/nonce-|strict-dynamic/)
  })
})
