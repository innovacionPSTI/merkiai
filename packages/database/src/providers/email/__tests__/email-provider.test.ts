import { getEmailProvider, ResendProvider } from '../index'

/**
 * PRV-09 — selector de proveedor de email activo (`store_config.email_provider`).
 * La factory debe devolver el proveedor correcto según el slug configurado.
 */
describe('getEmailProvider (selector de proveedor de email)', () => {
  it("devuelve ResendProvider para 'resend'", () => {
    const p = getEmailProvider({ provider: 'resend', apiKey: 're_test' })
    expect(p).toBeInstanceOf(ResendProvider)
    expect(p.name).toBe('resend')
  })

  it('usa Resend por defecto cuando el proveedor es null/undefined', () => {
    expect(getEmailProvider({ provider: null, apiKey: 're_test' }).name).toBe('resend')
    expect(getEmailProvider({ apiKey: 're_test' }).name).toBe('resend')
  })

  it('cae a Resend ante un slug desconocido (fail-safe)', () => {
    const p = getEmailProvider({ provider: 'proveedor-inexistente', apiKey: 're_test' })
    expect(p.name).toBe('resend')
  })

  it('el proveedor devuelto expone send()', () => {
    const p = getEmailProvider({ provider: 'resend', apiKey: 're_test' })
    expect(typeof p.send).toBe('function')
  })
})
