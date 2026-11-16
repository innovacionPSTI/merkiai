import { test, expect } from '@playwright/test'
import { SEEDED_PRODUCT, SEEDED_COMPONENT_KEY, CO_ADDRESS, adminApi } from '../lib/fixtures'

/**
 * Flujo de riesgo venta → ledger (E18·HU-178), por API y sin pasarela real:
 *   1. el storefront crea el pedido (`/api/checkout`, autoridad de precios en el servidor);
 *   2. el admin confirma el pago (`payment-status: approved`, igual que un pago manual
 *      validado) → `applyStockForOrder` escribe en el libro;
 *   3. el kardex del componente `al_vender` muestra la salida por venta.
 * Si la tienda de prueba tiene una pasarela activa, el pedido queda pendiente de
 * pago y la aprobación manual lo confirma igual.
 */
test('pedido confirmado descuenta el componente al_vender en el ledger', async ({ request }) => {
  const admin = await adminApi()

  // Producto sembrado → id y primera variante (vía admin).
  const suggest = await (await request.get(`/api/search/suggest?q=${encodeURIComponent(SEEDED_PRODUCT.name)}`)).json() as { suggestions: Array<{ id: number; slug: string }> }
  const hit = suggest.suggestions.find((s) => s.slug === SEEDED_PRODUCT.slug)
  test.skip(!hit, 'El producto sembrado no está publicado (¿E2E_SEED=1?).')
  const product = await (await admin.get(`/api/admin/products/${hit!.id}`)).json() as { variants: Array<{ id: number; price: number }> }
  const variant = product.variants[0]
  expect(variant, 'el producto sembrado tiene variante').toBeTruthy()

  // Componente al_vender y su kardex antes de vender.
  const items = await admin.get('/api/admin/inventory/items')
  test.skip(items.status() === 402, 'El plan de prueba no incluye inventario.')
  const component = (await items.json() as Array<{ id: number; key: string }>).find((i) => i.key === SEEDED_COMPONENT_KEY)
  test.skip(!component, 'La receta al_vender no está sembrada.')
  const kardexBefore = (await (await admin.get(`/api/admin/operations/export?type=kardex&item=${component!.id}`)).text()).trim().split('\n').length

  // 1) Pedido desde el storefront.
  const checkout = await request.post('/api/checkout', {
    data: {
      email: `e2e+${Date.now()}@example.com`, name: 'Cliente E2E', phone: '3001234567',
      address: CO_ADDRESS,
      items: [{ variant_id: variant.id, qty: 1, product_name: SEEDED_PRODUCT.name, variant_label: '', price: variant.price }],
      idempotency_key: `e2e-${Date.now()}`,
    },
  })
  expect(checkout.ok(), `checkout → ${checkout.status()} ${await checkout.text()}`).toBeTruthy()
  const order = await checkout.json() as { order_id: number; order_number: string }
  expect(order.order_number).toBeTruthy()

  // 2) Pago confirmado desde el admin.
  const approve = await admin.patch(`/api/admin/orders/${order.order_id}/payment-status`, { data: { payment_status: 'approved' } })
  expect(approve.ok(), `aprobar pago → ${approve.status()}`).toBeTruthy()

  // 3) El kardex del componente tiene un movimiento más (salida por venta).
  await expect.poll(async () => (await (await admin.get(`/api/admin/operations/export?type=kardex&item=${component!.id}`)).text()).trim().split('\n').length, { timeout: 15_000 })
    .toBeGreaterThan(kardexBefore)
  await admin.dispose()
})
