import StoreShell from '@/components/layout/StoreShell'

export const dynamic = 'force-dynamic'

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreShell>
      <main>{children}</main>
    </StoreShell>
  )
}
