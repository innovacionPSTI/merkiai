import { makePreviewToken, verifyPreviewToken } from '../preview'

const SECRET = 'server-signing-secret'

describe('preview token por-tenant (HU-128)', () => {
  it('genera un token hex determinista por tenant', () => {
    const t = makePreviewToken('tenant-A', SECRET)
    expect(t).toMatch(/^[0-9a-f]{64}$/)
    expect(makePreviewToken('tenant-A', SECRET)).toBe(t) // determinista
  })

  it('tokens distintos por tenant', () => {
    expect(makePreviewToken('tenant-A', SECRET)).not.toBe(makePreviewToken('tenant-B', SECRET))
  })

  it('verifica el token de su propio tenant', () => {
    const t = makePreviewToken('tenant-A', SECRET)
    expect(verifyPreviewToken(t, 'tenant-A', SECRET)).toBe(true)
  })

  it('rechaza el token de otro tenant (aislamiento)', () => {
    const t = makePreviewToken('tenant-A', SECRET)
    expect(verifyPreviewToken(t, 'tenant-B', SECRET)).toBe(false)
  })

  it('rechaza sin secreto, sin token o con secreto distinto', () => {
    const t = makePreviewToken('tenant-A', SECRET)
    expect(verifyPreviewToken(t, 'tenant-A', undefined)).toBe(false)
    expect(verifyPreviewToken(null, 'tenant-A', SECRET)).toBe(false)
    expect(verifyPreviewToken(t, 'tenant-A', 'otro-secreto')).toBe(false)
  })
})
