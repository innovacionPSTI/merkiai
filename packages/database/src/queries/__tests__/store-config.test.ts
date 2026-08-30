/**
 * Unit tests — getStoreConfig / updateStoreConfig (HU-207: config por tenant)
 *
 *   getStoreConfig → happy path, fallback a DEFAULT_CONFIG, error BD, filtro tenant_id
 *   updateStoreConfig → upsert por tenant_id, updated_at, lanza si la BD falla
 */

import { getStoreConfig, updateStoreConfig } from '../store-config'

const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001'

// ─── Mock del cliente Supabase (select→eq→maybeSingle | upsert→select→single) ──
const mockMaybeSingle = jest.fn()
const mockEq = jest.fn(() => ({ maybeSingle: mockMaybeSingle }))
const mockSelect = jest.fn(() => ({ eq: mockEq }))
const mockUpsertChain = jest.fn()
const mockUpsertSelect = jest.fn(() => ({ single: mockUpsertChain }))
const mockUpsert = jest.fn((_payload: Record<string, unknown>, _opts?: unknown) => ({ select: mockUpsertSelect }))
const mockFrom = jest.fn(() => ({ select: mockSelect, upsert: mockUpsert }))

jest.mock('../../client', () => ({
  createServerClient: jest.fn(() => ({ from: mockFrom })),
}))

beforeEach(() => jest.clearAllMocks())

const fullConfig = {
  id: 1,
  tenant_id: DEFAULT_TENANT_ID,
  whatsapp_number: '573001234567',
  store_name: 'Merkiai',
  store_email: 'info@tienda.example.com',
  logo_url: 'https://example.com/logo.png',
  resend_api_key: null,
  resend_from_email: 'pedidos@tienda.example.com',
  terms_content: null,
  privacy_content: null,
  instagram_url: null,
  instagram_enabled: true,
  facebook_url: null,
  facebook_enabled: true,
  tiktok_url: null,
  tiktok_enabled: true,
  updated_at: '2026-07-09T00:00:00.000Z',
}

describe('getStoreConfig', () => {
  it('devuelve el registro cuando la BD responde correctamente', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: fullConfig, error: null })
    const result = await getStoreConfig()
    expect(result.whatsapp_number).toBe('573001234567')
    expect(result.logo_url).toBe('https://example.com/logo.png')
    expect(result.store_name).toBe('Merkiai')
  })

  it('devuelve DEFAULT_CONFIG cuando la BD devuelve error', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'table not found' } })
    const result = await getStoreConfig()
    expect(result.id).toBe(1)
    expect(result.store_name).toBe('Mi Tienda')
    expect(result.order_prefix).toBe('ORD')
    expect(result.whatsapp_number).toBeNull()
    expect(result.logo_url).toBeNull()
  })

  it('devuelve DEFAULT_CONFIG cuando data es null (tabla vacía)', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null })
    const result = await getStoreConfig()
    expect(result.id).toBe(1)
    expect(result.whatsapp_number).toBeNull()
  })

  it('propaga si la promesa lanza (sin catch externo)', async () => {
    mockMaybeSingle.mockRejectedValueOnce(new Error('Network error'))
    await expect(getStoreConfig()).rejects.toThrow('Network error')
  })

  it('usa la tabla store_config', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: fullConfig, error: null })
    await getStoreConfig()
    expect(mockFrom).toHaveBeenCalledWith('store_config')
  })

  it('filtra por tenant_id (por defecto, el tenant por defecto)', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: fullConfig, error: null })
    await getStoreConfig()
    expect(mockEq).toHaveBeenCalledWith('tenant_id', DEFAULT_TENANT_ID)
  })

  it('filtra por el tenant indicado', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: fullConfig, error: null })
    await getStoreConfig(undefined, 'tenant-x')
    expect(mockEq).toHaveBeenCalledWith('tenant_id', 'tenant-x')
  })
})

describe('updateStoreConfig', () => {
  it('hace upsert por tenant_id con los campos provistos', async () => {
    mockUpsertChain.mockResolvedValueOnce({ data: { ...fullConfig, whatsapp_number: '573009999999' }, error: null })
    const result = await updateStoreConfig({ whatsapp_number: '573009999999' })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: DEFAULT_TENANT_ID, whatsapp_number: '573009999999' }),
      expect.objectContaining({ onConflict: 'tenant_id' }),
    )
    expect(result.whatsapp_number).toBe('573009999999')
  })

  it('incluye updated_at en el upsert', async () => {
    mockUpsertChain.mockResolvedValueOnce({ data: fullConfig, error: null })
    await updateStoreConfig({ store_name: 'Merkiai Nuevo' })
    const upsertArg = mockUpsert.mock.calls[0]![0]
    expect(upsertArg).toHaveProperty('updated_at')
    expect(typeof upsertArg.updated_at).toBe('string')
  })

  it('lanza el error de Supabase cuando el upsert falla', async () => {
    const dbError = { message: 'DB write error', code: '42P01' }
    mockUpsertChain.mockResolvedValueOnce({ data: null, error: dbError })
    await expect(updateStoreConfig({ store_name: 'X' })).rejects.toMatchObject(dbError)
  })

  it('reenvía order_prefix en el upsert (prefijo configurable del número de orden)', async () => {
    mockUpsertChain.mockResolvedValueOnce({ data: { ...fullConfig, order_prefix: 'SHOP' }, error: null })
    const result = await updateStoreConfig({ order_prefix: 'SHOP' })
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ tenant_id: DEFAULT_TENANT_ID, order_prefix: 'SHOP' }),
      expect.objectContaining({ onConflict: 'tenant_id' }),
    )
    expect(result.order_prefix).toBe('SHOP')
  })

  it('actualiza solo logo_url sin afectar otros campos', async () => {
    const updated = { ...fullConfig, logo_url: 'https://example.com/new-logo.png' }
    mockUpsertChain.mockResolvedValueOnce({ data: updated, error: null })
    const result = await updateStoreConfig({ logo_url: 'https://example.com/new-logo.png' })
    expect(result.logo_url).toBe('https://example.com/new-logo.png')
    const upsertArg = mockUpsert.mock.calls[0]![0]
    expect(upsertArg).not.toHaveProperty('whatsapp_number')
  })

  it('guarda terms_content y privacy_content en Markdown', async () => {
    const legalConfig = {
      ...fullConfig,
      terms_content: '## Términos\n\nEsto es un ejemplo.',
      privacy_content: '## Privacidad\n\nDatos protegidos.',
    }
    mockUpsertChain.mockResolvedValueOnce({ data: legalConfig, error: null })
    const result = await updateStoreConfig({
      terms_content: '## Términos\n\nEsto es un ejemplo.',
      privacy_content: '## Privacidad\n\nDatos protegidos.',
    })
    expect(result.terms_content).toContain('## Términos')
  })
})
