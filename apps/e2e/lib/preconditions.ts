/**
 * Helpers de precondición para specs E2E. Si el tenant de prueba no tiene un
 * entitlement (p. ej. `inventory`/`quotes`), el endpoint responde 402 y el test
 * se salta en vez de fallar — así la suite es verde en cualquier plan sembrado.
 */
import type { APIResponse } from '@playwright/test'

/** El endpoint respondió 402 (plan sin la feature). */
export function planLacksFeature(res: APIResponse): boolean {
  return res.status() === 402
}
