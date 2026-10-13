/**
 * @jest-environment node
 */
/**
 * Integration tests — POST /api/webhooks/skydropx (sección "Envíos")
 *
 * Formato real (JSON:API):
 *   { data: { id, type, attributes: { status, tracking_number? } } }
 *   data.id = id del envío (= orders.skydropx_shipment_id)
 *
 * STATUS_MAP: in_transit/out_for_delivery/picked_up/label_* → shipped,
 *   delivered/fulfilled → delivered, exception/returned/cancelled → exception.
 *
 * HU-278: la ruta (1) identifica el pedido/tenant por skydropx_shipment_id (o
 * tracking_number), (2) autentica por token Bearer si está configurado,
 * (3) aplica idempotencia y (4) actualiza la orden + email.
 */

import { NextRequest } from 'next/server'

jest.mock('@merkiai/database', () => ({
  createServerClient: jest.fn(),
  resolveEmailConfig: jest.fn().mockResolvedValue(null), // sin email → skip
  resolveShippingCreds: jest.fn().mockResolvedValue(null), // sin token → sin verificación
  markWebhookEventProcessed: jest.fn().mockResolvedValue({ duplicate: false }),
}))
jest.mock('@/lib/machine-db', () => ({ getMachineDb: jest.fn(() => ({})) }))

import { createServerClient, resolveShippingCreds, markWebhookEventProcessed } from '@merkiai/database'
import { POST } from '../webhooks/skydropx/route'

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockResolveShippingCreds = resolveShippingCreds as jest.MockedFunction<typeof resolveShippingCreds>
const mockMarkProcessed = markWebhookEventProcessed as jest.MockedFunction<typeof markWebhookEventProcessed>

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function makeRequest(body: object, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/skydropx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

/**
 * Soporta las dos consultas de la ruta:
 *   lectura:  from().select().eq().maybeSingle()  → { tenant_id }
 *   update:   from().update().eq().select().single() → rowData
 */
function buildSupabaseMock(rowData: object | null = null, orderRow: object | null = { tenant_id: 't1' }) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: orderRow, error: null })
  const readEq      = jest.fn().mockReturnValue({ maybeSingle })
  const readSelect  = jest.fn().mockReturnValue({ eq: readEq })

  const singleMock  = jest.fn().mockResolvedValue({ data: rowData, error: null })
  const selectMock  = jest.fn().mockReturnValue({ single: singleMock })
  const eqMock      = jest.fn().mockReturnValue({ select: selectMock })
  const updateMock  = jest.fn().mockReturnValue({ eq: eqMock })

  const mockSupabase = {
    from: jest.fn().mockReturnValue({ select: readSelect, update: updateMock }),
  }
  return { mockSupabase, updateMock, eqMock, readEq, selectMock, singleMock }
}

/** Payload de la sección Envíos: data.id = shipment id. */
function shipmentPayload(shipmentId: string, status: string, tracking?: string) {
  return {
    data: {
      id: shipmentId,
      type: 'shipments',
      attributes: { status, ...(tracking ? { tracking_number: tracking } : {}) },
    },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockResolveShippingCreds.mockResolvedValue(null as never)
  mockMarkProcessed.mockResolvedValue({ duplicate: false })
})

// ─────────────────────────────────────────────
// Mapeo de estado
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — mapeo de estado', () => {
  const mappings = [
    { status: 'in_transit',       expected: 'shipped'   },
    { status: 'out_for_delivery', expected: 'shipped'   },
    { status: 'picked_up',        expected: 'shipped'   },
    { status: 'delivered',        expected: 'delivered' },
    { status: 'exception',        expected: 'exception' },
    { status: 'returned',         expected: 'exception' },
    { status: 'cancelled',        expected: 'exception' },
  ]

  mappings.forEach(({ status, expected }) => {
    it(`status "${status}" → order.status "${expected}"`, async () => {
      const { mockSupabase, updateMock } = buildSupabaseMock()
      mockCreateServerClient.mockReturnValue(mockSupabase as never)

      const res = await POST(makeRequest(shipmentPayload('SHIP-001', status)))
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ status: expected }))
    })
  })
})

// ─────────────────────────────────────────────
// Identificación del pedido
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — identificación del pedido', () => {
  it('filtra por skydropx_shipment_id cuando hay data.id', async () => {
    const { mockSupabase, eqMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await POST(makeRequest(shipmentPayload('SHIP-ABC-123', 'delivered')))

    expect(eqMock).toHaveBeenCalledWith('skydropx_shipment_id', 'SHIP-ABC-123')
  })

  it('cae a tracking_number cuando no hay data.id', async () => {
    const { mockSupabase, eqMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await POST(makeRequest({ data: { type: 'shipments', attributes: { status: 'delivered', tracking_number: 'TRK-9' } } }))

    expect(eqMock).toHaveBeenCalledWith('tracking_number', 'TRK-9')
  })

  it('incluye updated_at en la actualización', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await POST(makeRequest(shipmentPayload('SHIP-XYZ', 'delivered')))

    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ updated_at: expect.any(String) }))
  })
})

// ─────────────────────────────────────────────
// Eventos ignorados
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — ignorados', () => {
  it('status "draft" → 200 sin actualizar', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await POST(makeRequest(shipmentPayload('SHIP-DR', 'draft')))
    expect(res.status).toBe(200)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('sin id ni tracking → 200 sin actualizar', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await POST(makeRequest({ data: { type: 'shipments', attributes: { status: 'delivered' } } }))
    expect(res.status).toBe(200)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('pedido no encontrado → 200 warning', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock(null, null)
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await POST(makeRequest(shipmentPayload('SHIP-NOPE', 'delivered')))
    const data = await res.json()
    expect(data.warning).toBe('order_not_found')
    expect(updateMock).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// Autenticación por token (Bearer)
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — token', () => {
  const TOKEN = 'whtok_test_abc123'
  const CREDS = { provider: 'skydropx', clientId: 'cid', clientSecret: 'sec', webhookToken: TOKEN }

  it('rechaza (401) token inválido cuando está configurado', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    mockResolveShippingCreds.mockResolvedValue(CREDS as never)

    const res = await POST(makeRequest(shipmentPayload('SHIP-T', 'delivered'), { authorization: 'Bearer wrong' }))
    expect(res.status).toBe(401)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('acepta token válido (Bearer)', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    mockResolveShippingCreds.mockResolvedValue(CREDS as never)

    const res = await POST(makeRequest(shipmentPayload('SHIP-OK', 'delivered'), { authorization: `Bearer ${TOKEN}` }))
    expect(res.status).toBe(200)
    expect(updateMock).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// Idempotencia
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — idempotencia', () => {
  it('evento duplicado → 200 sin actualizar', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    mockMarkProcessed.mockResolvedValue({ duplicate: true })

    const res = await POST(makeRequest(shipmentPayload('SHIP-DUP', 'delivered')))
    const data = await res.json()
    expect(data.idempotent).toBe(true)
    expect(updateMock).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// Errores
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — errores', () => {
  it('retorna 400 si el body no es JSON válido', async () => {
    const req = new NextRequest('http://localhost/api/webhooks/skydropx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json {{{',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
