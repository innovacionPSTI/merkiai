import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getVariantTypes } from '@merkiai/database'
import { getAdminUser } from '@/lib/auth'
import { getAdminDb } from '@/lib/admin-db'
import { canAccess } from '@/lib/roles'
import type { AdminRole } from '@/lib/roles'
import VariantTypesClient from './VariantTypesClient'

export const metadata: Metadata = { title: 'Tipos de variante' }
export const dynamic = 'force-dynamic'

export default async function VariantesPage() {
  const adminUser = await getAdminUser()
  if (!adminUser || !canAccess(adminUser.role as AdminRole, 'variantes')) {
    redirect('/no-autorizado')
  }

  const variantTypes = await getVariantTypes(false, getAdminDb(adminUser.tenantId))

  return <VariantTypesClient variantTypes={variantTypes} />
}
