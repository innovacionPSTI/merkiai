/**
 * @jest-environment node
 */
/**
 * Integration tests — POST /api/checkout
 *
 * Modelo de pasarela única (active_provider), espejo de envíos:
 *   - Validación de entrada (400 si faltan campos)
 *   - Modo manual: active_provider = 'none' → pedido 'manual' pendiente, sin payment_url
 *   - Happy path: usa la pasarela activa del servidor y retorna payment_url
 *   - SEGURIDAD: el `payment_method` del cliente se ignora; manda active_provider
 *   - Fallo de DB: retorna 500
 *
 * Se mockea @vps/database (getActiveProvider + getPaymentGateway) y @/stack.
 */

import { NextRequest } from 'next/server'

// Mock DB layer — debe ir antes de los imports
jest.mock('@vps/database', () => ({
  createOrder: jest.fn(),
  getPaymentConfig: jest.fn(),
  getPaymentGateway: jest.fn(),
  getActiveProvider: jest.fn(),
  getStockForVariants: jest.fn(),
  createServerClient: jest.fn(),
}))

// Corta la cadena de imports ESM de @stackframe/stack (jose, export-to-csv, otp…)
jest.mock('@/stack', () => ({
  stackServerApp: { getUser: jest.fn().mockResolvedValue(null) },
}))

import { createOrder, getPaymentConfig, getPaymentGateway, getActiveProvider, getStockForVariants } from '@vps/database'
import { POST } from '../checkout/route'

const mockCreateOrder = createOrder as jest.MockedFunction<typeof createOrder>
const mockGetPaymentConfig = getPaymentConfig as jest.MockedFunction<typeof getPaymentConfig>
const mockGetPaymentGateway = getPaymentGateway as jest.MockedFunction<typeof getPaymentGateway>
const mockGetActiveProvider = getActiveProvider as jest.MockedFunction<typeof getActiveProvider>
const mockGetStockForVariants = getStockForVariants as jest.MockedFunction<typeof getStockForVariants>

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────
// IP única por request: el route aplica rate limiting (10 req/min por IP).
let ipCounter = 0
function makeRequest(body: object): NextRequest {
  ipCounter++
  return new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `10.0.0.${ipCounter}` },
    body: JSON.stringify(body),
  })
}

const validBody = {
  email: 'juan@example.com',
  name: 'Juan Pérez',
  phone: '3001234567',
  address: { address: 'Calle 93 #15-10', city: 'Bogotá', department: 'Cundinamarca', postal_code: '110221' },
  items: [
    { variant_id: 10, product_name: 'Café Huila', variant_label: '500g · Claro', price: 45000, qty: 2 },
  ],
  subtotal: 90000,
  shipping_cost: 8000,
  total: 98000,
  // El cliente puede mandar payment_method, pero el servidor lo ignora.
  payment_method: 'wompi',
}

const wompiConfig = {
  id: 1,
  active_provider: 'wompi',
  wompi_public_key: 'pub_test_abc123',
  wompi_integrity_secret: 'test_integrity_secret',
  mercadopago_access_token: 'TEST-mp-abc123',
}
const mpConfig  = { id: 1, active_provider: 'mercadopago', mercadopago_access_token: 'TEST-mp-abc123' }
const boldConfig = { id: 1, active_provider: 'bold', bold_api_key: 'bk', bold_secret_key: 'sk' }
const noneConfig = { id: 1, active_provider: 'none' }

const WOMPI_PAYMENT_URL = 'https://checkout.wompi.co/p/?public-key=pub_test_abc123&reference=VPS-0042'
const MP_SANDBOX_URL    = 'https://sandbox.mercadopago.com.co/checkout/v1/redirect?pref_id=pref-123'

// Replica la lógica real de getActiveProvider (fail-closed).
function realActiveProvider(config: { active_provider?: string; wompi_public_key?: string | null; wompi_integrity_secret?: string | null; mercadopago_access_token?: string | null; tucompra_merchant_id?: string | null; tucompra_secret_key?: string | null; bold_api_key?: string | null; bold_secret_key?: string | null }): string {
  switch (config.active_provider) {
    case 'wompi':       return config.wompi_public_key && config.wompi_integrity_secret ? 'wompi' : 'none'
    case 'mercadopago': return config.mercadopago_access_token ? 'mercadopago' : 'none'
    case 'tucompra':    return config.tucompra_merchant_id && config.tucompra_secret_key ? 'tucompra' : 'none'
    case 'bold':        return config.bold_api_key && config.bold_secret_key ? 'bold' : 'none'
    default:            return 'none'
  }
}

// Gateway falso: createPaymentUrl resuelve la URL de la pasarela activa.
function fakeGatewayFactory(method: string) {
  const url = method === 'mercadopago' ? MP_SANDBOX_URL : WOMPI_PAYMENT_URL
  return { createPaymentUrl: jest.fn().mockResolvedValue(url) }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetPaymentConfig.mockResolvedValue(wompiConfig as never)
  mockGetActiveProvider.mockImplementation(realActiveProvider as never)
  mockGetPaymentGateway.mockImplementation(fakeGatewayFactory as never)
  mockGetStockForVariants.mockResolvedValue([]) // sin restricción de stock por defecto
})

