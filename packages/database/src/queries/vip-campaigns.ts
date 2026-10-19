import type { Db } from '../client'

/**
 * Campañas de acceso anticipado VIP (HU-289/290 · E19). Ventana horaria dirigida
 * a un segmento, con alcance de productos/categorías y oferta/cupo opcionales.
 * `db` se pasa por parámetro (RLS por tenant / is_admin; el storefront usa el
 * cliente-máquina). La derivación de estado y acceso es pura y testeable.
 */

export type CampaignStatus = 'scheduled' | 'active' | 'ended' | 'paused' | 'cancelled'

export interface VipScopeItem { product_id: number | null; category_id: number | null }

export interface VipCampaign {
  id: number
  name: string
  segment_id: number | null
  starts_at: string
  ends_at: string
  status: CampaignStatus
  offer_percent: number | null
  quota: number | null
  created_at: string
  updated_at: string
  scope?: VipScopeItem[]
}

/**
 * Estado EFECTIVO de una campaña en un instante. El control manual (paused /
 * cancelled) manda; si no, se deriva de la ventana: antes→scheduled,
 * dentro→active, después→ended. Pura.
 */
export function deriveCampaignStatus(
  c: Pick<VipCampaign, 'status' | 'starts_at' | 'ends_at'>,
  now: Date = new Date(),
): CampaignStatus {
  if (c.status === 'paused' || c.status === 'cancelled') return c.status
  const t = now.getTime()
  if (t < new Date(c.starts_at).getTime()) return 'scheduled'
  if (t >= new Date(c.ends_at).getTime()) return 'ended'
  return 'active'
}

/** ¿La campaña está en su ventana activa ahora (y no pausada/cancelada)? Pura. */
export function isCampaignLive(c: Pick<VipCampaign, 'status' | 'starts_at' | 'ends_at'>, now: Date = new Date()): boolean {
  return deriveCampaignStatus(c, now) === 'active'
}

const CAMPAIGN_COLS = 'id, name, segment_id, starts_at, ends_at, status, offer_percent, quota, created_at, updated_at'

export async function listCampaigns(db: Db): Promise<VipCampaign[]> {
  const { data } = await db.from('vip_campaigns').select(CAMPAIGN_COLS).order('starts_at', { ascending: false })
  return (data ?? []) as VipCampaign[]
}

export async function getCampaign(id: number, db: Db): Promise<VipCampaign | null> {
  const { data } = await db.from('vip_campaigns').select(CAMPAIGN_COLS).eq('id', id).maybeSingle()
  if (!data) return null
  const { data: scope } = await db.from('vip_campaign_scope').select('product_id, category_id').eq('campaign_id', id)
  return { ...(data as any), scope: (scope ?? []) as VipScopeItem[] }
}

export interface CampaignInput {
  name: string
  segment_id: number | null
  starts_at: string
  ends_at: string
  offer_percent?: number | null
  quota?: number | null
  /** Alcance: ids de productos y/o categorías. */
  product_ids?: number[]
  category_ids?: number[]
}

/** Valida y normaliza una campaña. Pura. */
export function validateCampaign(input: CampaignInput): { ok: boolean; error?: string } {
  if (!(input.name ?? '').trim()) return { ok: false, error: 'El nombre es obligatorio.' }
  const s = new Date(input.starts_at).getTime()
  const e = new Date(input.ends_at).getTime()
  if (!Number.isFinite(s) || !Number.isFinite(e)) return { ok: false, error: 'Fechas inválidas.' }
  if (e <= s) return { ok: false, error: 'El fin debe ser posterior al inicio.' }
  if (input.offer_percent != null && (input.offer_percent < 0 || input.offer_percent > 100)) {
    return { ok: false, error: 'El descuento debe estar entre 0 y 100.' }
  }
  const hasScope = (input.product_ids?.length ?? 0) + (input.category_ids?.length ?? 0) > 0
  if (!hasScope) return { ok: false, error: 'Agrega al menos un producto o categoría al alcance.' }
  return { ok: true }
}

