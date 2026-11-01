/**
 * HU-194 · Estado del tenant y gate del panel (puro, sin dependencias).
 *
 * Mientras el cobro del SaaS es manual, la suspensión se aplica fijando
 * `status=suspended` (o `canceled`) en la consola. El panel se bloquea en esos
 * dos estados, espejo del gate del storefront. **Fail-open**: cualquier otro
 * estado, desconocido o nulo (p. ej. si el control-plane no responde) NO bloquea,
 * para nunca dejar a un operador fuera por un fallo de red.
 */
export function isTenantBlocked(status: string | null | undefined): boolean {
  return status === 'suspended' || status === 'canceled'
}