// ─────────────────────────────────────────────
// Validación de entrada (400)
// ─────────────────────────────────────────────
describe('POST /api/checkout — validación', () => {
  it('retorna 400 si falta email', async () => {
    const res = await POST(makeRequest({ ...validBody, email: undefined }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toMatch(/incompleto/i)
  })

  it('retorna 400 si falta name', async () => {
    expect((await POST(makeRequest({ ...validBody, name: undefined }))).status).toBe(400)
  })

  it('retorna 400 si falta address', async () => {
    expect((await POST(makeRequest({ ...validBody, address: undefined }))).status).toBe(400)
  })

  it('retorna 400 si items es un arreglo vacío', async () => {
    expect((await POST(makeRequest({ ...validBody, items: [] }))).status).toBe(400)
  })

  it('retorna 400 si items está ausente', async () => {
    expect((await POST(makeRequest({ ...validBody, items: undefined }))).status).toBe(400)
  })
})

// ─────────────────────────────────────────────
// Stock (Épica 9)
// ─────────────────────────────────────────────
describe('POST /api/checkout — validación de stock', () => {
  it('retorna 409 si una variante no tiene stock suficiente y no permite backorder', async () => {
    mockGetStockForVariants.mockResolvedValueOnce([
      { variant_id: 10, stock: 1, allow_backorder: false },
    ])
    const res = await POST(makeRequest(validBody)) // qty 2 > stock 1
    expect(res.status).toBe(409)
    const data = await res.json()
    expect(data.items?.[0]).toMatchObject({ variant_id: 10, available: 1 })
    expect(mockCreateOrder).not.toHaveBeenCalled()
  })

  it('permite comprar sin stock si el producto tiene allow_backorder', async () => {
    mockGetStockForVariants.mockResolvedValueOnce([
      { variant_id: 10, stock: 0, allow_backorder: true },
    ])
    mockCreateOrder.mockResolvedValueOnce({ id: 1, order_number: 'VPS-0001' } as never)
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
  })
})

// ─────────────────────────────────────────────
// Modo manual (active_provider = 'none')
// ─────────────────────────────────────────────
describe('POST /api/checkout — sin pasarela activa (manual)', () => {
  beforeEach(() => {
    mockGetPaymentConfig.mockResolvedValue(noneConfig as never)
  })

  it('crea el pedido como manual, sin payment_url, con flag manual', async () => {
    mockCreateOrder.mockResolvedValueOnce({ id: 7, order_number: 'VPS-0007' } as never)

    const res = await POST(makeRequest(validBody))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.manual).toBe(true)
    expect(data.payment_url).toBeNull()
    expect(data.order_number).toBe('VPS-0007')
  })

  it('persiste payment_method = "manual"', async () => {
    mockCreateOrder.mockResolvedValueOnce({ id: 7, order_number: 'VPS-0007' } as never)

    await POST(makeRequest(validBody))

    expect(mockCreateOrder).toHaveBeenCalledWith(expect.objectContaining({ payment_method: 'manual' }))
  })

  it('NO invoca ninguna pasarela de pago', async () => {
    mockCreateOrder.mockResolvedValueOnce({ id: 7, order_number: 'VPS-0007' } as never)

    await POST(makeRequest(validBody))

    expect(mockGetPaymentGateway).not.toHaveBeenCalled()
  })
})

// ─────────────────────────────────────────────
// Happy path (200) — pasarela activa
// ─────────────────────────────────────────────
describe('POST /api/checkout — happy path', () => {
  it('retorna order_number, order_id y payment_url con Wompi activo', async () => {
    mockCreateOrder.mockResolvedValueOnce({ id: 42, order_number: 'VPS-0042', status: 'pending' } as never)

    const res = await POST(makeRequest(validBody))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.order_number).toBe('VPS-0042')
    expect(data.order_id).toBe(42)
    expect(data.payment_url).toBe(WOMPI_PAYMENT_URL)
  })

  it('persiste payment_method = pasarela activa (wompi)', async () => {
    mockCreateOrder.mockResolvedValueOnce({ id: 1, order_number: 'VPS-0001' } as never)

    await POST(makeRequest(validBody))

    expect(mockCreateOrder).toHaveBeenCalledWith(expect.objectContaining({ payment_method: 'wompi' }))
    expect(mockGetPaymentGateway).toHaveBeenCalledWith('wompi', expect.objectContaining({ active_provider: 'wompi' }))
  })

  it('usa shipping_cost = 0 si no se proporciona', async () => {
    mockCreateOrder.mockResolvedValueOnce({ id: 1, order_number: 'VPS-0001' } as never)

    await POST(makeRequest({ ...validBody, shipping_cost: undefined }))

    expect(mockCreateOrder).toHaveBeenCalledWith(expect.objectContaining({ shipping_cost: 0 }))
  })

  it('devuelve una URL sandbox de MercadoPago cuando es la pasarela activa', async () => {
    mockGetPaymentConfig.mockResolvedValueOnce(mpConfig as never)
    mockCreateOrder.mockResolvedValueOnce({ id: 5, order_number: 'VPS-0005' } as never)

    const res = await POST(makeRequest({ ...validBody, payment_method: 'mercadopago' }))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.payment_url).toContain('sandbox.mercadopago')
    expect(mockCreateOrder).toHaveBeenCalledWith(expect.objectContaining({ payment_method: 'mercadopago' }))
  })

  it('usa Bold cuando es la pasarela activa (payment_method = bold)', async () => {
    mockGetPaymentConfig.mockResolvedValueOnce(boldConfig as never)
    mockCreateOrder.mockResolvedValueOnce({ id: 6, order_number: 'VPS-0006' } as never)

    const res = await POST(makeRequest({ ...validBody, payment_method: 'wompi' })) // cliente miente
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.payment_url).toBeTruthy()
    expect(mockGetPaymentGateway).toHaveBeenCalledWith('bold', expect.objectContaining({ active_provider: 'bold' }))
    expect(mockCreateOrder).toHaveBeenCalledWith(expect.objectContaining({ payment_method: 'bold' }))
  })
})

