import { createHmac } from 'crypto'
import { verifyMercadoPagoSignature } from '../mercadopago'

const secret = 'mp_webhook_secret'
const dataId = '12345678'
const requestId = 'req-abc'
const ts = '1700000000'

function sign(id: string, reqId: string, t: string, s: string): string {
  const manifest = `id:${id};request-id:${reqId};ts:${t};`
  const v1 = createHmac('sha256', s).update(manifest).digest('hex')
  return `ts=${t},v1=${v1}`
}

describe('verifyMercadoPagoSignature', () => {
  it('valida una firma correcta', () => {
    const xSignature = sign(dataId, requestId, ts, secret)
    expect(verifyMercadoPagoSignature({ xSignature, xRequestId: requestId, dataId, secret })).toBe(true)
  })

  it('rechaza una firma incorrecta', () => {
    expect(verifyMercadoPagoSignature({ xSignature: `ts=${ts},v1=deadbeef`, xRequestId: requestId, dataId, secret })).toBe(false)
  })

  it('rechaza si falta v1 o ts', () => {
    expect(verifyMercadoPagoSignature({ xSignature: 'v1=abc', xRequestId: requestId, dataId, secret })).toBe(false)
    expect(verifyMercadoPagoSignature({ xSignature: `ts=${ts}`, xRequestId: requestId, dataId, secret })).toBe(false)
  })

  it('rechaza si falta la cabecera de firma', () => {
    expect(verifyMercadoPagoSignature({ xSignature: null, xRequestId: requestId, dataId, secret })).toBe(false)
  })

  it('devuelve null cuando no hay secreto configurado (se omite, se confía en re-consulta)', () => {
    expect(verifyMercadoPagoSignature({ xSignature: sign(dataId, requestId, ts, secret), xRequestId: requestId, dataId, secret: null })).toBeNull()
  })
})