export async function createCampaign(input: CampaignInput, db: Db, tenantId: string): Promise<VipCampaign> {
  const v = validateCampaign(input)
  if (!v.ok) throw new Error(v.error)
  const { data, error } = await db
    .from('vip_campaigns')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      tenant_id: tenantId, name: input.name.trim(), segment_id: input.segment_id ?? null,
      starts_at: input.starts_at, ends_at: input.ends_at,
      offer_percent: input.offer_percent ?? null, quota: input.quota ?? null, status: 'scheduled',
    } as any)
    .select(CAMPAIGN_COLS)
    .single()
  if (error) throw error
  const campaign = data as VipCampaign
  await replaceScope(campaign.id, input.product_ids ?? [], input.category_ids ?? [], db, tenantId)
  return campaign
}

export async function updateCampaign(id: number, input: CampaignInput, db: Db, tenantId: string): Promise<void> {
  const v = validateCampaign(input)
  if (!v.ok) throw new Error(v.error)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('vip_campaigns').update({
    name: input.name.trim(), segment_id: input.segment_id ?? null,
    starts_at: input.starts_at, ends_at: input.ends_at,
    offer_percent: input.offer_percent ?? null, quota: input.quota ?? null,
    updated_at: new Date().toISOString(),
  } as any).eq('id', id)
  if (error) throw error
  await replaceScope(id, input.product_ids ?? [], input.category_ids ?? [], db, tenantId)
}

async function replaceScope(campaignId: number, productIds: number[], categoryIds: number[], db: Db, tenantId: string): Promise<void> {
  await db.from('vip_campaign_scope').delete().eq('campaign_id', campaignId)
  const rows = [
    ...productIds.map((product_id) => ({ tenant_id: tenantId, campaign_id: campaignId, product_id, category_id: null })),
    ...categoryIds.map((category_id) => ({ tenant_id: tenantId, campaign_id: campaignId, product_id: null, category_id })),
  ]
  if (rows.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await db.from('vip_campaign_scope').insert(rows as any)
    if (error) throw error
  }
}

/** Cambia el control manual: pausar/reanudar/cancelar. */
export async function setCampaignStatus(id: number, status: CampaignStatus, db: Db): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await db.from('vip_campaigns').update({ status, updated_at: new Date().toISOString() } as any).eq('id', id)
  if (error) throw error
}

export async function deleteCampaign(id: number, db: Db): Promise<void> {
  const { error } = await db.from('vip_campaigns').delete().eq('id', id)
  if (error) throw error
}

// ── Gating de acceso anticipado en el storefront (HU-290) ─────────────────────

export interface VipGateCampaign {
  id: number
  name: string
  ends_at: string
  segment_id: number | null
  offer_percent: number | null
  quota: number | null
}

export interface VipGate {
  product_id: number | null
  category_id: number | null
  campaign: VipGateCampaign
}

/** Estado de acceso de un producto para un visitante concreto. */
export type GateStatus = 'open' | 'vip_member' | 'locked'

/**
 * Reglas de acceso (pura, server-side). Dada la lista de gates vivos y el
 * producto/categoría + segmentos del visitante, decide si está abierto, si el
 * visitante es miembro VIP (puede comprar) o si está bloqueado ("disponible
 * pronto"). Un producto sin campaña viva → `open`. Si lo cubre una campaña viva:
 * miembro del segmento → `vip_member`; si no (o sin sesión) → `locked`.
 */
export function resolveProductGate(
  gates: VipGate[],
  opts: { productId: number; categoryId: number | null; memberSegmentIds: number[] },
): { status: GateStatus; campaign?: VipGateCampaign } {
  const matching = gates.filter(
    (g) => g.product_id === opts.productId || (g.category_id != null && g.category_id === opts.categoryId),
  )
  if (matching.length === 0) return { status: 'open' }
  // La campaña que cierra antes marca la urgencia mostrada.
  matching.sort((a, b) => new Date(a.campaign.ends_at).getTime() - new Date(b.campaign.ends_at).getTime())
  const { campaign } = matching[0]
  const isMember = campaign.segment_id != null && opts.memberSegmentIds.includes(campaign.segment_id)
  return { status: isMember ? 'vip_member' : 'locked', campaign }
}

