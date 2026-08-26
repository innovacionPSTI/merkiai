import type { ReactNode } from 'react'
import { PanelShell } from '@merkiai/ui'
import { requirePlatformOperator } from '@/lib/platform-auth'
import LogoutButton from '@/components/LogoutButton'
import ConsoleSidebar from '@/components/Sidebar'

export const dynamic = 'force-dynamic'

export default async function DashLayout({ children }: { children: ReactNode }) {
  const operator = await requirePlatformOperator()

  return (
    <PanelShell
      sidebar={<ConsoleSidebar />}
      topbar={
        <>
          <span style={{ fontSize: 14, color: '#6b7280', fontWeight: 600 }}>Control Plane</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#666' }}>{operator.email}</span>
            <LogoutButton />
          </div>
        </>
      }
    >
      {children}
    </PanelShell>
  )
}
