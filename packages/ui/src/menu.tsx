'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './icon'

export interface RowAction {
  label: ReactNode
  icon?: ReactNode
  href?: string
  onClick?: () => void
  danger?: boolean
}

/**
 * Menú de acciones por fila (kebab) con popover (HU-241). Cliente: maneja
 * abrir/cerrar y click-fuera. La acción destructiva se pinta en rojo.
 */
export function RowActionsMenu({ items, label = 'Acciones' }: { items: RowAction[]; label?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        style={{ border: 0, background: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'inline-flex', color: 'var(--ui-muted)' }}
      >
        <Icon name="more" size={18} />
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute', right: 0, top: 36, zIndex: 20, minWidth: 200,
            background: 'var(--ui-surface)', border: '1px solid var(--ui-border)',
            borderRadius: 12, boxShadow: 'var(--ui-shadow-lg)', padding: 6,
          }}
        >
          {items.map((it, i) => {
            const style: React.CSSProperties = {
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              padding: '8px 10px', borderRadius: 8, fontSize: 13, textAlign: 'left',
              background: 'none', border: 0, cursor: 'pointer', textDecoration: 'none',
              color: it.danger ? 'var(--ui-danger)' : 'var(--ui-text)',
            }
            const content = <>{it.icon}{it.label}</>
            return it.href ? (
              <a key={i} role="menuitem" href={it.href} style={style} onClick={() => setOpen(false)}>{content}</a>
            ) : (
              <button key={i} type="button" role="menuitem" style={style}
                onClick={() => { it.onClick?.(); setOpen(false) }}>{content}</button>
            )
          })}
        </div>
      )}
    </div>
  )
}