// ─────────────────────────────────────────────
// SEGURIDAD — el método del cliente NO manda
// ─────────────────────────────────────────────
describe('POST /api/checkout — seguridad (no bypass de pasarela)', () => {
  it('ignora el payment_method del cliente y usa la pasarela activa del servidor', async () => {
    // Servidor activo = wompi; el cliente intenta forzar mercadopago
    mockGetPaymentConfig.mockResolvedValue(wompiConfig as never)
    mockCreateOrder.mockResolvedValueOnce({ id: 9, order_number: 'VPS-0009' } as never)

    await POST(makeRequest({ ...validBody, payment_method: 'mercadopago' }))

    // Se usa wompi (activo en el servidor), NO mercadopago (enviado por el cliente)
    expect(mockGetPaymentGateway).toHaveBeenCalledWith('wompi', expect.anything())
    expect(mockCreateOrder).toHaveBeenCalledWith(expect.objectContaining({ payment_method: 'wompi' }))
  })

  it('con active_provider="none" ignora payment_method="wompi" del cliente y crea pedido manual', async () => {
    mockGetPaymentConfig.mockResolvedValue(noneConfig as never)
    mockCreateOrder.mockResolvedValueOnce({ id: 10, order_number: 'VPS-0010' } as never)

    const res = await POST(makeRequest({ ...validBody, payment_method: 'wompi' }))
    const data = await res.json()

    expect(data.manual).toBe(true)
    expect(mockGetPaymentGateway).not.toHaveBeenCalled()
    expect(mockCreateOrder).toHaveBeenCalledWith(expect.objectContaining({ payment_method: 'manual' }))
  })
})

// ─────────────────────────────────────────────
// shipping_rate — transportadora elegida por el usuario
// ─────────────────────────────────────────────
describe('POST /api/checkout — shipping_rate', () => {
  it('pasa carrier_name y skydropx_rate_id a createOrder cuando se incluye shipping_rate', async () => {
    mockCreateOrder.mockResolvedValueOnce({ id: 1, order_number: 'VPS-0001' } as never)

    await POST(makeRequest({
      ...validBody,
      shipping_rate: { id: 'rate-abc123', carrier_name: 'Servientrega', service_name: 'Estándar', days: 3, total_price: 12000 },
    }))

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ skydropx_rate_id: 'rate-abc123', carrier_name: 'Servientrega' })
    )
  })

  it('pasa carrier_name=null cuando shipping_rate es null', async () => {
    mockCreateOrder.mockResolvedValueOnce({ id: 2, order_number: 'VPS-0002' } as never)

    await POST(makeRequest({ ...validBody, shipping_rate: null }))

    expect(mockCreateOrder).toHaveBeenCalledWith(
      expect.objectContaining({ skydropx_rate_id: null, carrier_name: null })
    )
  })
})

// ─────────────────────────────────────────────
// Errores internos (500 / 503)
// ─────────────────────────────────────────────
describe('POST /api/checkout — errores internos', () => {
  it('retorna 500 si createOrder lanza un error de DB', async () => {
    mockCreateOrder.mockRejectedValueOnce(new Error('Database connection failed'))

    const res = await POST(makeRequest(validBody))
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toMatch(/interno/i)
  })

  it('no expone detalles del error de DB al cliente', async () => {
    mockCreateOrder.mockRejectedValueOnce(new Error('Sensitive internal error with DB credentials'))

    const data = await (await POST(makeRequest(validBody))).json()
    expect(data.error).not.toContain('credentials')
  })

  it('retorna 503 si la factory de la pasarela activa lanza (defensivo)', async () => {
    mockGetPaymentGateway.mockImplementationOnce(() => { throw new Error('Wompi: faltan credenciales') })

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(503)
  })
})
