/**
 * Monitoreo de errores de aplicación (HU-170). Abstracción intercambiable
 * `ErrorReporter` — igual que pagos/envíos/correo/identidad, la app no se acopla
 * a un proveedor. Por defecto usa `ConsoleReporter` (JSON estructurado a stderr,
 * que Vercel/Supabase Logs recogen sin configurar nada). Con `SENTRY_DSN` y un
 * hook global de captura se puede enrutar a Sentry u otro APM sin tocar los
 * llamadores. Nunca lanza: reportar un error no debe tumbar la request.
 *
 * Capas (aclaración): el *infra logging/metrics* (Vercel/Supabase, equivalente a
 * CloudWatch en AWS) es otra cosa y ya existe; esto añade el tracking de errores
 * de aplicación (stack + contexto de negocio + agrupación en el proveedor).
 */

export interface ErrorContext {
  /** Dónde ocurrió: 'checkout', 'webhook.wompi', etc. */
  scope?: string
  /** Tenant afectado (para filtrar incidencias por tienda). */
  tenantId?: string
  /** Ruta/endpoint. */
  route?: string
  /** Identificador de request si existe. */
  requestId?: string
  /** Datos extra (se les hace scrubbing de PII/secretos antes de enviar). */
  extra?: Record<string, unknown>
}

export interface ErrorReporter {
  captureException(err: unknown, context?: ErrorContext): void
  captureMessage(message: string, context?: ErrorContext): void
}

// Claves que NUNCA deben salir en un reporte (PII / secretos). AC-4.
const SENSITIVE_KEYS = [
  'email', 'phone', 'telefono', 'celular', 'address', 'direccion', 'document', 'documento',
  'password', 'clave', 'token', 'secret', 'api_key', 'apikey', 'authorization', 'card', 'tarjeta',
  'cvv', 'pan', 'public_key', 'private_key', 'access_token', 'integrity_secret', 'events_secret',
]

/** Redacta claves sensibles (recursivo, tope de profundidad). Pura. */
export function scrubContext(value: unknown, depth = 0): unknown {
  if (depth > 4 || value == null) return value
  if (Array.isArray(value)) return value.map((v) => scrubContext(v, depth + 1))
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEYS.some((s) => k.toLowerCase().includes(s)) ? '[redacted]' : scrubContext(v, depth + 1)
    }
    return out
  }
  return value
}

function normalize(err: unknown): { name: string; message: string; stack?: string } {
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack }
  return { name: 'NonError', message: typeof err === 'string' ? err : JSON.stringify(err) }
}

/** No hace nada (para tests/entornos donde no se quiere ruido). */
export class NoopReporter implements ErrorReporter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  captureException(_err: unknown, _context?: ErrorContext): void {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  captureMessage(_message: string, _context?: ErrorContext): void {}
}

/** Log estructurado a stderr — recogido por la infra (Vercel/Supabase). Default. */
export class ConsoleReporter implements ErrorReporter {
  captureException(err: unknown, context: ErrorContext = {}): void {
    try {
      const e = normalize(err)
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({
        level: 'error', ...e,
        scope: context.scope, tenantId: context.tenantId, route: context.route, requestId: context.requestId,
        extra: context.extra ? scrubContext(context.extra) : undefined,
        at: new Date().toISOString(),
      }))
    } catch { /* reportar nunca debe lanzar */ }
  }
  captureMessage(message: string, context: ErrorContext = {}): void {
    try {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({ level: 'warn', message, scope: context.scope, tenantId: context.tenantId, at: new Date().toISOString() }))
    } catch { /* no-op */ }
  }
}

/**
 * Enruta al APM externo (Sentry u otro) a través de un hook global que la app
 * registra en su arranque (`globalThis.__merkiaiCaptureException`). Así el
 * paquete no depende de `@sentry/nextjs` directamente (se instala y conecta en
 * la app). Siempre loguea a consola como respaldo.
 */
export class HookReporter extends ConsoleReporter {
  captureException(err: unknown, context: ErrorContext = {}): void {
    super.captureException(err, context)
    try {
      const hook = (globalThis as any).__merkiaiCaptureException as undefined | ((e: unknown, c: ErrorContext) => void)
      if (typeof hook === 'function') hook(err, { ...context, extra: context.extra ? (scrubContext(context.extra) as Record<string, unknown>) : undefined })
    } catch { /* no-op */ }
  }
}

let _reporter: ErrorReporter | null = null

/** Reporter activo. Con un hook de APM registrado o `SENTRY_DSN`, usa HookReporter. */
export function getErrorReporter(): ErrorReporter {
  if (_reporter) return _reporter
  const hasHook = typeof (globalThis as any).__merkiaiCaptureException === 'function'
  const hasDsn = !!process.env.SENTRY_DSN
  _reporter = hasHook || hasDsn ? new HookReporter() : new ConsoleReporter()
  return _reporter
}

/** Permite inyectar un reporter (tests). */
export function setErrorReporter(r: ErrorReporter | null): void { _reporter = r }

/** Atajo best-effort para los bordes: captura y nunca lanza. */
export function reportError(err: unknown, context?: ErrorContext): void {
  try { getErrorReporter().captureException(err, context) } catch { /* no-op */ }
}
