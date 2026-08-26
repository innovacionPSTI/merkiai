import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Servicio pausado',
  robots: { index: false, follow: false },
}

/** HU-194: página mostrada cuando el tenant está suspendido por facturación. */
export default function ServicioPausado() {
  return (
    <main
      style={{
        maxWidth: 560,
        margin: '96px auto',
        padding: 24,
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1>Servicio temporalmente pausado</h1>
      <p style={{ color: '#555' }}>
        Esta tienda no está disponible en este momento. Si eres el propietario,
        regulariza tu facturación para reactivarla.
      </p>
    </main>
  )
}
