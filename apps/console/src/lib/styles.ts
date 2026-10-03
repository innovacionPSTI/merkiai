import type { CSSProperties } from 'react'

// Retintado a tokens --ui-* (HU-240). Se resuelven dentro de .mk-shell.
// Pendiente: migrar estas pantallas al kit (DataTable/Field/btn) en HU-244 y retirar este módulo.
export const box: CSSProperties = { border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius)', padding: 16, marginBottom: 16 }
export const input: CSSProperties = { padding: '7px 10px', marginRight: 8, border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius)', background: 'var(--ui-surface)', color: 'var(--ui-text)' }
export const th: CSSProperties = { textAlign: 'left', borderBottom: '1px solid var(--ui-border)', padding: '11px 8px', fontSize: 10.5, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--ui-muted)', whiteSpace: 'nowrap' }
export const td: CSSProperties = { borderBottom: '1px solid var(--ui-border)', padding: '13px 8px', fontSize: 14, verticalAlign: 'top' }
export const btn: CSSProperties = { padding: '8px 14px', background: 'var(--ui-primary)', color: 'var(--ui-primary-contrast)', border: 0, borderRadius: 'var(--ui-radius)', cursor: 'pointer', fontWeight: 600 }
export const mono: CSSProperties = { fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }
export const scroll: CSSProperties = { overflowX: 'auto' }

export const money = (cents: number, currency: string) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100)
