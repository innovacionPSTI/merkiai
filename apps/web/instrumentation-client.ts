/**
 * HU-170 · instrumentación de cliente (navegador). Inicializa Sentry en el
 * browser solo si hay `NEXT_PUBLIC_SENTRY_DSN` (guarded). Import no-literal para
 * no romper el build cuando el paquete aún no está instalado.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  const mod = '@sentry/nextjs'
  import(/* webpackIgnore: false */ mod)
    .then((Sentry) => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(Sentry as any).init({
          dsn,
          environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
          tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0),
          sendDefaultPii: false,
        })
      } catch { /* init tolerante */ }
    })
    .catch(() => { /* SDK no instalado: no-op */ })
}

/** Instrumenta las transiciones de router del App Router (si el SDK lo soporta). */
export function onRouterTransitionStart(...args: unknown[]) {
  try {
    const mod = '@sentry/nextjs'
    import(/* webpackIgnore: false */ mod).then((Sentry) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fn = (Sentry as any).captureRouterTransitionStart
      if (typeof fn === 'function') fn(...args)
    }).catch(() => {})
  } catch { /* no-op */ }
}
