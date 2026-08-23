/**
 * Integration tests — GET + PATCH /api/admin/payment-config
 *
 * Escenarios cubiertos:
 *   GET  → sin config en BD: devuelve estructura vacía con has_* = false
 *   GET  → con config: devuelve secrets enmascarados (••••last4) + flags has_*
 *   GET  → wompi_public_key no se enmascara (es público)
 *   PATCH → valida prefijo pub_ en wompi_public_key
 *   PATCH → secrets vacíos no sobreescriben existentes (delegado a updatePaymentConfig)
 *   PATCH → actualiza wompi_active y mercadopago_active
 *   PATCH → devuelve respuesta enmascarada igual que el GET
 *   PATCH → error de BD → 500
 *   GET  → error de BD → 500
 *
 * Mocks: @merkiai/database (getPaymentConfig, updatePaymentConfig)
 */

import { NextRequest } from 'next/server'

jest.mock('@merkiai/database', () => ({
  getPaymentConfig: jest.fn(),
  updatePaymentConfig: jest.fn(),
}))

import { getPaymentConfig, updatePaymentConfig } from '@merkiai/database'
import { GET, PATCH } from '../route'

const mockGet = getPaymentConfig as jest.MockedFunction<typeof getPaymentConfig>
const mockUpdate = updatePaymentConfig as jest.MockedFunction<typeof updatePaymentConfig>

// ── Fixtures ──────────────────────────────────
const fullConfig = {
  id: 1,
  active_provider: 'wompi',
  wompi_public_key: 'pub_test_abc123',
  wompi_private_key: 'prv_test_abc1234',      // last 4: 1234
  wompi_integrity_secret: 'test_int_secret56', // last 4: et56
  wompi_events_secret: 'test_events_secret78', // last 4: et78
  mercadopago_access_token: 'TEST-mp-token-99', // last 4: t-99
  mercadopago_public_key: 'TEST-pub-mp-key',
  tucompra_merchant_id: null,
  tucompra_secret_key: null,
  tucompra_sandbox: true,
  updated_at: new Date().toISOString(),
}

