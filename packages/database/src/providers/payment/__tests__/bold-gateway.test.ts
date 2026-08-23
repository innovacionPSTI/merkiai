/**
 * Unit tests — BoldGateway
 *
 * Cubre: creación de link (POST + headers + body), verificación de firma
 * HMAC-SHA256(base64(body)), sandbox con llave vacía, mapStatus y extractWebhookData.
 */

import { createHmac } from 'crypto'
import { BoldGateway } from '../BoldGateway'
import type { CreatePaymentParams } from '../types'

const cfg = { apiKey: 'bold_api_123', secretKey: 'super_secret', sandbox: false }

const baseParams: CreatePaymentParams = {
  orderNumber: 'ORD-0042',
  amountInCents: 9800000, // 98.000 COP en centavos
  currency: 'COP',
  customerEmail: 'juan@example.com',
  customerName: 'Juan Pérez',
  customerPhone: '3001234567',
  items: [{ id: '10', title: 'Café', quantity: 2, unit_price: 45000 }],
  redirectUrl: 'https://shop.com/checkout/confirmation?order=ORD-0042',
  webhookUrl: 'https://shop.com/api/webhooks/bold',
}

/** Firma como la haría Bold: HMAC-SHA256 hex de base64(body) con la llave secreta. */
function boldSign(body: string, secret: string): string {
  const encoded = Buffer.from(body, 'utf-8').toString('base64')
  return createHmac('sha256', secret).update(encoded).digest('hex')
}

afterEach(() => { jest.restoreAllMocks() })

describe('BoldGateway — createPaymentUrl', () => {
  it('hace POST a /online/link/v1 con header x-api-key y devuelve payload.url', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ payload: { payment_link: 'LNK_1', url: 'https://checkout.bold.co/LNK_1' }, errors: [] }),
    } as unknown as Response)

    const url = await new BoldGateway(cfg).createPaymentUrl(baseParams)

    expect(url).toBe('https://checkout.bold.co/LNK_1')
    const [calledUrl, init] = fetchMock.mock.calls[0]
    expect(String(calledUrl)).toBe('https://integrations.api.bold.co/online/link/v1')
    expect((init?.headers as Record<string, string>).Authorization).toBe('x-api-key bold_api_123')

    const body = JSON.parse(String(init?.body))
    expect(body.amount_type).toBe('CLOSE')
    expect(body.amount.total_amount).toBe(98000) // centavos → COP
    expect(body.reference).toBe('ORD-0042') // referencia externa top-level → webhook data.metadata.reference
    expect(body.metadata).toBeUndefined() // Bold ignora metadata en el API Link de pagos
    expect(body.callback_url).toContain('order=ORD-0042')
  })

  it('lanza si Bold responde error HTTP', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false, status: 401, text: async () => 'unauthorized',
    } as unknown as Response)

    await expect(new BoldGateway(cfg).createPaymentUrl(baseParams)).rejects.toThrow(/Bold createLink falló 401/)
  })

  it('lanza si la respuesta no trae payload.url', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true, json: async () => ({ payload: {}, errors: [{ message: 'x' }] }),
    } as unknown as Response)

    await expect(new BoldGateway(cfg).createPaymentUrl(baseParams)).rejects.toThrow(/sin payload\.url/)
  })
})

describe('BoldGateway — verifyWebhook', () => {
  const body = JSON.stringify({ type: 'SALE_APPROVED', data: { metadata: { reference: 'ORD-0042' } } })

  it('acepta una firma válida', () => {
    const sig = boldSign(body, cfg.secretKey)
    expect(new BoldGateway(cfg).verifyWebhook(body, { 'x-bold-signature': sig })).toBe(true)
  })

  it('rechaza una firma inválida', () => {
    expect(new BoldGateway(cfg).verifyWebhook(body, { 'x-bold-signature': 'deadbeef' })).toBe(false)
  })

  it('rechaza si no viene el header de firma', () => {
    expect(new BoldGateway(cfg).verifyWebhook(body, { 'x-bold-signature': null })).toBe(false)
  })

  it('en sandbox verifica con llave secreta vacía', () => {
    const sandboxGw = new BoldGateway({ ...cfg, sandbox: true })
    const sig = boldSign(body, '') // Bold firma con llave vacía en pruebas
    expect(sandboxGw.verifyWebhook(body, { 'x-bold-signature': sig })).toBe(true)
  })

  it('fail-closed: en producción con llave secreta vacía rechaza (no se puede forjar)', () => {
    const prodNoSecret = new BoldGateway({ ...cfg, sandbox: false, secretKey: '' })
    const sig = boldSign(body, '') // firma calculada con llave vacía
    expect(prodNoSecret.verifyWebhook(body, { 'x-bold-signature': sig })).toBe(false)
  })
})

describe('BoldGateway — queryStatusByReference (fallback)', () => {
  it('consulta por referencia externa con x-api-key y devuelve el estado aprobado', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ notifications: [
        { type: 'SALE_REJECTED', subject: 'T1', data: { payment_id: 'P1' } },
        { type: 'SALE_APPROVED', subject: 'T2', data: { payment_id: 'P2' } },
      ] }),
    } as unknown as Response)

    const out = await new BoldGateway(cfg).queryStatusByReference('ORD-0042')

    expect(out).toEqual({ status: 'approved', rawStatus: 'SALE_APPROVED', paymentId: 'P2' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://integrations.api.bold.co/payments/webhook/notifications/ORD-0042?is_external_reference=true')
    expect((init?.headers as Record<string, string>).Authorization).toBe('x-api-key bold_api_123')
  })

  it('devuelve null si no hay notificaciones', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ notifications: [] }) } as unknown as Response)
    expect(await new BoldGateway(cfg).queryStatusByReference('ORD-0001')).toBeNull()
  })

  it('devuelve null ante error HTTP', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 404 } as unknown as Response)
    expect(await new BoldGateway(cfg).queryStatusByReference('ORD-0001')).toBeNull()
  })
})

describe('BoldGateway — mapStatus / extractWebhookData', () => {
  it('mapea los estados de Bold', () => {
    const gw = new BoldGateway(cfg)
    expect(gw.mapStatus('SALE_APPROVED')).toBe('approved')
    expect(gw.mapStatus('SALE_REJECTED')).toBe('rejected')
    expect(gw.mapStatus('VOID_APPROVED')).toBe('rejected')
    expect(gw.mapStatus('VOID_REJECTED')).toBe('pending')
  })

  it('extrae la referencia, el estado y el monto (amountCop) del body', () => {
    const gw = new BoldGateway(cfg)
    const body = JSON.stringify({
      type: 'SALE_APPROVED',
      subject: 'TXN-1',
      data: { payment_id: 'PAY-1', amount: { total: 98000 }, metadata: { reference: 'ORD-0042' } },
    })
    expect(gw.extractWebhookData(body)).toEqual({
      orderReference: 'ORD-0042',
      rawStatus: 'SALE_APPROVED',
      paymentId: 'PAY-1',
      amountCop: 98000,
    })
  })

  it('devuelve null si falta la referencia', () => {
    const gw = new BoldGateway(cfg)
    expect(gw.extractWebhookData(JSON.stringify({ type: 'SALE_APPROVED', data: {} }))).toBeNull()
  })
})
