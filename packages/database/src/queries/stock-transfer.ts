/**
 * queries/stock-transfer.ts — Transferencias de inventario entre ubicaciones
 * (E18·HU-181). Una transferencia son **dos movimientos** en el libro: una salida
 * (`transfer` out) en la ubicación origen y una entrada (`transfer` in) en la
 * destino, por la misma cantidad. Idempotente por `op_key` (`transfer:<id>:out|in`).
 *
 * `planTransferMovements` es **puro**. `recordTransfer` valida (origen≠destino,
 * cantidad > 0, disponible suficiente en origen) y anexa las dos piernas.
 */
import type { Db } from '../client'
import { recordMovement, getAvailable, type MovementDirection } from './stock-movements'
import { toBase } from './uom'

export interface TransferLeg { direction: MovementDirection; location_id: number }

/** Las dos piernas de una transferencia (salida origen + entrada destino). Puro. */
export function planTransferMovements(fromLocationId: number, toLocationId: number): TransferLeg[] {
  return [
    { direction: 'out', location_id: fromLocationId },
    { direction: 'in', location_id: toLocationId },
  ]
}

export interface TransferInput {
  tenant_id?: string
  transfer_id: string
  stock_item_id: number
  from_location_id: number
  to_location_id: number
  qty: number
  uom_id?: number | null
  uom_factor?: number
  reason?: string | null
}

/** Registra una transferencia (dos piernas, idempotente). Devuelve nº de movimientos nuevos. */
export async function recordTransfer(db: Db, input: TransferInput): Promise<{ applied: number }> {
  if (input.from_location_id === input.to_location_id) throw new Error('El origen y el destino deben ser distintos')
  if (!(input.qty > 0)) throw new Error('La cantidad debe ser mayor a cero')

  const qtyBase = toBase(input.qty, input.uom_factor ?? 1)
  const availableAtSource = await getAvailable(db, input.stock_item_id, input.from_location_id)
  if (qtyBase > availableAtSource) {
    throw new Error(`Disponible insuficiente en el origen (${availableAtSource})`)
  }

  const legs = planTransferMovements(input.from_location_id, input.to_location_id)
  let applied = 0
  for (const leg of legs) {
    const res = await recordMovement(db, {
      tenant_id: input.tenant_id,
      stock_item_id: input.stock_item_id,
      location_id: leg.location_id,
      movement_type: 'transfer',
      direction: leg.direction,
      qty: input.qty,
      uom_id: input.uom_id ?? null,
      uom_factor: input.uom_factor ?? 1,
      reason: input.reason ?? 'Transferencia entre ubicaciones',
      ref_type: 'transfer',
      ref_id: input.transfer_id,
      op_key: `transfer:${input.transfer_id}:${leg.direction}`,
    })
    if (!res.deduped) applied += 1
  }
  return { applied }
}
