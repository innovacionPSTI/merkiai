/**
 * @jest-environment node
 *
 * HU-227 — getMachineDb: fail-closed (exige secreto + tenantId).
 */
import { getMachineDb } from '../machine-db'

describe('getMachineDb (HU-227)', () => {
  const OLD = { ...process.env }
  afterEach(() => { process.env = { ...OLD } })

  it('lanza si falta SUPABASE_JWT_SECRET (no degrada a service-role)', () => {
    delete process.env.SUPABASE_JWT_SECRET
    expect(() => getMachineDb('t1')).toThrow(/SUPABASE_JWT_SECRET/)
  })

  it('lanza si falta tenantId', () => {
    process.env.SUPABASE_JWT_SECRET = 'x'.repeat(40)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://x.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'anon'
    expect(() => getMachineDb('')).toThrow(/tenantId/)
  })
})
