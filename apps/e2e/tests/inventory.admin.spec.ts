import { test, expect } from '@playwright/test'
import { planLacksFeature } from '../lib/preconditions'

/**
 * Inventario / ledger (E24) — API-driven y determinista: crea un ítem, ajusta su
 * saldo y comprueba la valorización y el kardex. No depende del DOM ni de pagos;
 * usa la sesión admin (storageState) y los endpoints reales que expone el panel.
 */
test.describe('Operaciones · Inventario (API)', () => {
  test('crear ítem → ajustar entrada → se refleja en valorización y kardex', async ({ request }) => {
    const name = `E2E Insumo ${Date.now()}`

    const create = await request.post('/api/admin/inventory/items', { data: { name, item_class: 'insumo' } })
    test.skip(planLacksFeature(create), 'El tenant de prueba no tiene el plan con inventario (feature `inventory`).')
    expect(create.ok(), `crear ítem → ${create.status()}`).toBeTruthy()
    const item = await create.json()
    expect(item.id).toBeGreaterThan(0)

    // Ajuste de entrada (saldo de apertura manual) → anexa un movimiento al libro.
    const adjust = await request.post(`/api/admin/inventory/items/${item.id}/adjust`, {
      data: { direction: 'in', qty: 10, reason: 'E2E apertura' },
    })
    expect(adjust.ok(), `ajuste → ${adjust.status()}`).toBeTruthy()

    // Valorización (CSV) incluye el ítem recién creado.
    const valuation = await request.get('/api/admin/operations/export?type=valuation')
    expect(valuation.ok()).toBeTruthy()
    expect(valuation.headers()['content-type']).toContain('text/csv')
    const csv = await valuation.text()
    expect(csv).toContain('clave,nombre,clase')
    expect(csv).toContain(name)

    // Kardex del ítem (CSV) con al menos el movimiento de ajuste.
    const kardex = await request.get(`/api/admin/operations/export?type=kardex&item=${item.id}`)
    expect(kardex.ok()).toBeTruthy()
    const kardexCsv = await kardex.text()
    expect(kardexCsv.split('\n').length).toBeGreaterThan(1)
    expect(kardexCsv).toContain('fecha,tipo,direccion,cantidad,unidad,motivo,referencia')
  })
})
