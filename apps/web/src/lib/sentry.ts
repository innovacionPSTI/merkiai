/**
 * HU-170 · conexión real con Sentry (APM) para el storefront.
 *
 * Mantiene la abstracción del repo: el paquete `@merkiai/database` NO depende de
 * Sentry; expone un hook global `globalThis.__merkiaiCaptureException` que el
 * `HookReporter` usa. Aquí registramos ese hook apuntando a Sentry.
 *
 * Todo es GUARDED:
 *  - Si no hay `SENTRY_DSN` (servidor) / `NEXT_PUBLIC_SENTRY_DSN` (navegador),
 *    no se inicializa nada → se mantiene el `ConsoleReporter` por defecto.
 *  - El import de `@sentry/nextjs` es dinámico y NO-LITERAL para que el proyecto
 *    compile aunque el paquete no esté instalado todavía; al instalarlo + definir
 *    el DSN, empieza a reportar sin tocar los llamadores.
 *  - Nunca lanza: un fallo de inicialización no debe tumbar la app.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySentry = any

let _sentry: AnySentry | null = null
let _loaded = false

/** Carga perezosa y tolerante del SDK (no-literal para no acoplar el build). */
export async function loadSentry(): Promise<AnySentry | null> {
  if (_loaded) return _sentry
  _loaded = true
  try {
    const mod = '@sentry/nextjs'
    // Import no-literal: TS lo trata como `any` y no exige el módulo en build.
    _sentry = await import(/* webpackIgnore: false */ mod)
  } catch {
    _sentry = null
  }
  return _sentry
}

/** Inicializa Sentry en el servidor y registra el hook global de captura. */
export async function initSentryServer(): Promise<void> {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return
  const Sentry = await loadSentry()
  if (!Sentry?.init) return
  try {
    Sentry.init({
      dsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
      // El scrubbing de PII ya lo hace el ErrorReporter antes de pasar el extra.
      sendDefaultPii: false,
    })
    // Hook que consume el HookReporter de @merkiai/database.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(globalThis as any).__merkiaiCaptureException = (err: unknown, ctx: Record<string, unknown> = {}) => {
      try {
        Sentry.captureException(err, {
          tags: { scope: (ctx.scope as string) ?? undefined, tenantId: (ctx.tenantId as string) ?? undefined, route: (ctx.route as string) ?? undefined },
          extra: (ctx.extra as Record<string, unknown>) ?? undefined,
        })
      } catch { /* reportar nunca debe lanzar */ }
    }
  } catch { /* init tolerante a fallos */ }
}
