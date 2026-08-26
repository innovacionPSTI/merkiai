/**
 * @jest-environment node
 *
 * HU-156 — gate de `getRequestUserDb` (flujos con sesión).
 * Verifica la degradación segura: sin el flag / sin secreto → `undefined`
 * (la query usa su cliente server-role; no se activa RLS de comprador).
 */
import { getRequestUserDb } from '../tenant-db'

describe('getRequestUserDb · gate seguro (HU-156)', () => {
  const OLD = { ...process.env }
  afterEach(() => { process.env = { ...OLD } })

  it('devuelve undefined si SESSION_RLS_ENABLED != "true"', async () => {
    delete process.env.SESSION_RLS_ENABLED
    process.env.SUPABASE_JWT_SECRET = 'secreto'
    expect(await getRequestUserDb('user-1')).toBeUndefined()
  })

  it('devuelve undefined si falta SUPABASE_JWT_SECRET aunque el flag esté activo', async () => {
    process.env.SESSION_RLS_ENABLED = 'true'
    delete process.env.SUPABASE_JWT_SECRET
    expect(await getRequestUserDb('user-1')).toBeUndefined()
  })
})
