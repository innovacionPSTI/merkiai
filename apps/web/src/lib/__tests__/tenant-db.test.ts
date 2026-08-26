/**
 * @jest-environment node
 *
 * HU-156/157 — RLS obligatoria (fail-closed). Sin `SUPABASE_JWT_SECRET` no hay
 * degradación a service-role en el plano de tienda: las funciones lanzan.
 */
import { getRequestUserDb, getRequestCatalogDb } from '../tenant-db'

describe('RLS obligatoria · fail-closed', () => {
  const OLD = { ...process.env }
  afterEach(() => { process.env = { ...OLD } })

  it('getRequestUserDb lanza si falta SUPABASE_JWT_SECRET', async () => {
    delete process.env.SUPABASE_JWT_SECRET
    await expect(getRequestUserDb('user-1')).rejects.toThrow(/SUPABASE_JWT_SECRET/)
  })

  it('getRequestCatalogDb lanza si falta SUPABASE_JWT_SECRET', async () => {
    delete process.env.SUPABASE_JWT_SECRET
    await expect(getRequestCatalogDb()).rejects.toThrow(/SUPABASE_JWT_SECRET/)
  })
})
