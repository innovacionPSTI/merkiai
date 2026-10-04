/**
 * @jest-environment node
 */
let cookieValue: string | undefined
jest.mock('next/headers', () => ({
  cookies: jest.fn(async () => ({ get: (_n: string) => (cookieValue === undefined ? undefined : { value: cookieValue }) })),
}))
const mockResolveTenant = jest.fn()
jest.mock('@/lib/tenant-context', () => ({ resolveTenant: () => mockResolveTenant() }))

import { makePreviewToken } from '@merkiai/database'
import { isPreviewMode } from '../preview'

const SECRET = 'preview-secret'
const OLD = process.env.PREVIEW_SIGNING_SECRET
beforeAll(() => { process.env.PREVIEW_SIGNING_SECRET = SECRET })
afterAll(() => { process.env.PREVIEW_SIGNING_SECRET = OLD })
beforeEach(() => { cookieValue = undefined; mockResolveTenant.mockResolvedValue({ tenantId: 'tenant-A' }) })

describe('isPreviewMode — la cookie lleva el token y se re-verifica (HU-128/seguridad)', () => {
  it('token válido del tenant del Host → true', async () => {
    cookieValue = makePreviewToken('tenant-A', SECRET)
    expect(await isPreviewMode()).toBe(true)
  })

  it('cookie forjada "=1" → false (no basta poner la cookie a mano)', async () => {
    cookieValue = '1'
    expect(await isPreviewMode()).toBe(false)
  })

  it('token de OTRO tenant en este Host → false (aislamiento)', async () => {
    cookieValue = makePreviewToken('tenant-B', SECRET)
    expect(await isPreviewMode()).toBe(false)
  })

  it('sin cookie → false', async () => {
    cookieValue = undefined
    expect(await isPreviewMode()).toBe(false)
  })
})
