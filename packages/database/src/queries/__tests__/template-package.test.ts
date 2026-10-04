import {
  buildTemplatePackage,
  parseTemplatePackage,
  TemplatePackageError,
  TEMPLATE_PACKAGE_VERSION,
  TEMPLATE_PACKAGE_KIND,
  PACKAGE_THEME_FIELDS,
} from '../template-package'

const theme = {
  id: 7, tenant_id: 't', is_active: true, is_default: false,
  name: 'Boutique', color_primary: '#111111', color_dark: '#000000',
  color_cream: '#ffffff', color_cream_warm: '#fefefe', color_yellow: '#ffcc00',
  color_yellow_pale: '#fff7cc', color_text: '#222222', color_price: '#aa0000',
  font_display: 'lora', font_body: 'inter',
  color_scheme: 'auto', dark_bg: '#101010', dark_surface: '#202020', dark_text: '#eeeeee',
  template: 'esencial', created_at: 'x', updated_at: 'y',
} as any

describe('buildTemplatePackage (HU-129)', () => {
  it('incluye kind, versión y solo los campos del tema (sin id/tenant/flags)', () => {
    const pkg = buildTemplatePackage(theme)
    expect(pkg.kind).toBe(TEMPLATE_PACKAGE_KIND)
    expect(pkg.schema_version).toBe(TEMPLATE_PACKAGE_VERSION)
    expect(Object.keys(pkg.theme).sort()).toEqual([...PACKAGE_THEME_FIELDS].sort())
    expect((pkg.theme as any).id).toBeUndefined()
    expect((pkg.theme as any).tenant_id).toBeUndefined()
    expect((pkg.theme as any).is_active).toBeUndefined()
    expect(pkg.theme.template).toBe('esencial')
  })
})

describe('parseTemplatePackage (HU-129)', () => {
  it('redondea build→parse conservando los campos', () => {
    const input = parseTemplatePackage(buildTemplatePackage(theme))
    expect((input as any).name).toBe('Boutique')
    expect((input as any).color_scheme).toBe('auto')
    expect((input as any).template).toBe('esencial')
  })

  it('rechaza objetos que no son plantillas Merkiai', () => {
    expect(() => parseTemplatePackage({ foo: 1 })).toThrow(TemplatePackageError)
  })

  it('rechaza versiones más nuevas que la soportada', () => {
    expect(() => parseTemplatePackage({ kind: TEMPLATE_PACKAGE_KIND, schema_version: 999, theme: { name: 'X' } }))
      .toThrow(/más nueva/i)
  })

  it('tolera un paquete sin los campos nuevos → defaults', () => {
    const legacy = { kind: TEMPLATE_PACKAGE_KIND, schema_version: 1, theme: { name: 'Vieja', color_primary: '#123456' } }
    const input = parseTemplatePackage(legacy) as any
    expect(input.color_scheme).toBe('light')   // default
    expect(input.dark_bg).toBeNull()
    expect(input.color_price).toBeNull()
    expect(input.template).toBeNull()
    expect(input.color_primary).toBe('#123456')
  })

  it('ignora claves desconocidas', () => {
    const input = parseTemplatePackage({ kind: TEMPLATE_PACKAGE_KIND, schema_version: 1, theme: { name: 'N', hack: 'x' } }) as any
    expect(input.hack).toBeUndefined()
  })

  it('normaliza un color_scheme inválido a light', () => {
    const input = parseTemplatePackage({ kind: TEMPLATE_PACKAGE_KIND, schema_version: 1, theme: { name: 'N', color_scheme: 'neon' } }) as any
    expect(input.color_scheme).toBe('light')
  })

  it('permite renombrar al importar', () => {
    const input = parseTemplatePackage(buildTemplatePackage(theme), 'Nueva') as any
    expect(input.name).toBe('Nueva')
  })

  it('exige nombre', () => {
    expect(() => parseTemplatePackage({ kind: TEMPLATE_PACKAGE_KIND, schema_version: 1, theme: {} })).toThrow(/nombre/i)
  })
})
