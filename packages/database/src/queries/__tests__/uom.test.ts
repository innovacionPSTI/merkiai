import {
  toBase, fromBase, convertUom, normalizeQty,
  isItemClass, isUomDimension, normalizeStockItemInput,
} from '../uom'

const g = { dimension: 'weight' as const, to_base_factor: 1 }
const kg = { dimension: 'weight' as const, to_base_factor: 1000 }
const ml = { dimension: 'volume' as const, to_base_factor: 1 }

describe('conversión de unidades (HU-400, pura)', () => {
  it('toBase / fromBase', () => {
    expect(toBase(2, 1000)).toBe(2000)      // 2 kg → 2000 g
    expect(fromBase(2000, 1000)).toBe(2)    // 2000 g → 2 kg
  })

  it('convertUom entre unidades de la misma dimensión', () => {
    expect(convertUom(1.5, kg, g)).toBe(1500)   // 1.5 kg → 1500 g
    expect(convertUom(250, g, kg)).toBe(0.25)   // 250 g → 0.25 kg
  })

  it('convertUom lanza si las dimensiones difieren', () => {
    expect(() => convertUom(1, g, ml)).toThrow(/incompatibles/)
  })

  it('fromBase exige factor > 0', () => {
    expect(() => fromBase(10, 0)).toThrow(/factor/)
  })

  it('normalizeQty redondea y tolera no-finitos', () => {
    expect(normalizeQty(0.1 + 0.2)).toBe(0.3)
    expect(normalizeQty(Infinity)).toBe(0)
  })
})

describe('validación de clase/dimensión', () => {
  it('isItemClass', () => {
    expect(isItemClass('materia_prima')).toBe(true)
    expect(isItemClass('terminado')).toBe(true)
    expect(isItemClass('otro')).toBe(false)
  })
  it('isUomDimension', () => {
    expect(isUomDimension('weight')).toBe(true)
    expect(isUomDimension('tiempo')).toBe(false)
  })
})

describe('normalizeStockItemInput', () => {
  it('slugifica key, default clase terminado, sellable coherente', () => {
    const r = normalizeStockItemInput({ name: 'Café Verde' })!
    expect(r).toMatchObject({ key: 'cafe-verde', name: 'Café Verde', item_class: 'terminado', sellable: true })
  })
  it('materia prima no es vendible por defecto', () => {
    const r = normalizeStockItemInput({ name: 'Bulto', item_class: 'materia_prima' })!
    expect(r).toMatchObject({ item_class: 'materia_prima', sellable: false })
  })
  it('clase inválida cae a terminado; respeta uom_id y override de sellable', () => {
    const r = normalizeStockItemInput({ name: 'X', item_class: 'raro', uom_id: 5, sellable: false })!
    expect(r).toMatchObject({ item_class: 'terminado', uom_id: 5, sellable: false })
  })
  it('null si falta nombre/clave', () => {
    expect(normalizeStockItemInput({ name: '' })).toBeNull()
    expect(normalizeStockItemInput({ key: '!!!', name: '' })).toBeNull()
  })
})
