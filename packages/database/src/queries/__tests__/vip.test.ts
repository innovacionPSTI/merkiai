import { evaluateSegmentRules, computeSegmentMembers, aggregateCustomerStats } from '../segments'
import { deriveCampaignStatus, isCampaignLive, validateCampaign } from '../vip-campaigns'

describe('segmentos (HU-288)', () => {
  const now = new Date('2026-10-18T12:00:00Z')

  describe('evaluateSegmentRules', () => {
    it('cumple todas las reglas', () => {
      const s = { customer_id: 'c1', orders: 5, total: 500000, last_order_at: '2026-10-10T00:00:00Z' }
      expect(evaluateSegmentRules(s, { min_orders: 3, min_total: 100000, within_days: 30 }, now)).toBe(true)
    })
    it('falla por nº de pedidos', () => {
      const s = { customer_id: 'c1', orders: 1, total: 500000, last_order_at: '2026-10-10T00:00:00Z' }
      expect(evaluateSegmentRules(s, { min_orders: 3 }, now)).toBe(false)
    })
    it('falla por antigüedad de la última compra', () => {
      const s = { customer_id: 'c1', orders: 9, total: 999999, last_order_at: '2026-01-01T00:00:00Z' }
      expect(evaluateSegmentRules(s, { within_days: 30 }, now)).toBe(false)
    })
    it('reglas vacías no incluyen a nadie', () => {
      const s = { customer_id: 'c1', orders: 9, total: 999999, last_order_at: '2026-10-17T00:00:00Z' }
      expect(evaluateSegmentRules(s, {}, now)).toBe(false)
    })
  })

  describe('aggregateCustomerStats', () => {
    it('solo cuenta pagos aprobados y acumula total + última fecha', () => {
      const stats = aggregateCustomerStats([
        { customer_id: 'c1', total: 100, created_at: '2026-10-01T00:00:00Z', payment_status: 'approved' },
        { customer_id: 'c1', total: 200, created_at: '2026-10-05T00:00:00Z', payment_status: 'approved' },
        { customer_id: 'c1', total: 999, created_at: '2026-10-09T00:00:00Z', payment_status: 'pending' },
        { customer_id: null,  total: 50,  created_at: '2026-10-02T00:00:00Z', payment_status: 'approved' },
      ])
      expect(stats).toEqual([{ customer_id: 'c1', orders: 2, total: 300, last_order_at: '2026-10-05T00:00:00Z' }])
    })
  })

  describe('computeSegmentMembers', () => {
    it('devuelve solo los que cumplen', () => {
      const stats = [
        { customer_id: 'a', orders: 5, total: 500, last_order_at: '2026-10-15T00:00:00Z' },
        { customer_id: 'b', orders: 1, total: 100, last_order_at: '2026-10-15T00:00:00Z' },
      ]
      expect(computeSegmentMembers(stats, { min_orders: 3 }, now)).toEqual(['a'])
    })
  })
})

describe('campañas VIP (HU-289/290)', () => {
  const base = { starts_at: '2026-10-18T10:00:00Z', ends_at: '2026-10-18T22:00:00Z' }

  describe('deriveCampaignStatus', () => {
    it('scheduled antes de la ventana', () => {
      expect(deriveCampaignStatus({ ...base, status: 'scheduled' }, new Date('2026-10-18T09:00:00Z'))).toBe('scheduled')
    })
    it('active dentro de la ventana', () => {
      expect(deriveCampaignStatus({ ...base, status: 'scheduled' }, new Date('2026-10-18T12:00:00Z'))).toBe('active')
    })
    it('ended después de la ventana', () => {
      expect(deriveCampaignStatus({ ...base, status: 'active' }, new Date('2026-10-18T23:00:00Z'))).toBe('ended')
    })
    it('paused/cancelled mandan sobre la ventana', () => {
      expect(deriveCampaignStatus({ ...base, status: 'paused' }, new Date('2026-10-18T12:00:00Z'))).toBe('paused')
      expect(deriveCampaignStatus({ ...base, status: 'cancelled' }, new Date('2026-10-18T12:00:00Z'))).toBe('cancelled')
    })
    it('isCampaignLive true solo si active', () => {
      expect(isCampaignLive({ ...base, status: 'scheduled' }, new Date('2026-10-18T12:00:00Z'))).toBe(true)
      expect(isCampaignLive({ ...base, status: 'paused' }, new Date('2026-10-18T12:00:00Z'))).toBe(false)
    })
  })

  describe('validateCampaign', () => {
    const ok = { name: 'Lanzamiento', segment_id: 1, ...base, product_ids: [10] }
    it('acepta una campaña válida', () => {
      expect(validateCampaign(ok).ok).toBe(true)
    })
    it('rechaza ventana invertida', () => {
      expect(validateCampaign({ ...ok, starts_at: base.ends_at, ends_at: base.starts_at }).ok).toBe(false)
    })
    it('rechaza sin alcance', () => {
      expect(validateCampaign({ ...ok, product_ids: [], category_ids: [] }).ok).toBe(false)
    })
    it('rechaza descuento fuera de rango', () => {
      expect(validateCampaign({ ...ok, offer_percent: 150 }).ok).toBe(false)
    })
  })
})
