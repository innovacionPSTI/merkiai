/**
 * Tests unitarios — getAdminConfig / updateAdminConfig (HU-207: config por tenant)
 */

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'

// ── Mocks (get: select→eq→maybeSingle | update: upsert→select→single) ─────────
const mockMaybeSingle  = jest.fn()
const mockUpsertSingle = jest.fn()
const mockEq     = jest.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockSelect = jest.fn(() => ({ eq: mockEq }))
const mockUpsert = jest.fn((_payload: Record<string, unknown>, _opts?: unknown) => ({
  select: jest.fn(() => ({ single: mockUpsertSingle })),
}))
const mockFrom = jest.fn(() => ({ select: mockSelect, upsert: mockUpsert }))

jest.mock('../../client', () => ({
  createServerClient: () => ({ from: mockFrom }),
}))

import { getAdminConfig, updateAdminConfig } from '../admin-config'

describe('getAdminConfig', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns DB row when found', async () => {
    const row = { id: 1, tenant_id: DEFAULT_TENANT_ID, accent_color: '#4F46E5', sidebar_color: '#0F172A', updated_at: '2025-01-01' }
    mockMaybeSingle.mockResolvedValue({ data: row, error: null })

    const result = await getAdminConfig()
    expect(result.accent_color).toBe('#4F46E5')
    expect(mockEq).toHaveBeenCalledWith('tenant_id', DEFAULT_TENANT_ID)
  })

  it('returns DEFAULT_ADMIN_CONFIG when DB returns error', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const result = await getAdminConfig()
    expect(result.id).toBe(1)
    expect(result.accent_color).toBe('#4F46E5')
    expect(result.sidebar_color).toBe('#0F172A')
  })

  it('returns DEFAULT_ADMIN_CONFIG when data is null', async () => {
    mockMaybeSingle.mockResolvedValue({ data: null, error: null })
    const result = await getAdminConfig()
    expect(result.id).toBe(1)
  })
})

describe('updateAdminConfig', () => {
  beforeEach(() => jest.clearAllMocks())

  it('upserts por tenant y devuelve la config', async () => {
    const updated = { id: 1, tenant_id: DEFAULT_TENANT_ID, accent_color: '#FF0000', sidebar_color: '#0F172A', updated_at: '2025-06-01' }
    mockUpsertSingle.mockResolvedValue({ data: updated, error: null })

    const result = await updateAdminConfig({ accent_color: '#FF0000' })
    expect(result.accent_color).toBe('#FF0000')
    expect(mockFrom).toHaveBeenCalledWith('admin_config')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: DEFAULT_TENANT_ID, accent_color: '#FF0000' }),
      expect.objectContaining({ onConflict: 'tenant_id' }),
    )
  })

  it('throws on DB error', async () => {
    mockUpsertSingle.mockResolvedValue({ data: null, error: { message: 'constraint violation' } })
    await expect(updateAdminConfig({ sidebar_color: '#000' })).rejects.toMatchObject({ message: 'constraint violation' })
  })

  it('includes updated_at in upsert payload', async () => {
    mockUpsertSingle.mockResolvedValue({ data: { id: 1, tenant_id: DEFAULT_TENANT_ID, accent_color: '#4F46E5', sidebar_color: '#222', updated_at: '2025-06-01' }, error: null })
    await updateAdminConfig({ sidebar_color: '#222' })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ updated_at: expect.any(String) }),
      expect.objectContaining({ onConflict: 'tenant_id' }),
    )
  })
})
