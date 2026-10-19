import { normalizeGiftCardCode, generateGiftCardCode, isGiftCardRedeemable, computeRedemption } from '../gift-cards'

describe('gift cards (HU-148)', () => {
  describe('normalizeGiftCardCode', () => {
    it('mayúsculas, sin espacios ni guiones', () => {
      expect(normalizeGiftCardCode(' abcd-efgh ')).toBe('ABCDEFGH')
    })
  })

  describe('generateGiftCardCode', () => {
    it('formato agrupado y sin caracteres ambiguos', () => {
      const code = generateGiftCardCode(3, 4, () => 0) // siempre primer char 'A'
      expect(code).toBe('AAAA-AAAA-AAAA')
      expect(code).not.toMatch(/[01IO]/)
    })
  })

  describe('isGiftCardRedeemable', () => {
    const now = new Date('2026-10-18T12:00:00Z')
    it('activa con saldo y sin vencer → true', () => {
      expect(isGiftCardRedeemable({ active: true, balance: 100, expires_at: null }, now)).toBe(true)
    })
    it('inactiva / sin saldo / vencida → false', () => {
      expect(isGiftCardRedeemable({ active: false, balance: 100, expires_at: null }, now)).toBe(false)
      expect(isGiftCardRedeemable({ active: true, balance: 0, expires_at: null }, now)).toBe(false)
      expect(isGiftCardRedeemable({ active: true, balance: 100, expires_at: '2026-01-01T00:00:00Z' }, now)).toBe(false)
    })
  })

  describe('computeRedemption', () => {
    it('aplica gift card primero y luego saldo, sin exceder', () => {
      expect(computeRedemption(10000, 3000, 2000)).toEqual({ giftCardApplied: 3000, creditApplied: 2000, remaining: 5000 })
    })
    it('la gift card cubre todo', () => {
      expect(computeRedemption(5000, 9000, 1000)).toEqual({ giftCardApplied: 5000, creditApplied: 0, remaining: 0 })
    })
    it('gift card + saldo cubren todo (saldo se cap al resto)', () => {
      expect(computeRedemption(5000, 3000, 9000)).toEqual({ giftCardApplied: 3000, creditApplied: 2000, remaining: 0 })
    })
    it('sin saldos → todo queda por pagar', () => {
      expect(computeRedemption(5000, 0, 0)).toEqual({ giftCardApplied: 0, creditApplied: 0, remaining: 5000 })
    })
  })
})
