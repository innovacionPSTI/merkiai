import { hasInternalSecret, hasCronSecret } from '../auth'
import type { NextRequest } from 'next/server'

function reqWith(headers: Record<string, string>): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest
}

describe('hasInternalSecret (console · HU-202)', () => {
  const OLD = process.env.INTERNAL_API_SECRET
  beforeAll(() => { process.env.INTERNAL_API_SECRET = 'super-secreto-interno' })
  afterAll(() => { process.env.INTERNAL_API_SECRET = OLD })

  it('acepta el secreto correcto (server-to-server, sin Origin)', () => {
    expect(hasInternalSecret(reqWith({ 'x-internal-secret': 'super-secreto-interno' }))).toBe(true)
  })

  it('rechaza secreto incorrecto', () => {
    expect(hasInternalSecret(reqWith({ 'x-internal-secret': 'malo' }))).toBe(false)
  })

  it('rechaza si falta el header', () => {
    expect(hasInternalSecret(reqWith({}))).toBe(false)
  })

  it('rechaza peticiones con Origin (navegador cross-origin)', () => {
    expect(
      hasInternalSecret(reqWith({ 'x-internal-secret': 'super-secreto-interno', origin: 'https://evil.com' })),
    ).toBe(false)
  })
})

describe('hasCronSecret (Vercel Cron · HU-440)', () => {
  const OLD = process.env.CRON_SECRET
  afterAll(() => { process.env.CRON_SECRET = OLD })

  it('acepta Bearer correcto', () => {
    process.env.CRON_SECRET = 'cron-secreto-largo-123'
    expect(hasCronSecret(reqWith({ authorization: 'Bearer cron-secreto-largo-123' }))).toBe(true)
  })
  it('rechaza Bearer incorrecto, sin header o sin prefijo', () => {
    process.env.CRON_SECRET = 'cron-secreto-largo-123'
    expect(hasCronSecret(reqWith({ authorization: 'Bearer otro' }))).toBe(false)
    expect(hasCronSecret(reqWith({}))).toBe(false)
    expect(hasCronSecret(reqWith({ authorization: 'cron-secreto-largo-123' }))).toBe(false)
  })
  it('fail-closed si CRON_SECRET no está configurado', () => {
    delete process.env.CRON_SECRET
    expect(hasCronSecret(reqWith({ authorization: 'Bearer undefined' }))).toBe(false)
  })
})
