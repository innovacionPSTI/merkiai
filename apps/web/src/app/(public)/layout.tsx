import StoreShell from '@/components/layout/StoreShell'

// El nav y el footer usan datos configurables — siempre refrescar desde BD.
export const dynamic = 'force-dynamic'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreShell>
      <main>{children}</main>
    </StoreShell>
  )
}
