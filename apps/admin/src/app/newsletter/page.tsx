import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { PageHeader } from '@merkiai/ui'
import { getAdminUser } from '@/lib/auth'
import { requireAdminDb } from '@/lib/admin-context'
import type { NewsletterSubscriber } from '@merkiai/database'
import NewsletterClient from './NewsletterClient'

export const metadata: Metadata = { title: 'Newsletter' }
export const dynamic = 'force-dynamic'

export default async function NewsletterPage() {
  const adminUser = await getAdminUser()
  if (
    !adminUser ||
    (adminUser.role !== 'super_admin' &&
      adminUser.role !== 'admin' &&
      adminUser.role !== 'gestor_tienda')
  ) {
    redirect('/no-autorizado')
  }

  const { db: supabase } = await requireAdminDb()
  const { data } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('subscribed_at', { ascending: false })

  const subscribers: NewsletterSubscriber[] = data ?? []

  return (
    <div>
      <div className="mb-8">
        <PageHeader
          title="Newsletter"
          description="Gestiona suscriptores y envía campañas de correo a tu audiencia."
        />
      </div>
      <NewsletterClient initialSubscribers={subscribers} />
    </div>
  )
}
