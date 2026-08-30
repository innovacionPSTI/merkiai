import { redirect } from 'next/navigation'
import { listWorkspaces } from '@/lib/workspaces'
import { setActiveTenantId } from '@/lib/active-tenant'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Elige un espacio de trabajo' }

/** Fija el tenant activo si el usuario pertenece a él y entra al panel. */
async function selectWorkspace(formData: FormData) {
  'use server'
  const tenantId = String(formData.get('tenantId') ?? '')
  const ws = await listWorkspaces()
  if (!ws.some((w) => w.tenantId === tenantId)) return
  await setActiveTenantId(tenantId)
  redirect('/dashboard')
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join('') || '?'
}

export default async function SelectWorkspacePage() {
  const workspaces = await listWorkspaces()

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      <header className="flex justify-end p-6">
        <a href="/handler/sign-out" className="text-sm text-slate-500 hover:text-slate-800">Cerrar sesión</a>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h.01M9 13h.01M15 9h.01M15 13h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-slate-800">Elige un espacio de trabajo</h1>
        <p className="text-slate-500 mt-1 mb-8">Tienes acceso a varios. Elige el que quieras abrir.</p>

        {workspaces.length === 0 ? (
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">
            No perteneces a ninguna tienda todavía. Pide a un administrador que te invite.
          </div>
        ) : (
          <div className="w-full max-w-md space-y-3">
            {workspaces.map((w) => (
              <form key={w.tenantId} action={selectWorkspace}>
                <input type="hidden" name="tenantId" value={w.tenantId} />
                <button
                  type="submit"
                  className="w-full flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-300 hover:shadow-sm transition text-left"
                >
                  <span className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 font-semibold flex items-center justify-center">
                    {initials(w.name)}
                  </span>
                  <span className="flex-1">
                    <span className="block font-semibold text-slate-800">{w.name}</span>
                    <span className="block text-sm text-slate-500">Espacio de trabajo</span>
                  </span>
                  <span className="text-slate-400">→</span>
                </button>
              </form>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
