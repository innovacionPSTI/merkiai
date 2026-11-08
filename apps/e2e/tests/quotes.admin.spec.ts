import { test, expect } from '@playwright/test'
import { planLacksFeature } from '../lib/preconditions'

/**
 * Cotizaciones (HU-408) — API-driven: crea una cotización, la mueve a "enviada" y
 * la convierte en una orden (reusa el modelo de orden). Verifica el número de orden.
 */
test.describe('Operaciones · Cotizaciones (API)', () => {
  test('crear → enviar → convertir a orden', async ({ request }) => {
    const create = await request.post('/api/admin/quotes', {
      data: { customer_name: 'Cliente E2E', items: [{ name: 'Servicio E2E', qty: 1, unit_price: 50000 }] },
    })
    test.skip(planLacksFeature(create), 'El tenant de prueba no tiene el plan con cotizaciones (feature `quotes`).')
    expect(create.ok(), `crear cotización → ${create.status()}`).toBeTruthy()
    const quote = await create.json()
    expect(quote.total).toBe(50000)

    const send = await request.patch(`/api/admin/quotes/${quote.id}`, { data: { status: 'sent' } })
    expect(send.ok()).toBeTruthy()

    const convert = await request.post(`/api/admin/quotes/${quote.id}/convert`)
    expect(convert.ok(), `convertir → ${convert.status()}`).toBeTruthy()
    const result = await convert.json()
    expect(result.order_number, 'debe devolver el número de orden creado').toBeTruthy()
  })
})
