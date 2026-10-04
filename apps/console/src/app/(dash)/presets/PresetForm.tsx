'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { input, btn } from '@/lib/styles'
import { savePreset, type PresetActionState } from '../../actions'

const initial: PresetActionState = { ok: false }

// Superficies de bloque que puede incluir el home de arranque del preset.
const SECTION_TYPES: { value: string; label: string }[] = [
  { value: 'hero', label: 'Carrusel (hero)' },
  { value: 'featured_products', label: 'Productos destacados' },
  { value: 'best_sellers', label: 'Más vendidos' },
  { value: 'services', label: 'Servicios' },
  { value: 'historia', label: 'Historia' },
  { value: 'blog_preview', label: 'Del blog' },
  { value: 'newsletter', label: 'Newsletter' },
]

const THEME_COLORS: { key: string; label: string; def: string }[] = [
  { key: 'color_primary', label: 'Primario', def: '#4f46e5' },
  { key: 'color_dark', label: 'Oscuro', def: '#4338ca' },
  { key: 'color_cream', label: 'Fondo', def: '#ffffff' },
  { key: 'color_text', label: 'Texto', def: '#1f2430' },
]
const FONTS = ['dm-sans', 'inter', 'cormorant', 'playfair']

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

const lbl: React.CSSProperties = { fontSize: 12, color: 'var(--ui-muted)', display: 'block', marginBottom: 4 }
const section: React.CSSProperties = { border: '1px solid var(--ui-border)', borderRadius: 'var(--ui-radius)', padding: 12 }

interface Cat { name: string; description: string }
interface Prod { name: string; price: string; category: string; featured: boolean }

