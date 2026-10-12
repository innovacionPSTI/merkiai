/**
 * Unit tests — WompiGateway (fuente única de la lógica Wompi).
 *
 * Cubre: createPaymentUrl (URL + firma SHA256), verifyWebhook (fail-closed +
 * tiempo constante), mapStatus, extractWebhookData (con amountCop) y
 * queryTransaction (base sandbox/prod según la llave + mapeo de estado).
 */

import { createHash } from 'crypto'
import { WompiGateway } from '../WompiGateway'
import type { CreatePaymentParams } from '../types'

const cfg = {
  publicKey: 'pub_test_abc123',
  integritySecret: 'test_int_secret',
  eventsSecret: 'test_events_secret',
  privateKey: 'prv_test_xyz',
}

const baseParams: CreatePaymentParams = {
  orderNumber: 'ORD-0042',
  amountInCents: 9800000,
  currency: 'COP',
  customerEmail: 'juan@example.com',
  customerName: 'Juan Pérez',
  customerPhone: '3001234567',
  items: [{ id: '10', title: 'Café', quantity: 2, unit_price: 45000 }],
  redirectUrl: 'https://shop.com/checkout/confirmation?order=ORD-0042',
  webhookUrl: 'https://shop.com/api/webhooks/wompi',
}

afterEach(() => { jest.restoreAllMocks() })

describe('WompiGateway — createPaymentUrl', () => {
  it('arma la URL con public-key, monto, referencia y firma SHA256', async () => {
    const url = new URL(await new WompiGateway(cfg).createPaymentUrl(baseParams))
    expect(url.origin + url.pathname).toContain('checkout.wompi.co/p/')
    expect(url.searchParams.get('public-key')).toBe('pub_test_abc123')
    expect(url.searchParams.get('amount-in-cents')).toBe('9800000')
    expect(url.searchParams.get('reference')).toBe('ORD-0042')
    const expected = createHash('sha256').update('ORD-00429800000COPtest_int_secret').digest('hex')
    expect(url.searchParams.get('signature:integrity')).toBe(expected)
  })
})

describe('WompiGateway — verifyWebhook (fail-closed)', () => {
  const payload = '{"event":"transaction.updated"}'
  const timestamp = '1720000000000'
  const sign = (p: string, t: string, s: string) => createHash('sha256').update(`${p}${t}${s}`).digest('hex')

  it('acepta una firma válida', () => {
    const checksum = sign(payload, timestamp, cfg.eventsSecret)
    expect(new WompiGateway(cfg).verifyWebhook(payload, { 'x-timestamp': timestamp, 'x-checksum': checksum })).toBe(true)
  })
  it('rechaza firma inválida', () => {
    expect(new WompiGateway(cfg).verifyWebhook(payload, { 'x-timestamp': timestamp, 'x-checksum': 'mala' })).toBe(false)
  })
  it('rechaza si falta el secreto (fail-closed)', () => {
    const g = new WompiGateway({ ...cfg, eventsSecret: '' })
    expect(g.verifyWebhook(payload, { 'x-timestamp': timestamp, 'x-checksum': sign(payload, timestamp, '') })).toBe(false)
  })
})

describe('WompiGateway — extractWebhookData', () => {
  it('extrae referencia, estado, id y monto en COP', () => {
    const data = new WompiGateway(cfg).extractWebhookData({
      event: 'transaction.updated',
      data: { transaction: { id: 'txn-1', reference: 'ORD-9', status: 'APPROVED', amount_in_cents: 1234500 } },
    })
    expect(data).toEqual({ orderReference: 'ORD-9', rawStatus: 'APPROVED', paymentId: 'txn-1', amountCop: 12345 })
  })
  it('ignora eventos que no son transaction.updated', () => {
    expect(new WompiGateway(cfg).extractWebhookData({ event: 'nope' })).toBeNull()
  })
})

describe('WompiGateway — queryTransaction', () => {
  it('consulta la API SANDBOX con llave de prueba y mapea el estado', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: 'txn-1', status: 'APPROVED', reference: 'ORD-9', amount_in_cents: 5000000 } }),
    } as unknown as Response)
    const r = await new WompiGateway(cfg).queryTransaction('txn-1')
    expect(fetchMock).toHaveBeenCalledWith('https://sandbox.wompi.co/v1/transactions/txn-1', expect.objectContaining({
      headers: { Authorization: 'Bearer prv_test_xyz' },
    }))
    expect(r).toEqual({ status: 'approved', rawStatus: 'APPROVED', paymentId: 'txn-1', reference: 'ORD-9', amountCop: 50000 })
  })
  it('usa la API de PRODUCCIÓN con llave real', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true, json: async () => ({ data: { id: 't', status: 'PENDING' } }),
    } as unknown as Response)
    await new WompiGateway({ ...cfg, publicKey: 'pub_prod_x' }).queryTransaction('t')
    expect(fetchMock).toHaveBeenCalledWith('https://production.wompi.co/v1/transactions/t', expect.anything())
  })
  it('devuelve null si la API falla', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false } as unknown as Response)
    expect(await new WompiGateway(cfg).queryTransaction('x')).toBeNull()
  })
})
