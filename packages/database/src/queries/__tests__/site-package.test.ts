import { buildSitePackage, safeStoreConfig, SITE_PACKAGE_KIND, SITE_PACKAGE_VERSION, SAFE_STORE_CONFIG_FIELDS } from '../site-package'
import { TEMPLATE_PACKAGE_KIND } from '../template-package'

const theme = {
  id: 1, tenant_id: 't', is_active: true, is_default: false, name: 'Tema',
  color_primary: '#111', color_dark: '#000', color_cream: '#fff', color_cream_warm: '#fef',
  color_yellow: '#ff0', color_yellow_pale: '#ffe', color_text: '#222', color_price: null,
  font_display: 'lora', font_body: 'inter', color_scheme: 'light', dark_bg: null, dark_surface: null,
  dark_text: null, template: 'default', created_at: 'x', updated_at: 'y',
} as any

const config = {
  id: 1, tenant_id: 't', store_name: 'Tienda', template: 'default', inventory_model: 'single',
  resend_api_key: 'SECRET-123', resend_from_email: 'ventas@x.com',
  onboarding_state: { presetApplied: 'cafe' }, updated_at: 'z',
  footer_show_store: true, trust_badges: [],
} as any

describe('safeStoreConfig — no filtra secretos (HU-123)', () => {
  it('excluye resend_api_key y campos internos; incluye los presentacionales', () => {
    const safe = safeStoreConfig(config)
    expect(safe.resend_api_key).toBeUndefined()
    expect(safe.onboarding_state).toBeUndefined()
    expect((safe as any).id).toBeUndefined()
    expect((safe as any).updated_at).toBeUndefined()
    expect(safe.store_name).toBe('Tienda')
    expect(safe.resend_from_email).toBe('ventas@x.com') // el from no es secreto
  })

  it('solo contiene claves del allowlist', () => {
    const safe = safeStoreConfig(config)
    for (const k of Object.keys(safe)) expect(SAFE_STORE_CONFIG_FIELDS as readonly string[]).toContain(k)
  })
})

describe('buildSitePackage (HU-123)', () => {
  it('arma el paquete con Tema (paquete de HU-129), config segura, nav y páginas', () => {
    const pkg = buildSitePackage({ theme, storeConfig: config, nav: [{ id: 1 }], pages: [] })
    expect(pkg.kind).toBe(SITE_PACKAGE_KIND)
    expect(pkg.schema_version).toBe(SITE_PACKAGE_VERSION)
    expect(pkg.theme?.kind).toBe(TEMPLATE_PACKAGE_KIND)
    expect((pkg.store_config as any).resend_api_key).toBeUndefined()
    expect(pkg.nav).toEqual([{ id: 1 }])
    expect(pkg.pages).toEqual([])
  })

  it('tolera tienda sin tema activo', () => {
    expect(buildSitePackage({ theme: null, storeConfig: config, nav: [], pages: [] }).theme).toBeNull()
  })
})
