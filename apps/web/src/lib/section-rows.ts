/**
 * HU-351 · agrupación de secciones en Filas/Columnas para el render.
 *
 * Modelo (opt-in, cero regresión):
 *  - Una sección **sin `row_id`** = su propia **fila a todo el ancho** → render
 *    idéntico al actual (pila vertical).
 *  - Secciones **consecutivas con el mismo `row_id`** forman una **fila** cuyas
 *    proporciones salen del preset `row_layout` ("6,6", "8,4", "4,4,4", "3,3,3,3"…)
 *    sobre una grilla de 12. En móvil la grilla **apila** (grid-cols-1).
 *
 * El helper es puro (testeable sin DB). El render lo consume el path CMS/home.
 */

export interface RowInput {
  id: number
  row_id?: string | null
  row_layout?: string | null
  col_index?: number | null
}

export interface RowCell<S> { section: S; span: number }
export interface LayoutRow<S> { rowId: string | null; cells: RowCell<S>[]; single: boolean }

// Map estático (literal) para que Tailwind detecte las clases; evita safelist.
const SPAN_CLASS: Record<number, string> = {
  1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4',
  5: 'lg:col-span-5', 6: 'lg:col-span-6', 7: 'lg:col-span-7', 8: 'lg:col-span-8',
  9: 'lg:col-span-9', 10: 'lg:col-span-10', 11: 'lg:col-span-11', 12: 'lg:col-span-12',
}

/** Clase de ancho de celda (1..12 sobre lg); fuera de rango → 12. */
export function cellSpanClass(span: number): string {
  const s = Math.min(12, Math.max(1, Math.round(span) || 12))
  return SPAN_CLASS[s]
}

/** Parsea un preset "6,6" → [6,6]. Valores inválidos se descartan. */
export function parseLayout(raw: string | null | undefined): number[] {
  if (!raw) return []
  return String(raw)
    .split(/[,\s/|-]+/)
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12)
}

export function groupSectionsIntoRows<S extends RowInput>(sections: S[]): LayoutRow<S>[] {
  const rows: LayoutRow<S>[] = []
  let i = 0
  while (i < sections.length) {
    const rid = normId(sections[i].row_id)
    if (!rid) {
      rows.push({ rowId: null, cells: [{ section: sections[i], span: 12 }], single: true })
      i++
      continue
    }
    // Acumula secciones CONSECUTIVAS con el mismo row_id.
    const group: S[] = []
    while (i < sections.length && normId(sections[i].row_id) === rid) {
      group.push(sections[i]); i++
    }
    // Orden por col_index (fallback: orden de aparición ya preservado).
    group.sort((a, b) => (a.col_index ?? 0) - (b.col_index ?? 0))
    const layout = parseLayout(group.find((g) => g.row_layout)?.row_layout)
    const equal = Math.max(1, Math.floor(12 / group.length))
    const cells: RowCell<S>[] = group.map((section, idx) => ({ section, span: layout[idx] ?? equal }))
    rows.push({ rowId: rid, cells, single: cells.length <= 1 })
  }
  return rows
}

function normId(v: string | null | undefined): string | null {
  const s = v == null ? '' : String(v).trim()
  return s.length ? s : null
}

// ─── Responsive fino (HU-351) ─────────────────────────────────────────────────
// Visibilidad por breakpoint y orden en móvil, **opt-in** desde `settings` de la
// sección (sin migración): `hideMobile`, `hideDesktop`, `mobileOrder` (0..11).
// Clases literales (no arbitrarias) → Tailwind las detecta sin safelist.

const ORDER_CLASS: Record<number, string> = {
  0: 'order-none', 1: 'order-1', 2: 'order-2', 3: 'order-3', 4: 'order-4',
  5: 'order-5', 6: 'order-6', 7: 'order-7', 8: 'order-8', 9: 'order-9',
  10: 'order-10', 11: 'order-11',
}

/**
 * Clases responsive de una celda/sección a partir de su `settings` (puro).
 * - `hideMobile` → oculto en móvil, visible desde `lg`.
 * - `hideDesktop` → visible en móvil, oculto desde `lg`.
 * - ambos → oculto siempre.
 * - `mobileOrder` (0..11) → reordena en móvil; en `lg` vuelve al orden natural.
 * Sin settings = '' (cero regresión).
 */
export function cellResponsiveClasses(settings: unknown): string {
  const s = (settings && typeof settings === 'object' ? settings : {}) as Record<string, unknown>
  const out: string[] = []
  const hideMobile = s.hideMobile === true
  const hideDesktop = s.hideDesktop === true
  if (hideMobile && hideDesktop) out.push('hidden')
  else if (hideMobile) out.push('hidden', 'lg:block')
  else if (hideDesktop) out.push('block', 'lg:hidden')
  const mo = typeof s.mobileOrder === 'number' ? Math.min(11, Math.max(0, Math.round(s.mobileOrder))) : null
  if (mo != null && ORDER_CLASS[mo]) out.push(ORDER_CLASS[mo], 'lg:order-none')
  return out.join(' ')
}
