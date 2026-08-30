// `identity.ts` importa `@/stack`, que construye StackServerApp al cargar (requiere
// envs). No lo necesitamos: probamos el adaptador con un app inyectado.
jest.mock('@/stack', () => ({ stackServerApp: {} }))

import { stackIdentity } from '../identity'

/** Fake mínimo de StackServerApp para probar el adaptador inviteMember. */
function makeApp() {
  const inviteUser = jest.fn(async () => {})
  const team = { id: 'team-1', inviteUser }
  const app = { getTeam: jest.fn(async () => team) }
  return { app: app as never as Parameters<typeof stackIdentity>[0], inviteUser }
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
