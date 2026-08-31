import { redirect } from 'next/navigation'
import StoreShell from '@/components/layout/StoreShell'
import AccountSidebar from '@/components/account/AccountSidebar'
import { stackServerApp } from '@/stack'

export const dynamic = 'force-dynamic'

/**
 * Layout compartido para /account/*. El chrome (Navbar/Footer + tenant) lo
 * resuelve `<StoreShell>` (una vez, por tenant). Aquí solo: verificar sesión y
 * componer el sidebar + contenido.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await stackServerApp.getUser()
  if (!user) redirect('/login')

  const displayName = user.displayName ?? ''
  const email       = user.primaryEmail ?? ''

  return (
    <StoreShell>
      <div className="bg-brand-cream min-h-screen pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="md:grid md:grid-cols-4 md:gap-8">
            <AccountSidebar displayName={displayName} email={email} />
            <main className="md:col-span-3 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </StoreShell>
  )
}