/** Formulario de crear/editar Preset — campos estructurados (HU-233). */
export default function PresetForm() {
  const [state, action, pending] = useActionState(savePreset, initial)

  const [theme, setTheme] = useState<Record<string, string>>({
    name: 'Preset', color_primary: '#4f46e5', color_dark: '#4338ca', color_cream: '#ffffff', color_text: '#1f2430',
    font_display: 'cormorant', font_body: 'dm-sans',
  })
  const [sections, setSections] = useState<string[]>(['hero', 'featured_products', 'newsletter'])
  const [cats, setCats] = useState<Cat[]>([{ name: '', description: '' }])
  const [prods, setProds] = useState<Prod[]>([{ name: '', price: '', category: '', featured: false }])

  const themeJson = JSON.stringify(theme)
  const sectionsJson = JSON.stringify(sections.map((t, i) => ({ section_type: t, order_index: i * 10 })))
  const catsJson = JSON.stringify(cats.filter((c) => c.name.trim()).map((c, i) => ({ name: c.name.trim(), description: c.description.trim() || undefined, order_index: i })))
  const prodsJson = JSON.stringify(
    prods.filter((p) => p.name.trim()).map((p) => ({
      name: p.name.trim(), price: Number(p.price) || 0,
      category_slug: p.category.trim() ? slugify(p.category) : undefined, featured: p.featured,
    })),
  )

  const toggleSection = (v: string) =>
    setSections((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]))

  return (
    <form action={action} style={{ display: 'grid', gap: 14, maxWidth: 760 }}>
      {/* Datos básicos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <label><span style={lbl}>Key (identificador)</span><input style={{ ...input, width: '100%' }} name="key" placeholder="cafe-basico" required /></label>
        <label><span style={lbl}>Nombre visible</span><input style={{ ...input, width: '100%' }} name="name" placeholder="Café básico" required /></label>
        <label><span style={lbl}>Nicho</span><input style={{ ...input, width: '100%' }} name="niche" placeholder="cafe" required /></label>
        <label><span style={lbl}>Template (layout)</span><input style={{ ...input, width: '100%' }} name="template" defaultValue="default" /></label>
        <label style={{ gridColumn: '1 / span 2' }}><span style={lbl}>Descripción</span><textarea style={{ ...input, width: '100%', minHeight: 44 }} name="description" placeholder="Para qué sirve este preset" /></label>
        <label><span style={lbl}>Modelo de inventario</span>
          <select style={{ ...input, width: '100%' }} name="inventory_model" defaultValue="single">
            <option value="single">Stock único</option>
            <option value="multi_location">Multi-ubicación</option>
          </select>
        </label>
        <label><span style={lbl}>Planes (vacío = todos)</span><input style={{ ...input, width: '100%' }} name="available_in_plans" placeholder="free, pro" /></label>
      </div>

      {/* Tema */}
      <fieldset style={section}>
        <legend style={lbl}>Apariencia (tema)</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {THEME_COLORS.map((c) => (
            <label key={c.key} style={{ fontSize: 12 }}>
              <span style={{ display: 'block', marginBottom: 2 }}>{c.label}</span>
              <input type="color" value={theme[c.key] ?? c.def} onChange={(e) => setTheme((t) => ({ ...t, [c.key]: e.target.value }))} />
            </label>
          ))}
          <label style={{ fontSize: 12 }}><span style={{ display: 'block', marginBottom: 2 }}>Fuente títulos</span>
            <select style={input} value={theme.font_display} onChange={(e) => setTheme((t) => ({ ...t, font_display: e.target.value }))}>{FONTS.map((f) => <option key={f}>{f}</option>)}</select>
          </label>
          <label style={{ fontSize: 12 }}><span style={{ display: 'block', marginBottom: 2 }}>Fuente cuerpo</span>
            <select style={input} value={theme.font_body} onChange={(e) => setTheme((t) => ({ ...t, font_body: e.target.value }))}>{FONTS.map((f) => <option key={f}>{f}</option>)}</select>
          </label>
        </div>
      </fieldset>

      {/* Secciones del home */}
      <fieldset style={section}>
        <legend style={lbl}>Secciones de arranque del home</legend>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {SECTION_TYPES.map((s) => (
            <label key={s.value} style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={sections.includes(s.value)} onChange={() => toggleSection(s.value)} /> {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Categorías de ejemplo */}
      <fieldset style={section}>
        <legend style={lbl}>Categorías de ejemplo</legend>
        {cats.map((c, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <input style={{ ...input, flex: 1 }} placeholder="Nombre" value={c.name} onChange={(e) => setCats((a) => a.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
            <input style={{ ...input, flex: 1 }} placeholder="Descripción (opcional)" value={c.description} onChange={(e) => setCats((a) => a.map((x, j) => j === i ? { ...x, description: e.target.value } : x))} />
            <button type="button" onClick={() => setCats((a) => a.filter((_, j) => j !== i))} style={{ ...btn, background: 'none', color: 'var(--ui-danger)' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => setCats((a) => [...a, { name: '', description: '' }])} style={{ ...btn, background: 'var(--ui-surface-2)', color: 'var(--ui-text)' }}>+ Categoría</button>
      </fieldset>

      {/* Productos de ejemplo */}
      <fieldset style={section}>
        <legend style={lbl}>Productos de ejemplo</legend>
        {prods.map((p, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <input style={{ ...input, flex: 2, minWidth: 140 }} placeholder="Nombre" value={p.name} onChange={(e) => setProds((a) => a.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
            <input style={{ ...input, width: 110 }} type="number" min={0} placeholder="Precio" value={p.price} onChange={(e) => setProds((a) => a.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} />
            <input style={{ ...input, width: 140 }} placeholder="Categoría" value={p.category} onChange={(e) => setProds((a) => a.map((x, j) => j === i ? { ...x, category: e.target.value } : x))} />
            <label style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <input type="checkbox" checked={p.featured} onChange={(e) => setProds((a) => a.map((x, j) => j === i ? { ...x, featured: e.target.checked } : x))} /> destacado
            </label>
            <button type="button" onClick={() => setProds((a) => a.filter((_, j) => j !== i))} style={{ ...btn, background: 'none', color: 'var(--ui-danger)' }}>×</button>
          </div>
        ))}
        <button type="button" onClick={() => setProds((a) => [...a, { name: '', price: '', category: '', featured: false }])} style={{ ...btn, background: 'var(--ui-surface-2)', color: 'var(--ui-text)' }}>+ Producto</button>
      </fieldset>

      <label style={{ maxWidth: 220 }}><span style={lbl}>Estado</span>
        <select style={{ ...input, width: '100%' }} name="active" defaultValue="true"><option value="true">Activo</option><option value="false">Inactivo</option></select>
      </label>

      {/* Campos serializados que espera el backend */}
      <input type="hidden" name="theme" value={themeJson} />
      <input type="hidden" name="home_sections" value={sectionsJson} />
      <input type="hidden" name="sample_categories" value={catsJson} />
      <input type="hidden" name="sample_products" value={prodsJson} />

      <button type="submit" disabled={pending} style={btn}>{pending ? 'Guardando…' : 'Guardar preset'}</button>
      {state.error && <p style={{ color: 'var(--ui-danger)', fontSize: 13, margin: 0 }}>{state.error}</p>}
      {state.ok && state.message && <p style={{ color: 'var(--ui-success)', fontSize: 13, margin: 0 }}>{state.message}</p>}
    </form>
  )
}
