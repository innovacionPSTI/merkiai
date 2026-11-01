import StoreShell from '@/components/layout/StoreShell'
import { EcommerceProvider } from '@/components/EcommerceProvider'
import { getStoreContext } from '@/lib/store-context'

// El nav y el footer usan datos configurables — siempre refrescar desde BD.
export const dynamic = 'force-dynamic'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // HU-173 · peldaño e-commerce (modo vitrina oculta los CTA de compra). Reusa
  // el contexto cacheado por request (misma resolución que StoreShell).
  const ctx = await getStoreContext().catch(() => null)
  const ecommerceEnabled = ctx?.ecommerceEnabled ?? true

  return (
    <StoreShell>
      <EcommerceProvider enabled={ecommerceEnabled}>
        <main>{children}</main>
      </EcommerceProvider>
    </StoreShell>
  )
}
