/**
 * Guardas anti-fraude compartidas para las confirmaciones de pago.
 *
 * `amountCoversOrder`: comprueba que el valor realmente pagado (en COP) cubre el
 * total del pedido. Evita que una transacción por un monto menor al del pedido lo
 * marque como pagado (subpago). Si no hay dato de monto, NO bloquea: se apoya en
 * la firma / re-consulta autenticada de cada pasarela.
 */
export function amountCoversOrder(paidCop: number | null | undefined, orderTotalCop: number): boolean {
  if (paidCop == null || !Number.isFinite(paidCop)) return true
  // Tolera 1 COP de redondeo (algunas pasarelas devuelven decimales).
  return Math.round(paidCop) + 1 >= orderTotalCop
}
