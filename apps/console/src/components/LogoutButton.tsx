'use client'

import { useStackApp } from '@stackframe/stack'
import { useState } from 'react'

/** Cierra la sesión de Stack Auth y redirige a `/login` (afterSignOut). */
export default function LogoutButton() {
  const app = useStackApp()
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await app.signOut()
        } finally {
          setBusy(false)
        }
      }}
      style={{
        padding: '6px 12px',
        borderRadius: 6,
        border: '1px solid #ccc',
        background: '#fff',
        cursor: busy ? 'default' : 'pointer',
        fontSize: 13,
        opacity: busy ? 0.6 : 1,
      }}
    >
      {busy ? 'Saliendo…' : 'Cerrar sesión'}
    </button>
  )
}
