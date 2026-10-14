import { validateReturn, createReturn, setReturnStatus, getReturnsForOrder } from '../returns'

describe('validateReturn', () => {
  const ok = { order_id: 1, order_number: 'ORD-1', reason: 'defectuoso' }
  it('acepta payload válido', () => { expect(validateReturn(ok)).toBeNull() })
  it('exige order_id y order_number', () => {
    expect(validateReturn({ ...ok, order_id: 0 })).toMatch(/pedido/i)
    expect(validateReturn({ ...ok, order_number: ' ' })).toMatch(/número/i)
  })
  it('rechaza motivo muy largo', () => {
    expect(validateReturn({ ...ok, reason: 'x'.repeat(501) })).toMatch(/largo/i)
  })
})

describe('createReturn', () => {
  it('inserta con tenant, estado requested y campos normalizados', async () => {
    const single = jest.fn().mockResolvedValue({ data: { id: 9 }, error: null })
    const select = jest.fn().mockReturnValue({ single })
    const insert = jest.fn().mockReturnValue({ select })
    const db = { from: jest.fn(() => ({ insert })) } as any
    const res = await createReturn(db, { order_id: 5, order_number: ' ORD-5 ', reason: ' roto ', note: null }, 't1')
    expect(res).toEqual({ ok: true, id: 9 })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      tenant_id: 't1', order_id: 5, order_number: 'ORD-5', reason: 'roto', status: 'requested',
    }))
  })
})

describe('setReturnStatus', () => {
  function dbUpdate(returnRow: unknown) {
    const single = jest.fn().mockResolvedValue({ data: returnRow, error: null })
    const select = jest.fn().mockReturnValue({ single })
    const eq = jest.fn().mockReturnValue({ select })
    const update = jest.fn().mockReturnValue({ eq })
    return { db: { from: jest.fn(() => ({ update })) } as any, update }
  }

  it('aprueba con restock → marca restocked y resolved_at', async () => {
    const { db, update } = dbUpdate({ id: 1, status: 'approved', order_number: 'ORD-1', restocked: true })
    const res = await setReturnStatus(db, 1, 'approved', { restocked: true })
    expect(res.ok).toBe(true)
    const patch = update.mock.calls[0][0]
    expect(patch).toMatchObject({ status: 'approved', restocked: true })
    expect(patch.resolved_at).toEqual(expect.any(String))
  })

  it('rechaza sin restocked', async () => {
    const { db, update } = dbUpdate({ id: 2, status: 'rejected', order_number: 'ORD-2' })
    await setReturnStatus(db, 2, 'rejected')
    expect(update.mock.calls[0][0]).not.toHaveProperty('restocked')
  })
})

describe('getReturnsForOrder', () => {
  it('filtra por order y ordena desc', async () => {
    const order = jest.fn().mockResolvedValue({ data: [{ id: 1 }] })
    const eq = jest.fn().mockReturnValue({ order })
    const select = jest.fn().mockReturnValue({ eq })
    const db = { from: jest.fn(() => ({ select })) } as any
    const res = await getReturnsForOrder(db, 7)
    expect(eq).toHaveBeenCalledWith('order_id', 7)
    expect(res).toEqual([{ id: 1 }])
  })
})
