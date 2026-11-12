/**
 * URL de la consola (control plane), desde `CONSOLE_URL`. HU-364: el nombre
 * antiguo `CONTROL_PLANE_URL` se retiró (todos los entornos usan el nuevo).
 */
export function consoleUrl(): string | undefined {
  return process.env.CONSOLE_URL || undefined
}
