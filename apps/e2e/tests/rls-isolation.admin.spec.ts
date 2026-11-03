import { test, expect } from '@playwright/test'

/**
 * Aislamiento multi-tenant (RLS) — crítico por ser single-DB pooled: el admin del
 * tenant A no debe ver NI tocar datos del tenant B.
 *
 * La sesión por defecto (global-setup) es del tenant A. Este test verifica que,
 * con esa sesión, no se accede a un recurso del tenant B.
 *
 * Marcado como fixme hasta fijar un id de recurso conocido del tenant B en el seed;
 * sirve de plantilla del chequeo.
 */
test.fixme('el admin del tenant A no accede a un ítem del tenant B', async ({ request }) => {
  const adminUrl = process.env.E2E_ADMIN_URL ?? 'http://localhost:3001'
  // TODO: sembrar en el tenant B un ítem con id conocido y ponerlo aquí.
  const itemIdDelTenantB = 999999

  const res = await request.patch(`${adminUrl}/api/admin/inventory/items/${itemIdDelTenantB}`, {
    data: { name: 'intento cross-tenant' },
  })
  // RLS debe impedirlo: no 2xx (404/500 por fila inexistente para este tenant).
  expect(res.ok()).toBeFalsy()
})

test('la sesión admin resuelve su propio tenant', async ({ page }) => {
  await page.goto('/operaciones')
  // Si la sesión es válida y scoped, el tablero carga sin redirigir a login.
  await expect(page).not.toHaveURL(/sign-in/)
  await expect(page.getByRole('heading', { name: 'Operaciones' })).toBeVisible()
})
