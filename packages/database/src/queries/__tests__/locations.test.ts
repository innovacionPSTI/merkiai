import { isLocationKind, pickDefaultLocationId, type Location } from '../locations'

const loc = (over: Partial<Location>): Location => ({
  id: 1, code: 'c', name: 'n', kind: 'warehouse', address: null, city: null, department: null,
  is_default: false, active: true, ...over,
})

describe('ubicaciones (HU-176, puras)', () => {
  it('isLocationKind', () => {
    expect(isLocationKind('store')).toBe(true)
    expect(isLocationKind('pickup')).toBe(true)
    expect(isLocationKind('nave')).toBe(false)
  })

  it('pickDefaultLocationId: default activa > primera activa > null', () => {
    expect(pickDefaultLocationId([
      loc({ id: 1, active: true }), loc({ id: 2, is_default: true, active: true }),
    ])).toBe(2)
    expect(pickDefaultLocationId([
      loc({ id: 5, is_default: true, active: false }), loc({ id: 6, active: true }),
    ])).toBe(6) // default inactiva → primera activa
    expect(pickDefaultLocationId([loc({ id: 9, active: false })])).toBeNull()
    expect(pickDefaultLocationId([])).toBeNull()
  })
})
