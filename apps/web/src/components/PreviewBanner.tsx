'use client'

/**
 * Banner de vista previa (HU-128). Avisa al comerciante que está viendo el
 * borrador (incluye secciones/ítems deshabilitados) y permite salir.
 */
export default function PreviewBanner() {
  async function exitPreview() {
    try { await fetch('/api/preview', { method: 'DELETE' }) } catch { /* noop */ }
    window.location.reload()
  }
  // Barra fija al PIE: no tapa el encabezado ni el héroe de la página (el Navbar
  // del storefront es fixed top-0). Patrón estándar de "modo vista previa".
  return (
    <div
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: '#1f2430', color: '#fff',
        padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12, fontSize: 13, fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 -2px 12px rgba(0,0,0,.25)',
      }}
    >
      <span>Vista previa — estás viendo el borrador, incluyendo contenido sin publicar.</span>
      <button
        onClick={exitPreview}
        style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: 0, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}
      >
        Salir de la vista previa
      </button>
    </div>
  )
}
