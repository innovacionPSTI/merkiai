import { signReceivableLink, verifyReceivableLink, receivablePaymentReference, parseReceivableReference } from '../receivables-link'

describe('enlace de pago de cartera', () => {
  const secret = 's'.repeat(32)
  it('firma verificable solo para el mismo tenant y documento', () => {
    const sig = signReceivableLink('t1', 7, secret)
    expect(verifyReceivableLink('t1', 7, sig, secret)).toBe(true)
    expect(verifyReceivableLink('t2', 7, sig, secret)).toBe(false)
    expect(verifyReceivableLink('t1', 8, sig, secret)).toBe(false)
    expect(verifyReceivableLink('t1', 7, sig, 'otro')).toBe(false)
    expect(verifyReceivableLink('t1', 7, null, secret)).toBe(false)
    expect(verifyReceivableLink('t1', 7, sig, undefined)).toBe(false)
  })
  it('referencia de pago reversible y distinguible de un pedido', () => {
    const ref = receivablePaymentReference(42, 1700000000000)
    expect(ref).toBe('CXC-42-1700000000000')
    expect(ref.length).toBeLessThanOrEqual(64)
    expect(parseReceivableReference(ref)).toEqual({ documentId: 42 })
    expect(parseReceivableReference('ORD-0042')).toBeNull()
    expect(parseReceivableReference(undefined)).toBeNull()
  })
})
