import { test, expect, request } from '@playwright/test'

/**
 * Flujo de riesgo: compra en el storefront → pago aprobado → el stock se descuenta
 * en el **ledger** (movimiento `sale`), y para un terminado `al_vender` se consumen
 * sus componentes. Es el corte venta→ledger (E18·HU-178) de punta a punta.
 *
 * Nota: el pago se simula invocando el webhook del proveedor con un payload de
 * test (NO se usa pasarela real). Ajusta el endpoint/payload del webhook de tu
 * proveedor de pruebas, y los selectores del checkout del storefront.
 *
 * Marcado como fixme hasta cablear los selectores/datos reales del storefront de
 * tu tienda de prueba; sirve de plantilla del recorrido.
 */
test.fixme('compra aprobada descuenta el componente al_vender en el ledger', async ({ page }) => {
  const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:3001'

  await test.step('disponible inicial del componente (vía kardex admin)', async () => {
    // Lee el disponible de 'cafe-en-grano' antes de vender (API o kardex).
  })

  await test.step('comprar en el storefront', async () => {
    await page.goto('/')
    // TODO: abrir PDP de "Café E2E", agregar al carrito, ir a checkout, completar
    // datos de invitado y colocar la orden (pago manual o pendiente).
    await expect(page).toHaveTitle(/.+/)
  })

  await test.step('simular webhook de pago aprobado', async () => {
    const api = await request.newContext()
    // TODO: POST al webhook del proveedor de pruebas con el order_number creado y
    // un payload de test firmado → dispara applyStockForOrder → ledger.
    void api
    void adminUrl
  })

  await test.step('el componente bajó 18 g en el ledger', async () => {
    // Relee el disponible: debe haber disminuido en la cantidad del BOM al_vender.
  })
})
