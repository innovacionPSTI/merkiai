/**
 * @jest-environment node
 */
/**
 * Integration tests — POST /api/webhooks/skydropx (sección "Envíos")
 *
 * Payload real (JSON:API, tipo "packages"):
 *   { data: { id, type: "packages", attributes: { status, tracking_number },
 *             relationships: { shipment: { data: { id } }, order: {...} } } }
 *   relationships.shipment.data.id = id del envío (= orders.skydropx_shipment_id)
 *
 * Autenticación por header Authorization:
 *   HMAC   → "HMAC <hex(hmac-sha512(secret, rawBody))>"
 *   Bearer → "Bearer <token>"
 */

import { NextRequest } from 'next/server'
import { createHmac } from 'crypto'

jest.mock('@merkiai/database', () => ({
  createServerClient: jest.fn(),
  resolveEmailConfig: jest.fn().mockResolvedValue(null),
  resolveShippingCreds: jest.fn().mockResolvedValue(null),
  markWebhookEventProcessed: jest.fn().mockResolvedValue({ duplicate: false }),
  // HU-282: normalización agnóstica de estados (capa compartida).
  normalizeShipmentStatus: (_p: string, raw?: string) => {
    const MAP: Record<string, string> = {
      in_transit: 'shipped', last_mile: 'shipped', picked_up: 'shipped', out_for_delivery: 'shipped',
      delivered: 'delivered', fulfilled: 'delivered',
      exception: 'exception', in_return: 'exception', canceled: 'exception', cancelled: 'exception', returned: 'exception',
    }
    return raw ? (MAP[raw.toLowerCase()] ?? null) : null
  },
}))
jest.mock('@/lib/machine-db', () => ({ getMachineDb: jest.fn(() => ({})) }))

import { createServerClient, resolveShippingCreds, markWebhookEventProcessed } from '@merkiai/database'
import { POST } from '../webhooks/skydropx/route'

const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>
const mockResolveShippingCreds = resolveShippingCreds as jest.MockedFunction<typeof resolveShippingCreds>
const mockMarkProcessed = markWebhookEventProcessed as jest.MockedFunction<typeof markWebhookEventProcessed>

function makeRequest(body: object, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/webhooks/skydropx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

/** Soporta: lectura from().select().{or|eq}().maybeSingle() y update from().update().{or|eq}().select().single() */
function buildSupabaseMock(rowData: object | null = null, orderRow: object | null = { tenant_id: 't1' }) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: orderRow, error: null })
  const readEq      = jest.fn().mockReturnValue({ maybeSingle })
  const readOr      = jest.fn().mockReturnValue({ maybeSingle })
  const readSelect  = jest.fn().mockReturnValue({ eq: readEq, or: readOr })

  const singleMock  = jest.fn().mockResolvedValue({ data: rowData, error: null })
  const selectMock  = jest.fn().mockReturnValue({ single: singleMock })
  const eqMock      = jest.fn().mockReturnValue({ select: selectMock })
  const orMock      = jest.fn().mockReturnValue({ select: selectMock })
  const updateMock  = jest.fn().mockReturnValue({ eq: eqMock, or: orMock })

  const mockSupabase = {
    from: jest.fn().mockReturnValue({ select: readSelect, update: updateMock }),
  }
  return { mockSupabase, updateMock, eqMock, orMock, readEq, readOr, selectMock, singleMock }
}

/** Payload de la sección Envíos: data.type=packages, shipment id en relationships. */
function packagePayload(opts: { packageId?: string; shipmentId?: string; status: string; tracking?: string }) {
  return {
    data: {
      id: opts.packageId ?? 'PKG-1',
      type: 'packages',
      attributes: { status: opts.status, ...(opts.tracking ? { tracking_number: opts.tracking } : {}) },
      relationships: {
        ...(opts.shipmentId ? { shipment: { data: { id: opts.shipmentId, type: 'shipments' } } } : {}),
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
// Mapeo de estado
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — mapeo de estado', () => {
  const mappings = [
    { status: 'in_transit', expected: 'shipped'   },
    { status: 'last_mile',  expected: 'shipped'   },
    { status: 'delivered',  expected: 'delivered' },
    { status: 'exception',  expected: 'exception' },
    { status: 'in_return',  expected: 'exception' },
    { status: 'canceled',   expected: 'exception' },
  ]
  mappings.forEach(({ status, expected }) => {
    it(`status "${status}" → "${expected}"`, async () => {
      const { mockSupabase, updateMock } = buildSupabaseMock()
      mockCreateServerClient.mockReturnValue(mockSupabase as never)
      const res = await POST(makeRequest(packagePayload({ shipmentId: 'SHIP-1', status })))
      expect(res.status).toBe(200)
      expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ status: expected }))
    })
  })
})

