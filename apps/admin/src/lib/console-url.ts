/**
 * URL de la consola (control plane). HU-364: el nombre canónico es `CONSOLE_URL`;
 * `CONTROL_PLANE_URL` se acepta como alias retrocompatible durante la transición
 * (se retirará cuando todos los entornos usen el nombre nuevo).
 */
export function consoleUrl(): string | undefined {
  return process.env.CONSOLE_URL || process.env.CONTROL_PLANE_URL || undefined
}
