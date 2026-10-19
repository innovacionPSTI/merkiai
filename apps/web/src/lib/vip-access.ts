import { listLiveVipGates, customerSegmentIds, resolveProductGate } from '@merkiai/database'
import type { GateStatus, VipGateCampaign } from '@merkiai/database'
import { stackServerApp } from '@/stack'
import { resolveTenant } from '@/lib/tenant-context'
import { getMachineDb } from '@/lib/machine-db'

/**
 * Gating de acceso anticipado VIP (HU-290). Resolución SERVER-SIDE: el storefront
 * nunca confía en la UI. Usa el cliente-máquina (service-role) porque las tablas
 * VIP solo son gestionables por is_admin; la pertenencia del visitante se deriva
 * de su sesión (Stack Auth → customer → segmentos).
 */

export interface VipGateInfo { status: GateStatus; campaign?: VipGateCampaign }

/** Segmentos del visitante actual (o [] si no hay sesión/cliente). */
export async function getViewerSegmentIds(tenantId: string): Promise<number[]> {
  const user = await stackServerApp.getUser().catch(() => null)
  if (!user) return []
  const db = getMachineDb(tenantId)
  const { data: customer } = await db.from('customers').select('id').eq('stack_id', user.id).maybeSingle()
  return customerSegmentIds(db, (customer?.id as string) ?? null)
}

/** Resuelve el gate de un producto para el visitante actual. */
export async function resolveGateForProduct(
  productId: number,
  categoryId: number | null,
): Promise<VipGateInfo> {
  try {
    const { tenantId } = await resolveTenant()
    const db = getMachineDb(tenantId)
    const [gates, memberSegmentIds] = await Promise.all([
      listLiveVipGates(db),
      getViewerSegmentIds(tenantId),
    ])
    return resolveProductGate(gates, { productId, categoryId, memberSegmentIds })
  } catch {
    // Fail-open: si falla la resolución, no bloquear la tienda.
    return { status: 'open' }
  }
}

/**
 * Revalida el acceso VIP de un conjunto de variantes en checkout (AC-4). Dada la
 * lista de variant_ids, mapea a producto/categoría y devuelve los que están
 * bloqueados para el visitante (no deberían poder comprarse).
 */
export async function findLockedVariants(
  tenantId: string,
  variantIds: number[],
): Promise<number[]> {
  if (!variantIds.length) return []
  const db = getMachineDb(tenantId)
  const [gates, memberSegmentIds, variantsRes] = await Promise.all([
    listLiveVipGates(db),
    getViewerSegmentIds(tenantId),
    db.from('product_variants').select('id, product_id, products!inner(id, category_id)').in('id', variantIds),
  ])
  if (gates.length === 0) return []
  const locked: number[] = []
  for (const v of (variantsRes.data ?? []) as any[]) {
    const prod = Array.isArray(v.products) ? v.products[0] : v.products
    const gate = resolveProductGate(gates, {
      productId: v.product_id as number,
      categoryId: (prod?.category_id as number) ?? null,
      memberSegmentIds,
    })
    if (gate.status === 'locked') locked.push(v.id as number)
  }
  return locked
}
