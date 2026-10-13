/**
 * Unit tests — registry + gatewayFromInstance (ADR-004 · HU-276/277).
 */
import { PAYMENT_PROVIDERS, getProviderDef, missingRequired } from '../registry'
import { gatewayFromInstance } from '../payment/index'

describe('registry · detección de entorno', () => {
  const wompi = getProviderDef('payment', 'wompi')!
  it('Wompi: pub_test_ → test, pub_prod_ → production', () => {
    expect(wompi.detectEnv({ public_key: 'pub_test_abc' })).toBe('test')
    expect(wompi.detectEnv({ public_key: 'pub_prod_abc' })).toBe('production')
    expect(wompi.detectEnv({})).toBe('unknown')
  })
  it('MercadoPago: TEST → test, APP_USR → production', () => {
    const mp = getProviderDef('payment', 'mercadopago')!
    expect(mp.detectEnv({ public_key: 'TEST-1' })).toBe('test')
    expect(mp.detectEnv({ access_token: 'APP_USR-1' })).toBe('production')
  })
  it('Bold: sandbox en settings decide el entorno', () => {
    const bold = getProviderDef('payment', 'bold')!
    expect(bold.detectEnv({}, { sandbox: true })).toBe('test')
    expect(bold.detectEnv({}, { sandbox: false })).toBe('production')
  })
})

describe('registry · requeridos', () => {
  it('Wompi exige public_key + integrity_secret', () => {
    const w = getProviderDef('payment', 'wompi')!
    expect(missingRequired(w, { public_key: 'x' })).toEqual(['integrity_secret'])
    expect(missingRequired(w, { public_key: 'x', integrity_secret: 'y' })).toEqual([])
  })
  it('hay 4 pasarelas registradas', () => {
    expect(PAYMENT_PROVIDERS.map((p) => p.provider).sort()).toEqual(['bold', 'mercadopago', 'tucompra', 'wompi'])
  })
})

describe('gatewayFromInstance', () => {
  it('construye Wompi desde credenciales genéricas', () => {
    const gw = gatewayFromInstance('wompi', { public_key: 'pub_test_x', integrity_secret: 's' })
    expect(gw.name).toBe('wompi')
  })
  it('falla si faltan credenciales requeridas', () => {
    expect(() => gatewayFromInstance('wompi', { public_key: 'pub_test_x' })).toThrow(/integrity/i)
  })
  it('construye Bold con sandbox desde settings', () => {
    const gw = gatewayFromInstance('bold', { api_key: 'k' }, { sandbox: true })
    expect(gw.name).toBe('bold')
  })
})
