import { Suspense } from 'react'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { stackServerApp } from '@/stack'
import CheckoutClient from '@/components/checkout/CheckoutClient'
import { getRequestUserDb } from '@/lib/tenant-db'
import { getStoreContext } from '@/lib/store-context'
import { resolveTenant } from '@/lib/tenant-context'
import { storeCountries } from '@/lib/store-countries'

export const metadata: Metadata = { title: 'Checkout' }

interface SavedAddress {
  full_name: string
  phone: string | null
  address: string
  city: string
  department: string | null
  postal_code: string | null
  is_default: boolean
  country?: string | null
  neighborhood?: string | null
}

async function getDefaultAddress(): Promise<SavedAddress | null> {
  try {
    const user = await stackServerApp.getUser()
    if (!user?.primaryEmail) return null

    // Cliente RLS `authenticated` (tenant + dueño); NO service-role.
    const supabase = await getRequestUserDb(user.id)

    // Look up the customer record
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('stack_id', user.id)
      .maybeSingle()

    // Fallback: look up by email (guest who later registered)
    let customerId = customer?.id ?? null
    if (!customerId) {
      const { data: byEmail } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.primaryEmail)
        .maybeSingle()
      customerId = byEmail?.id ?? null
    }

    if (!customerId) return null

    const { data: addresses } = await supabase
      .from('customer_addresses')
      .select('full_name, phone, address, city, department, postal_code, is_default, country, neighborhood')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (!addresses?.length) return null
    return addresses.find((a) => a.is_default) ?? addresses[0]
  } catch {
    return null
  }
}

/** HU-468 · países a los que vende la tienda (sus mercados). Fail-safe: Colombia. */
async function getStoreCountries(): Promise<string[]> {
  try {
    const { tenantId } = await resolveTenant()
    return await storeCountries(tenantId)
  } catch {
    return ['CO']
  }
}

export default async function CheckoutPage() {
  // HU-173 · peldaño e-commerce: en modo vitrina/catálogo no hay checkout.
  // El carrito (store-context) ya está gated; aquí se redirige por si se llega
  // por URL directa. El checkout API también lo bloquea (barrera dura).
  const ctx = await getStoreContext().catch(() => null)
  if (ctx && ctx.ecommerceEnabled === false) redirect('/')

  const [defaultAddress, user, countries] = await Promise.all([
    getDefaultAddress(),
    stackServerApp.getUser().catch(() => null),
    getStoreCountries(),
  ])

  return (
    <Suspense>
      <CheckoutClient
        initialEmail={user?.primaryEmail ?? ''}
        defaultAddress={defaultAddress}
        countries={countries}
      />
    </Suspense>
  )
}
