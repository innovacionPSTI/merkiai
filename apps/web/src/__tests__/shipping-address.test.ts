import { sanitizeCheckoutAddress } from '@/lib/shipping-address'

describe('HU-468 · dirección del checkout por país', () => {
  it('Colombia sin país explícito: igual que antes + country y E.164 si aplica', () => {
    const r = sanitizeCheckoutAddress({ address: 'Calle 1', city: 'Medellín', department: 'Antioquia', postal_code: '' }, '300 123 4567', ['CO'])
    expect(r).toEqual({ ok: true, phoneE164: '+573001234567', address: { address: 'Calle 1', city: 'Medellín', department: 'Antioquia', country: 'CO', phone_e164: '+573001234567' } })
  })

  it('Colombia no bloquea teléfonos con formato antiguo (AC-5)', () => {
    const r = sanitizeCheckoutAddress({ address: 'Calle 1', city: 'Cali', department: 'Valle del Cauca' }, '4441234', ['CO'])
    expect(r.ok).toBe(true)
  })

  it('rechaza países a los que la tienda no vende', () => {
    expect(sanitizeCheckoutAddress({ country: 'MX', address: 'x', city: 'y' }, '', ['CO'])).toEqual({ ok: false, error: 'La tienda no hace envíos a ese país.' })
  })

  it('México valida colonia, CP, estado y teléfono', () => {
    const bad = sanitizeCheckoutAddress({ country: 'MX', address: 'Av 1', city: 'Guadalajara', department: 'Jalisco', postal_code: '44100' }, '33 1234 5678', ['CO', 'MX'])
    expect(bad).toEqual({ ok: false, error: 'Barrio o colonia: Este campo es obligatorio.' })
    const ok = sanitizeCheckoutAddress({ country: 'MX', address: 'Av 1', city: 'Guadalajara', department: 'Jalisco', postal_code: '44100', neighborhood: 'Centro' }, '33 1234 5678', ['CO', 'MX'])
    expect(ok).toMatchObject({ ok: true, phoneE164: '+523312345678', address: { country: 'MX', neighborhood: 'Centro', postal_code: '44100' } })
  })
})
