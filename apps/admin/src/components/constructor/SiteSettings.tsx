'use client'

/**
 * SiteSettings (HU-371) — "Ajustes de sitio" dentro del Constructor: lo editorial
 * de la tienda (nombre, descripción, logo, favicon, redes, toggles de footer/nav)
 * que antes vivía en *Configuración → General*. Persiste vía /api/admin/config.
 * Lo técnico (dominios, pagos, envíos, correos) permanece en Configuración.
 */
import { useState } from 'react'
import { Icon } from '@merkiai/ui'
import ImageUpload from '../ImageUpload'

export interface SiteConfig {
  store_name: string
  store_description: string | null
  logo_url: string | null
  favicon_url: string | null
  instagram_url: string | null; instagram_enabled: boolean
  facebook_url: string | null; facebook_enabled: boolean
  tiktok_url: string | null; tiktok_enabled: boolean
  footer_show_store: boolean; footer_show_blog: boolean; footer_show_legal: boolean
  nav_show_cart: boolean; nav_show_auth: boolean; nav_show_wishlist: boolean
}

export default function SiteSettings({ initial, onClose }: { initial: SiteConfig; onClose: () => void }) {
  const [cfg, setCfg] = useState<SiteConfig>(initial)
  const [msg, setMsg] = useState('')

  async function save(fields: Partial<SiteConfig>) {
    setCfg((c) => ({ ...c, ...fields }))
    const res = await fetch('/api/admin/config', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields),
    })
    setMsg(res.ok ? 'Guardado ✓' : 'No se pudo guardar')
  }
  const toggle = (k: keyof SiteConfig) => (e: React.ChangeEvent<HTMLInputElement>) => save({ [k]: e.target.checked } as Partial<SiteConfig>)

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="w-96 max-w-full h-full bg-white shadow-xl p-5 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-brand-primary text-lg">Ajustes de sitio</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Cerrar"><Icon name="close" size={18} /></button>
        </div>
        {msg && <p className="text-xs text-indigo-600 mb-2">{msg}</p>}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre de la tienda</label>
            <input defaultValue={cfg.store_name} onBlur={(e) => e.target.value.trim() !== cfg.store_name && save({ store_name: e.target.value.trim() })}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Descripción</label>
            <textarea defaultValue={cfg.store_description ?? ''} rows={2} onBlur={(e) => e.target.value !== (cfg.store_description ?? '') && save({ store_description: e.target.value || null })}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Logo</label>
              <ImageUpload value={cfg.logo_url ?? ''} onChange={(url) => save({ logo_url: url || null })} bucket="content" label="" sizeClass="h-20" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Favicon</label>
              <ImageUpload value={cfg.favicon_url ?? ''} onChange={(url) => save({ favicon_url: url || null })} bucket="content" label="" sizeClass="h-20" />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Redes sociales</p>
            {(['instagram', 'facebook', 'tiktok'] as const).map((net) => {
              const urlKey = `${net}_url` as keyof SiteConfig
              const enKey = `${net}_enabled` as keyof SiteConfig
              return (
                <div key={net} className="flex items-center gap-2 mb-2">
                  <input type="checkbox" checked={cfg[enKey] as boolean} onChange={toggle(enKey)} title={`Mostrar ${net}`} />
                  <input defaultValue={(cfg[urlKey] as string | null) ?? ''} placeholder={`URL de ${net}`}
                    onBlur={(e) => e.target.value !== ((cfg[urlKey] as string | null) ?? '') && save({ [urlKey]: e.target.value || null } as Partial<SiteConfig>)}
                    className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                </div>
              )
            })}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Footer</p>
            <label className="flex items-center gap-2 text-sm text-slate-600 mb-1"><input type="checkbox" checked={cfg.footer_show_store} onChange={toggle('footer_show_store')} /> Columna de tienda</label>
            <label className="flex items-center gap-2 text-sm text-slate-600 mb-1"><input type="checkbox" checked={cfg.footer_show_blog} onChange={toggle('footer_show_blog')} /> Columna de blog</label>
            <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={cfg.footer_show_legal} onChange={toggle('footer_show_legal')} /> Columna legal</label>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Barra de navegación</p>
            <label className="flex items-center gap-2 text-sm text-slate-600 mb-1"><input type="checkbox" checked={cfg.nav_show_cart} onChange={toggle('nav_show_cart')} /> Carrito</label>
            <label className="flex items-center gap-2 text-sm text-slate-600 mb-1"><input type="checkbox" checked={cfg.nav_show_auth} onChange={toggle('nav_show_auth')} /> Cuenta / acceso</label>
            <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={cfg.nav_show_wishlist} onChange={toggle('nav_show_wishlist')} /> Favoritos</label>
          </div>

          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">Dominios, pagos, envíos y correos siguen en Configuración.</p>
        </div>
      </div>
    </div>
  )
}
