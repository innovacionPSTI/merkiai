import type { ReactNode } from 'react'
import { requirePlatformOperator } from '@/lib/platform-auth'
import LogoutButton from '@/components/LogoutButton'
import Sidebar from '@/components/Sidebar'

export const dynamic = 'force-dynamic'

export default async function DashLayout({ children }: { children: ReactNode }) {
  const operator = await requirePlatformOperator()

  return (
    <>
      <style>{`
        .cw-shell { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 24px; max-width: 1180px; margin: 0 auto; padding: 24px; }
        .cw-nav a, .cw-nav span { display: block; padding: 8px 10px; border-radius: 6px; font-size: 14px; text-decoration: none; color: #2E5A3B; }
        .cw-nav a:hover { background: #eef3ef; }
        .cw-nav a.active { background: #2E5A3B; color: #fff; }
        .cw-nav span.disabled { color: #aaa; }
        @media (max-width: 760px) { .cw-shell { grid-template-columns: 1fr; } .cw-side { display: none; } }
      `}</style>

      <div style={{ borderBottom: '1px solid #eee', background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ color: '#2E5A3B', fontSize: 18 }}>Merkiai · Control Plane</strong>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#666' }}>{operator.email}</span>
            <LogoutButton />
          </div>
        </div>
      </div>

      <div className="cw-shell">
        <aside className="cw-side">
          <Sidebar />
        </aside>
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
    </>
  )
}
