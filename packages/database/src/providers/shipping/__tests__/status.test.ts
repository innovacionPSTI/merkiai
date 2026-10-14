/**
 * HU-282 · normalizeShipmentStatus (capa agnóstica de estados de envío).
 */
import { normalizeShipmentStatus } from '../status'

describe('normalizeShipmentStatus', () => {
  it('mapea estados de tracking de skydropx al estado interno', () => {
    expect(normalizeShipmentStatus('skydropx', 'in_transit')).toBe('shipped')
    expect(normalizeShipmentStatus('skydropx', 'last_mile')).toBe('shipped')
    expect(normalizeShipmentStatus('skydropx', 'delivered')).toBe('delivered')
    expect(normalizeShipmentStatus('skydropx', 'exception')).toBe('exception')
    expect(normalizeShipmentStatus('skydropx', 'in_return')).toBe('exception')
    expect(normalizeShipmentStatus('skydropx', 'canceled')).toBe('exception')
  })

  it('es case-insensitive', () => {
    expect(normalizeShipmentStatus('skydropx', 'DELIVERED')).toBe('delivered')
  })

  it('devuelve null para estados previos al despacho / desconocidos', () => {
    expect(normalizeShipmentStatus('skydropx', 'draft')).toBeNull()
    expect(normalizeShipmentStatus('skydropx', 'verified')).toBeNull()
    expect(normalizeShipmentStatus('skydropx', 'desconocido')).toBeNull()
    expect(normalizeShipmentStatus('skydropx', '')).toBeNull()
    expect(normalizeShipmentStatus('skydropx', undefined)).toBeNull()
  })

  it('devuelve null para un proveedor sin mapa (aún no integrado)', () => {
    expect(normalizeShipmentStatus('otro_carrier', 'delivered')).toBeNull()
  })
})
