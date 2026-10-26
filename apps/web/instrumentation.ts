/**
 * HU-170 · instrumentación de arranque (Next.js). Inicializa Sentry solo en el
 * runtime Node del servidor y solo si hay DSN configurado (guarded). Sin DSN no
 * ocurre nada: el storefront sigue con el `ConsoleReporter` por defecto.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initSentryServer } = await import('./src/lib/sentry')
    await initSentryServer()
  }
}

/**
 * Captura de errores de rutas/Server Components (Next 15/16). Se enruta a Sentry
 * vía su helper si el SDK está disponible; de lo contrario no-op.
 */
export async function onRequestError(...args: unknown[]) {
  try {
    const { loadSentry } = await import('./src/lib/sentry')
    const Sentry = await loadSentry()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (Sentry && typeof (Sentry as any).captureRequestError === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(Sentry as any).captureRequestError(...args)
    }
  } catch { /* no-op: instrumentación nunca debe tumbar la request */ }
}
