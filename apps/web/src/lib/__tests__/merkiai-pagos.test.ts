/**
 * @jest-environment node
 */
import { gatewayMethod, hydrateManagedPayment, reportMerkiaiFee } from '../merkiai-pagos'
import type { ActivePayment } from '@merkiai/database'

const managed: ActivePayment = { provider: 'merkiai_pagos', environment: 'production', credentials: {}, settings: {}, source: 'instance' }
const ok = (body: unknown, status = 200) => jest.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body }) as unknown as typeof fetch

describe('Merkiai Pagos en el storefront', () => {
  const OLD = { ...process.env }
  beforeEach(() => { process.env.CONSOLE_URL = 'https://console.test'; process.env.INTERNAL_API_SECRET = 'x'.repeat(24) })
  afterAll(() => { process.env = OLD })

  it('gatewayMethod: Merkiai Pagos usa el método/webhook de PayZen', () => {
    expect(gatewayMethod('merkiai_pagos')).toBe('payzen')
    expect(gatewayMethod('wompi')).toBe('wompi')
  })
  it('otros proveedores pasan sin tocar', async () => {
    const wompi = { ...managed, provider: 'wompi' }
    expect(await hydrateManagedPayment(wompi, 't1', ok({}))).toBe(wompi)
    expect(await hydrateManagedPayment(null, 't1', ok({}))).toBeNull()
  })
  it('hidrata credenciales desde la consola', async () => {
    const f = ok({ active: true, environment: 'test', credentials: { shop_id: '123', password: 'testpassword_x' } })
    const r = await hydrateManagedPayment(managed, 't1', f)
    expect(r?.credentials).toEqual({ shop_id: '123', password: 'testpassword_x' })
    expect(r?.environment).toBe('test')
    expect((f as jest.Mock).mock.calls[0][0]).toBe('https://console.test/api/internal/tenants/t1/payments/merkiai')
  })
  it('fail-closed si no está activo o la consola falla', async () => {
    await expect(hydrateManagedPayment(managed, 't1', ok({ active: false }))).rejects.toThrow(/no está activo/)
    await expect(hydrateManagedPayment(managed, 't1', ok({ error: 'x' }, 503))).rejects.toThrow()
    delete process.env.CONSOLE_URL; delete process.env.CONTROL_PLANE_URL
    await expect(hydrateManagedPayment(managed, 't1', ok({}))).rejects.toThrow(/consola/)
  })
  it('reportMerkiaiFee: true solo si la consola confirma', async () => {
    const f = ok({ status: 'recorded' })
    expect(await reportMerkiaiFee('t1', { paymentId: 'tx', orderNumber: 'O1', amountCents: 100 }, f)).toBe(true)
    expect(JSON.parse((f as jest.Mock).mock.calls[0][1].body)).toEqual({ currency: 'COP', paymentId: 'tx', orderNumber: 'O1', amountCents: 100 })
    expect(await reportMerkiaiFee('t1', { paymentId: 'tx', orderNumber: 'O1', amountCents: 100 }, ok({}, 502))).toBe(false)
  })
})
