/**
 * Unit tests — PayzenGateway (HU-442)
 * Cubre: CreatePaymentOrder (Basic auth, monto en centavos, orderId, ipnTargetUrl),
 * firma de IPN, mapStatus, extracción del pedido y entorno por contraseña.
 */
import { createHmac } from 'crypto'
import { PayzenGateway, payzenEnvFromPassword } from '../PayzenGateway'
import { gatewayFromInstance } from '../index'
import { getProviderDef, missingRequired } from '../../registry'
import type { CreatePaymentParams } from '../types'

const cfg = { shopId: '33970753', password: 'testpassword_abc' }
const params: CreatePaymentParams = {
  orderNumber: 'ORD-0042', amountInCents: 9800000, currency: 'COP', customerEmail: 'juan@example.com', customerName: 'Juan',
  items: [], redirectUrl: 'https://tienda.merkiai.com/checkout/confirmation?order=ORD-0042', webhookUrl: 'https://tienda.merkiai.com/api/webhooks/payzen',
}
function ipnBody(answer: object, password = cfg.password): string {
  const a = JSON.stringify(answer)
  return new URLSearchParams({ 'kr-answer': a, 'kr-hash': createHmac('sha256', password).update(a).digest('hex'), 'kr-hash-algorithm': 'sha256_hmac', 'kr-src': 'PAYMENT_ORDER' }).toString()
}
const paid = { orderStatus: 'PAID', orderDetails: { orderId: 'ORD-0042' }, transactions: [{ uuid: 'tx-9', amount: 9800000 }] }

afterEach(() => jest.restoreAllMocks())

describe('PayzenGateway — createPaymentUrl', () => {
  it('POST Charge/CreatePaymentOrder y devuelve paymentURL', async () => {
    const f = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ status: 'SUCCESS', answer: { paymentURL: 'https://secure.payzen.lat/t/abc' } }) } as unknown as Response)
    const url = await new PayzenGateway(cfg).createPaymentUrl(params)
    expect(url).toBe('https://secure.payzen.lat/t/abc')
    const [u, init] = f.mock.calls[0] as [string, RequestInit]
    expect(u).toBe('https://api.payzen.lat/api-payment/V4/Charge/CreatePaymentOrder')
    expect((init.headers as Record<string, string>).Authorization).toBe('Basic ' + Buffer.from('33970753:testpassword_abc').toString('base64'))
    const body = JSON.parse(init.body as string)
    expect(body).toMatchObject({ amount: 9800000, currency: 'COP', orderId: 'ORD-0042', channelOptions: { channelType: 'URL' }, ipnTargetUrl: params.webhookUrl, successUrl: params.redirectUrl })
  })
  it('error de PayZen → lanza con el código', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ status: 'ERROR', answer: { errorCode: 'INT_009', errorMessage: 'invalid amount' } }) } as unknown as Response)
    await expect(new PayzenGateway(cfg).createPaymentUrl(params)).rejects.toThrow(/INT_009/)
  })
})

describe('PayzenGateway — IPN', () => {
  const gw = new PayzenGateway(cfg)
  it('firma válida / manipulada / otra contraseña', () => {
    expect(gw.verifyWebhook(ipnBody(paid))).toBe(true)
    expect(gw.verifyWebhook(ipnBody(paid).replace('ORD-0042', 'ORD-0043'))).toBe(false)
    expect(gw.verifyWebhook(ipnBody(paid, 'otra'))).toBe(false)
    expect(gw.verifyWebhook('kr-answer=%7B%7D')).toBe(false)
  })
  it('extrae pedido, estado, id y monto en COP', () => {
    expect(gw.extractWebhookData(ipnBody(paid))).toEqual({ orderReference: 'ORD-0042', rawStatus: 'PAID', paymentId: 'tx-9', amountCop: 98000 })
    expect(gw.extractWebhookData('nada=1')).toBeNull()
  })
  it('mapStatus', () => {
    expect(gw.mapStatus('PAID')).toBe('approved')
    expect(gw.mapStatus('UNPAID')).toBe('rejected')
    expect(gw.mapStatus('RUNNING')).toBe('pending')
    expect(gw.mapStatus('ABANDONED')).toBe('pending')
  })
})

describe('PayZen en el registry', () => {
  it('entorno por contraseña y requeridos', () => {
    expect(payzenEnvFromPassword('prodpassword_x')).toBe('production')
    expect(payzenEnvFromPassword('testpassword_x')).toBe('test')
    const def = getProviderDef('payment', 'payzen')!
    expect(def.detectEnv({ password: 'prodpassword_x' })).toBe('production')
    expect(missingRequired(def, { shop_id: '1' })).toEqual(['password'])
  })
  it('gatewayFromInstance construye el gateway o falla claro', () => {
    expect(gatewayFromInstance('payzen', { shop_id: '1', password: 'testpassword_x' }).name).toBe('payzen')
    expect(() => gatewayFromInstance('payzen', { shop_id: '1' })).toThrow(/PayZen/)
  })
})
