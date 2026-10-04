import { getTemplateVariant } from '@merkiai/database'
import { getStoreContext } from '@/lib/store-context'
import CartView from './CartView'

export const dynamic = 'force-dynamic'

export default async function CarritoPage() {
  // HU-122c: la densidad del carrito la fija la plantilla activa del tenant.
  const template = await getStoreContext().then((c) => c.config?.template).catch(() => undefined)
  const density = getTemplateVariant(template, 'cart')
  return <CartView density={density} />
}
