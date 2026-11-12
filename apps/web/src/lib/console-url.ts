/**
 * URL de la consola (control plane). HU-364: el nombre canónico es `CONSOLE_URL`;
 * `CONTROL_PLANE_URL` se acepta como alias retrocompatible durante la transición
 * (se retirará cuando todos los entornos usen el nombre nuevo). Si un entorno aún
 * depende del alias, se avisa UNA vez en el log para detectarlo antes del retiro.
 */
let warned = false

export function consoleUrl(): string | undefined {
  if (process.env.CONSOLE_URL) return process.env.CONSOLE_URL
  const legacy = process.env.CONTROL_PLANE_URL
  if (legacy && !warned) {
    warned = true
    console.warn('[HU-364] CONTROL_PLANE_URL está obsoleta: crea CONSOLE_URL con el mismo valor y borra la anterior.')
  }
  return legacy || undefined
}
