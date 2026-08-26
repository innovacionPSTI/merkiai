'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/', label: 'Tenants' },
  { href: '/planes', label: 'Planes' },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <nav className="cw-nav" style={{ position: 'sticky', top: 72 }}>
      {ITEMS.map((it) => (
        <Link key={it.href} href={it.href} className={path === it.href ? 'active' : ''}>
          {it.label}
        </Link>
      ))}
      <span className="disabled" title="Próximamente">Dominios</span>
      <span className="disabled" title="Próximamente">Auditoría</span>
    </nav>
  )
}
