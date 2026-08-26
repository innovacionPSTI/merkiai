export default function NoAutorizado() {
  return (
    <main style={{ maxWidth: 560, margin: '80px auto', padding: 24, textAlign: 'center' }}>
      <h1 style={{ color: '#b00' }}>Sin autorización</h1>
      <p>Tu cuenta no tiene el permiso <code>platform:operate</code> para operar la plataforma.</p>
    </main>
  )
}
