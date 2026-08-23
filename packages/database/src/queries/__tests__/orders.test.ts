/**
 * Unit tests for orders query helpers.
 * Focus areas:
 *   - createOrder: número correlativo VPS-XXXX, campo status/payment_status por defecto
 *   - updateOrderStatus: merge con campos extra
 *   - getOrdersByCustomer: ordenamiento descendente
 *   - getOrderById: manejo de not-found
 */

import { createOrder, updateOrderStatus, getOrdersByCustomer, getOrdersByCustomerEmail, getOrderById } from '../orders'
import { createServerClient } from '../../client'
import type { CreateOrderInput } from '../orders'

jest.mock('../../client')
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────
const baseInput: CreateOrderInput = {
  customer_name: 'Carlos Martínez',
  customer_email: 'carlos@example.com',
  customer_phone: '3001234567',
  shipping_addr: {
    address: 'Calle 93 #15-10',
    city: 'Bogotá',
    department: 'Cundinamarca',
    postal_code: '110221',
  },
  items: [
    { variant_id: 10, product_name: 'Café Huila', variant_label: '500g · Claro', price: 45000, qty: 2 },
  ],
  subtotal: 90000,
  shipping_cost: 8000,
  total: 98000,
  payment_method: 'wompi',
}

function buildOrderMock(overrides = {}) {
  return {
    id: 1,
    order_number: 'VPS-0001',
    status: 'pending',
    payment_status: 'pending',
    discount: 0,
    ...baseInput,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

// ─────────────────────────────────────────────
// createOrder
// ─────────────────────────────────────────────
describe('createOrder', () => {
  // El número de orden lo genera el RPC `generate_order_number` (secuencia + prefijo
  // configurable). Aquí se mockea el RPC y la cadena de insert.
  function setupMock(createdOrder: { order_number: string } & Record<string, unknown>) {
    const singleMock = jest.fn().mockResolvedValue({ data: createdOrder, error: null })
    const insertMock = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({ single: singleMock }),
    })
    const rpcMock = jest.fn().mockResolvedValue({ data: createdOrder.order_number, error: null })
    const supabase = {
      rpc: rpcMock,
      from: jest.fn(() => ({ insert: insertMock })),
    }
    mockCreateServerClient.mockReturnValue(supabase as never)
    return { singleMock, insertMock, rpcMock }
  }

  it('genera el número de orden vía RPC generate_order_number', async () => {
    const expectedOrder = buildOrderMock({ order_number: 'VPS-0042' })
    const { rpcMock, insertMock } = setupMock(expectedOrder)

    const order = await createOrder(baseInput)
    expect(rpcMock).toHaveBeenCalledWith('generate_order_number')
    // El número devuelto por el RPC se usa como order_number del insert
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ order_number: 'VPS-0042' })
    )
    expect(order.order_number).toBe('VPS-0042')
  })

  it('lanza error si el RPC no devuelve número', async () => {
    const rpcMock = jest.fn().mockResolvedValue({ data: null, error: new Error('seq failed') })
    mockCreateServerClient.mockReturnValue({ rpc: rpcMock, from: jest.fn() } as never)
    await expect(createOrder(baseInput)).rejects.toThrow('seq failed')
  })

  it('asigna status "pending" y payment_status "pending" por defecto', async () => {
    setupMock(buildOrderMock())
    const order = await createOrder(baseInput)
    expect(order.status).toBe('pending')
    expect(order.payment_status).toBe('pending')
  })

  it('asigna discount = 0 si no se proporciona', async () => {
    const inputSinDescuento = { ...baseInput }
    delete (inputSinDescuento as CreateOrderInput & { discount?: number }).discount
    setupMock(buildOrderMock({ discount: 0 }))
    const order = await createOrder(inputSinDescuento)
    expect(order.discount).toBe(0)
  })

  it('aplica el descuento si se proporciona', async () => {
    const inputConDescuento = { ...baseInput, discount: 5000, total: 93000 }
    setupMock(buildOrderMock({ discount: 5000, total: 93000 }))
    const order = await createOrder(inputConDescuento)
    expect(order.discount).toBe(5000)
  })

  it('lanza error si Supabase falla al insertar', async () => {
    const rpcMock = jest.fn().mockResolvedValue({ data: 'VPS-0001', error: null })
    const supabase = {
      rpc: rpcMock,
      from: jest.fn(() => ({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: new Error('Insert failed') }),
          }),
        }),
      })),
    }
    mockCreateServerClient.mockReturnValue(supabase as never)
    await expect(createOrder(baseInput)).rejects.toThrow('Insert failed')
  })
})

