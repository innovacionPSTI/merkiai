import { buildSwatchColorMap } from '../variant-types'

const vt = (name: string, swatch_hex: Record<string, string>) =>
  ({ id: 1, tenant_id: 't', name, values: Object.keys(swatch_hex), swatch_hex, display_type: 'swatch', active: true, order_index: 0, created_at: 'x' }) as any

describe('buildSwatchColorMap (HU-264)', () => {
  it('fusiona los hex de varios tipos, en minúsculas', () => {
    const map = buildSwatchColorMap([
      vt('Color', { Rojo: '#e11', Azul: '#1e40af' }),
      vt('Tono', { Verde: '#16a34a' }),
    ])
    expect(map).toEqual({ rojo: '#e11', azul: '#1e40af', verde: '#16a34a' })
  })

  it('ignora hex vacíos y tipos sin swatch_hex', () => {
    const map = buildSwatchColorMap([vt('Color', { Rojo: '', Azul: '#00f' }), { ...vt('X', {}), swatch_hex: undefined } as any])
    expect(map).toEqual({ azul: '#00f' })
  })

  it('lista vacía → {}', () => {
    expect(buildSwatchColorMap([])).toEqual({})
  })
})
