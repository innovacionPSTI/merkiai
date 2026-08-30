/** @jest-environment node */
// Evita cargar el SDK de Stack Auth al importar el módulo.
jest.mock('@/stack', () => ({ stackServerApp: {} }))

import { resolveWorkspace, type Workspace } from '../workspaces'

const w = (tenantId: string): Workspace => ({ tenantId, teamId: `team-${tenantId}`, name: tenantId })

describe('resolveWorkspace (HU-158)', () => {
  it('sin workspaces → none', () => {
    expect(resolveWorkspace([], null)).toEqual({ mode: 'none' })
  })

  it('un workspace, sin activo → auto', () => {
    expect(resolveWorkspace([w('t1')], null)).toEqual({ mode: 'auto', tenantId: 't1' })
  })

  it('varios workspaces, sin activo → select', () => {
    expect(resolveWorkspace([w('t1'), w('t2')], null)).toEqual({ mode: 'select' })
  })

  it('activo válido → active', () => {
    expect(resolveWorkspace([w('t1'), w('t2')], 't2')).toEqual({ mode: 'active', tenantId: 't2' })
  })

  it('activo que no pertenece → cae a la lógica normal (auto/select)', () => {
    expect(resolveWorkspace([w('t1')], 'otro')).toEqual({ mode: 'auto', tenantId: 't1' })
    expect(resolveWorkspace([w('t1'), w('t2')], 'otro')).toEqual({ mode: 'select' })
  })
})
