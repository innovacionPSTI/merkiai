/**
 * customer-import — parser PURO de clientes en CSV (HU-132). Reusa `parseCsv`.
 * Identidad por `email` (normalizado a minúsculas). Reporta por email.
 * No crea cuentas de Stack Auth: son registros de contacto (stack_id = NULL).
 */
import { parseCsv } from './product-import'

export interface ImportCustomer {
  email: string
  name: string | null
  phone: string | null
}

export interface CustomerParseError { row: number; message: string }
export interface CustomerParseResult { customers: ImportCustomer[]; errors: CustomerParseError[] }

export const CUSTOMER_IMPORT_TEMPLATE = [
  'email,name,phone',
  'ana@example.com,Ana Pérez,3001234567',
  'carlos@example.com,Carlos Ruiz,',
].join('\n')

const ALIASES: Record<string, string> = {
  correo: 'email', 'e-mail': 'email', nombre: 'name', telefono: 'phone', teléfono: 'phone', celular: 'phone',
}
const canon = (h: string) => {
  const n = h.trim().toLowerCase().replace(/\s+/g, '_')
  return ALIASES[n] ?? n
}
const clean = (v: string | undefined): string | null => {
  const t = (v ?? '').trim()
  return t === '' ? null : t
}
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

export function parseCustomersCsv(text: string): CustomerParseResult {
  const errors: CustomerParseError[] = []
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ''))
  if (rows.length < 2) return { customers: [], errors: [{ row: 1, message: 'El archivo no tiene filas de datos.' }] }

  const headers = rows[0].map(canon)
  if (!headers.includes('email')) return { customers: [], errors: [{ row: 1, message: 'Falta la columna obligatoria "email".' }] }
  const col = (cells: string[], name: string) => {
    const i = headers.indexOf(name)
    return i === -1 ? undefined : cells[i]
  }

  const byEmail = new Map<string, ImportCustomer>()
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    const lineNo = r + 1
    const email = (col(cells, 'email') ?? '').trim().toLowerCase()
    if (!email) { errors.push({ row: lineNo, message: 'Falta el email.' }); continue }
    if (!isEmail(email)) { errors.push({ row: lineNo, message: `Email inválido: "${email}".` }); continue }
    if (byEmail.has(email)) { errors.push({ row: lineNo, message: `Email duplicado en el archivo: "${email}".` }); continue }
    byEmail.set(email, { email, name: clean(col(cells, 'name')), phone: clean(col(cells, 'phone')) })
  }

  return { customers: [...byEmail.values()], errors }
}
