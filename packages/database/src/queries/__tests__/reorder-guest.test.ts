import { getOrderForGuest } from '../orders'
import { getVariantsForCart } from '../products'

describe('getOrderForGuest (HU-150)', () => {
  function dbWith(result: { data: unknown; error?: unknown }) {
    const maybeSingle = jest.fn().mockResolvedValue({ data: result.data, error: result.error ?? null })
    const eq3 = jest.fn().mockReturnValue({ maybeSingle })
    const eq2 = jest.fn().mockReturnValue({ eq: eq3 })
    const eq1 = jest.fn().mockReturnValue({ eq: eq2 })
    const select = jest.fn().mockReturnValue({ eq: eq1 })
    return { db: { from: jest.fn(() => ({ select })) } as any, eq1, eq2, eq3 }
  }

  it('null si falta número o email (no toca BD)', async () => {
    const { db } = dbWith({ data: null })
    expect(await getOrderForGuest(db, '', 'a@b.com', 't1')).toBeNull()
    expect(await getOrderForGuest(db, 'ORD-1', '  ', 't1')).toBeNull()
    expect(db.from).not.toHaveBeenCalled()
  })

  it('normaliza email, filtra por tenant/número/email y devuelve subset seguro', async () => {
    const { db, eq1, eq2, eq3 } = dbWith({
      data: {
        order_number: 'ORD-0042', status: 'shipped', payment_status: 'approved',
        created_at: '2026-01-01', tracking_number: 'TRK', carrier_name: 'Serv',
        items: [{ product_name: 'Cafe', variant_label: 'Medio', qty: 2, price: 1000 }], total: 50000,
      },
    })
    const res = await getOrderForGuest(db, '  ORD-0042 ', ' ANA@X.com ', 't1')
    expect(eq1).toHaveBeenCalledWith('tenant_id', 't1')
    expect(eq2).toHaveBeenCalledWith('order_number', 'ORD-0042')
    expect(eq3).toHaveBeenCalledWith('customer_email', 'ana@x.com')
    expect(res).toEqual({
      order_number: 'ORD-0042', status: 'shipped', payment_status: 'approved', created_at: '2026-01-01',
      tracking_number: 'TRK', carrier_name: 'Serv',
      items: [{ product_name: 'Cafe', variant_label: 'Medio', qty: 2 }], total: 50000,
    })
    // No expone price por ítem ni campos sensibles.
    expect((res!.items[0] as Record<string, unknown>).price).toBeUndefined()
  })

  it('null si no coincide (data vacío)', async () => {
    const { db } = dbWith({ data: null })
    expect(await getOrderForGuest(db, 'ORD-9', 'a@b.com', 't1')).toBeNull()
  })
})

describe('getVariantsForCart (HU-112)', () => {
  it('[] sin ids válidos', async () => {
    const db = { from: jest.fn() } as any
    expect(await getVariantsForCart(db, [])).toEqual([])
  })

  it('mapea variantes activas con datos del producto', async () => {
    const data = [
      { id: 10, price: 5000, stock: 3, active: true, image_url: null, weight: '500g', weight_kg: 0.5, length_cm: null, width_cm: null, height_cm: null,
        products: { id: 1, slug: 'cafe', name: 'Cafe', active: true, allow_backorder: false, images: [{ url: 'c.jpg' }] } },
    ]
    const eq = jest.fn().mockResolvedValue({ data })
    const inMock = jest.fn().mockReturnValue({ eq })
    const select = jest.fn().mockReturnValue({ in: inMock })
    const db = { from: jest.fn(() => ({ select })) } as any

    const res = await getVariantsForCart(db, [10, 10])
    expect(res).toHaveLength(1)
    expect(res[0]).toMatchObject({ variant_id: 10, product_id: 1, slug: 'cafe', price: 5000, stock: 3, allow_backorder: false, image_url: 'c.jpg' })
  })
})