/** Campañas vivas (dentro de ventana, ni pausadas ni canceladas) con su alcance. */
export async function listLiveVipGates(db: Db, now: Date = new Date()): Promise<VipGate[]> {
  const iso = now.toISOString()
  const { data } = await db
    .from('vip_campaigns')
    .select('id, name, ends_at, segment_id, offer_percent, quota, starts_at, status, vip_campaign_scope(product_id, category_id)')
    .lte('starts_at', iso)
    .gt('ends_at', iso)
    .not('status', 'in', '("paused","cancelled")')
  const gates: VipGate[] = []
  for (const c of (data ?? []) as any[]) {
    const campaign: VipGateCampaign = {
      id: c.id, name: c.name, ends_at: c.ends_at, segment_id: c.segment_id,
      offer_percent: c.offer_percent, quota: c.quota,
    }
    const scope = Array.isArray(c.vip_campaign_scope) ? c.vip_campaign_scope : []
    for (const s of scope) gates.push({ product_id: s.product_id ?? null, category_id: s.category_id ?? null, campaign })
  }
  return gates
}

/** Segmentos a los que pertenece un cliente (o [] si no hay sesión/cliente). */
export async function customerSegmentIds(db: Db, customerId: string | null): Promise<number[]> {
  if (!customerId) return []
  const { data } = await db.from('customer_segment_members').select('segment_id').eq('customer_id', customerId)
  return (data ?? []).map((r: any) => r.segment_id as number)
}

// ── Reporte de campaña (HU-294) ───────────────────────────────────────────────

export interface VipCampaignReport {
  members: number
  participants: number
  orders: number
  revenue: number
  avgTicket: number
  /** Participación = participantes / miembros del segmento (0..1). */
  participationRate: number
}

/** Agrega los pedidos de los miembros en la ventana a métricas de campaña. Pura. */
export function computeVipReport(
  members: number,
  orders: Array<{ customer_id: string | null; total: number }>,
): VipCampaignReport {
  const participants = new Set(orders.map((o) => o.customer_id).filter(Boolean) as string[]).size
  const revenue = orders.reduce((s, o) => s + Number(o.total ?? 0), 0)
  const count = orders.length
  return {
    members,
    participants,
    orders: count,
    revenue,
    avgTicket: count > 0 ? Math.round(revenue / count) : 0,
    participationRate: members > 0 ? participants / members : 0,
  }
}

/**
 * Reporte de una campaña VIP (HU-294): participación del segmento y ventas de
 * sus miembros dentro de la ventana (pagos aprobados). Nota: mide pedidos de los
 * miembros en la ventana (no filtra por los productos del alcance; suficiente
 * para el MVP de medición).
 */
export async function getVipCampaignReport(campaignId: number, db: Db): Promise<VipCampaignReport> {
  const campaign = await getCampaign(campaignId, db)
  if (!campaign) throw new Error('Campaña no encontrada.')

  let members = 0
  let memberIds: string[] = []
  if (campaign.segment_id != null) {
    const { data } = await db.from('customer_segment_members').select('customer_id').eq('segment_id', campaign.segment_id)
    memberIds = (data ?? []).map((r: any) => r.customer_id as string)
    members = memberIds.length
  }

  if (memberIds.length === 0) return computeVipReport(members, [])

  const { data: orders } = await db
    .from('orders')
    .select('customer_id, total, created_at, payment_status')
    .in('customer_id', memberIds)
    .eq('payment_status', 'approved')
    .gte('created_at', campaign.starts_at)
    .lte('created_at', campaign.ends_at)
  return computeVipReport(members, (orders ?? []) as any)
}