// ─────────────────────────────────────────────
// Identificación del pedido
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — identificación', () => {
  it('empareja por shipment_external_id (con fallback a skydropx_shipment_id)', async () => {
    const { mockSupabase, orMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    await POST(makeRequest(packagePayload({ shipmentId: 'SHIP-ABC', status: 'delivered' })))
    expect(orMock).toHaveBeenCalledWith(expect.stringContaining('shipment_external_id.eq.SHIP-ABC'))
    expect(orMock).toHaveBeenCalledWith(expect.stringContaining('skydropx_shipment_id.eq.SHIP-ABC'))
  })

  it('cae a tracking_number cuando no hay shipment id', async () => {
    const { mockSupabase, eqMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    await POST(makeRequest(packagePayload({ status: 'delivered', tracking: 'TRK-9' })))
    expect(eqMock).toHaveBeenCalledWith('tracking_number', 'TRK-9')
  })
})

// ─────────────────────────────────────────────
// Ignorados
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — ignorados', () => {
  it('status desconocido → 200 sin actualizar', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    const res = await POST(makeRequest(packagePayload({ shipmentId: 'SHIP-1', status: 'verified' })))
    expect(res.status).toBe(200)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('sin shipment id ni tracking → 200 sin actualizar', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    const res = await POST(makeRequest(packagePayload({ status: 'delivered' })))
    expect(res.status).toBe(200)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('pedido no encontrado → 200 warning', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock(null, null)
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    const res = await POST(makeRequest(packagePayload({ shipmentId: 'SHIP-NOPE', status: 'delivered' })))
    const data = await res.json()
    expect(data.warning).toBe('order_not_found')
    expect(updateMock).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// Autenticación HMAC
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — HMAC', () => {
  const SECRET = 'whsec_abc'
  const CREDS = { provider: 'skydropx', clientId: 'c', clientSecret: 's', webhookSecret: SECRET }

  it('acepta firma HMAC-SHA512 válida', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    mockResolveShippingCreds.mockResolvedValue(CREDS as never)

    const body = packagePayload({ shipmentId: 'SHIP-H', status: 'delivered' })
    const raw = JSON.stringify(body)
    const sig = createHmac('sha512', SECRET).update(raw).digest('hex')
    const req = new NextRequest('http://localhost/api/webhooks/skydropx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `HMAC ${sig}` },
      body: raw,
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(updateMock).toHaveBeenCalled()
  })

  it('rechaza (401) firma HMAC inválida', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    mockResolveShippingCreds.mockResolvedValue(CREDS as never)
    const res = await POST(makeRequest(packagePayload({ shipmentId: 'SHIP-H', status: 'delivered' }), { authorization: 'HMAC deadbeef' }))
    expect(res.status).toBe(401)
    expect(updateMock).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// Autenticación Bearer
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — Bearer', () => {
  const TOKEN = 'whtok_xyz'
  const CREDS = { provider: 'skydropx', clientId: 'c', clientSecret: 's', webhookToken: TOKEN }

  it('acepta token Bearer válido', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    mockResolveShippingCreds.mockResolvedValue(CREDS as never)
    const res = await POST(makeRequest(packagePayload({ shipmentId: 'SHIP-B', status: 'delivered' }), { authorization: `Bearer ${TOKEN}` }))
    expect(res.status).toBe(200)
    expect(updateMock).toHaveBeenCalled()
  })

  it('rechaza (401) token Bearer inválido', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    mockResolveShippingCreds.mockResolvedValue(CREDS as never)
    const res = await POST(makeRequest(packagePayload({ shipmentId: 'SHIP-B', status: 'delivered' }), { authorization: 'Bearer wrong' }))
    expect(res.status).toBe(401)
    expect(updateMock).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// Idempotencia + errores
// ─────────────────────────────────────────────
describe('POST /api/webhooks/skydropx — idempotencia y errores', () => {
  it('evento duplicado → 200 sin actualizar', async () => {
    const { mockSupabase, updateMock } = buildSupabaseMock()
    mockCreateServerClient.mockReturnValue(mockSupabase as never)
    mockMarkProcessed.mockResolvedValue({ duplicate: true })
    const res = await POST(makeRequest(packagePayload({ shipmentId: 'SHIP-D', status: 'delivered' })))
    const data = await res.json()
    expect(data.idempotent).toBe(true)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('400 si el body no es JSON válido', async () => {
    const req = new NextRequest('http://localhost/api/webhooks/skydropx', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: 'nope {{{',
    })
    expect((await POST(req)).status).toBe(400)
  })
})
