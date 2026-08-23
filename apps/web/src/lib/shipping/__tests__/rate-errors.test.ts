import { humanizeShippingError } from '../rate-errors'

describe('humanizeShippingError', () => {
  it('traduce el 422 de declared_amount a un mensaje sobre el total del pedido', () => {
    const err = new Error('Skydropx createQuotation failed: 422 — {"errors":{"declared_amount":["El valor declarado debe ser mayor o igual a 10000"]}}')
    const r = humanizeShippingError(err)
    expect(r.status).toBe(422)
    expect(r.message).toMatch(/total del pedido es muy bajo/i)
    expect(r.message).not.toMatch(/declared_amount|10000/) // no filtra detalle técnico
  })

  it('traduce errores de dirección/código postal', () => {
    const err = new Error('Skydropx createQuotation failed: 422 — {"errors":{"postal_code":["inválido"]}}')
    const r = humanizeShippingError(err)
    expect(r.status).toBe(422)
    expect(r.message).toMatch(/código postal/i)
  })

  it('da un mensaje 422 genérico para otros campos de validación', () => {
    const err = new Error('Skydropx createQuotation failed: 422 — {"errors":{"weight":["requerido"]}}')
    const r = humanizeShippingError(err)
    expect(r.status).toBe(422)
    expect(r.message).toMatch(/no pudimos cotizar/i)
  })

  it('cae a un mensaje 502 con tarifa estándar para errores no-validación', () => {
    const r = humanizeShippingError(new Error('network timeout'))
    expect(r.status).toBe(502)
    expect(r.message).toMatch(/tarifa estándar/i)
  })
})
