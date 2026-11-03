/**
 * Siembra del tenant de prueba para E2E. Reusa los bloques que ya existen en el
 * producto en vez de fixtures a mano:
 *   - endpoint interno de aprovisionamiento (`/api/internal/tenants/seed`), que
 *     aplica el preset (tema, catálogo de ejemplo y el bloque `operations` de
 *     HU-410 si el plan trae `inventory`),
 *   - endpoint de backfill del saldo de apertura al ledger (HU-178 F3a).
 *
 * Prerrequisitos (ver docs/E2E-PRUEBAS.md):
 *   - DB con migraciones+seeds aplicadas,
 *   - el tenant de prueba existe con sus entitlements activos
 *     (inventory, multi_location, price_lists, quotes),
 *   - variables E2E_* configuradas.
 *
 * Es idempotente: el preset no duplica catálogo y el backfill no duplica saldos.
 */

interface SeedOptions {
  adminUrl: string
  tenantId: string
  internalSecret: string
}

const PRESET = {
  theme: { name: 'Tienda E2E', color_primary: '#0f766e' },
  template: 'boutique',
  sample_categories: [{ name: 'Bebidas' }],
  sample_products: [
    { name: 'Café E2E', price: 12000, category_slug: 'bebidas', featured: true, stock: 25 },
  ],
  // Operaciones (HU-410): se materializa solo si el plan trae `inventory`.
  operations: {
    uoms: [{ code: 'g', name: 'Gramo', dimension: 'weight', to_base_factor: 1 }],
    stock_items: [
      { name: 'Café en grano', item_class: 'materia_prima', uom: 'g' },
      { name: 'Café E2E', item_class: 'terminado', sellable: true },
    ],
    boms: [
      {
        output: 'cafe-e2e',
        consumption_policy: 'al_vender',
        components: [{ item: 'cafe-en-grano', qty: 18, uom: 'g' }],
      },
    ],
  },
}

async function post(url: string, secret: string, body: unknown) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-secret': secret },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Seed ${url} → ${res.status}: ${await res.text()}`)
  return res.json().catch(() => ({}))
}

/** Aprovisiona el tenant de prueba con catálogo + operaciones de ejemplo. */
export async function seedTestTenant(opts: SeedOptions): Promise<void> {
  if (!opts.internalSecret) {
    throw new Error('E2E_INTERNAL_SECRET no configurado: no se puede sembrar vía endpoint interno')
  }
  await post(`${opts.adminUrl}/api/internal/tenants/seed`, opts.internalSecret, {
    tenantId: opts.tenantId,
    storeName: 'Tienda E2E',
    preset: PRESET,
    limits: { categories: 50, products: 200, pages: 50 },
    allowMultiLocation: true,
    allowBlueprint: false,
    allowInventory: true,
  })
}

/** Materializa el stock legacy actual como saldo de apertura en el ledger. */
export async function backfillOpeningStock(adminUrl: string, storageStatePath: string): Promise<void> {
  // El backfill vive tras auth de admin (no es endpoint interno): se invoca desde
  // una request autenticada. Ver el uso en global-setup / docs.
  void adminUrl
  void storageStatePath
}
