/**
 * HU-170 · la inicialización de Sentry es GUARDED por DSN. Se mockea el SDK para
 * no cargar el paquete real (pesado) en el worker de jest y hacer el test
 * determinista esté o no instalado `@sentry/nextjs`.
 */

const mockInit = jest.fn()
const mockCapture = jest.fn()
jest.mock('@sentry/nextjs', () => ({ init: mockInit, captureException: mockCapture }))

import { initSentryServer } from '../sentry'

describe('initSentryServer (HU-170 guarded)', () => {
  const OLD = process.env
  beforeEach(() => {
    jest.resetModules()
    mockInit.mockClear()
    mockCapture.mockClear()
    process.env = { ...OLD }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (globalThis as any).__merkiaiCaptureException
  })
  afterAll(() => { process.env = OLD })

  it('no inicializa ni registra el hook cuando no hay DSN', async () => {
    delete process.env.SENTRY_DSN
    delete process.env.NEXT_PUBLIC_SENTRY_DSN
    await initSentryServer()
    expect(mockInit).not.toHaveBeenCalled()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((globalThis as any).__merkiaiCaptureException).toBeUndefined()
  })

  it('con DSN inicializa Sentry y registra el hook global', async () => {
    process.env.SENTRY_DSN = 'https://example@o0.ingest.sentry.io/0'
    await initSentryServer()
    expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ dsn: process.env.SENTRY_DSN }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hook = (globalThis as any).__merkiaiCaptureException
    expect(typeof hook).toBe('function')
    // El hook enruta a Sentry.captureException sin lanzar.
    hook(new Error('x'), { scope: 'test', tenantId: 't1' })
    expect(mockCapture).toHaveBeenCalled()
  })

  it('nunca lanza aunque Sentry.init falle', async () => {
    process.env.SENTRY_DSN = 'https://example@o0.ingest.sentry.io/0'
    mockInit.mockImplementationOnce(() => { throw new Error('init boom') })
    await expect(initSentryServer()).resolves.toBeUndefined()
  })
})
