import { normalizeGiftCardCode, generateGiftCardCode, isGiftCardRedeemable, computeRedemption, redeemGiftCard, computeStoreValueReconciliation, redeemStoreValue, refundStoreValue } from '../gift-cards'

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

  describe('redeemGiftCard (atómico)', () => {
    function dbWith(balance: number, updateRows: unknown[] = [{ id: 1 }]) {
      const selectSingle = jest.fn().mockResolvedValue({ data: { balance, active: true, expires_at: null } })
      const updEqBalance = jest.fn().mockResolvedValue({ data: updateRows })
      const updEqId = jest.fn(() => ({ eq: updEqBalance }))
      const updSelect = jest.fn(() => ({ eq: updEqId }))        // .select('id')... but chain is update().eq().eq().select()
      // Chain real: update().eq('id').eq('balance').select('id')
      const chain = {
        update: jest.fn(() => ({ eq: () => ({ eq: () => ({ select: () => Promise.resolve({ data: updateRows }) }) }) })),
        select: jest.fn(() => ({ eq: () => ({ maybeSingle: selectSingle }) })),
      }
      void updSelect; void updEqId; void updEqBalance
      return { from: jest.fn(() => chain) } as any
    }
    it('aplica el mínimo entre saldo y monto', async () => {
      const applied = await redeemGiftCard(1, 3000, dbWith(5000))
      expect(applied).toBe(3000)
    })
    it('si el saldo es menor, aplica solo el saldo', async () => {
      const applied = await redeemGiftCard(1, 9000, dbWith(2000))
      expect(applied).toBe(2000)
    })
    it('devuelve 0 si el guard optimista no afecta filas (concurrencia)', async () => {
      const applied = await redeemGiftCard(1, 1000, dbWith(5000, []))
      expect(applied).toBe(0)
    })
  })

  describe('redeemStoreValue / refundStoreValue (HU-298 RPC)', () => {
    it('redeemStoreValue llama al RPC y devuelve lo aplicado', async () => {
      const rpc = jest.fn().mockResolvedValue({ data: { gift_card_applied: 3000, store_credit_applied: 1000 }, error: null })
      const r = await redeemStoreValue({ rpc } as any, { tenantId: 't1', giftCardId: 5, giftCardAmount: 3000, customerId: 'c1', storeCreditAmount: 1000, orderId: null })
      expect(rpc).toHaveBeenCalledWith('redeem_store_value', expect.objectContaining({ p_tenant: 't1', p_gift_card_id: 5, p_gift_card_amount: 3000, p_store_credit_amount: 1000 }))
      expect(r).toEqual({ giftCardApplied: 3000, storeCreditApplied: 1000 })
    })
    it('refundStoreValue llama al RPC de reverso', async () => {
      const rpc = jest.fn().mockResolvedValue({ error: null })
      await refundStoreValue({ rpc } as any, { tenantId: 't1', giftCardId: 5, giftCardAmount: 3000, customerId: 'c1', storeCreditAmount: 1000 })
      expect(rpc).toHaveBeenCalledWith('refund_store_value', expect.objectContaining({ p_tenant: 't1', p_gift_card_id: 5, p_gift_card_amount: 3000, p_store_credit_amount: 1000 }))
    })
  })

  describe('computeStoreValueReconciliation (HU-300 AC-5)', () => {
    it('agrega emitido/restante/canjeado de gift cards y abonos/consumos de saldo', () => {
      const r = computeStoreValueReconciliation(
        [{ initial_balance: 10000, balance: 4000 }, { initial_balance: 5000, balance: 5000 }],
        [{ delta: 8000 }, { delta: -3000 }, { delta: 2000 }],
      )
      expect(r.giftCards).toEqual({ issued: 15000, remaining: 9000, redeemed: 6000, count: 2 })
      expect(r.storeCredit).toEqual({ credited: 10000, consumed: 3000, balance: 7000 })
    })
  })
})
