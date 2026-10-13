/**
 * Unit tests — maskInstance (ADR-004 · HU-276). Nunca expone secretos.
 */
import { maskInstance, publicProviders } from '../mask-instance'
import { PAYMENT_PROVIDERS, getProviderDef, type IntegrationInstance } from '@merkiai/database'

const wompiDef = getProviderDef('payment', 'wompi')!

const inst: IntegrationInstance = {
  id: 'i1', tenantId: 't1', kind: 'payment', provider: 'wompi', label: 'Wompi prod',
  environment: 'production',
  credentials: { public_key: 'pub_prod_x', private_key: 'prv_prod_secret', integrity_secret: 'int_secret' },
  settings: {}, enabled: true, isActive: true, createdAt: 'now', updatedAt: 'now',
}

describe('maskInstance', () => {
  it('expone los campos de texto pero NO los secretos (solo flags)', () => {
    const m = maskInstance(inst, wompiDef)
    expect(m.values.public_key).toBe('pub_prod_x')          // texto → visible
    expect((m.values as Record<string, unknown>).private_key).toBeUndefined() // secreto → no
    expect(m.secretSet.private_key).toBe(true)
    expect(m.secretSet.integrity_secret).toBe(true)
    expect(m.secretSet.events_secret).toBe(false)           // no guardado
    expect(m.label).toBe('Wompi prod')
    expect(m.environment).toBe('production')
    expect(m.isActive).toBe(true)
  })
  it('no filtra ningún valor de secreto en el objeto serializado', () => {
    const json = JSON.stringify(maskInstance(inst, wompiDef))
    expect(json).not.toContain('prv_prod_secret')
    expect(json).not.toContain('int_secret')
  })
})

describe('publicProviders', () => {
  it('serializa el registry sin funciones (detectEnv no viaja al cliente)', () => {
    const pub = publicProviders(PAYMENT_PROVIDERS)
    expect(pub.map((p) => p.provider).sort()).toEqual(['bold', 'mercadopago', 'tucompra', 'wompi'])
    expect((pub[0] as Record<string, unknown>).detectEnv).toBeUndefined()
    expect(Array.isArray(pub[0].fields)).toBe(true)
  })
})
