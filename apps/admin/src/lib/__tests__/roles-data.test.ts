import { userCanManageData, ROLE_CONFIG } from '../roles'

describe('userCanManageData (HU-134)', () => {
  it('admin y super_admin pueden gestionar datos', () => {
    expect(userCanManageData({ role: 'admin' })).toBe(true)
    expect(userCanManageData({ role: 'super_admin' })).toBe(true)
  })

  it('vendedor y gestor_tienda NO pueden gestionar datos', () => {
    expect(userCanManageData({ role: 'vendedor' })).toBe(false)
    expect(userCanManageData({ role: 'gestor_tienda' })).toBe(false)
  })

  it('rol ausente o desconocido → false', () => {
    expect(userCanManageData({})).toBe(false)
    expect(userCanManageData({ role: 'miembro' })).toBe(false)
    expect(userCanManageData({ role: 'customer' })).toBe(false)
  })

  it('la capacidad está declarada en ROLE_CONFIG', () => {
    expect(ROLE_CONFIG.admin.canManageData).toBe(true)
    expect(ROLE_CONFIG.vendedor.canManageData).toBe(false)
  })
})
