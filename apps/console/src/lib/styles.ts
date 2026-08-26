import type { CSSProperties } from 'react'

export const box: CSSProperties = { border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }
export const input: CSSProperties = { padding: '6px 8px', marginRight: 8, border: '1px solid #ccc', borderRadius: 6 }
export const th: CSSProperties = { textAlign: 'left', borderBottom: '2px solid #2E5A3B', padding: 8, fontSize: 13, whiteSpace: 'nowrap' }
export const td: CSSProperties = { borderBottom: '1px solid #eee', padding: 8, fontSize: 14, verticalAlign: 'top' }
export const btn: CSSProperties = { padding: '6px 14px', background: '#2E5A3B', color: '#fff', border: 0, borderRadius: 6, cursor: 'pointer' }
export const mono: CSSProperties = { fontFamily: 'monospace', fontSize: 12, whiteSpace: 'pre-wrap' }
export const scroll: CSSProperties = { overflowX: 'auto' }

export const money = (cents: number, currency: string) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(cents / 100)
