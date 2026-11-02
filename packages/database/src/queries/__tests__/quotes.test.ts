import { quoteLineTotal, quoteTotals, isQuoteExpired, canConvertQuote, isQuoteStatus } from '../quotes'

describe('cotizaciones (HU-408 F1, puras)', () => {
  it('quoteLineTotal y quoteTotals con descuento topado', () => {
    expect(quoteLineTotal(3, 2500)).toBe(7500)
    const items = [{ qty: 2, unit_price: 10000 }, { qty: 1, unit_price: 5000 }]
    expect(quoteTotals(items, 3000)).toEqual({ subtotal: 25000, discount: 3000, total: 22000 })
    // descuento mayor al subtotal → se topa al subtotal
    expect(quoteTotals(items, 999999)).toEqual({ subtotal: 25000, discount: 25000, total: 0 })
  })

  it('isQuoteExpired respeta valid_until (null nunca vence)', () => {
    const now = new Date('2026-11-02T12:00:00Z')
    expect(isQuoteExpired(null, now)).toBe(false)
    expect(isQuoteExpired('2026-11-01T00:00:00Z', now)).toBe(true)
    expect(isQuoteExpired('2026-12-01T00:00:00Z', now)).toBe(false)
  })

  it('canConvertQuote bloquea convertida/cancelada/vencida', () => {
    const now = new Date('2026-11-02T12:00:00Z')
    expect(canConvertQuote({ status: 'accepted', valid_until: '2026-12-01T00:00:00Z' }, now)).toBeNull()
    expect(canConvertQuote({ status: 'draft', valid_until: null }, now)).toBeNull()
    expect(canConvertQuote({ status: 'converted', valid_until: null }, now)).toMatch(/convertida/)
    expect(canConvertQuote({ status: 'cancelled', valid_until: null }, now)).toMatch(/cancelada/)
    expect(canConvertQuote({ status: 'accepted', valid_until: '2026-10-01T00:00:00Z' }, now)).toMatch(/vencida/)
  })

  it('isQuoteStatus', () => {
    expect(isQuoteStatus('draft')).toBe(true)
    expect(isQuoteStatus('nope')).toBe(false)
  })
})
