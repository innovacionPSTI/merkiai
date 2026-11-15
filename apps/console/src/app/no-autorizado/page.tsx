import { T } from '@merkiai/ui'

export default function NoAutorizado() {
  return (
    <main style={{ maxWidth: 560, margin: '80px auto', padding: 24, textAlign: 'center' }}>
      <h1 style={{ color: '#b00' }}><T>Sin autorización</T></h1>
      <p><T>Tu cuenta no tiene el permiso</T> <code>platform:operate</code> <T>para operar la plataforma.</T></p>
    </main>
  )
}
