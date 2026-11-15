/**
 * Países a los que vende la tienda (E28 · HU-468): los de sus mercados activos.
 * Fail-safe: Colombia (comportamiento histórico) si no hay mercados o la consulta falla.
 */
import { listMarkets, marketCountries } from '@merkiai/database'
import { getMachineDb } from './machine-db'

export async function storeCountries(tenantId: string): Promise<string[]> {
  try {
    return marketCountries(await listMarkets(getMachineDb(tenantId), tenantId))
  } catch {
    return ['CO']
  }
}
