jest.mock('../../lib/email', () => ({ sendBackInStock: jest.fn().mockResolvedValue(undefined) }))

import { isValidEmail, subscribeStockNotification, notifyBackInStock } from '../stock-notifications'
import { sendBackInStock } from '../../lib/email'

describe('isValidEmail', () => {
  it('acepta correos válidos y rechaza inválidos', () => {
    expect(isValidEmail('a@b.com')).toBe(true)
    expect(isValidEmail(' persona@tienda.co ')).toBe(true)
    expect(isValidEmail('sin-arroba')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('subscribeStockNotification', () => {
  function dbWith(insertResult: { error: unknown }) {
    const insert = jest.fn().mockResolvedValue(insertResult)
    return { db: { from: jest.fn(() => ({ insert })) } as any, insert }
  }

  it('rechaza correo inválido sin tocar la BD', async () => {
    const { db, insert } = dbWith({ error: null })
    const res = await subscribeStockNotification(db, 5, 'malo', 't1')
    expect(res.ok).toBe(false)
    expect(insert).not.toHaveBeenCalled()
  })

  it('inserta con tenant + email normalizado y notified_at null', async () => {
    const { db, insert } = dbWith({ error: null })
    const res = await subscribeStockNotification(db, 5, '  Persona@Tienda.CO ', 't1')
    expect(res.ok).toBe(true)
    expect(insert).toHaveBeenCalledWith({ tenant_id: 't1', variant_id: 5, email: 'persona@tienda.co', notified_at: null })
  })

  it('trata el conflicto único (23505) como éxito idempotente', async () => {
    const { db } = dbWith({ error: { code: '23505', message: 'dup' } })
    const res = await subscribeStockNotification(db, 5, 'a@b.com', 't1')
    expect(res.ok).toBe(true)
  })

  it('propaga otros errores de BD', async () => {
    const { db } = dbWith({ error: { code: 'XXYY', message: 'boom' } })
    const res = await subscribeStockNotification(db, 5, 'a@b.com', 't1')
    expect(res.ok).toBe(false)
    expect(res.error).toBe('boom')
  })
})

describe('notifyBackInStock', () => {
  beforeEach(() => jest.clearAllMocks())

  it('envía a los pendientes y los marca notificados', async () => {
    const update = jest.fn().mockReturnValue({ in: jest.fn().mockResolvedValue({ error: null }) })
    const select = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({ is: jest.fn().mockResolvedValue({ data: [{ id: 1, email: 'a@b.com' }, { id: 2, email: 'c@d.com' }] }) }),
    })
    const db = { from: jest.fn(() => ({ select, update })) } as any

    const sent = await notifyBackInStock(db, 7, { productName: 'Cafe', productUrl: null, variantLabel: 'Medio · 1kg' }, { apiKey: 'k', fromEmail: 'f@x.com' })

    expect(sent).toBe(2)
    expect(sendBackInStock).toHaveBeenCalledTimes(2)
    expect(update).toHaveBeenCalledWith({ notified_at: expect.any(String) })
  })

  it('no hace nada si no hay pendientes', async () => {
    const select = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({ is: jest.fn().mockResolvedValue({ data: [] }) }),
    })
    const db = { from: jest.fn(() => ({ select })) } as any

    const sent = await notifyBackInStock(db, 7, { productName: 'Cafe' }, { apiKey: 'k', fromEmail: 'f@x.com' })
    expect(sent).toBe(0)
    expect(sendBackInStock).not.toHaveBeenCalled()
  })
})
