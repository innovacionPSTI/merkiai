// `identity.ts` importa `@/stack`, que construye StackServerApp al cargar (requiere
// envs). No lo necesitamos: probamos el adaptador con un app inyectado.
jest.mock('@/stack', () => ({ stackServerApp: {} }))

import { stackIdentity } from '../identity'

/** Fake mínimo de StackServerApp para probar el adaptador inviteMember/deleteOrg. */
function makeApp(opts: { team?: unknown | null } = {}) {
  const inviteUser = jest.fn(async () => {})
  const del = jest.fn(async () => {})
  const team = opts.team === null ? null : { id: 'team-1', inviteUser, delete: del }
  const app = { getTeam: jest.fn(async () => team) }
  return { app: app as never as Parameters<typeof stackIdentity>[0], inviteUser, del }
}

describe('stackIdentity.inviteMember (callbackUrl obligatorio en servidor)', () => {
  it('pasa el callbackUrl configurado a inviteUser', async () => {
    const { app, inviteUser } = makeApp()
    const id = stackIdentity(app, { inviteCallbackUrl: 'https://admin.merkiai.com/handler/team-invitation' })
    await id.inviteMember!('team-1', 'due@x.com')
    expect(inviteUser).toHaveBeenCalledWith({
      email: 'due@x.com',
      callbackUrl: 'https://admin.merkiai.com/handler/team-invitation',
    })
  })

  it('sin callbackUrl → lanza (evita el error opaco de Stack Auth en servidor)', async () => {
    const { app, inviteUser } = makeApp()
    const id = stackIdentity(app)
    await expect(id.inviteMember!('team-1', 'due@x.com')).rejects.toThrow(/inviteCallbackUrl requerido/)
    expect(inviteUser).not.toHaveBeenCalled()
  })
})

describe('stackIdentity.deleteOrg (best-effort, idempotente)', () => {
  it('borra el Team si existe', async () => {
    const { app, del } = makeApp()
    await stackIdentity(app).deleteOrg!('team-1')
    expect(del).toHaveBeenCalled()
  })

  it('no lanza si el Team ya no existe', async () => {
    const { app, del } = makeApp({ team: null })
    await expect(stackIdentity(app).deleteOrg!('team-x')).resolves.toBeUndefined()
    expect(del).not.toHaveBeenCalled()
  })
})
