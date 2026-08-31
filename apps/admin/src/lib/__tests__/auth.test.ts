/**
 * @jest-environment node
 *
 * getAdminUser (HU-158): resolución de tenant por profiles.tenant_id.
 */
jest.mock('@/stack', () => ({ stackServerApp: { getUser: jest.fn() } }))
jest.mock('@merkiai/database', () => ({ createServerClient: jest.fn() }))
jest.mock('../active-tenant', () => ({ getActiveTenantId: jest.fn() }))

import { stackServerApp } from '@/stack'
import { createServerClient } from '@merkiai/database'
import { getActiveTenantId } from '../active-tenant'
import { getAdminUser } from '../auth'

const mockGetUser = stackServerApp.getUser as jest.Mock
const mockCreate = createServerClient as unknown as jest.Mock
const mockActive = getActiveTenantId as jest.Mock
const mockEq = jest.fn()

const T1 = '00000000-0000-0000-0000-000000000001'
const T2 = '5e2ddd4d-1005-4381-b2c7-3ee16e5af1b8'

beforeEach(() => {
  jest.clearAllMocks()
  mockGetUser.mockResolvedValue({ id: 'u1', primaryEmail: 'a@x.com', displayName: 'A' })
  mockActive.mockResolvedValue(T1)
  mockCreate.mockReturnValue({ from: () => ({ select: () => ({ eq: mockEq }) }) })
})

function profiles(rows: unknown, error: unknown = null) {
  mockEq.mockResolvedValue({ data: rows, error })
}

describe('getAdminUser', () => {
  it('sin sesión → null', async () => {
    mockGetUser.mockResolvedValue(null)
    expect(await getAdminUser()).toBeNull()
  })

  it('1 perfil admin → devuelve tenantId + role', async () => {
    profiles([{ role: 'super_admin', full_name: 'A', tenant_id: T2 }])
    expect(await getAdminUser()).toMatchObject({ role: 'super_admin', tenantId: T2, needsWorkspaceSelection: false })
  })

  it('perfil no-admin (customer) → null', async () => {
    profiles([{ role: 'customer', full_name: 'A', tenant_id: T1 }])
    expect(await getAdminUser()).toBeNull()
  })

  it('error de consulta → null (no lo traga)', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
    profiles(null, { message: 'boom' })
    expect(await getAdminUser()).toBeNull()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('varios perfiles + cookie activa coincide → usa ese tenant', async () => {
    mockActive.mockResolvedValue(T2)
    profiles([
      { role: 'admin', full_name: 'A', tenant_id: T1 },
      { role: 'super_admin', full_name: 'A', tenant_id: T2 },
    ])
    expect(await getAdminUser()).toMatchObject({ tenantId: T2, role: 'super_admin', needsWorkspaceSelection: false })
  })

  it('varios perfiles sin cookie coincidente → needsWorkspaceSelection', async () => {
    mockActive.mockResolvedValue('otra-cosa')
    profiles([
      { role: 'admin', full_name: 'A', tenant_id: T1 },
      { role: 'super_admin', full_name: 'A', tenant_id: T2 },
    ])
    expect((await getAdminUser())?.needsWorkspaceSelection).toBe(true)
  })
})