// ─────────────────────────────────────────────
// updateOrderStatus
// ─────────────────────────────────────────────
describe('updateOrderStatus', () => {
  it('actualiza el status y el updated_at del pedido', async () => {
    const updatedOrder = buildOrderMock({ status: 'shipped' })
    const singleMock = jest.fn().mockResolvedValue({ data: updatedOrder, error: null })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({ single: singleMock }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const order = await updateOrderStatus(1, 'shipped')
    expect(order.status).toBe('shipped')
  })

  it('aplica campos extra (tracking_number, label_url)', async () => {
    const updatedOrder = buildOrderMock({
      status: 'shipped',
      tracking_number: 'TRK123456',
      label_url: 'https://cdn.skydropx.com/label.pdf',
    })
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: updatedOrder, error: null }),
        }),
      }),
    })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({ update: updateMock }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await updateOrderStatus(1, 'shipped', {
      tracking_number: 'TRK123456',
      label_url: 'https://cdn.skydropx.com/label.pdf',
    } as never)

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'shipped',
        tracking_number: 'TRK123456',
        label_url: 'https://cdn.skydropx.com/label.pdf',
      })
    )
  })

  it('lanza error si la orden no existe', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Row not found' },
              }),
            }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await expect(updateOrderStatus(9999, 'shipped')).rejects.toMatchObject({
      code: 'PGRST116',
    })
  })
})

// ─────────────────────────────────────────────
// getOrdersByCustomer
// ─────────────────────────────────────────────
describe('getOrdersByCustomer', () => {
  it('retorna los pedidos del cliente ordenados por fecha descendente', async () => {
    const orders = [
      buildOrderMock({ id: 2, order_number: 'VPS-0002', customer_id: 'user-abc' }),
      buildOrderMock({ id: 1, order_number: 'VPS-0001', customer_id: 'user-abc' }),
    ]
    const orderMock = jest.fn().mockResolvedValue({ data: orders, error: null })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ order: orderMock }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const result = await getOrdersByCustomer('user-abc')
    expect(result).toHaveLength(2)
    expect(result[0].order_number).toBe('VPS-0002')
    expect(orderMock).toHaveBeenCalledWith('created_at', { ascending: false })
  })

  it('retorna arreglo vacío si el cliente no tiene pedidos', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const result = await getOrdersByCustomer('user-sin-pedidos')
    expect(result).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// getOrdersByCustomerEmail — HU-060 (Tracking en Mi Cuenta)
// ─────────────────────────────────────────────
describe('getOrdersByCustomerEmail', () => {
  it('busca por email en minúsculas, ordena desc y expone la info de seguimiento', async () => {
    const orders = [
      buildOrderMock({ id: 2, order_number: 'VPS-0002', status: 'shipped', tracking_number: 'TRK-9', carrier_name: 'Servientrega' }),
      buildOrderMock({ id: 1, order_number: 'VPS-0001', status: 'delivered' }),
    ]
    const eqMock = jest.fn().mockReturnValue({
      order: jest.fn().mockResolvedValue({ data: orders, error: null }),
    })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({ select: jest.fn().mockReturnValue({ eq: eqMock }) }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const result = await getOrdersByCustomerEmail('Carlos@Example.com')

    // Email normalizado a minúsculas (los pedidos históricos se vinculan por email)
    expect(eqMock).toHaveBeenCalledWith('customer_email', 'carlos@example.com')
    expect(result).toHaveLength(2)
    expect(result[0].order_number).toBe('VPS-0002')
    // La vista de Mi Cuenta muestra el número de guía y la transportadora
    expect(result[0].tracking_number).toBe('TRK-9')
    expect(result[0].carrier_name).toBe('Servientrega')
  })

  it('retorna arreglo vacío si el email no tiene pedidos', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ order: jest.fn().mockResolvedValue({ data: [], error: null }) }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    expect(await getOrdersByCustomerEmail('nadie@example.com')).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────
// getOrderById
// ─────────────────────────────────────────────
describe('getOrderById', () => {
  it('retorna el pedido con el id indicado', async () => {
    const mockOrder = buildOrderMock({ id: 5, order_number: 'VPS-0005' })
    const singleMock = jest.fn().mockResolvedValue({ data: mockOrder, error: null })
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({ single: singleMock }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    const order = await getOrderById(5)
    expect(order.id).toBe(5)
    expect(order.order_number).toBe('VPS-0005')
  })

  it('lanza error si el pedido no existe', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Row not found' },
            }),
          }),
        }),
      }),
    }
    mockCreateServerClient.mockReturnValue(mockSupabase as never)

    await expect(getOrderById(9999)).rejects.toMatchObject({ code: 'PGRST116' })
  })
})
