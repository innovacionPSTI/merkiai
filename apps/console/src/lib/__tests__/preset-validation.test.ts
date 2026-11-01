import {
  parsePresetForm,
  parseJsonObject,
  parseJsonArray,
  parsePlanList,
} from '../preset-validation'

describe('parseJsonObject / parseJsonArray / parsePlanList', () => {
  it('parseJsonObject: vacío → {}, objeto ok, array/no-objeto → null', () => {
    expect(parseJsonObject('')).toEqual({})
    expect(parseJsonObject(undefined)).toEqual({})
    expect(parseJsonObject('{"a":1}')).toEqual({ a: 1 })
    expect(parseJsonObject('[1]')).toBeNull()
    expect(parseJsonObject('{bad}')).toBeNull()
  })
  it('parseJsonArray: vacío → [], array ok, objeto/inválido → null', () => {
    expect(parseJsonArray('')).toEqual([])
    expect(parseJsonArray('[1,2]')).toEqual([1, 2])
    expect(parseJsonArray('{"a":1}')).toBeNull()
    expect(parseJsonArray('nope')).toBeNull()
  })
  it('parsePlanList: normaliza a minúsculas y descarta vacíos', () => {
    expect(parsePlanList('Free, PRO ,')).toEqual(['free', 'pro'])
    expect(parsePlanList('')).toEqual([])
  })
})

describe('parsePresetForm (HU-233)', () => {
  const base = {
    key: 'cafe-basico', name: 'Café básico', niche: 'cafe',
    description: 'Arranque para cafeterías', theme: '{"primary":"#0f766e"}',
    template: 'default', home_sections: '[]', sample_categories: '[]',
    sample_products: '[]', inventory_model: 'single', available_in_plans: 'free, pro', active: 'true',
  }

  it('acepta y normaliza un preset válido', () => {
    const r = parsePresetForm(base)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value).toMatchObject({
        key: 'cafe-basico', name: 'Café básico', niche: 'cafe',
        theme: { primary: '#0f766e' }, template: 'default',
        inventory_model: 'single', available_in_plans: ['free', 'pro'], active: true,
        blueprint: {}, // HU-373 · sin blueprint por defecto
      })
    }
  })

  it('HU-373 · blueprint vacío → {}, objeto ok, array/inválido → error', () => {
    expect(parsePresetForm(base).ok && parsePresetForm(base)).toMatchObject({ value: { blueprint: {} } })
    const ok = parsePresetForm({ ...base, blueprint: '{"pages":[{"key":"blog","label":"Blog","slug":"blog"}]}' })
    expect(ok.ok && ok.value.blueprint).toMatchObject({ pages: [{ key: 'blog' }] })
    expect(parsePresetForm({ ...base, blueprint: '[1,2]' })).toMatchObject({ ok: false })
  })

  it('rechaza key inválida', () => {
    expect(parsePresetForm({ ...base, key: 'Café Básico' })).toMatchObject({ ok: false })
  })

  it('rechaza nicho inválido', () => {
    expect(parsePresetForm({ ...base, niche: 'Café!' })).toMatchObject({ ok: false })
  })

  it('rechaza theme que no es objeto', () => {
    expect(parsePresetForm({ ...base, theme: '[1,2]' })).toMatchObject({ ok: false })
  })

  it('rechaza home_sections que no es array', () => {
    expect(parsePresetForm({ ...base, home_sections: '{"a":1}' })).toMatchObject({ ok: false })
  })

  it('rechaza inventory_model inválido', () => {
    expect(parsePresetForm({ ...base, inventory_model: 'infinito' })).toMatchObject({ ok: false })
  })

  it('available_in_plans vacío → [] (todos)', () => {
    const r = parsePresetForm({ ...base, available_in_plans: '' })
    expect(r.ok && r.value.available_in_plans).toEqual([])
  })

  it('active=false se respeta', () => {
    const r = parsePresetForm({ ...base, active: 'false' })
    expect(r.ok && r.value.active).toBe(false)
  })
})
