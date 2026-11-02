import { applyPresetToStore, normalizeOperationsPreset, type OperationsPreset, type PresetPayload } from '../apply-preset'

const OP: OperationsPreset = {
  uoms: [
    { code: 'g', name: 'Gramo', dimension: 'weight', to_base_factor: 1 },
    { code: '', name: 'inválida' },                 // se descarta (sin code)
  ],
  stock_items: [
    { name: 'Café en grano', item_class: 'materia_prima', uom: 'g' },
    { name: 'Café en grano' },                       // dup por key → se descarta
    { name: 'Leche', item_class: 'raro', uom: 'ml' }, // clase inválida → insumo
    { name: 'Capuchino', item_class: 'terminado', sellable: true },
    { name: '   ' },                                  // sin nombre → se descarta
  ],
  boms: [
    {
      output: 'capuchino',
      consumption_policy: 'al_vender',
      components: [
        { item: 'cafe-en-grano', qty: 18, uom: 'g' },
        { item: 'leche', qty: 150, uom: 'ml' },
        { item: 'fantasma', qty: 1 },                 // item no declarado → se descarta
        { item: 'leche', qty: 0 },                    // qty 0 → se descarta
      ],
    },
    { output: 'no-existe', components: [{ item: 'leche', qty: 1 }] }, // output no declarado → se descarta
    { output: 'capuchino', components: [{ item: 'leche', qty: 1 }] }, // dup output → se descarta
  ],
}

describe('preset de Operaciones (HU-410, normalización pura)', () => {
  it('deriva keys, aplica defaults y descarta referencias inválidas', () => {
    const n = normalizeOperationsPreset(OP)
    expect(n.uoms.map((u) => u.code)).toEqual(['g'])

    const keys = n.stock_items.map((i) => i.key)
    expect(keys).toEqual(['cafe-en-grano', 'leche', 'capuchino'])
    expect(n.stock_items.find((i) => i.key === 'leche')!.item_class).toBe('insumo') // clase inválida → default
    expect(n.stock_items.find((i) => i.key === 'capuchino')!.sellable).toBe(true)

    expect(n.boms).toHaveLength(1)
    const bom = n.boms[0]
    expect(bom.output).toBe('capuchino')
    expect(bom.consumption_policy).toBe('al_vender')
    expect(bom.yield_qty).toBe(1)
    expect(bom.components.map((c) => c.item)).toEqual(['cafe-en-grano', 'leche']) // fantasma y qty0 fuera
  })

  it('bloque vacío → listas vacías', () => {
    expect(normalizeOperationsPreset(undefined)).toEqual({ uoms: [], stock_items: [], boms: [] })
  })
})

/* ── AC-2 · gating por plan: sin `inventory` el bloque operations se ignora ──── */

function fakeDb() {
  const chain: Record<string, unknown> = {
    select() { return chain }, eq() { return chain }, limit() { return chain },
    maybeSingle() { return Promise.resolve({ data: null, error: null }) },
    single() { return Promise.resolve({ data: { id: 1 }, error: null }) },
    update() { return { eq() { return { eq() { return Promise.resolve({ error: null }) }, then(r: (v: unknown) => void) { r({ error: null }) } } } } },
    insert() { return { select() { return { single: () => Promise.resolve({ data: { id: 1 }, error: null }) } }, then(r: (v: unknown) => void) { r({ error: null }) } } },
    then(resolve: (v: unknown) => void) { resolve({ data: [], count: 0, error: null }) },
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { from: (_t: string) => chain } as any
}

describe('preset de Operaciones (HU-410, AC-2 gating)', () => {
  const preset: PresetPayload = { operations: OP }

  it('sin allowInventory → operations se omite (cero regresión)', async () => {
    const r = await applyPresetToStore('t-1', preset, { allowInventory: false }, fakeDb())
    expect(r.results.operations).toMatch(/skipped/)
  })

  it('con allowInventory → se siembra (claves operations.*)', async () => {
    const r = await applyPresetToStore('t-1', preset, { allowInventory: true }, fakeDb())
    expect(Object.keys(r.results).some((k) => k.startsWith('operations.'))).toBe(true)
  })
})
