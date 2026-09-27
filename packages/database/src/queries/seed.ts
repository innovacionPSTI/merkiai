/**
 * queries/seed.ts — Semilla de configuración y arranque por tenant (HU-207 / HU-234).
 *
 * Al aprovisionar un tenant nuevo (HU-209), su config vive en el PLANO DE TIENDA
 * (store_config/payment_config/shipping_config/admin_config) y necesita una fila
 * por tenant + la página `home` para que el storefront y el admin operen desde
 * el minuto cero. Esta función es **idempotente** (upsert por tenant): re-correr
 * no duplica ni pisa datos ya editados por el comerciante (usa las columnas
 * mínimas; el resto lo llenan los defaults del esquema).
 *
 * HU-234: además siembra las **secciones de arranque del home** (del preset
 * elegido o un default genérico) para que la tienda no nazca vacía. Se marcan
 * como **ejemplo** (`settings.sample` / `metadata.sample = true`) para poder
 * reemplazarlas o borrarlas en lote desde el admin. Idempotente: solo siembra si
 * el tenant aún no tiene secciones de home.
 *
 * Se ejecuta con service-role desde el endpoint interno del admin (autorizado
 * por el control plane), porque toca varias tablas del plano de tienda antes de
 * que exista sesión del dueño. Como el service-role NO pasa por RLS, todas las
 * escrituras y lecturas fijan `tenant_id` explícitamente.
 */
import { createServerClient, type Db } from '../client'

/** Ítem de arranque de una sección (hero slide, card, etc.). */
export interface StarterSectionItem {
  item_type?: string
  title?: string
  description?: string
  cta_text?: string
  link_url?: string
  icon?: string
  image_url?: string
  order_index?: number
  metadata?: Record<string, unknown>
}

/** Sección de arranque del home (estructura + ítems). */
export interface StarterSection {
  section_type: string
  title?: string
  subtitle?: string
  body?: string
  order_index?: number
  settings?: Record<string, unknown>
  items?: StarterSectionItem[]
}

/**
 * Secciones de arranque genéricas (sin vertical). Espejo neutro de
 * seeds/02_content.sql: estructura del home + un hero de bienvenida.
 */
export const DEFAULT_HOME_SECTIONS: StarterSection[] = [
  {
    section_type: 'hero',
    title: 'Carrusel principal',
    order_index: 0,
    items: [
      {
        item_type: 'slide',
        title: 'Bienvenido a tu tienda',
        description: 'Configura este mensaje, las imágenes y los productos desde el panel de administración.',
        cta_text: 'Ver productos',
        link_url: '/shop',
        order_index: 1,
        metadata: { bg_color: '#1E293B' },
      },
    ],
  },
  { section_type: 'featured_products', title: 'Productos destacados', order_index: 10 },
  { section_type: 'best_sellers', title: 'Más vendidos', order_index: 20 },
  { section_type: 'blog_preview', title: 'Del blog', order_index: 30 },
  { section_type: 'newsletter', title: 'Newsletter', order_index: 40 },
]

export interface SeedTenantConfigInput {
  /** Nombre visible de la tienda (por defecto, genérico). */
  storeName?: string
  /**
   * Secciones de arranque del home (HU-234). Si se omite, se usa
   * DEFAULT_HOME_SECTIONS. HU-235 puede pasar las del preset elegido.
   */
  homeSections?: StarterSection[]
}

export interface SeedTenantConfigResult {
  tenantId: string
  results: Record<string, 'ok' | string>
}

export async function seedTenantConfig(
  tenantId: string,
  input: SeedTenantConfigInput = {},
  db: Db = createServerClient(),
): Promise<SeedTenantConfigResult> {
  if (!tenantId) throw new Error('[seed] tenantId requerido')
  const supabase = db
  const storeName = (input.storeName ?? '').trim() || 'Mi Tienda'
  const results: Record<string, 'ok' | string> = {}

  // Upsert idempotente por tenant. onConflict = clave por tenant (e17/03/07).
  // ignoreDuplicates: no pisa filas existentes (config ya editada por el dueño).
  const step = async (
    table: string,
    row: Record<string, unknown>,
    onConflict: string,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from(table)
      .upsert(row, { onConflict, ignoreDuplicates: true })
    results[table] = error ? `error: ${error.message}` : 'ok'
  }

  await step('store_config',    { tenant_id: tenantId, store_name: storeName, template: 'default' }, 'tenant_id')
  await step('payment_config',  { tenant_id: tenantId }, 'tenant_id') // active_provider default 'none'
  await step('shipping_config', { tenant_id: tenantId }, 'tenant_id')
  await step('admin_config',    { tenant_id: tenantId }, 'tenant_id')
  // Página home del tenant (PK compuesta tenant_id,key tras e17/04).
  await step('pages', {
    tenant_id: tenantId, key: 'home', label: 'Inicio', slug: '',
    page_type: 'home', enabled: true, show_in_footer: false, order_index: 0,
  }, 'tenant_id,key')

  // HU-234: secciones de arranque del home (solo si no existen aún).
  results.home_sections = await seedHomeSections(
    supabase,
    tenantId,
    input.homeSections ?? DEFAULT_HOME_SECTIONS,
  )

  return { tenantId, results }
}

/**
 * Materializa las secciones de arranque del home para un tenant (HU-234).
 * Idempotente: si el tenant ya tiene alguna sección de home, no hace nada.
 * Marca todo como `sample` para reemplazo/borrado en lote desde el admin.
 */
async function seedHomeSections(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  tenantId: string,
  sections: StarterSection[],
): Promise<'ok' | string> {
  try {
    const { count, error: cErr } = await supabase
      .from('page_sections')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('page_key', 'home')
    if (cErr) return `error: ${cErr.message}`
    if ((count ?? 0) > 0) return 'skipped (ya existen)'

    for (const [i, sec] of sections.entries()) {
      const { data: secRow, error: sErr } = await supabase
        .from('page_sections')
        .insert({
          tenant_id: tenantId,
          page_key: 'home',
          section_type: sec.section_type,
          title: sec.title ?? null,
          subtitle: sec.subtitle ?? null,
          body: sec.body ?? null,
          enabled: true,
          order_index: sec.order_index ?? i * 10,
          settings: { ...(sec.settings ?? {}), sample: true },
        })
        .select('id')
        .single()
      if (sErr || !secRow) return `error: ${sErr?.message ?? 'sin id de sección'}`

      const items = sec.items ?? []
      if (items.length) {
        const { error: iErr } = await supabase.from('section_items').insert(
          items.map((it, j) => ({
            tenant_id: tenantId,
            section_id: secRow.id,
            item_type: it.item_type ?? 'card',
            title: it.title ?? null,
            description: it.description ?? null,
            icon: it.icon ?? null,
            image_url: it.image_url ?? null,
            cta_text: it.cta_text ?? null,
            link_url: it.link_url ?? null,
            enabled: true,
            order_index: it.order_index ?? j + 1,
            metadata: { ...(it.metadata ?? {}), sample: true },
          })),
        )
        if (iErr) return `error (items): ${iErr.message}`
      }
    }
    return 'ok'
  } catch (e) {
    return `error: ${e instanceof Error ? e.message : String(e)}`
  }
}
