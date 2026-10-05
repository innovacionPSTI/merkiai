import { parseCouponsCsv, COUPON_IMPORT_TEMPLATE } from '../coupon-import'

describe('parseCouponsCsv', () => {
  it('parsea cupones y normaliza código a mayúsculas', () => {
    const csv = ['code,type,value,min_order_amount,max_uses,expires_at', 'bienvenida,percentage,10,0,100,2026-12-31'].join('\n')
    const { coupons, errors } = parseCouponsCsv(csv)
    expect(errors).toHaveLength(0)
    expect(coupons[0]).toMatchObject({ code: 'BIENVENIDA', type: 'percentage', value: 10, min_order_amount: 0, max_uses: 100, expires_at: '2026-12-31', active: true })
  })

  it('acepta sinónimos ES y tipo "fijo"/"porcentaje"', () => {
    const csv = ['codigo,tipo,valor,minimo', 'ENVIO,fijo,15000,80000'].join('\n')
    const { coupons, errors } = parseCouponsCsv(csv)
    expect(errors).toHaveLength(0)
    expect(coupons[0]).toMatchObject({ code: 'ENVIO', type: 'fixed', value: 15000, min_order_amount: 80000, max_uses: null, expires_at: null })
  })

  it('rechaza porcentaje > 100 y valor inválido', () => {
    const csv = ['code,type,value', 'A,percentage,150', 'B,fixed,0'].join('\n')
    const { coupons, errors } = parseCouponsCsv(csv)
    expect(coupons).toHaveLength(0)
    expect(errors.some((e) => /porcentaje/i.test(e.message))).toBe(true)
    expect(errors.some((e) => /valor/i.test(e.message))).toBe(true)
  })

  it('rechaza tipo inválido y reporta duplicados', () => {
    const csv = ['code,type,value', 'X,loquesea,10', 'Y,fixed,10', 'Y,fixed,20'].join('\n')
    const { coupons, errors } = parseCouponsCsv(csv)
    expect(coupons).toHaveLength(1)
    expect(errors.some((e) => /tipo/i.test(e.message))).toBe(true)
    expect(errors.some((e) => /duplicado/i.test(e.message))).toBe(true)
  })

  it('falla sin columnas obligatorias', () => {
    expect(parseCouponsCsv('type,value\npercentage,10').errors[0].message).toMatch(/code/i)
  })

  it('la plantilla se parsea sin errores', () => {
    const { coupons, errors } = parseCouponsCsv(COUPON_IMPORT_TEMPLATE)
    expect(errors).toHaveLength(0)
    expect(coupons).toHaveLength(2)
  })
})
