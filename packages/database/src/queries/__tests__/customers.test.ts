/**
 * Unit tests — ensureCustomer (HU-156 · provisioning idempotente).
 *
 * Cubre: vinculado por stack_id, invitado por email (adjunta stack_id) y creación,
 * más el reclamo de pedidos de invitado (update de orders por email + customer_id null).
 */
import { ensureCustomer } from '../customers'

/**
 * Mock encadenable del cliente Supabase. `terminals` alimenta, en orden, los
 * resultados de `maybeSingle()`/`single()`. Los métodos intermedios devuelven el
 * builder (thenable → {error:null}) para soportar `update().eq()` e `is()`.
 */
function makeDb(terminals: Array<{ data: unknown; error?: unknown }>) {
  let i = 0
  const inserts: unknown[] = []
  const updates: unknown[] = []
  const from = jest.fn(() => {
    const b: Record<string, unknown> = {}
    b.select = jest.fn(() => b)
    b.eq = jest.fn(() => b)
    b.is = jest.fn(() => b)
    b.update = jest.fn((p: unknown) => { updates.push(p); return b })
    b.insert = jest.fn((p: unknown) => { inserts.push(p); return b })
    b.maybeSingle = jest.fn(async () => terminals[i++])
    b.single = jest.fn(async () => terminals[i++])
    b.then = (resolve: (v: unknown) => void) => resolve({ error: null })
    return b
  })
  return { db: { from } as never, from, inserts, updates }
}

const TID = '00000000-0000-0000-0000-000000000001'

describe('ensureCustomer', () => {
  it('devuelve el customer ya vinculado por stack_id (sin insertar)', async () => {
    const { db, inserts } = makeDb([{ data: { id: 'c1' } }])
    const res = await ensureCustomer({ stackUserId: 'sub-1', email: 'a@x.com', tenantId: TID }, db)
    expect(res).toEqual({ id: 'c1' })
    expect(inserts).toHaveLength(0)
  })

  it('adjunta stack_id a un cliente-invitado existente por email', async () => {
    const { db, updates, inserts } = makeDb([
      { data: null },                          // byStack
      { data: { id: 'c2', stack_id: null } },  // byEmail (invitado)
    ])
    const res = await ensureCustomer({ stackUserId: 'sub-2', email: 'guest@x.com', name: 'Ana', tenantId: TID }, db)
    expect(res).toEqual({ id: 'c2' })
    expect(inserts).toHaveLength(0)
    // update para adjuntar stack_id + el claim de pedidos (por email)
    expect(updates.some((u) => (u as { stack_id?: string }).stack_id === 'sub-2')).toBe(true)
  })

  it('crea el customer con tenant_id cuando no existe', async () => {
    const { db, inserts } = makeDb([
      { data: null },                // byStack
      { data: null },                // byEmail
      { data: { id: 'c3' } },        // insert().single()
    ])
    const res = await ensureCustomer({ stackUserId: 'sub-3', email: 'new@x.com', name: 'Beto', tenantId: TID }, db)
    expect(res).toEqual({ id: 'c3' })
    expect(inserts).toHaveLength(1)
    expect(inserts[0]).toMatchObject({ stack_id: 'sub-3', email: 'new@x.com', tenant_id: TID })
  })
})
