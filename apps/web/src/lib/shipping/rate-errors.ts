/**
 * Traduce un error del proveedor de envíos (Skydropx) a un mensaje amigable para
 * el cliente (sin filtrar detalles técnicos) y un status HTTP adecuado.
 * El SkydropxProvider lanza mensajes del tipo: "... failed: 422 — {json}".
 */
export function humanizeShippingError(err: unknown): { message: string; status: number } {
  const raw = err instanceof Error ? err.message : String(err)
  const match = raw.match(/(\d{3})\s*—\s*(\{[\s\S]*\})/)

  if (match && Number(match[1]) === 422) {
    let field = ''
    try {
      const body = JSON.parse(match[2]) as { errors?: Record<string, string[]> }
      field = body.errors ? Object.keys(body.errors)[0] ?? '' : ''
    } catch { /* ignore */ }

    if (field === 'declared_amount') {
      return { message: 'El total del pedido es muy bajo para cotizar el envío. Agrega más productos e inténtalo de nuevo.', status: 422 }
    }
    if (field.includes('postal') || field.includes('zip') || field.includes('area') || field.includes('address')) {
      return { message: 'No pudimos cotizar el envío con esa dirección. Revisa el código postal, la ciudad y el departamento.', status: 422 }
    }
    return { message: 'No pudimos cotizar el envío con los datos ingresados. Revisa la dirección e inténtalo de nuevo.', status: 422 }
  }

  return { message: 'No pudimos calcular las tarifas de envío en este momento. Se aplicará la tarifa estándar al confirmar.', status: 502 }
}
