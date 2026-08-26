'use client'

import { usePathname } from 'next/navigation'
import { PanelSidebar, type NavGroup } from '@merkiai/ui'

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export default function ConsoleSidebar() {
  const path = usePathname()
  const groups: NavGroup[] = [
    {
      label: 'Plataforma',
      items: [
        { href: '/', label: 'Tenants', active: path === '/', icon: <Icon d="M3 7h18M3 12h18M3 17h18" /> },
        { href: '/planes', label: 'Planes', active: path === '/planes', icon: <Icon d="M4 5h16v5H4zM4 14h16v5H4z" /> },
        { label: 'Dominios', disabled: true, icon: <Icon d="M12 3a9 9 0 100 18 9 9 0 000-18M3 12h18" /> },
        { label: 'Auditoría', disabled: true, icon: <Icon d="M4 5h16v14H4zM8 9h8M8 13h5" /> },
      ],
    },
  ]
  return <PanelSidebar brand="Merkiai · Control Plane" groups={groups} />
}