function makePatchRequest(body: object): NextRequest {
  return new NextRequest('http://localhost/api/admin/payment-config', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => jest.clearAllMocks())

// ─────────────────────────────────────────────
// GET
// ─────────────────────────────────────────────
describe('GET /api/admin/payment-config', () => {
  it('devuelve estructura vacía con has_* = false cuando no hay config en BD', async () => {
    mockGet.mockResolvedValueOnce(null)
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()

    expect(data.wompi_public_key).toBeNull()
    expect(data.active_provider).toBe('none')
    expect(data.has_wompi_private_key).toBe(false)
    expect(data.has_wompi_integrity_secret).toBe(false)
    expect(data.has_wompi_events_secret).toBe(false)
    expect(data.has_mercadopago_access_token).toBe(false)
    expect(data.has_tucompra_password).toBe(false)
  })

  it('enmascara wompi_private_key con ••••last4', async () => {
    mockGet.mockResolvedValueOnce(fullConfig as never)
    const res = await GET()
    const data = await res.json()

    // La clave privada tiene "1234" al final → debe aparecer ••••1234
    expect(data.wompi_private_key).toBe('••••1234')
  })

  it('enmascara wompi_integrity_secret correctamente', async () => {
    mockGet.mockResolvedValueOnce(fullConfig as never)
    const res = await GET()
    const data = await res.json()

    expect(data.wompi_integrity_secret).toMatch(/^••••/)
    expect(data.wompi_integrity_secret).not.toBe(fullConfig.wompi_integrity_secret)
  })

  it('devuelve wompi_public_key en texto plano (es una clave pública)', async () => {
    mockGet.mockResolvedValueOnce(fullConfig as never)
    const res = await GET()
    const data = await res.json()

    expect(data.wompi_public_key).toBe('pub_test_abc123')
  })

  it('devuelve has_wompi_private_key = true cuando existe', async () => {
    mockGet.mockResolvedValueOnce(fullConfig as never)
    const res = await GET()
    const data = await res.json()

    expect(data.has_wompi_private_key).toBe(true)
    expect(data.has_wompi_integrity_secret).toBe(true)
    expect(data.has_wompi_events_secret).toBe(true)
    expect(data.has_mercadopago_access_token).toBe(true)
  })

  it('devuelve has_* = false cuando los secrets son null', async () => {
    mockGet.mockResolvedValueOnce({
      ...fullConfig,
      wompi_private_key: null,
      wompi_integrity_secret: null,
      wompi_events_secret: null,
      mercadopago_access_token: null,
    } as never)
    const res = await GET()
    const data = await res.json()

    expect(data.has_wompi_private_key).toBe(false)
    expect(data.has_wompi_integrity_secret).toBe(false)
    expect(data.has_wompi_events_secret).toBe(false)
    expect(data.has_mercadopago_access_token).toBe(false)
  })

  it('retorna 500 si getPaymentConfig lanza', async () => {
    mockGet.mockRejectedValueOnce(new Error('DB error'))
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

// ─────────────────────────────────────────────
// PATCH
// ─────────────────────────────────────────────
describe('PATCH /api/admin/payment-config — validación', () => {
  it('retorna 400 si wompi_public_key no empieza con pub_', async () => {
    const req = makePatchRequest({ wompi_public_key: 'prv_test_xxx' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/pub_/)
  })

  it('acepta wompi_public_key que empieza con pub_test_', async () => {
    mockUpdate.mockResolvedValueOnce(fullConfig as never)
    const req = makePatchRequest({ wompi_public_key: 'pub_test_newkey' })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
  })

  it('acepta wompi_public_key que empieza con pub_prod_', async () => {
    mockUpdate.mockResolvedValueOnce({ ...fullConfig, wompi_public_key: 'pub_prod_xxx' } as never)
    const req = makePatchRequest({ wompi_public_key: 'pub_prod_xxx' })
    const res = await PATCH(req)
    expect(res.status).toBe(200)
  })

  it('retorna 400 si active_provider es un valor inválido', async () => {
    const req = makePatchRequest({ active_provider: 'paypal' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/inválido/i)
  })

  it('retorna 400 si se activa una pasarela sin credenciales completas', async () => {
    // La config actual no tiene credenciales de wompi
    mockGet.mockResolvedValueOnce({ ...fullConfig, active_provider: 'none', wompi_public_key: null, wompi_integrity_secret: null } as never)
    const req = makePatchRequest({ active_provider: 'wompi' })
    const res = await PATCH(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.missing).toContain('wompi_public_key')
    expect(data.missing).toContain('wompi_integrity_secret')
  })
})

describe('PATCH /api/admin/payment-config — proveedor activo', () => {
  it('activa una pasarela cuando las credenciales ya están guardadas', async () => {
    mockGet.mockResolvedValueOnce(fullConfig as never) // current ya tiene creds wompi
    mockUpdate.mockResolvedValueOnce({ ...fullConfig, active_provider: 'wompi' } as never)

    const res = await PATCH(makePatchRequest({ active_provider: 'wompi' }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ active_provider: 'wompi' }))
  })

  it('permite desactivar todo con active_provider = "none" (sin chequear credenciales)', async () => {
    mockUpdate.mockResolvedValueOnce({ ...fullConfig, active_provider: 'none' } as never)

    const res = await PATCH(makePatchRequest({ active_provider: 'none' }))
    expect(res.status).toBe(200)
    // 'none' no dispara validación de credenciales (no llama getPaymentConfig)
    expect(mockGet).not.toHaveBeenCalled()
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ active_provider: 'none' }))
  })

  it('la respuesta PATCH también enmascara los secrets', async () => {
    mockUpdate.mockResolvedValueOnce(fullConfig as never)
    const res = await PATCH(makePatchRequest({ mercadopago_public_key: 'TEST-x' }))
    const data = await res.json()

    expect(data.wompi_private_key).toMatch(/^••••/)
    expect(data.wompi_private_key).not.toBe(fullConfig.wompi_private_key)
    expect(data.has_wompi_private_key).toBe(true)
  })

  it('retorna 500 si updatePaymentConfig lanza', async () => {
    mockUpdate.mockRejectedValueOnce(new Error('DB error'))
    const res = await PATCH(makePatchRequest({ mercadopago_public_key: 'TEST-x' }))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })
})
