/**
 * @jest-environment node
 */
/**
 * Unit tests — GET /api/maintenance-status
 *
 * Verifica que la ruta retorne maintenance_mode según store_config.
 */

import { GET } from '../maintenance-status/route'

const mockGetStoreConfig = jest.fn()

jest.mock('@vps/database', () => ({
  getStoreConfig: () => mockGetStoreConfig(),
}))

beforeEach(() => jest.clearAllMocks())

describe('GET /api/maintenance-status', () => {
  it('devuelve maintenance_mode: false cuando está desactivado', async () => {
    mockGetStoreConfig.mockResolvedValueOnce({ maintenance_mode: false })

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.maintenance_mode).toBe(false)
  })

  it('devuelve maintenance_mode: true cuando está activado', async () => {
    mockGetStoreConfig.mockResolvedValueOnce({ maintenance_mode: true })

    const res = await GET()
    const body = await res.json()

    expect(body.maintenance_mode).toBe(true)
  })

  it('devuelve maintenance_mode: false si la BD falla (fallback seguro)', async () => {
    mockGetStoreConfig.mockRejectedValueOnce(new Error('DB error'))

    // La ruta captura el error y responde 200 con maintenance_mode: false (fail-safe)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.maintenance_mode).toBe(false)
  })
})
