'use client'

import { usePathname } from 'next/navigation'
import { PanelSidebar, useT, type NavGroup } from '@merkiai/ui'

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export default function ConsoleSidebar() {
  const path = usePathname()
  const t = useT('console.nav')
  const groups: NavGroup[] = [
    {
      label: t('group_platform'),
      items: [
        { href: '/', label: t('tenants'), active: path === '/', icon: <Icon d="M3 7h18M3 12h18M3 17h18" /> },
        { href: '/planes', label: t('plans'), active: path === '/planes', icon: <Icon d="M4 5h16v5H4zM4 14h16v5H4z" /> },
        { href: '/presets', label: t('presets'), active: path === '/presets', icon: <Icon d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /> },
        { href: '/suscripciones', label: t('subscriptions'), active: path === '/suscripciones', icon: <Icon d="M3 6h18v12H3zM3 10h18M7 15h4" /> },
        { href: '/merkiai-pagos', label: t('merkiai_payments'), active: path === '/merkiai-pagos', icon: <Icon d="M2 7h20v10H2zM2 11h20M6 15h3" /> },
        { href: '/infraestructura', label: t('infrastructure'), active: path === '/infraestructura', icon: <Icon d="M4 7h16M4 12h16M4 17h16M8 4v16" /> },
        { label: t('domains'), disabled: true, icon: <Icon d="M12 3a9 9 0 100 18 9 9 0 000-18M3 12h18" /> },
        { label: t('audit'), disabled: true, icon: <Icon d="M4 5h16v14H4zM8 9h8M8 13h5" /> },
      ],
    },
  ]
  return <PanelSidebar brand="Merkiai · Control Plane" groups={groups} />
}
