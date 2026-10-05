'use client'

/**
 * BackupWidget — descarga respaldos de datos de negocio (HU-125): productos,
 * pedidos y clientes, en CSV (hoja de cálculo) o JSON (respaldo fiel).
 * La descarga sale del endpoint `GET /api/admin/backup` (RLS por tenant).
 */
import { Icon } from '@merkiai/ui'

const DOMAINS: { key: string; label: string; icon: 'product' | 'order' | 'customer' }[] = [
  { key: 'products', label: 'Productos', icon: 'product' },
  { key: 'orders', label: 'Pedidos', icon: 'order' },
  { key: 'customers', label: 'Clientes', icon: 'customer' },
]

export default function BackupWidget() {
  return (
    <div className="space-y-3">
      {DOMAINS.map((d) => (
        <div key={d.key} className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-cream text-brand-primary">
            <Icon name={d.icon} size={18} />
          </span>
          <span className="font-brand text-sm text-brand-primary flex-1">{d.label}</span>
          <a
            href={`/api/admin/backup?domain=${d.key}&format=csv`}
            className="font-brand text-xs text-brand-primary border border-brand-primary/20 rounded-lg px-3 py-1.5 hover:bg-brand-cream transition-colors"
          >
            CSV
          </a>
          <a
            href={`/api/admin/backup?domain=${d.key}&format=json`}
            className="font-brand text-xs text-brand-primary/60 border border-brand-primary/15 rounded-lg px-3 py-1.5 hover:bg-brand-cream transition-colors"
          >
            JSON
          </a>
        </div>
      ))}
      <p className="font-brand text-xs text-brand-primary/40">
        CSV para abrir en hoja de cálculo; JSON como respaldo fiel. Los productos (CSV) son compatibles con la carga masiva.
      </p>
    </div>
  )
}
