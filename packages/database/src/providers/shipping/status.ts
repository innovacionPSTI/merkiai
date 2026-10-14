/**
 * Normalización AGNÓSTICA de estados de envío (HU-282).
 *
 * Cada transportadora reporta sus propios códigos de tracking; aquí se mapean al
 * estado INTERNO canónico de la orden. Agregar un carrier = una entrada en
 * `SHIPMENT_STATUS_MAPS` (igual que el registry de proveedores). La ruta de
 * webhook de cada carrier solo llama a `normalizeShipmentStatus(provider, raw)`.
 */

/** Estado interno que un evento de tracking puede fijar en la orden. */
export type InternalShipmentStatus = 'shipped' | 'delivered' | 'exception'

/** Skydropx (enum oficial de tracking + variantes de envío/orden). */
const SKYDROPX: Record<string, InternalShipmentStatus> = {
  // Tracking oficial
  created: 'shipped', picked_up: 'shipped', in_transit: 'shipped',
  last_mile: 'shipped', delivery_attempt: 'shipped', delivered_to_branch: 'shipped',
  delivered: 'delivered',
  exception: 'exception', in_return: 'exception', canceled: 'exception',
  destroyed: 'exception', retained: 'exception',
  // Variantes de envío
  label_created: 'shipped', label_printed: 'shipped', out_for_delivery: 'shipped',
  returned: 'exception', cancelled: 'exception',
  // Órdenes (por si se suscribe esa sección)
  sent: 'shipped', partially_sent: 'shipped', fulfilled: 'delivered',
  // draft / verified / pending → se ignoran
}

/** Mapa por proveedor. Al integrar otro carrier, se agrega su entrada aquí. */
export const SHIPMENT_STATUS_MAPS: Record<string, Record<string, InternalShipmentStatus>> = {
  skydropx: SKYDROPX,
}

/**
 * Traduce el código de tracking crudo de un proveedor al estado interno, o null
 * si no corresponde a un cambio de estado (desconocido / previo al despacho).
 */
export function normalizeShipmentStatus(
  provider: string,
  raw: string | null | undefined,
): InternalShipmentStatus | null {
  if (!raw) return null
  const map = SHIPMENT_STATUS_MAPS[provider]
  return map?.[raw.toLowerCase()] ?? null
}
