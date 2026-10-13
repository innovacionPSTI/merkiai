/**
 * @jest-environment node
 */
/**
 * Integration tests — POST /api/webhooks/skydropx
 *
 * Payload format (PRO API):
 *   { event, data: { attributes: { tracking_number, workflow_status, ... } } }
 *
 * EVENT_STATUS_MAP in the route:
 *   shipment.delivered, shipment.exception, package.in_transit, etc.
 * WORKFLOW_STATUS_MAP:
 *   in_transit, out_for_delivery, delivered, exception, etc.
 *
 * HU-278: la ruta ahora (1) identifica el pedido/tenant por tracking_number,
 * (2) verifica la firma HMAC-SHA512 si el tenant tiene webhook_secret,
 * (3) aplica idempotencia y (4) actualiza la orden + email.
 */

import { NextRequest } from 'next/server'
import { createHmac } from 'crypto'

jest.mock('@merkiai/database', () => ({
  createServerClient: jest.fn(),
  resolveEmailConfig: jest.fn().mockResolvedValue(null), // sin email → skip
  resolveShippingCreds: jest.fn().mockResolvedValue(null), // sin secreto → sin verificación de firma
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
  return { mockSupabase, updateMock, eqMock, selectMock, singleMock, readEq }
}

function eventPayload(event: string, tracking: string, workflowStatus?: string) {
  return {
    event,
    data: {
      attributes: {
        tracking_number: tracking,
        ...(workflowStatus ? { workflow_status: workflowStatus } : {}),
      },
    },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockResolveShippingCreds.mockResolvedValue(null as never)
  mockMarkProcessed.mockResolvedValue({ duplicate: false })
})

// ─────────────────────────────────────────────
// Event mapping via EVENT_STATUS_MAP
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — event mapping', () => {
  const eventMappings = [
    { event: 'shipment.delivered',      expectedStatus: 'delivered' },
    { event: 'shipment.exception',      expectedStatus: 'exception' },
    { event: 'package.in_transit',      expectedStatus: 'shipped'   },
    { event: 'package.out_for_delivery',expectedStatus: 'shipped'   },
    { event: 'package.delivered',       expectedStatus: 'delivered' },
    { event: 'package.returned',        expectedStatus: 'exception' },
  ]

  eventMappings.forEach(({ event, expectedStatus }) => {
    it(`evento "${event}" → status "${expectedStatus}"`, async () => {
      const { mockSupabase, updateMock } = buildSupabaseMock()
      mockCreateServerClient.mockReturnValue(mockSupabase as never)

      const res = await POST(makeRequest(eventPayload(event, 'TRK-001-ABC')))
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.ok).toBe(true)
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: expectedStatus })
      )
    })
  })
})

// ─────────────────────────────────────────────
// Workflow status mapping (takes precedence)
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — workflow_status mapping', () => {
  const workflowMappings = [
    { workflow_status: 'in_transit',       expectedStatus: 'shipped'   },
    { workflow_status: 'out_for_delivery', expectedStatus: 'shipped'   },
    { workflow_status: 'delivered',        expectedStatus: 'delivered' },
    { workflow_status: 'exception',        expectedStatus: 'exception' },
  ]

  workflowMappings.forEach(({ workflow_status, expectedStatus }) => {
    it(`workflow_status "${workflow_status}" → "${expectedStatus}"`, async () => {
      const { mockSupabase, updateMock } = buildSupabaseMock()
      mockCreateServerClient.mockReturnValue(mockSupabase as never)

      const res = await POST(makeRequest(
        eventPayload('shipment.status.updated', 'TRK-WF-001', workflow_status)
      ))

      expect(res.status).toBe(200)
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: expectedStatus })
      )
    })
  })
})

// ─────────────────────────────────────────────
// Eventos desconocidos → ignorar
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — eventos ignorados', () => {
  it('evento desconocido → 200 sin actualizar la BD', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await POST(makeRequest(
      eventPayload('shipment.unknown_event', 'TRK-999')
    ))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.ok).toBe(true)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('sin tracking_number → 200 sin actualizar la BD', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await POST(makeRequest({ event: 'shipment.delivered', data: { attributes: {} } }))
    expect(res.status).toBe(200)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('pedido no encontrado → 200 sin actualizar la BD', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock(null, null) // orderRow null
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const res = await POST(makeRequest(eventPayload('shipment.delivered', 'TRK-NOPE')))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.warning).toBe('order_not_found')
    expect(updateMock).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// Firma (HMAC-SHA512) — solo si hay secreto configurado
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — verificación de firma', () => {
  const SECRET = 'whsec_test_123'
  const SKY_CREDS = { provider: 'skydropx', clientId: 'cid', clientSecret: 'sec', webhookSecret: SECRET }

  it('rechaza (401) firma inválida cuando hay secreto', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    mockResolveShippingCreds.mockResolvedValue(SKY_CREDS as never)

    const res = await POST(makeRequest(
      eventPayload('shipment.delivered', 'TRK-SIG'),
      { 'x-skydropx-signature': 'deadbeef' }
    ))
    expect(res.status).toBe(401)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('acepta firma válida cuando hay secreto', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    mockResolveShippingCreds.mockResolvedValue(SKY_CREDS as never)

    const body = eventPayload('shipment.delivered', 'TRK-SIG-OK')
    const raw = JSON.stringify(body)
    const sig = createHmac('sha512', SECRET).update(raw).digest('hex')

    const req = new NextRequest('http://localhost/api/webhooks/skydropx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-skydropx-signature': sig },
      body: raw,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(updateMock).toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// Idempotencia
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — idempotencia', () => {
  it('evento duplicado → 200 sin actualizar la BD', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    mockMarkProcessed.mockResolvedValue({ duplicate: true })

    const res = await POST(makeRequest(eventPayload('shipment.delivered', 'TRK-DUP')))
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.idempotent).toBe(true)
    expect(updateMock).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// Actualización por tracking_number
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — actualización de orden', () => {
  it('filtra por el tracking_number correcto del payload', async () => {
    const { mockSupabase, eqMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await POST(makeRequest(eventPayload('shipment.delivered', 'TRK-ABC-12345')))

    expect(eqMock).toHaveBeenCalledWith('tracking_number', 'TRK-ABC-12345')
  })

  it('incluye updated_at en la actualización', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await POST(makeRequest(eventPayload('shipment.delivered', 'TRK-XYZ')))

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ updated_at: expect.any(String) })
    )
  })
})

// ─────────────────────────────────────────────
// Error handling
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — manejo de errores', () => {
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
