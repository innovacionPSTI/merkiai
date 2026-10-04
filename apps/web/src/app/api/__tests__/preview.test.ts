/**
 * @jest-environment node
 */
const mockCookieSet = jest.fn()
const mockCookieDelete = jest.fn()
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ set: mockCookieSet, delete: mockCookieDelete })),
}))
jest.mock('@/lib/tenant-context', () => ({ resolveTenant: jest.fn(async () => ({ tenantId: 'tenant-A' })) }))

import { NextRequest } from 'next/server'
import { makePreviewToken } from '@merkiai/database'
import { GET, DELETE } from '../preview/route'

const SECRET = 'test-preview-secret'
const OLD = process.env.PREVIEW_SIGNING_SECRET
beforeAll(() => { process.env.PREVIEW_SIGNING_SECRET = SECRET })
afterAll(() => { process.env.PREVIEW_SIGNING_SECRET = OLD })
beforeEach(() => jest.clearAllMocks())

function req(params: Record<string, string>) {
  const url = new URL('http://tienda-a.merkiai.com/api/preview')
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  return new NextRequest(url.toString())
}

describe('GET /api/preview (HU-128)', () => {
  it('token válido del tenant → cookie con el TOKEN + redirect al path (mismo host)', async () => {
    const token = makePreviewToken('tenant-A', SECRET)
    const res = await GET(req({ token, path: '/blog/mi-post' }))
    // La cookie guarda el token (no '1') para re-verificarlo en cada request.
    expect(mockCookieSet).toHaveBeenCalledWith('__merkiai_preview', token, expect.objectContaining({ httpOnly: true }))
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://tienda-a.merkiai.com/blog/mi-post')
  })

  it('token de otro tenant → 401 (aislamiento)', async () => {
    const otherToken = makePreviewToken('tenant-B', SECRET)
    const res = await GET(req({ token: otherToken }))
    expect(res.status).toBe(401)
    expect(mockCookieSet).not.toHaveBeenCalled()
  })

  it('path externo se ignora → redirige a /', async () => {
    const token = makePreviewToken('tenant-A', SECRET)
    const res = await GET(req({ token, path: 'https://evil.com' }))
    expect(res.headers.get('location')).toBe('http://tienda-a.merkiai.com/')
  })
})

describe('DELETE /api/preview', () => {
  it('borra la cookie de preview', async () => {
    const res = await DELETE()
    expect(mockCookieDelete).toHaveBeenCalledWith('__merkiai_preview')
    expect(res.status).toBe(200)
  })
})
