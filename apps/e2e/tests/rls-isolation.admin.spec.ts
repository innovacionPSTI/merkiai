import { test, expect } from '@playwright/test'

/**
 * Aislamiento multi-tenant (RLS) — crítico por ser single-DB pooled: el admin del
 * tenant A no debe ver NI tocar datos de otro tenant. La sesión por defecto
 * (global-setup) es la del tenant A.
 */
test.describe('Seguridad · Aislamiento de tenant', () => {
  test('la sesión admin carga su propio panel (scoping ok)', async ({ page }) => {
    await page.goto('/operaciones')
    await expect(page, 'no debe redirigir a login').not.toHaveURL(/sign-in/)
    await expect(page.getByRole('heading', { name: 'Operaciones' })).toBeVisible()
  })

  test('no se puede editar un recurso que no pertenece al tenant (RLS)', async ({ request }) => {
    // Un id altísimo no existe para este tenant → RLS/consulta no devuelve fila →
    // el PATCH no puede ser 2xx. (El cross-tenant real con un id del tenant B se
    // cubre sembrando B; aquí validamos que no hay fuga por id arbitrario.)
    const res = await request.patch('/api/admin/inventory/items/999999999', { data: { name: 'intento cross-tenant' } })
    expect(res.ok(), 'no debe permitir editar un recurso ajeno/inexistente').toBeFalsy()
  })
})
