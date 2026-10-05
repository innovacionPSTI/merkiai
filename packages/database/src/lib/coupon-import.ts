/**
 * coupon-import — parser PURO de cupones en CSV (HU-132). Reusa `parseCsv`.
 * Identidad por `code` (se normaliza a MAYÚSCULAS). Reporta por `code`.
 */
import { parseCsv } from './product-import'

export interface ImportCoupon {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  min_order_amount: number
  max_uses: number | null
  expires_at: string | null
  active: boolean
}

export interface CouponParseError { row: number; message: string }
export interface CouponParseResult { coupons: ImportCoupon[]; errors: CouponParseError[] }

export const COUPON_IMPORT_TEMPLATE = [
  'code,type,value,min_order_amount,max_uses,expires_at,active',
  'BIENVENIDA10,percentage,10,0,100,2026-12-31,true',
  'ENVIOGRATIS,fixed,15000,80000,,,true',
].join('\n')

const ALIASES: Record<string, string> = {
  codigo: 'code', código: 'code', tipo: 'type', valor: 'value',
  minimo: 'min_order_amount', minimo_compra: 'min_order_amount', min_compra: 'min_order_amount',
  usos: 'max_uses', usos_max: 'max_uses', max_usos: 'max_uses',
  vence: 'expires_at', vencimiento: 'expires_at', expira: 'expires_at',
  activo: 'active', activa: 'active',
}
const canon = (h: string) => {
  const n = h.trim().toLowerCase().replace(/\s+/g, '_')
  return ALIASES[n] ?? n
}
const toBool = (v: string | undefined, dflt = true) => {
  if (v == null || v.trim() === '') return dflt
  return /^(true|1|si|sí|yes|y|x)$/i.test(v.trim())
}
function toNum(v: string | undefined): number | null {
  if (v == null) return null
  let s = v.trim().replace(/\s/g, '')
  if (s === '') return null
  const hasDot = s.includes('.'), hasComma = s.includes(',')
  if (hasDot && hasComma) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')
  else if (hasComma) s = /,\d{1,2}$/.test(s) ? s.replace(',', '.') : s.replace(/,/g, '')
  else if (hasDot) { const dots = (s.match(/\./g) ?? []).length; if (dots > 1 || !/\.\d{1,2}$/.test(s)) s = s.replace(/\./g, '') }
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
function normType(v: string | undefined): 'percentage' | 'fixed' | null {
  const t = (v ?? '').trim().toLowerCase()
  if (['percentage', 'percent', 'porcentaje', '%', 'pct'].includes(t)) return 'percentage'
  if (['fixed', 'fijo', 'monto', 'amount'].includes(t)) return 'fixed'
  return null
}

export function parseCouponsCsv(text: string): CouponParseResult {
  const errors: CouponParseError[] = []
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''))
  if (rows.length < 2) return { coupons: [], errors: [{ row: 1, message: 'El archivo no tiene filas de datos.' }] }

  const headers = rows[0].map(canon)
  for (const req of ['code', 'type', 'value']) {
    if (!headers.includes(req)) return { coupons: [], errors: [{ row: 1, message: `Falta la columna obligatoria "${req}".` }] }
  }
  const col = (cells: string[], name: string) => {
    const i = headers.indexOf(name)
    return i === -1 ? undefined : cells[i]
  }

  const byCode = new Map<string, ImportCoupon>()
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    const lineNo = r + 1
    const code = (col(cells, 'code') ?? '').trim().toUpperCase()
    if (!code) { errors.push({ row: lineNo, message: 'Falta el código.' }); continue }
    if (byCode.has(code)) { errors.push({ row: lineNo, message: `Código duplicado en el archivo: "${code}".` }); continue }

    const type = normType(col(cells, 'type'))
    if (!type) { errors.push({ row: lineNo, message: `Tipo inválido para "${code}" (percentage|fixed).` }); continue }

    const value = toNum(col(cells, 'value'))
    if (value == null || value <= 0) { errors.push({ row: lineNo, message: `Valor inválido para "${code}".` }); continue }
    if (type === 'percentage' && value > 100) { errors.push({ row: lineNo, message: `El porcentaje de "${code}" no puede superar 100.` }); continue }

    const maxUses = toNum(col(cells, 'max_uses'))
    const expires = (col(cells, 'expires_at') ?? '').trim()

    byCode.set(code, {
      code, type, value,
      min_order_amount: Math.max(0, Math.trunc(toNum(col(cells, 'min_order_amount')) ?? 0)),
      max_uses: maxUses != null && maxUses > 0 ? Math.trunc(maxUses) : null,
      expires_at: expires === '' ? null : expires,
      active: toBool(col(cells, 'active')),
    })
  }

  return { coupons: [...byCode.values()], errors }
}
