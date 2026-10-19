import { scrubContext, ConsoleReporter, NoopReporter, HookReporter, reportError, setErrorReporter } from '../error-reporter'

describe('error-reporter (HU-170)', () => {
  describe('scrubContext', () => {
    it('redacta claves sensibles (PII/secretos), recursivo', () => {
      const out = scrubContext({
        email: 'a@b.com', phone: '3001', nested: { api_key: 'sk_live', ok: 1 }, list: [{ password: 'x' }],
        keep: 'visible',
      }) as any
      expect(out.email).toBe('[redacted]')
      expect(out.phone).toBe('[redacted]')
      expect(out.nested.api_key).toBe('[redacted]')
      expect(out.nested.ok).toBe(1)
      expect(out.list[0].password).toBe('[redacted]')
      expect(out.keep).toBe('visible')
    })
    it('no explota con null/valores primitivos', () => {
      expect(scrubContext(null)).toBeNull()
      expect(scrubContext(42)).toBe(42)
    })
  })

  describe('reporters', () => {
    it('ConsoleReporter escribe JSON a stderr y no lanza', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
      new ConsoleReporter().captureException(new Error('boom'), { scope: 'test', tenantId: 't1', extra: { email: 'x@y.com' } })
      expect(spy).toHaveBeenCalledTimes(1)
      const payload = JSON.parse(spy.mock.calls[0][0] as string)
      expect(payload.message).toBe('boom')
      expect(payload.tenantId).toBe('t1')
      expect(payload.extra.email).toBe('[redacted]') // scrubbing aplicado
      spy.mockRestore()
    })
    it('NoopReporter no hace nada', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
      new NoopReporter().captureException(new Error('x'))
      expect(spy).not.toHaveBeenCalled()
      spy.mockRestore()
    })
    it('HookReporter invoca el hook global de APM si existe', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const hook = jest.fn()
      ;(globalThis as any).__merkiaiCaptureException = hook
      new HookReporter().captureException(new Error('boom'), { scope: 's' })
      expect(hook).toHaveBeenCalledTimes(1)
      delete (globalThis as any).__merkiaiCaptureException
      spy.mockRestore()
    })
    it('reportError usa el reporter inyectado y nunca lanza', () => {
      const captured: unknown[] = []
      setErrorReporter({ captureException: (e) => captured.push(e), captureMessage: () => {} })
      expect(() => reportError(new Error('z'), { scope: 's' })).not.toThrow()
      expect(captured).toHaveLength(1)
      setErrorReporter(null)
    })
  })
})
