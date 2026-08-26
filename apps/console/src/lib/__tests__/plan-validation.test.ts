import { parsePlanForm, parseJsonObject } from '../plan-validation'

describe('parseJsonObject', () => {
  it('vacío → {}', () => {
    expect(parseJsonObject('')).toEqual({})
    expect(parseJsonObject(undefined)).toEqual({})
  })
  it('objeto válido', () => {
    expect(parseJsonObject('{"pos": true}')).toEqual({ pos: true })
  })
  it('array o no-objeto → null', () => {
    expect(parseJsonObject('[1,2]')).toBeNull()
    expect(parseJsonObject('42')).toBeNull()
    expect(parseJsonObject('{bad}')).toBeNull()
  })
})

describe('parsePlanForm (HU-173)', () => {
  const base = {
    key: 'pro', name: 'Pro', price_cents: '9900000', currency: 'cop',
    features: '{"pos": true}', limits: '{"products": 2000}', data_isolation: 'shared', active: 'true',
  }

  it('normaliza y acepta un plan válido', () => {
    const r = parsePlanForm(base)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value).toMatchObject({
        key: 'pro', name: 'Pro', price_cents: 9900000, currency: 'COP',
        features: { pos: true }, limits: { products: 2000 }, data_isolation: 'shared', active: true,
      })
    }
  })

  it('rechaza key inválida', () => {
    expect(parsePlanForm({ ...base, key: 'Pro Plan' })).toMatchObject({ ok: false })
  })

  it('rechaza features JSON inválido', () => {
    expect(parsePlanForm({ ...base, features: '[1,2]' })).toMatchObject({ ok: false })
  })

  it('rechaza aislamiento inválido', () => {
    expect(parsePlanForm({ ...base, data_isolation: 'otro' })).toMatchObject({ ok: false })
  })

  it('active=false se respeta', () => {
    const r = parsePlanForm({ ...base, active: 'false' })
    expect(r.ok && r.value.active).toBe(false)
  })
})
