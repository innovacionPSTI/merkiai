import { hasInternalSecret } from '../auth'
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
