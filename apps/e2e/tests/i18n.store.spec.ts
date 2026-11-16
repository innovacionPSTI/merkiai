import { test, expect } from '@playwright/test'

/**
 * Idiomas (E28 · HU-462): con más de un idioma publicado, la versión con prefijo
 * responde en su idioma y la página anuncia `hreflang` recíproco. Con un solo
 * idioma la tienda se comporta como siempre (sin prefijos) y la prueba se salta.
 */
test.describe('Storefront · idiomas', () => {
  test('prefijo de idioma, html lang y hreflang', async ({ page, request }) => {
    const cfg = await (await request.get('/api/locales')).json() as { defaultLocale: string; locales: string[] }
    const other = cfg.locales.find((l) => l !== cfg.defaultLocale)
    test.skip(!other, 'La tienda de prueba publica un solo idioma.')

    const prefix = `/${other!.toLowerCase()}`
    const res = await page.goto(`${prefix}/shop`)
    expect(res?.status()).toBeLessThan(400)
    await expect(page.locator('html')).toHaveAttribute('lang', other!)
    await expect(page.locator(`link[rel="alternate"][hreflang="${cfg.defaultLocale}"]`)).toHaveCount(1)
    await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1)
  })

  test('el idioma por defecto con prefijo redirige a la URL sin prefijo', async ({ request }) => {
    const cfg = await (await request.get('/api/locales')).json() as { defaultLocale: string; locales: string[] }
    test.skip(cfg.locales.length < 2, 'La tienda de prueba publica un solo idioma.')
    const res = await request.get(`/${cfg.defaultLocale.toLowerCase()}/shop`, { maxRedirects: 0 })
    expect([301, 308]).toContain(res.status())
    expect(res.headers()['location']).toMatch(/\/shop$/)
  })
})
