/**
 * TenantSuspended (HU-194) — pantalla que reemplaza el panel cuando el tenant
 * está **suspendido o cancelado**. Mientras el cobro del SaaS es manual, esta es
 * la palanca que aplica la suspensión: el operador fija `status=suspended` en la
 * consola y el panel queda bloqueado (el storefront ya se pausa en el middleware).
 *
 * No expone acciones de gestión; solo informa y remite a soporte. El cierre de
 * sesión sigue disponible por la ruta estándar del proveedor de auth.
 */
export default function TenantSuspended() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-5 text-2xl">
          ⏸️
        </div>
        <h1 className="font-display text-xl text-brand-primary mb-2">Servicio en pausa</h1>
        <p className="font-brand text-sm text-brand-primary/60 leading-relaxed">
          El acceso a este panel está temporalmente pausado. Tus datos están a salvo
          y se restablecerán al regularizar la cuenta.
        </p>
        <p className="font-brand text-sm text-brand-primary/60 leading-relaxed mt-3">
          Para reactivarlo, comunícate con tu proveedor de servicio.
        </p>
        <a
          href="/handler/sign-out"
          className="inline-block mt-6 font-brand text-sm text-brand-primary/50 underline hover:text-brand-primary"
        >
          Cerrar sesión
        </a>
      </div>
    </div>
  )
}
