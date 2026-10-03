'use client'

import { useMemo, useState } from 'react'
import { FilterBar, ResourceCard, CardGrid, DataTable, StatusBadge, Chip, EmptyState, Icon } from '@merkiai/ui'
import type { PresetRow } from '@/lib/presets'
import { deletePreset } from '../../actions'

function DeleteButton({ keyName }: { keyName: string }) {
  return (
    <form action={deletePreset}>
      <input type="hidden" name="key" value={keyName} />
      <button type="submit" style={{ background: 'none', border: 0, color: 'var(--ui-danger)', cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Icon name="trash" size={15} /> Eliminar
      </button>
    </form>
  )
}

/** Explorador de presets con búsqueda, filtro por estado y vista grid/lista (HU-242). */
export default function PresetsBrowser({ presets }: { presets: PresetRow[] }) {
  const [q, setQ] = useState('')
  const [estado, setEstado] = useState('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    return presets.filter((p) => {
      if (estado === 'active' && !p.active) return false
      if (estado === 'inactive' && p.active) return false
      if (!term) return true
      return [p.name, p.niche, p.key].some((s) => s.toLowerCase().includes(term))
    })
  }, [presets, q, estado])

  return (
    <>
      <FilterBar
        search={q} onSearch={setQ} searchPlaceholder="Buscar por nombre, nicho o key…"
        segments={[{ value: 'all', label: 'Todos' }, { value: 'active', label: 'Activos' }, { value: 'inactive', label: 'Inactivos' }]}
        activeSegment={estado} onSegment={setEstado}
        view={view} onView={setView}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={<Icon name="preset" size={28} />} title="Sin presets" description={q || estado !== 'all' ? 'Ajusta la búsqueda o el filtro.' : 'Crea el primero con el formulario de abajo.'} />
      ) : view === 'grid' ? (
        <CardGrid>
          {filtered.map((p) => (
            <ResourceCard
              key={p.key}
              title={p.name}
              badge={<StatusBadge tone={p.active ? 'success' : 'neutral'}>{p.active ? 'activo' : 'inactivo'}</StatusBadge>}
              chips={<><Chip>{p.niche}</Chip><Chip variant="neutral">{p.template}</Chip></>}
              metrics={[
                { label: 'Inventario', value: p.inventory_model },
                { label: 'Planes', value: p.available_in_plans.length ? p.available_in_plans.join(', ') : 'todos' },
                { label: 'Key', value: <code>{p.key}</code> },
              ]}
              actions={<DeleteButton keyName={p.key} />}
            />
          ))}
        </CardGrid>
      ) : (
        <DataTable minWidth={720}>
          <thead>
            <tr><th>Nombre</th><th>Nicho</th><th>Template</th><th>Inventario</th><th>Planes</th><th>Estado</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.key}>
                <td style={{ fontWeight: 600 }}>{p.name}</td>
                <td><Chip>{p.niche}</Chip></td>
                <td><code>{p.template}</code></td>
                <td>{p.inventory_model}</td>
                <td>{p.available_in_plans.length ? p.available_in_plans.join(', ') : 'todos'}</td>
                <td><StatusBadge tone={p.active ? 'success' : 'neutral'}>{p.active ? 'activo' : 'inactivo'}</StatusBadge></td>
                <td><DeleteButton keyName={p.key} /></td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </>
  )
}
