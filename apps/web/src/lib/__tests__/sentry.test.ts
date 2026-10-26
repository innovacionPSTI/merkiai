/**
 * HU-170 · la inicialización de Sentry es GUARDED: sin DSN no registra el hook
 * global ni intenta cargar el SDK (el storefront sigue con ConsoleReporter).
 */
import { initSentryServer } from '../sentry'

describe('initSentryServer (HU-170 guarded)', () => {
  const OLD = process.env
  beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).__merkiaiCaptureException
  })
  afterAll(() => { process.env = OLD })

  it('no registra el hook cuando no hay DSN', async () => {
    delete process.env.SENTRY_DSN
    delete process.env.NEXT_PUBLIC_SENTRY_DSN
    await initSentryServer()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((globalThis as any).__merkiaiCaptureException).toBeUndefined()
  })

  it('con DSN pero sin SDK instalado, no lanza y no deja hook (import falla → no-op)', async () => {
    process.env.SENTRY_DSN = 'https://example@o0.ingest.sentry.io/0'
    await expect(initSentryServer()).resolves.toBeUndefined()
    // El SDK no está instalado en el entorno de test: el hook no se registra.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((globalThis as any).__merkiaiCaptureException).toBeUndefined()
  })
})
