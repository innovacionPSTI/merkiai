import { groupSectionsIntoRows, parseLayout, cellSpanClass, cellResponsiveClasses } from '../section-rows'

const S = (id: number, extra: Partial<{ row_id: string | null; row_layout: string | null; col_index: number | null }> = {}) => ({ id, ...extra })

describe('parseLayout (HU-351)', () => {
  it('parsea presets válidos', () => {
    expect(parseLayout('6,6')).toEqual([6, 6])
    expect(parseLayout('8,4')).toEqual([8, 4])
    expect(parseLayout('4,4,4')).toEqual([4, 4, 4])
    expect(parseLayout('3 3 3 3')).toEqual([3, 3, 3, 3])
  })
  it('descarta valores inválidos y vacíos', () => {
    expect(parseLayout(null)).toEqual([])
    expect(parseLayout('')).toEqual([])
    expect(parseLayout('0,13,x,6')).toEqual([6])
  })
})

describe('cellSpanClass (HU-351)', () => {
  it('mapea 1..12 a clases lg:col-span', () => {
    expect(cellSpanClass(6)).toBe('lg:col-span-6')
    expect(cellSpanClass(12)).toBe('lg:col-span-12')
  })
  it('acota fuera de rango', () => {
    expect(cellSpanClass(0)).toBe('lg:col-span-12') // 0 → default 12
    expect(cellSpanClass(99)).toBe('lg:col-span-12')
    expect(cellSpanClass(-3)).toBe('lg:col-span-1')
  })
})

describe('groupSectionsIntoRows (HU-351)', () => {
  it('cero regresión: sin row_id, cada sección es su fila full-width', () => {
    const rows = groupSectionsIntoRows([S(1), S(2), S(3)])
    expect(rows).toHaveLength(3)
    expect(rows.every((r) => r.single && r.cells.length === 1 && r.cells[0].span === 12 && r.rowId === null)).toBe(true)
  })

  it('agrupa consecutivas con el mismo row_id usando el preset', () => {
    const rows = groupSectionsIntoRows([
      S(1),
      S(2, { row_id: 'r1', row_layout: '8,4', col_index: 0 }),
      S(3, { row_id: 'r1', row_layout: '8,4', col_index: 1 }),
      S(4),
    ])
    expect(rows).toHaveLength(3)
    expect(rows[0].single).toBe(true)
    expect(rows[1].rowId).toBe('r1')
    expect(rows[1].single).toBe(false)
    expect(rows[1].cells.map((c) => c.span)).toEqual([8, 4])
    expect(rows[2].single).toBe(true)
  })

  it('ordena las celdas por col_index', () => {
    const rows = groupSectionsIntoRows([
      S(10, { row_id: 'r', row_layout: '6,6', col_index: 1 }),
      S(11, { row_id: 'r', row_layout: '6,6', col_index: 0 }),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0].cells.map((c) => c.section.id)).toEqual([11, 10])
  })

  it('sin preset: reparte en partes iguales', () => {
    const rows = groupSectionsIntoRows([
      S(1, { row_id: 'r' }), S(2, { row_id: 'r' }), S(3, { row_id: 'r' }),
    ])
    expect(rows[0].cells.map((c) => c.span)).toEqual([4, 4, 4])
  })

  it('mismos row_id NO consecutivos forman filas separadas', () => {
    const rows = groupSectionsIntoRows([
      S(1, { row_id: 'r' }), S(2), S(3, { row_id: 'r' }),
    ])
    expect(rows).toHaveLength(3)
  })
})

describe('cellResponsiveClasses (HU-351 responsive fino)', () => {
  it('sin settings = vacío (cero regresión)', () => {
    expect(cellResponsiveClasses(undefined)).toBe('')
    expect(cellResponsiveClasses(null)).toBe('')
    expect(cellResponsiveClasses({})).toBe('')
  })
  it('hideMobile oculta en móvil y muestra desde lg', () => {
    expect(cellResponsiveClasses({ hideMobile: true })).toBe('hidden lg:block')
  })
  it('hideDesktop muestra en móvil y oculta desde lg', () => {
    expect(cellResponsiveClasses({ hideDesktop: true })).toBe('block lg:hidden')
  })
  it('ambos = oculto siempre', () => {
    expect(cellResponsiveClasses({ hideMobile: true, hideDesktop: true })).toBe('hidden')
  })
  it('mobileOrder reordena en móvil y resetea en lg', () => {
    expect(cellResponsiveClasses({ mobileOrder: 2 })).toBe('order-2 lg:order-none')
    expect(cellResponsiveClasses({ mobileOrder: 99 })).toBe('order-11 lg:order-none')
  })
  it('combina visibilidad + orden', () => {
    expect(cellResponsiveClasses({ hideMobile: true, mobileOrder: 1 })).toBe('hidden lg:block order-1 lg:order-none')
  })
})
