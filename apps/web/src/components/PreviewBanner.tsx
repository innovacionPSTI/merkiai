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
  return (
    <div
      style={{
        position: 'sticky', top: 0, zIndex: 100, background: '#1f2430', color: '#fff',
        padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 12, fontSize: 13, fontFamily: 'system-ui, sans-serif',
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
