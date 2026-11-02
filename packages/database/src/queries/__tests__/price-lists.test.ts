import { resolveEffectivePrice, selectApplicableLists, isPriceScopeType, type PriceList, type PriceListItem } from '../price-lists'

const lists: PriceList[] = [
  { id: 1, key: 'base', name: 'Base', scope_type: 'generic', scope_value: null, priority: 0, active: true },
  { id: 2, key: 'pos', name: 'Mostrador', scope_type: 'channel', scope_value: 'pos', priority: 10, active: true },
  { id: 3, key: 'sedeB', name: 'Sede B', scope_type: 'location', scope_value: 'B', priority: 5, active: true },
  { id: 4, key: 'off', name: 'Inactiva', scope_type: 'generic', scope_value: null, priority: 99, active: false },
]

describe('listas de precio (HU-407, puros)', () => {
  it('isPriceScopeType valida el ámbito', () => {
    expect(isPriceScopeType('channel')).toBe(true)
    expect(isPriceScopeType('otro')).toBe(false)
  })

  it('selectApplicableLists: generic siempre; scope por coincidencia; ignora inactivas', () => {
    const r = selectApplicableLists(lists, { channel: 'pos', location: 'A' })
    expect(r.map((l) => l.id).sort()).toEqual([1, 2]) // base + pos (no sede B, no inactiva)
    expect(selectApplicableLists(lists, {}).map((l) => l.id)).toEqual([1]) // solo generic
  })

  it('AC-3: sin entradas aplicables rige el precio base', () => {
    const price = resolveEffectivePrice(10000, { productId: 7, items: [], listPriority: new Map() })
    expect(price).toBe(10000)
  })

  it('AC-1/AC-2: resuelve por producto y mayor prioridad gana', () => {
    const items: PriceListItem[] = [
      { id: 100, price_list_id: 1, product_id: 7, variant_id: null, price: 9000 },  // base prio 0
      { id: 101, price_list_id: 2, product_id: 7, variant_id: null, price: 8000 },  // pos prio 10
    ]
    const prio = new Map([[1, 0], [2, 10]])
    expect(resolveEffectivePrice(10000, { productId: 7, items, listPriority: prio })).toBe(8000)
  })

  it('variante gana sobre producto aunque la lista tenga menor prioridad', () => {
    const items: PriceListItem[] = [
      { id: 101, price_list_id: 2, product_id: 7, variant_id: null, price: 8000 }, // producto, prio 10
      { id: 102, price_list_id: 1, product_id: null, variant_id: 55, price: 7500 }, // variante, prio 0
    ]
    const prio = new Map([[1, 0], [2, 10]])
    expect(resolveEffectivePrice(10000, { productId: 7, variantId: 55, items, listPriority: prio })).toBe(7500)
  })

  it('empate de prioridad y especificidad → gana el más reciente (mayor id)', () => {
    const items: PriceListItem[] = [
      { id: 200, price_list_id: 1, product_id: 7, variant_id: null, price: 9000 },
      { id: 201, price_list_id: 2, product_id: 7, variant_id: null, price: 8800 },
    ]
    const prio = new Map([[1, 5], [2, 5]])
    expect(resolveEffectivePrice(10000, { productId: 7, items, listPriority: prio })).toBe(8800)
  })
})
