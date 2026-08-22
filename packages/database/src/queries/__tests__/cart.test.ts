/**
 * Unit tests — cart queries (replaceCart).
 *
 * Foco: replaceCart borra el carrito y hace UPSERT deduplicando por variant_id.
 * Regresión del error 23505 (unique customer_id,variant_id): el payload del cliente
 * puede traer el mismo variant repetido; sin dedup, el insert reventaba.
 */

import { replaceCart } from '../cart'
import { createServerClient } from '../../client'
import type { UpsertCartItemInput } from '../cart'

jest.mock('../../client')
const mockCreateServerClient = createServerClient as jest.MockedFunction<typeof createServerClient>

function row(variant_id: number, qty: number): UpsertCartItemInput {
  return {
    customer_id: 'cust-1',
    variant_id,
    product_id: variant_id * 10,
    product_name: `Producto ${variant_id}`,
    variant_label: 'Variante',
    qty,
    price: 1000,
  }
}

function setupMock() {
  const deleteEq = jest.fn().mockResolvedValue({ error: null })
  const upsert = jest.fn().mockResolvedValue({ error: null })
  const from = jest.fn(() => ({
    delete: jest.fn(() => ({ eq: deleteEq })),
    upsert,
  }))
  mockCreateServerClient.mockReturnValue({ from } as never)
  return { from, deleteEq, upsert }
}

beforeEach(() => jest.clearAllMocks())

describe('replaceCart', () => {
  it('deduplica por variant_id sumando cantidades antes del upsert', async () => {
    const { upsert } = setupMock()
    await replaceCart('cust-1', [row(7, 1), row(7, 2), row(9, 1)])

    expect(upsert).toHaveBeenCalledTimes(1)
    const [rows, opts] = upsert.mock.calls[0]
    expect(rows).toHaveLength(2) // 7 fusionado, 9 aparte
    expect(rows.find((r: UpsertCartItemInput) => r.variant_id === 7)?.qty).toBe(3)
    expect(rows.find((r: UpsertCartItemInput) => r.variant_id === 9)?.qty).toBe(1)
    expect(opts).toEqual({ onConflict: 'customer_id,variant_id' })
  })

  it('borra el carrito actual antes de insertar', async () => {
    const { from, deleteEq } = setupMock()
    await replaceCart('cust-1', [row(1, 1)])
    expect(from).toHaveBeenCalledWith('cart_items')
    expect(deleteEq).toHaveBeenCalledWith('customer_id', 'cust-1')
  })

  it('con carrito vacío borra pero no hace upsert', async () => {
    const { upsert, deleteEq } = setupMock()
    await replaceCart('cust-1', [])
    expect(deleteEq).toHaveBeenCalled()
    expect(upsert).not.toHaveBeenCalled()
  })

  it('propaga el error del upsert', async () => {
    const deleteEq = jest.fn().mockResolvedValue({ error: null })
    const upsert = jest.fn().mockResolvedValue({ error: new Error('upsert failed') })
    mockCreateServerClient.mockReturnValue({
      from: jest.fn(() => ({ delete: jest.fn(() => ({ eq: deleteEq })), upsert })),
    } as never)
    await expect(replaceCart('cust-1', [row(1, 1)])).rejects.toThrow('upsert failed')
  })
})
