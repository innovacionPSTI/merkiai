import { test, expect } from '@playwright/test'

/**
 * Operaciones en el admin (proyecto `admin`, sesión autenticada por global-setup).
 * Cubre el camino feliz del módulo E24/E18 que construimos. Los selectores usan
 * texto visible (resilientes a cambios de clases); ajusta si renombras etiquetas.
 */

test.describe('Operaciones · admin', () => {
  test('el tablero muestra KPIs y permite exportar', async ({ page }) => {
    await page.goto('/operaciones')
    await expect(page.getByRole('heading', { name: 'Operaciones' })).toBeVisible()
    await expect(page.getByText('Valor del inventario (a costo)')).toBeVisible()
    // El export responde CSV (descarga).
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: /Exportar valorización/i }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/valorizacion-inventario.*\.csv/)
  })

  test('crear un ítem de inventario y verlo en el listado', async ({ page }) => {
    await page.goto('/inventario')
    const nombre = `Insumo E2E ${Date.now()}`
    await page.getByRole('heading', { name: 'Nuevo ítem' }).scrollIntoViewIfNeeded()
    await page.getByLabel('Nombre').first().fill(nombre)
    await page.getByRole('button', { name: 'Agregar' }).click()
    await expect(page.getByText(nombre)).toBeVisible()
  })

  test('crear cotización y convertirla a orden', async ({ page }) => {
    await page.goto('/cotizaciones')
    await page.getByRole('button', { name: 'Nueva cotización' }).click()
    await page.getByLabel('Cliente').fill('Cliente E2E')
    await page.getByLabel('Concepto').first().fill('Servicio E2E')
    await page.getByLabel('Cant.').first().fill('1')
    await page.getByLabel('Precio').first().fill('50000')
    await page.getByRole('button', { name: 'Crear cotización' }).click()
    // Aparece la fila; convertir genera una orden.
    const fila = page.getByRole('row', { name: /Cliente E2E/ }).first()
    await expect(fila).toBeVisible()
    page.once('dialog', (d) => d.accept()) // confirm()
    await fila.getByRole('button', { name: 'Convertir a orden' }).click()
    await expect(page.getByText(/Orden creada:/i)).toBeVisible()
  })
})
