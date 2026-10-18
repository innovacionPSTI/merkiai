import { logAudit, listAudit } from '../audit'

describe('logAudit', () => {
  it('inserta con tenant, actor, acción y metadata (entity_id a texto)', async () => {
    const insert = jest.fn().mockResolvedValue({ error: null })
    const db = { from: jest.fn(() => ({ insert })) } as any
    await logAudit(db, {
      tenantId: 't1', actorEmail: 'a@x.com', actorRole: 'admin',
      action: 'order.status', entity: 'order', entityId: 42, summary: 'ok', metadata: { status: 'shipped' },
    })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      tenant_id: 't1', actor_email: 'a@x.com', actor_role: 'admin',
      action: 'order.status', entity: 'order', entity_id: '42', metadata: { status: 'shipped' },
    }))
  })

  it('no lanza si la BD falla (best-effort)', async () => {
    const db = { from: jest.fn(() => ({ insert: jest.fn().mockRejectedValue(new Error('boom')) })) } as any
    await expect(logAudit(db, { tenantId: 't1', action: 'x' })).resolves.toBeUndefined()
  })
})

describe('listAudit', () => {
  it('pagina con range, filtra por acción y devuelve total', async () => {
    const range = jest.fn().mockResolvedValue({ data: [{ id: 1 }], count: 3 })
    const eq = jest.fn().mockReturnValue({ range })
    const order = jest.fn().mockReturnValue({ eq, range })
    const select = jest.fn().mockReturnValue({ order })
    const db = { from: jest.fn(() => ({ select })) } as any

    const res = await listAudit(db, { action: 'data.export', limit: 10, offset: 20 })
    expect(select).toHaveBeenCalledWith('*', { count: 'exact' })
    expect(eq).toHaveBeenCalledWith('action', 'data.export')
    expect(range).toHaveBeenCalledWith(20, 29)
    expect(res).toEqual({ entries: [{ id: 1 }], total: 3 })
  })
})
